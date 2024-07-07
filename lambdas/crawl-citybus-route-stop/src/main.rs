use aws_config::BehaviorVersion;
use aws_lambda_events::sns::SnsEvent;
use aws_sdk_dynamodb::types::AttributeValue;
use aws_sdk_s3::primitives::ByteStream;
use aws_sdk_sns::types::MessageAttributeValue;
use futures::StreamExt;
use lambda_runtime::{
    run, service_fn,
    tracing::{self},
    Error, LambdaEvent,
};
use serde::{Deserialize, Serialize};
use std::env;
use tokio::task;

#[derive(Deserialize, Debug)]
struct TopicMessage {
    new_update_date: String,
}

#[derive(Serialize, Debug)]
struct GenericCrawlerMessage {
    url: String,
    s3_bucket: String,
    s3_key: String,
    dynamodb_pk: String,
    dynamodb_sk: String,
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
    dynamodb_client: &aws_sdk_dynamodb::Client,
    sns_client: &aws_sdk_sns::Client,
) -> Result<(), Error> {
    let http_client = reqwest::Client::new();

    let topic_message: TopicMessage =
        serde_json::from_str(&event.payload.records[0].sns.message).unwrap();

    let route_response = http_client
        .get("https://rt.data.gov.hk/v2/transport/citybus/route/ctb")
        .send()
        .await
        .unwrap();

    let route_json = route_response
        .json::<ResponseWrapper<RouteData>>()
        .await
        .unwrap();

    let route_json_string = serde_json::to_string(&route_json).unwrap();
    let route_json_byte_stream = ByteStream::from(route_json_string.into_bytes());

    s3_client
        .put_object()
        .bucket(env::var("RAW_DATA_BUCKET").expect("Missing RAW_DATA_BUCKET"))
        .key(format!(
            "bus/{}/citybus/route-list/route-list.json",
            topic_message.new_update_date
        ))
        .body(route_json_byte_stream)
        .send()
        .await
        .expect("Failed to save data to S3");

    let mut futs = futures::stream::FuturesUnordered::new();
    let mut tasks = vec![];

    for route in route_json.data {
        for direction in vec!["inbound", "outbound"] {
            let http_client_clone = http_client.clone();
            let s3_client_clone = s3_client.clone();
            let route_clone = route.clone();
            let direction_clone = direction.to_string();
            let sns_client_clone = sns_client.clone();
            let new_update_date = topic_message.new_update_date.clone();
            let dynamodb_client_clone = dynamodb_client.clone();

            let fut = task::spawn(async move {
                let route_stop_response = http_client_clone
                    .get(&format!(
                        "https://rt.data.gov.hk/v2/transport/citybus/route-stop/CTB/{}/{}",
                        route_clone.route, direction_clone
                    ))
                    .send()
                    .await;

                if route_stop_response.is_err() {
                    let _ = dynamodb_client_clone
                        .update_item()
                        .table_name(env::var("DYNAMODB_TABLE_NAME").unwrap())
                        .key(
                            "pk",
                            AttributeValue::S("#TD_ROUTES_FARES_GEOJSON#UPDATE".to_string()),
                        )
                        .key(
                            "sk",
                            AttributeValue::S(format!("#UPDATE_DATE#{}", new_update_date)),
                        )
                        .update_expression("SET #STATUS = :status AND append_list(#ERRORS, :error)")
                        .expression_attribute_names("#STATUS", "stopped")
                        .expression_attribute_values(":status", AttributeValue::Bool(true))
                        .expression_attribute_names("#ERRORS", "error")
                        .expression_attribute_values(
                            ":error",
                            AttributeValue::S(route_stop_response.err().unwrap().to_string()),
                        )
                        .send()
                        .await;

                    panic!(
                        "Failed to fetch route stop data for route {} and direction {}",
                        route_clone.route, direction_clone
                    );
                }

                let route_stop_json = route_stop_response
                    .unwrap()
                    .json::<ResponseWrapper<RouteStopData>>()
                    .await
                    .expect("Failed to parse route stop data");

                if route_stop_json.data.is_empty() {
                    return;
                }

                for route_stop in &route_stop_json.data {
                    let get_citybus_stop_message_attribute_value = MessageAttributeValue::builder()
                        .set_data_type(Some("String".to_string()))
                        .set_string_value(Some("generic-crawler".to_string()))
                        .build()
                        .unwrap();

                    let get_citybus_stop_message = GenericCrawlerMessage {
                        url: format!(
                            "https://rt.data.gov.hk/v2/transport/citybus/stop/{}",
                            route_stop.stop
                        ),
                        s3_bucket: env::var("RAW_DATA_BUCKET").expect("Missing RAW_DATA_BUCKET"),
                        s3_key: format!(
                            "bus/{}/citybus/stop/{}.json",
                            new_update_date, route_stop.stop
                        ),
                        dynamodb_pk: "#TD_ROUTES_FARES_GEOJSON#UPDATE".to_string(),
                        dynamodb_sk: format!("#UPDATE_DATE#{}", new_update_date),
                    };

                    let get_citybus_stop_json = serde_json::to_string(&get_citybus_stop_message)
                        .expect("Failed to serialize data");

                    let _ = sns_client_clone
                        .publish()
                        .topic_arn(
                            env::var("UPDATE_DATA_TOPIC_ARN").expect("Missing SNS_TOPIC_ARN"),
                        )
                        .message_attributes("type", get_citybus_stop_message_attribute_value)
                        .message(get_citybus_stop_json)
                        .send()
                        .await
                        .expect("Failed to send message to SNS");
                }

                let json =
                    serde_json::to_string(&route_stop_json).expect("Failed to serialize data");
                let json_byte_stream = ByteStream::from(json.into_bytes());

                s3_client_clone
                    .put_object()
                    .bucket(env::var("RAW_DATA_BUCKET").expect("Missing RAW_DATA_BUCKET"))
                    .key(format!(
                        "bus/{}/citybus/route-stop/{}-{}.json",
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

    let dynamodb_client = aws_sdk_dynamodb::Client::new(&config);
    let shared_dynamodb_client = &dynamodb_client;

    let sns_client = aws_sdk_sns::Client::new(&config);
    let shared_sns_client = &sns_client;

    run(service_fn(move |event| async move {
        function_handler(
            event,
            &shared_s3_client,
            &shared_dynamodb_client,
            shared_sns_client,
        )
        .await
    }))
    .await
}
