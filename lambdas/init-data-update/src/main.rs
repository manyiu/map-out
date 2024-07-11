use std::env;

use aws_config::{load_defaults, BehaviorVersion};
use aws_lambda_events::event::eventbridge::EventBridgeEvent;
use aws_sdk_dynamodb::types::AttributeValue;
use aws_sdk_sns::types::MessageAttributeValue;
use lambda_runtime::{
    run, service_fn,
    tracing::{self},
    Error, LambdaEvent,
};
use serde::Serialize;

#[derive(Serialize, Debug)]
struct InitDataUpdateTopicMessage {
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

async fn function_handler(
    _: LambdaEvent<EventBridgeEvent>,
    dynamodb_client: &aws_sdk_dynamodb::Client,
    sns_client: &aws_sdk_sns::Client,
) -> Result<(), Error> {
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_millis();

    let s3_bucket = env::var("RAW_DATA_BUCKET").unwrap();
    let dynamodb_table_name = env::var("DYNAMODB_TABLE_NAME").unwrap();
    let dynamodb_pk = "action#update";
    let dynamodb_sk = format!("created_at#{}", timestamp);
    let sns_topice_arn = env::var("UPDATE_DATA_TOPIC_ARN").unwrap();

    let _ = dynamodb_client
        .put_item()
        .table_name(dynamodb_table_name)
        .item("pk", AttributeValue::S(dynamodb_pk.to_string()))
        .item("sk", AttributeValue::S(dynamodb_sk.to_string()))
        .item("created_at", AttributeValue::N(timestamp.to_string()))
        .item("stopped", AttributeValue::Bool(false))
        .item("error", AttributeValue::L(Vec::new()))
        .send()
        .await
        .unwrap();

    let init_data_update_message_attribute_value = MessageAttributeValue::builder()
        .set_data_type(Some("String".to_string()))
        .set_string_value(Some("init-data-update".to_string()))
        .build()
        .unwrap();

    let init_data_update_message = InitDataUpdateTopicMessage { timestamp };

    let init_data_update_json = serde_json::to_string(&init_data_update_message).unwrap();

    let _ = sns_client
        .publish()
        .topic_arn(sns_topice_arn.to_string())
        .message_attributes("type", init_data_update_message_attribute_value)
        .message(init_data_update_json)
        .send()
        .await
        .unwrap();

    let get_kmb_route_message_attribute_value = MessageAttributeValue::builder()
        .set_data_type(Some("String".to_string()))
        .set_string_value(Some("generic-crawler".to_string()))
        .build()
        .unwrap();

    let get_kmb_route_message = GenericCrawlerMessage {
        url: "https://data.etabus.gov.hk/v1/transport/kmb/route".to_string(),
        s3_bucket: env::var("RAW_DATA_BUCKET").unwrap(),
        s3_key: format!("bus/{}/kmb/route/list.json", timestamp),
        dynamodb_pk: dynamodb_pk.to_string(),
        dynamodb_sk: dynamodb_sk.to_string(),
    };

    let get_kmb_route_json = serde_json::to_string(&get_kmb_route_message).unwrap();

    let _ = sns_client
        .publish()
        .topic_arn(env::var("UPDATE_DATA_TOPIC_ARN").unwrap())
        .message_attributes("type", get_kmb_route_message_attribute_value)
        .message(get_kmb_route_json)
        .send()
        .await
        .unwrap();

    let get_kmb_stop_message_attribute_value = MessageAttributeValue::builder()
        .set_data_type(Some("String".to_string()))
        .set_string_value(Some("generic-crawler".to_string()))
        .build()
        .unwrap();

    let get_kmb_stop_message = GenericCrawlerMessage {
        url: "https://data.etabus.gov.hk/v1/transport/kmb/stop".to_string(),
        s3_bucket: env::var("RAW_DATA_BUCKET").unwrap(),
        s3_key: format!("bus/{}/kmb/stop/list.json", timestamp),
        dynamodb_pk: dynamodb_pk.to_string(),
        dynamodb_sk: dynamodb_sk.to_string(),
    };

    let get_kmb_stop_json = serde_json::to_string(&get_kmb_stop_message).unwrap();

    let _ = sns_client
        .publish()
        .topic_arn(env::var("UPDATE_DATA_TOPIC_ARN").unwrap())
        .message_attributes("type", get_kmb_stop_message_attribute_value)
        .message(get_kmb_stop_json)
        .send()
        .await
        .unwrap();

    let get_kmb_route_stop_message_attribute_value = MessageAttributeValue::builder()
        .set_data_type(Some("String".to_string()))
        .set_string_value(Some("generic-crawler".to_string()))
        .build()
        .unwrap();

    let get_kmb_route_stop_message = GenericCrawlerMessage {
        url: "https://data.etabus.gov.hk/v1/transport/kmb/route-stop".to_string(),
        s3_bucket,
        s3_key: format!("bus/{}/kmb/route-stop/list.json", timestamp),
        dynamodb_pk: dynamodb_pk.to_string(),
        dynamodb_sk: dynamodb_sk.to_string(),
    };

    let get_kmb_route_stop_json = serde_json::to_string(&get_kmb_route_stop_message).unwrap();

    let _ = sns_client
        .publish()
        .topic_arn(sns_topice_arn.to_string())
        .message_attributes("type", get_kmb_route_stop_message_attribute_value)
        .message(get_kmb_route_stop_json)
        .send()
        .await
        .unwrap();

    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing::init_default_subscriber();

    let config = load_defaults(BehaviorVersion::latest()).await;

    let dynamodb_client = aws_sdk_dynamodb::Client::new(&config);
    let shared_dynamodb_client = &dynamodb_client;

    let sns_client = aws_sdk_sns::Client::new(&config);
    let shared_sns_client = &sns_client;

    run(service_fn(move |event| async move {
        function_handler(event, &shared_dynamodb_client, &shared_sns_client).await
    }))
    .await
}
