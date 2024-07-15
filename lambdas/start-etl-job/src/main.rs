use core::panic;
use std::env;

use aws_config::BehaviorVersion;
use aws_lambda_events::event::eventbridge::EventBridgeEvent;
use aws_sdk_dynamodb::types::AttributeValue;
use lambda_runtime::{run, service_fn, tracing, Error, LambdaEvent};

async fn function_handler(
    _event: LambdaEvent<EventBridgeEvent>,
    dynamodb_client: &aws_sdk_dynamodb::Client,
    glue_client: &aws_sdk_glue::Client,
) -> Result<(), Error> {
    let last_update_item = dynamodb_client
        .query()
        .table_name(env::var("DYNAMODB_TABLE_NAME")?)
        .key_condition_expression("#pk = :pk")
        .expression_attribute_names("#pk", "pk")
        .expression_attribute_values(":pk", AttributeValue::S("update".to_string()))
        .scan_index_forward(false)
        .limit(1)
        .send()
        .await?;

    let item = last_update_item.items.unwrap().first().unwrap().to_owned();

    let has_error = item.get("has_error").unwrap().as_bool().unwrap().to_owned();

    if has_error {
        panic!("Error in the last update");
    }

    let updated_at = item.get("created_at").unwrap().as_n().unwrap().to_owned();

    let _ = glue_client
        .start_job_run()
        .job_name(env::var("GLUE_JOB_NAME")?)
        .arguments("--updated_at", updated_at.to_string())
        .send()
        .await
        .unwrap();

    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    tracing::init_default_subscriber();

    let config = aws_config::load_defaults(BehaviorVersion::latest()).await;

    let dynamodb_client = aws_sdk_dynamodb::Client::new(&config);
    let shared_dynamodb_client = &dynamodb_client;

    let glue_client = aws_sdk_glue::Client::new(&config);
    let shared_glue_client = &glue_client;

    run(service_fn(move |event| async move {
        function_handler(event, &shared_dynamodb_client, &shared_glue_client).await
    }))
    .await
}
