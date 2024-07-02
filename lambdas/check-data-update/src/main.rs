use std::env;

use aws_config::{load_defaults, BehaviorVersion};
use aws_lambda_events::event::eventbridge::EventBridgeEvent;
use aws_sdk_dynamodb::types::AttributeValue;
use chrono::NaiveDate;
use lambda_runtime::{run, service_fn, tracing, Error, LambdaEvent};
use serde::Serialize;

#[derive(Serialize, Debug)]
struct TopicMessage {
    last_update_date: String,
    new_update_date: String,
}

async fn function_handler(
    _: LambdaEvent<EventBridgeEvent>,
    dynamodb_client: &aws_sdk_dynamodb::Client,
    sns_client: &aws_sdk_sns::Client,
) -> Result<(), Error> {
    let http_client = reqwest::Client::new();

    let new_update_date_response = http_client
        .get("https://static.data.gov.hk/td/routes-fares-geojson/DATA_LAST_UPDATED_DATE.csv")
        .send()
        .await
        .unwrap();

    let new_update_date_string = new_update_date_response.text().await.unwrap();
    let mut rdr = csv::Reader::from_reader(new_update_date_string.as_bytes());
    let mut records = csv::ByteRecord::new();

    rdr.read_byte_record(&mut records).unwrap();

    let new_update_date_string = std::str::from_utf8(records.get(0).unwrap()).unwrap();

    println!("updated_date_string: {}", new_update_date_string);

    let new_update_date = NaiveDate::parse_from_str(new_update_date_string, "%Y-%m-%d").unwrap();

    let last_update_result = dynamodb_client
        .get_item()
        .table_name(env::var("DYNAMODB_TABLE_NAME").unwrap())
        .key("pk", AttributeValue::S("#LAST_UPDATE".to_string()))
        .key(
            "sk",
            AttributeValue::S("#TD_ROUTES_FARES_GEOJSON".to_string()),
        )
        .send()
        .await;

    let last_update_item = last_update_result.unwrap().item;

    let database_last_update_date_string = match last_update_item.as_ref() {
        Some(item) => item.get("updated_at").unwrap().as_s().unwrap(),
        None => {
            let _ = dynamodb_client
                .put_item()
                .table_name(env::var("DYNAMODB_TABLE_NAME").unwrap())
                .item("pk", AttributeValue::S("#LAST_UPDATE".to_string()))
                .item(
                    "sk",
                    AttributeValue::S("#TD_ROUTES_FARES_GEOJSON".to_string()),
                )
                .item(
                    "updated_at",
                    AttributeValue::S(new_update_date_string.to_string()),
                )
                .send()
                .await;

            "2024-01-01"
        }
    };

    let database_last_update_date =
        NaiveDate::parse_from_str(&database_last_update_date_string, "%Y-%m-%d").unwrap();

    if new_update_date > database_last_update_date {
        use aws_sdk_sns::types::MessageAttributeValue;

        let message_attribute_value = MessageAttributeValue::builder()
            .set_data_type(Some("String".to_string()))
            .set_string_value(Some("init-update-data".to_string()))
            .build()
            .unwrap();

        let message = TopicMessage {
            last_update_date: database_last_update_date.to_string(),
            new_update_date: new_update_date_string.to_string(),
        };

        let json = serde_json::to_string(&message).unwrap();

        let _ = sns_client
            .publish()
            .topic_arn(env::var("UPDATE_DATA_TOPIC_ARN").unwrap())
            .message_attributes("type", message_attribute_value)
            .message(json)
            .send()
            .await
            .unwrap();
    }

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
