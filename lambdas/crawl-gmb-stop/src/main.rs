use core::panic;
use std::env;

use aws_config::BehaviorVersion;
use aws_lambda_events::event::sns::SnsEvent;
use aws_sdk_dynamodb::types::AttributeValue;
use aws_sdk_s3::primitives::ByteStream;
use lambda_runtime::{run, service_fn, tracing, Error, LambdaEvent};
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Debug)]
struct TopicMessage {
    url: String,
    stop_id: u32,
    s3_bucket: String,
    s3_key: String,
    dynamodb_pk: String,
    dynamodb_sk: String,
}

#[derive(Deserialize, Debug)]
struct Coordinates {
    latitude: f64,
    longitude: f64,
}

#[derive(Deserialize, Debug)]
struct StopDataCoordinate {
    wgs84: Coordinates,
    hk80: Coordinates,
}

#[derive(Deserialize, Debug)]
struct StopData {
    coordinates: StopDataCoordinate,
    enabled: bool,
    remarks_tc: Option<String>,
    remarks_sc: Option<String>,
    remarks_en: Option<String>,
}

#[derive(Deserialize, Debug)]
struct ResponseWrapper<T> {
    r#type: String,
    version: String,
    generated_timestamp: String,
    data: T,
}

#[derive(Serialize, Debug)]
struct DatabaseStopData {
    stop: u32,
    lat: f64,
    long: f64,
    enabled: bool,
    remarks_tc: Option<String>,
    remarks_sc: Option<String>,
    remarks_en: Option<String>,
}

async fn function_handler(
    event: LambdaEvent<SnsEvent>,
    s3_client: &aws_sdk_s3::Client,
    dynamodb_client: &aws_sdk_dynamodb::Client,
) -> Result<(), Error> {
    let topic_message: TopicMessage = serde_json::from_str(&event.payload.records[0].sns.message)?;

    let http_client = reqwest::Client::new();

    let response = http_client
        .get(&topic_message.url)
        .header("User-Agent", "reqwest")
        .send()
        .await;

    if response.as_ref().is_err() {
        let _ = dynamodb_client
            .update_item()
            .table_name(env::var("DYNAMODB_TABLE_NAME").unwrap())
            .key("pk", AttributeValue::S(topic_message.dynamodb_pk))
            .key("sk", AttributeValue::S(topic_message.dynamodb_sk))
            .update_expression("SET #STATUS = :status AND append_list(#ERRORS, :error)")
            .expression_attribute_names("#STATUS", "has_error")
            .expression_attribute_values(":status", AttributeValue::Bool(true))
            .expression_attribute_names("#ERRORS", "error")
            .expression_attribute_values(":error", AttributeValue::S(topic_message.url.to_string()))
            .send()
            .await;

        panic!("Failed to fetch URL, url: {}", topic_message.url);
    }

    let json = response
        .unwrap()
        .json::<ResponseWrapper<StopData>>()
        .await
        .unwrap();

    let stop_data = DatabaseStopData {
        stop: topic_message.stop_id,
        lat: json.data.coordinates.wgs84.latitude,
        long: json.data.coordinates.wgs84.longitude,
        enabled: json.data.enabled,
        remarks_tc: json.data.remarks_tc,
        remarks_sc: json.data.remarks_sc,
        remarks_en: json.data.remarks_en,
    };

    let stop_data_json = serde_json::to_string(&stop_data).unwrap();
    let body_byte_stream = ByteStream::from(stop_data_json.into_bytes());

    s3_client
        .put_object()
        .bucket(&topic_message.s3_bucket)
        .key(topic_message.s3_key)
        .body(body_byte_stream)
        .send()
        .await
        .expect("Failed to put object in S3");

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

    run(service_fn(move |event| async move {
        function_handler(event, &shared_s3_client, &shared_dynamodb_client).await
    }))
    .await
}
