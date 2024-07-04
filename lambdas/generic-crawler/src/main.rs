use aws_config::BehaviorVersion;
use aws_lambda_events::event::sns::SnsEvent;
use aws_sdk_s3::primitives::ByteStream;
use lambda_runtime::{run, service_fn, tracing, Error, LambdaEvent};
use serde::Deserialize;

#[derive(Deserialize, Debug)]
struct TopicMessage {
    url: String,
    s3_bucket: String,
    s3_key: String,
}

async fn function_handler(
    event: LambdaEvent<SnsEvent>,
    s3_client: &aws_sdk_s3::Client,
) -> Result<(), Error> {
    let topic_message: TopicMessage = serde_json::from_str(&event.payload.records[0].sns.message)?;

    let http_client = reqwest::Client::new();

    let response = http_client
        .get(&topic_message.url)
        .send()
        .await
        .expect("Failed to send request to URL");

    let body = response.json::<serde_json::Value>().await?;

    let json = serde_json::to_string(&body)?;

    let json_byte_stream = ByteStream::from(json.into_bytes());

    s3_client
        .put_object()
        .bucket(&topic_message.s3_bucket)
        .key(topic_message.s3_key)
        .body(json_byte_stream)
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

    run(service_fn(move |event| async move {
        function_handler(event, &shared_s3_client).await
    }))
    .await
}
