use std::env;

use aws_config::BehaviorVersion;
use aws_lambda_events::event::eventbridge::EventBridgeEvent;
use aws_sdk_dynamodb::types::AttributeValue;
use lambda_runtime::{run, service_fn, tracing, Error, LambdaEvent};

async fn function_handler(
    _event: LambdaEvent<EventBridgeEvent>,
    s3_client: &aws_sdk_s3::Client,
    dynamodb_client: &aws_sdk_dynamodb::Client,
) -> Result<(), Error> {
    let latest_update_item = dynamodb_client
        .query()
        .table_name(env::var("DYNAMODB_TABLE_NAME")?)
        .key_condition_expression("#pk = :pk")
        .expression_attribute_names("#pk", "pk")
        .expression_attribute_values(":pk", AttributeValue::S("update".to_string()))
        .scan_index_forward(false)
        .limit(1)
        .send()
        .await?;

    let item = latest_update_item
        .items
        .unwrap()
        .first()
        .unwrap()
        .to_owned();

    let has_error = item.get("has_error").unwrap().as_bool().unwrap().to_owned();

    if has_error {
        panic!("Error in the last update");
    }

    let updated_at = item.get("created_at").unwrap().as_n().unwrap().to_owned();

    let mut object_keys = Vec::new();

    let mut processed_data_object_response = s3_client
        .list_objects_v2()
        .bucket(env::var("PROCESSED_DATA_BUCKET")?)
        .prefix(format!("{}/", updated_at))
        .into_paginator()
        .send();

    while let Some(response) = processed_data_object_response.next().await {
        let outputs = response.unwrap();

        for content in outputs.contents() {
            let key = content.key().unwrap().to_string();

            object_keys.push(key);
        }
    }

    let _ = dynamodb_client
        .put_item()
        .table_name(env::var("DYNAMODB_TABLE_NAME")?)
        .item("pk", AttributeValue::S("data".to_string()))
        .item(
            "sk",
            AttributeValue::S(format!("created_at#{}", updated_at)),
        )
        .item("created_at", AttributeValue::N(updated_at.to_string()))
        .item("data", AttributeValue::Ss(object_keys.to_vec()))
        .send()
        .await?;

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
