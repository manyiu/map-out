use aws_config::BehaviorVersion;
use aws_lambda_events::sns::SnsEvent;
use aws_sdk_s3::primitives::ByteStream;
use futures::StreamExt;
use lambda_runtime::{run, service_fn, tracing, Error, LambdaEvent};
use serde::{Deserialize, Serialize};
use std::env;
use tokio::task;

#[derive(Deserialize, Debug)]
struct TopicMessage {
    last_update_date: String,
    new_update_date: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct ResponseWrapper<T> {
    r#type: String,
    version: String,
    generated_timestamp: String,
    data: Vec<T>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
struct RouteData {
    co: String,
    route: String,
    orig_tc: String,
    orig_en: String,
    dest_tc: String,
    dest_en: String,
    orig_sc: String,
    dest_sc: String,
    data_timestamp: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct RouteStopData {
    co: String,
    route: String,
    dir: String,
    seq: i32,
    stop: String,
    data_timestamp: String,
}

async fn function_handler(
    event: LambdaEvent<SnsEvent>,
    s3_client: &aws_sdk_s3::Client,
) -> Result<(), Error> {
    let http_client = reqwest::Client::new();

    let topic_message: TopicMessage =
        serde_json::from_str(&event.payload.records[0].sns.message).unwrap();

    let last_update_date =
        chrono::NaiveDate::parse_from_str(&topic_message.last_update_date, "%Y-%m-%d").unwrap();

    let new_update_date =
        chrono::NaiveDate::parse_from_str(&topic_message.new_update_date, "%Y-%m-%d").unwrap();

    let route_response = http_client
        .get("https://rt.data.gov.hk/v2/transport/citybus/route/ctb")
        .send()
        .await
        .unwrap();

    let route_json = route_response
        .json::<ResponseWrapper<RouteData>>()
        .await
        .unwrap();

    let mut futs = futures::stream::FuturesUnordered::new();
    let mut tasks = vec![];

    for route in route_json.data {
        for direction in vec!["inbound", "outbound"] {
            let http_client_clone = http_client.clone();
            let s3_client_clone = s3_client.clone();
            let route_clone = route.clone();
            let direction_clone = direction.to_string();

            let date_time = chrono::DateTime::parse_from_rfc3339(&route.data_timestamp)
                .unwrap()
                .date_naive();

            if date_time < last_update_date {
                continue;
            }

            let fut = task::spawn(async move {
                let route_stop_response = http_client_clone
                    .get(&format!(
                        "https://rt.data.gov.hk/v2/transport/citybus/route-stop/CTB/{}/{}",
                        route_clone.route, direction_clone
                    ))
                    .send()
                    .await
                    .expect("Failed to get route stop data");

                let route_stop_json = route_stop_response
                    .json::<ResponseWrapper<RouteStopData>>()
                    .await
                    .expect("Failed to parse route stop data");

                if route_stop_json.data.is_empty() {
                    return;
                }

                let json =
                    serde_json::to_string(&route_stop_json).expect("Failed to serialize data");
                let json_byte_stream = ByteStream::from(json.into_bytes());

                s3_client_clone
                    .put_object()
                    .bucket(env::var("RAW_DATA_BUCKET").expect("Missing RAW_DATA_BUCKET"))
                    .key(format!(
                        "raw/{}/citybus/route-stop/{}-{}.json",
                        new_update_date, route_clone.route, direction_clone
                    ))
                    .body(json_byte_stream)
                    .send()
                    .await
                    .expect("Failed to save data to S3");
            });

            futs.push(fut);

            if futs.len() >= 10 {
                tasks.push(futs.next().await.unwrap());
            }
        }
    }

    while let Some(task) = futs.next().await {
        tasks.push(task);
    }

    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing::init_default_subscriber();

    let config = aws_config::load_defaults(BehaviorVersion::latest()).await;

    let s3_client = aws_sdk_s3::Client::new(&config);
    let shared_s3_client = &s3_client;

    run(service_fn(move |event| async move {
        function_handler(event, &shared_s3_client).await
    }))
    .await
}
