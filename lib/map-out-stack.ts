import { Schedule, ScheduleExpression } from "@aws-cdk/aws-scheduler-alpha";
import { LambdaInvoke } from "@aws-cdk/aws-scheduler-targets-alpha";
import * as cdk from "aws-cdk-lib";
import { RustFunction } from "cargo-lambda-cdk";
import { Construct } from "constructs";
import path = require("path");

const subdomainPrefix =
  process.env.GITHUB_REF_NAME === "main"
    ? ""
    : `${process.env.GITHUB_REF_NAME}.`;

export class MapOutStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const rawDataBucket = new cdk.aws_s3.Bucket(this, "MapOutRawDataBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const processedDataBucket = new cdk.aws_s3.Bucket(
      this,
      "MapOutProcessedDataBucket",
      {
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    const dynamodbTable = new cdk.aws_dynamodb.Table(
      this,
      "MapOutDynamoDBTable",
      {
        partitionKey: {
          name: "pk",
          type: cdk.aws_dynamodb.AttributeType.STRING,
        },
        sortKey: { name: "sk", type: cdk.aws_dynamodb.AttributeType.STRING },
        billingMode: cdk.aws_dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const updateDataTopic = new cdk.aws_sns.Topic(
      this,
      "MapOutUpdateDataTopic",
      {
        displayName: "MapOut Update Data Topic",
      }
    );

    const checkDataUpdateFunction = new RustFunction(
      this,
      "MapOutCheckDataUpdateFunction",
      {
        manifestPath: path.join(
          __dirname,
          "..",
          "lambdas",
          "check-data-update",
          "Cargo.toml"
        ),
        architecture: cdk.aws_lambda.Architecture.ARM_64,
        environment: {
          DYNAMODB_TABLE_NAME: dynamodbTable.tableName,
          UPDATE_DATA_TOPIC_ARN: updateDataTopic.topicArn,
        },
        timeout: cdk.Duration.seconds(5),
      }
    );
    dynamodbTable.grantReadData(checkDataUpdateFunction);
    updateDataTopic.grantPublish(checkDataUpdateFunction);

    const checkDataUpdateFunctionInvokeTarget = new LambdaInvoke(
      checkDataUpdateFunction,
      {
        retryAttempts: 5,
      }
    );

    new Schedule(this, "MapOutDataCheckSchedule", {
      schedule: ScheduleExpression.cron({
        timeZone: cdk.TimeZone.ASIA_HONG_KONG,
        minute: "0",
        hour: "0",
        day: "*",
        month: "*",
        year: "*",
      }),
      target: checkDataUpdateFunctionInvokeTarget,
    });

    const crawlCitybusRouteStopFunction = new RustFunction(
      this,
      "MapOutCrawlCitybusRouteStopFunction",
      {
        manifestPath: path.join(
          __dirname,
          "..",
          "lambdas",
          "crawl-citybus-route-stop",
          "Cargo.toml"
        ),
        architecture: cdk.aws_lambda.Architecture.ARM_64,
        environment: {
          RAW_DATA_BUCKET: rawDataBucket.bucketName,
          DYNAMODB_TABLE_NAME: dynamodbTable.tableName,
        },
        timeout: cdk.Duration.minutes(3),
      }
    );
    rawDataBucket.grantWrite(crawlCitybusRouteStopFunction);
    dynamodbTable.grantReadData(crawlCitybusRouteStopFunction);
    updateDataTopic.addSubscription(
      new cdk.aws_sns_subscriptions.LambdaSubscription(
        crawlCitybusRouteStopFunction,
        {
          filterPolicy: {
            type: cdk.aws_sns.SubscriptionFilter.stringFilter({
              allowlist: ["init-update-data"],
            }),
          },
        }
      )
    );

    const genericCrawlerFunction = new RustFunction(
      this,
      "MapOutGenericCrawlerFunction",
      {
        manifestPath: path.join(
          __dirname,
          "..",
          "lambdas",
          "generic-crawler",
          "Cargo.toml"
        ),
        architecture: cdk.aws_lambda.Architecture.ARM_64,
        environment: {
          RAW_DATA_BUCKET: rawDataBucket.bucketName,
          DYNAMODB_TABLE_NAME: dynamodbTable.tableName,
        },
        timeout: cdk.Duration.minutes(1),
      }
    );
    rawDataBucket.grantWrite(genericCrawlerFunction);
    updateDataTopic.addSubscription(
      new cdk.aws_sns_subscriptions.LambdaSubscription(genericCrawlerFunction, {
        filterPolicy: {
          type: cdk.aws_sns.SubscriptionFilter.stringFilter({
            allowlist: ["generic-crawler"],
          }),
        },
      })
    );

    const hostingBucket = new cdk.aws_s3.Bucket(this, "MapOutHostingBucket", {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    new cdk.aws_s3_deployment.BucketDeployment(
      this,
      "MapOutHostingCacheDeployment",
      {
        sources: [
          cdk.aws_s3_deployment.Source.asset(
            path.join(__dirname, "..", "web-client", "dist")
          ),
        ],
        destinationBucket: hostingBucket,
        exclude: ["index.html"],
        cacheControl: [
          cdk.aws_s3_deployment.CacheControl.maxAge(cdk.Duration.days(365)),
        ],
        prune: false,
      }
    );

    new cdk.aws_s3_deployment.BucketDeployment(
      this,
      "MapOutHostingNoCacheDeployment",
      {
        sources: [
          cdk.aws_s3_deployment.Source.asset(
            path.join(__dirname, "..", "web-client", "dist")
          ),
        ],
        destinationBucket: hostingBucket,
        exclude: ["*"],
        include: ["index.html"],
        cacheControl: [cdk.aws_s3_deployment.CacheControl.noCache()],
        prune: false,
      }
    );

    const existingHostedZone = cdk.aws_route53.HostedZone.fromLookup(
      this,
      "MapOutHostedZone",
      {
        domainName: process.env.HOST_ZONE || "vazue.com",
      }
    );

    const hostingCertificate = new cdk.aws_certificatemanager.Certificate(
      this,
      "MapOutCertificate",
      {
        domainName: `${subdomainPrefix}map-out.${existingHostedZone.zoneName}`,
        validation:
          cdk.aws_certificatemanager.CertificateValidation.fromDns(
            existingHostedZone
          ),
      }
    );

    const originAccessIdentity = new cdk.aws_cloudfront.OriginAccessIdentity(
      this,
      "MapOutOriginAccessIdentity"
    );

    hostingBucket.grantRead(originAccessIdentity);

    const hostingDistribution = new cdk.aws_cloudfront.Distribution(
      this,
      "MapOutDistribution",
      {
        defaultBehavior: {
          origin: new cdk.aws_cloudfront_origins.S3Origin(hostingBucket, {
            originAccessIdentity,
          }),
          viewerProtocolPolicy:
            cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        },
        domainNames: [
          `${subdomainPrefix}map-out.${existingHostedZone.zoneName}`,
        ],
        certificate: hostingCertificate,
        defaultRootObject: "index.html",
        errorResponses: [
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: "/index.html",
          },
        ],
      }
    );

    const hostingCloudfrontTarget =
      new cdk.aws_route53_targets.CloudFrontTarget(hostingDistribution);

    new cdk.aws_route53.ARecord(this, "MapOutARecord", {
      zone: existingHostedZone,
      recordName: `${subdomainPrefix}map-out`,
      target: cdk.aws_route53.RecordTarget.fromAlias(hostingCloudfrontTarget),
    });

    new cdk.aws_route53.AaaaRecord(this, "MapOutAaaaRecord", {
      zone: existingHostedZone,
      recordName: `${subdomainPrefix}map-out`,
      target: cdk.aws_route53.RecordTarget.fromAlias(hostingCloudfrontTarget),
    });
  }
}
