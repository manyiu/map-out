use std::env;

use aws_config::BehaviorVersion;
use aws_lambda_events::event::s3::S3Event;
use lambda_runtime::{run, service_fn, tracing, Error, LambdaEvent};

async fn function_handler(
    event: LambdaEvent<S3Event>,
    s3_client: &aws_sdk_s3::Client,
) -> Result<(), Error> {
    for record in event.payload.records {
        let bucket = record.s3.bucket.name.unwrap();
        let key = record.s3.object.key.unwrap();
        let re = regex::Regex::new(r"bus\/[0-9]+\/").unwrap();
        let s3_key = re.replace(&key, "bus/");

        let _ = s3_client
            .copy_object()
            .copy_source(format!("{}/{}", bucket, key))
            .bucket(env::var("PROCESSING_DATA_BUCKET").unwrap())
            .key(s3_key)
            .send()
            .await;
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
