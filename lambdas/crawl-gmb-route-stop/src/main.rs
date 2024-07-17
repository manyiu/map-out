use std::env;

use aws_lambda_events::event::sns::SnsEvent;
use aws_sdk_dynamodb::types::AttributeValue;
use aws_sdk_s3::primitives::ByteStream;
use aws_sdk_sns::types::MessageAttributeValue;
use futures::StreamExt;
use lambda_runtime::{run, service_fn, tracing, Error, LambdaEvent};
use serde::{Deserialize, Serialize};
use tokio::task;

#[derive(Deserialize, Debug)]
struct TopicMessage {
    timestamp: u128,
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
    data: T,
}

#[derive(Deserialize, Debug)]
struct RoutesDataRoutes {
    HKI: Vec<String>,
    KLN: Vec<String>,
    NT: Vec<String>,
}

#[derive(Deserialize, Debug)]
struct RoutesData {
    routes: RoutesDataRoutes,
}

#[derive(Deserialize, Debug)]
struct RouteDataDirectionHeadway {
    weekdays: [bool; 7],
    public_holiday: bool,
    headway_seq: u32,
    start_time: String,
    end_time: String,
    frequency: u32,
    frequency_upper: u32,
}

#[derive(Deserialize, Debug)]
struct RouteDataDirection {
    route_seq: u32,
    orig_tc: String,
    orig_sc: String,
    orig_en: String,
    dest_tc: String,
    dest_sc: String,
    dest_en: String,
    remarks_tc: Option<String>,
    remarks_sc: Option<String>,
    remarks_en: Option<String>,
    headways: Vec<RouteDataDirectionHeadway>,
}

#[derive(Deserialize, Debug)]
struct RouteData {
    route_id: u32,
    region: String,
    route_code: String,
    description_tc: String,
    description_sc: String,
    description_en: String,
    directions: Vec<RouteDataDirection>,
}

#[derive(Serialize, Deserialize, Debug)]
struct RouteStopDataRouteStops {
    stop_seq: u32,
    stop_id: u32,
    name_tc: String,
    name_sc: String,
    name_en: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct RouteStopData {
    route_stops: Vec<RouteStopDataRouteStops>,
}

#[derive(Serialize, Debug)]
struct DatabaseRouteData {
    route_id: u32,
    region: String,
    route_code: String,
    description_tc: String,
    description_sc: String,
    description_en: String,
    route_seq: u32,
    orig_tc: String,
    orig_sc: String,
    orig_en: String,
    dest_tc: String,
    dest_sc: String,
    dest_en: String,
    remarks_tc: Option<String>,
    remarks_sc: Option<String>,
    remarks_en: Option<String>,
}

async fn function_handler(
    event: LambdaEvent<SnsEvent>,
    s3_client: &aws_sdk_s3::Client,
    dynamodb_client: &aws_sdk_dynamodb::Client,
    sns_client: &aws_sdk_sns::Client,
) -> Result<(), Error> {
    let topic_message: TopicMessage =
        serde_json::from_str(&event.payload.records[0].sns.message).unwrap();
    let new_update_date = topic_message.timestamp;
    let dynamodb_table_name = env::var("DYNAMODB_TABLE_NAME").unwrap();
    let dynamodb_pk = "update";
    let dynamodb_sk = format!("created_at#{}", new_update_date);
    let s3_bucket = env::var("RAW_DATA_BUCKET").unwrap();

    let http_client = reqwest::Client::new();

    let routes_response = http_client
        .get("https://data.etagmb.gov.hk/route")
        .send()
        .await;

    if routes_response.is_err() {
        let _ = dynamodb_client
            .update_item()
            .table_name(dynamodb_table_name.to_string())
            .key("pk", AttributeValue::S(dynamodb_pk.to_string()))
            .key("sk", AttributeValue::S(dynamodb_sk))
            .update_expression("SET #STATUS = :status AND append_list(#ERRORS, :error)")
            .expression_attribute_names("#STATUS", "has_error")
            .expression_attribute_values(":status", AttributeValue::Bool(true))
            .expression_attribute_names("#ERRORS", "error")
            .expression_attribute_values(
                ":error",
                AttributeValue::S(routes_response.err().unwrap().to_string()),
            )
            .send()
            .await;

        panic!(
            "Failed to fetch route citybus data for timestamp {}",
            new_update_date
        );
    }

    let routes_json = routes_response
        .unwrap()
        .json::<ResponseWrapper<RoutesData>>()
        .await
        .unwrap();

    let mut region_routes = vec![];

    for route in routes_json.data.routes.HKI {
        region_routes.push(vec!["HKI".to_string(), route]);
    }

    for route in routes_json.data.routes.KLN {
        region_routes.push(vec!["KLN".to_string(), route]);
    }

    for route in routes_json.data.routes.NT {
        region_routes.push(vec!["NT".to_string(), route]);
    }

    let mut futs = futures::stream::FuturesUnordered::new();
    let mut tasks = vec![];

    for region_route in region_routes {
        let http_client_clone = http_client.clone();
        let dynamodb_client_clone = dynamodb_client.clone();
        let dynamodb_table_name_clone = dynamodb_table_name.clone();
        let dynamodb_sk = dynamodb_sk.clone();
        let s3_bucket_clone = s3_bucket.clone();
        let s3_client_clone = s3_client.clone();
        let sns_client_clone = sns_client.clone();

        let fut = task::spawn(async move {
            let route_response = http_client_clone
                .get(&format!(
                    "https://data.etagmb.gov.hk/route/{}/{}",
                    region_route[0], region_route[1]
                ))
                .send()
                .await;

            if route_response.is_err() {
                let _ = dynamodb_client_clone
                    .update_item()
                    .table_name(dynamodb_table_name_clone.to_string())
                    .key("pk", AttributeValue::S(dynamodb_pk.to_string()))
                    .key("sk", AttributeValue::S(dynamodb_sk))
                    .update_expression("SET #STATUS = :status AND append_list(#ERRORS, :error)")
                    .expression_attribute_names("#STATUS", "has_error")
                    .expression_attribute_values(":status", AttributeValue::Bool(true))
                    .expression_attribute_names("#ERRORS", "error")
                    .expression_attribute_values(
                        ":error",
                        AttributeValue::S(route_response.err().unwrap().to_string()),
                    )
                    .send()
                    .await;

                panic!(
                    "Failed to fetch route citybus data for timestamp {}",
                    new_update_date
                );
            }

            let route_json = route_response
                .unwrap()
                .json::<ResponseWrapper<Vec<RouteData>>>()
                .await
                .unwrap();

            for route in route_json.data {
                for direction in route.directions {
                    let route_data = DatabaseRouteData {
                        route_id: route.route_id,
                        region: route.region.to_string(),
                        route_code: route.route_code.to_string(),
                        description_tc: route.description_tc.to_string(),
                        description_sc: route.description_sc.to_string(),
                        description_en: route.description_en.to_string(),
                        route_seq: direction.route_seq,
                        orig_tc: direction.orig_tc,
                        orig_sc: direction.orig_sc,
                        orig_en: direction.orig_en,
                        dest_tc: direction.dest_tc,
                        dest_sc: direction.dest_sc,
                        dest_en: direction.dest_en,
                        remarks_tc: direction.remarks_tc,
                        remarks_sc: direction.remarks_sc,
                        remarks_en: direction.remarks_en,
                    };

                    let route_data_json = serde_json::to_string(&route_data).unwrap();
                    let route_data_json_byte_stream =
                        ByteStream::from(route_data_json.into_bytes());

                    let _ = s3_client_clone
                        .put_object()
                        .bucket(s3_bucket_clone.to_string())
                        .key(format!(
                            "{}/gmb/route/{}-{}.json",
                            new_update_date, route.route_id, direction.route_seq
                        ))
                        .body(route_data_json_byte_stream)
                        .send()
                        .await;

                    let route_stop_response = http_client_clone
                        .get(&format!(
                            "https://data.etagmb.gov.hk/route-stop/{}/{}",
                            route.route_id, direction.route_seq
                        ))
                        .send()
                        .await;

                    if route_stop_response.is_err() {
                        let _ = dynamodb_client_clone
                            .update_item()
                            .table_name(dynamodb_table_name_clone.to_string())
                            .key("pk", AttributeValue::S(dynamodb_pk.to_string()))
                            .key("sk", AttributeValue::S(dynamodb_sk))
                            .update_expression(
                                "SET #STATUS = :status AND append_list(#ERRORS, :error)",
                            )
                            .expression_attribute_names("#STATUS", "has_error")
                            .expression_attribute_values(":status", AttributeValue::Bool(true))
                            .expression_attribute_names("#ERRORS", "error")
                            .expression_attribute_values(
                                ":error",
                                AttributeValue::S(route_stop_response.err().unwrap().to_string()),
                            )
                            .send()
                            .await;

                        panic!(
                            "Failed to fetch route citybus data for timestamp {}",
                            new_update_date
                        );
                    }

                    let route_stop_json = route_stop_response
                        .unwrap()
                        .json::<ResponseWrapper<RouteStopData>>()
                        .await
                        .unwrap();

                    let route_stop_json_ser = serde_json::to_string(&route_stop_json).unwrap();
                    let route_stop_body_byte_stream =
                        ByteStream::from(route_stop_json_ser.into_bytes());

                    let _ = s3_client_clone
                        .put_object()
                        .bucket(s3_bucket_clone.to_string())
                        .key(format!(
                            "{}/gmb/route-stop/{}-{}.json",
                            new_update_date, route.route_id, direction.route_seq
                        ))
                        .body(route_stop_body_byte_stream)
                        .send()
                        .await;

                    for stop in route_stop_json.data.route_stops {
                        let get_gmb_stop_message_attribute_value = MessageAttributeValue::builder()
                            .set_data_type(Some("String".to_string()))
                            .set_string_value(Some("generic-crawler".to_string()))
                            .build()
                            .unwrap();

                        let get_gmb_stop_message = GenericCrawlerMessage {
                            url: format!("https://data.etagmb.gov.hk/stop/{}", stop.stop_id),
                            s3_bucket: s3_bucket_clone.to_string(),
                            s3_key: format!("{}/gmb/stop/{}.json", new_update_date, stop.stop_id),
                            dynamodb_pk: dynamodb_pk.to_string(),
                            dynamodb_sk: dynamodb_sk.to_string(),
                        };

                        let get_gmb_stop_message_json =
                            serde_json::to_string(&get_gmb_stop_message).unwrap();

                        let _ = sns_client_clone
                            .publish()
                            .topic_arn(
                                env::var("UPDATE_DATA_TOPIC_ARN").expect("Missing SNS_TOPIC_ARN"),
                            )
                            .message_attributes("type", get_gmb_stop_message_attribute_value)
                            .message(get_gmb_stop_message_json)
                            .send()
                            .await;
                    }
                }
            }
        });

        futs.push(fut);

        if futs.len() >= 10 {
            tasks.push(futs.next().await.unwrap());
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

    let config = aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await;

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
