use std::env;

use aws_config::{load_defaults, BehaviorVersion};
use aws_sdk_dynamodb::types::AttributeValue;
use lambda_http::{run, service_fn, Body, Error, Request, Response};
use serde::Serialize;

#[derive(Serialize, Debug)]
struct HttpResponseBody {
    timestamp: i64,
    files: Vec<String>,
}

async fn function_handler(
    _event: Request,
    dynamodb_client: &aws_sdk_dynamodb::Client,
) -> Result<Response<Body>, Error> {
    let latest_update_response = dynamodb_client
        .query()
        .table_name(env::var("DYNAMODB_TABLE_NAME")?)
        .key_condition_expression("#pk = :pk")
        .expression_attribute_names("#pk", "pk")
        .expression_attribute_values(":pk", AttributeValue::S("data".to_string()))
        .scan_index_forward(false)
        .limit(1)
        .send()
        .await?;

    let item = latest_update_response.items().first().unwrap();

    let created_at = item
        .get("created_at")
        .unwrap()
        .as_n()
        .unwrap()
        .parse::<i64>()
        .unwrap();

    let file_list = item.get("data").unwrap().as_ss().unwrap();

    let response_body = HttpResponseBody {
        timestamp: created_at,
        files: file_list.clone(),
    };

    let resp = Response::builder()
        .status(200)
        .header("content-type", "application/json")
        .body(serde_json::to_string(&response_body).unwrap().into())
        .map_err(Box::new)?;
    Ok(resp)
}

#[tokio::main]
async fn main() -> Result<(), Error> {
    let config = load_defaults(BehaviorVersion::latest()).await;

    let dynamodb_client = aws_sdk_dynamodb::Client::new(&config);
    let shared_dynamodb_client = &dynamodb_client;

    run(service_fn(move |event| async move {
        function_handler(event, &shared_dynamodb_client).await
    }))
    .await
}
