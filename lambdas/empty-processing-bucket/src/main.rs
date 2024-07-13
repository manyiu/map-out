use std::env;

use aws_config::{load_defaults, BehaviorVersion};
use aws_lambda_events::event::eventbridge::EventBridgeEvent;
use lambda_runtime::{run, service_fn, tracing, Error, LambdaEvent};

async fn function_handler(
    _event: LambdaEvent<EventBridgeEvent>,
    s3_client: &aws_sdk_s3::Client,
) -> Result<(), Error> {
    let mut processing_list_objects_response = s3_client
        .list_objects_v2()
        .bucket(env::var("PROCESSING_DATA_BUCKET")?)
        .into_paginator()
        .send();

    while let Some(result) = processing_list_objects_response.next().await {
        let outputs = result.unwrap();
        let mut delete_objects = Vec::new();

        for content in outputs.contents() {
            let key = aws_sdk_s3::types::ObjectIdentifier::builder()
                .set_key(Some(content.key().unwrap().to_string()))
                .build()
                .unwrap();

            delete_objects.push(key);
        }

        if !delete_objects.is_empty() {
            let _ = s3_client
                .delete_objects()
                .bucket(env::var("PROCESSING_DATA_BUCKET")?)
                .delete(
                    aws_sdk_s3::types::Delete::builder()
                        .set_objects(Some(delete_objects))
                        .build()
                        .unwrap(),
                )
                .send()
                .await
                .unwrap();
        }
    }

    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing::init_default_subscriber();

    let config = load_defaults(BehaviorVersion::latest()).await;

    let s3_client = aws_sdk_s3::Client::new(&config);
    let shared_s3_client = &s3_client;

    run(service_fn(move |event| async move {
        function_handler(event, &shared_s3_client).await
    }))
    .await
}
