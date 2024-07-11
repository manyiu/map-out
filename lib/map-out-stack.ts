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

    const processingDataBucket = new cdk.aws_s3.Bucket(
      this,
      "MapOutProcessingDataBucket",
      {
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        lifecycleRules: [
          {
            expiration: cdk.Duration.days(1),
          },
        ],
      }
    );

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

    const initDataUpdateFunction = new RustFunction(
      this,
      "MapOutInitDataUpdateFunction",
      {
        manifestPath: path.join(
          __dirname,
          "..",
          "lambdas",
          "init-data-update",
          "Cargo.toml"
        ),
        architecture: cdk.aws_lambda.Architecture.ARM_64,
        environment: {
          DYNAMODB_TABLE_NAME: dynamodbTable.tableName,
          UPDATE_DATA_TOPIC_ARN: updateDataTopic.topicArn,
          RAW_DATA_BUCKET: rawDataBucket.bucketName,
        },
        timeout: cdk.Duration.minutes(1),
      }
    );
    dynamodbTable.grantWriteData(initDataUpdateFunction);
    updateDataTopic.grantPublish(initDataUpdateFunction);

    const initDataUpdateFunctionInvokeTarget = new LambdaInvoke(
      initDataUpdateFunction,
      {
        retryAttempts: 5,
      }
    );

    new Schedule(this, "MapOutInitDataUpdateSchedule", {
      schedule: ScheduleExpression.cron({
        timeZone: cdk.TimeZone.ASIA_HONG_KONG,
        minute: "0",
        hour: "0",
        day: "*",
        month: "*",
        year: "*",
      }),
      target: initDataUpdateFunctionInvokeTarget,
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
          UPDATE_DATA_TOPIC_ARN: updateDataTopic.topicArn,
        },
        timeout: cdk.Duration.minutes(3),
      }
    );
    rawDataBucket.grantWrite(crawlCitybusRouteStopFunction);
    dynamodbTable.grantWriteData(crawlCitybusRouteStopFunction);
    updateDataTopic.grantPublish(crawlCitybusRouteStopFunction);
    updateDataTopic.addSubscription(
      new cdk.aws_sns_subscriptions.LambdaSubscription(
        crawlCitybusRouteStopFunction,
        {
          filterPolicy: {
            type: cdk.aws_sns.SubscriptionFilter.stringFilter({
              allowlist: ["init-data-update"],
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
        timeout: cdk.Duration.minutes(5),
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

    const copyRawToProcessingFunction = new RustFunction(
      this,
      "MapOutCopyRawToProcessingFunction",
      {
        manifestPath: path.join(
          __dirname,
          "..",
          "lambdas",
          "copy-raw-to-processing",
          "Cargo.toml"
        ),
        architecture: cdk.aws_lambda.Architecture.ARM_64,
        environment: {
          RAW_DATA_BUCKET: rawDataBucket.bucketName,
          PROCESSING_DATA_BUCKET: processingDataBucket.bucketName,
        },
        timeout: cdk.Duration.minutes(1),
      }
    );
    rawDataBucket.grantRead(copyRawToProcessingFunction);
    processingDataBucket.grantWrite(copyRawToProcessingFunction);
    rawDataBucket.addEventNotification(
      cdk.aws_s3.EventType.OBJECT_CREATED,
      new cdk.aws_s3_notifications.LambdaDestination(
        copyRawToProcessingFunction
      ),
      { prefix: "bus/" }
    );

    const glueDatabaseName = "map_out";

    const glueIamPolicy = new cdk.aws_iam.Policy(this, "MapOutGlueIamPolicy", {
      statements: [
        new cdk.aws_iam.PolicyStatement({
          actions: ["s3:GetObject", "s3:PutObject"],
          resources: [
            `${rawDataBucket.bucketArn}/*`,
            `${processingDataBucket.bucketArn}/*`,
            `${processedDataBucket.bucketArn}/*`,
          ],
        }),
      ],
    });

    const glueIamRole = new cdk.aws_iam.Role(this, "MapOutGlueIamRole", {
      assumedBy: new cdk.aws_iam.ServicePrincipal("glue.amazonaws.com"),
      managedPolicies: [
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSGlueServiceRole"
        ),
      ],
    });

    glueIamPolicy.attachToRole(glueIamRole);

    const glueDatebase = new cdk.aws_glue.CfnDatabase(
      this,
      "MapOutGlueDatabase",
      { catalogId: this.account, databaseInput: { name: glueDatabaseName } }
    );

    const citybusRouteTable = new cdk.aws_glue.CfnTable(
      this,
      "MapOutCitybusRouteTable",
      {
        databaseName: glueDatabaseName,
        catalogId: this.account,
        tableInput: {
          name: "map_out-citybus_route",
          parameters: {
            jsonPath: "$.data[*]",
            compressionType: "none",
            classification: "json",
            typeOfData: "file",
          },
          storageDescriptor: {
            columns: [
              {
                name: "co",
                type: "string",
              },
              {
                name: "route",
                type: "string",
              },
              {
                name: "orig_tc",
                type: "string",
              },
              {
                name: "orig_en",
                type: "string",
              },
              {
                name: "dest_tc",
                type: "string",
              },
              {
                name: "dest_en",
                type: "string",
              },
              {
                name: "orig_sc",
                type: "string",
              },
              {
                name: "dest_sc",
                type: "string",
              },
              {
                name: "data_timestamp",
                type: "string",
              },
            ],
            location: `s3://${processingDataBucket.bucketName}/bus/citybus/route/`,
            inputFormat: "org.apache.hadoop.mapred.TextInputFormat",
            outputFormat:
              "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat",
            serdeInfo: {
              serializationLibrary: "org.openx.data.jsonserde.JsonSerDe",
              parameters: {
                paths:
                  "co,route,orig_tc,orig_en,dest_tc,dest_en,orig_sc,dest_sc,data_timestamp",
              },
            },
          },
        },
      }
    );

    const citybusStopTable = new cdk.aws_glue.CfnTable(
      this,
      "MapOutCitybusStopTable",
      {
        databaseName: glueDatabaseName,
        catalogId: this.account,
        tableInput: {
          name: "map_out-citybus_stop",
          parameters: {
            jsonPath: "$.data",
            compressionType: "none",
            classification: "json",
            typeOfData: "file",
          },
          storageDescriptor: {
            columns: [
              {
                name: "data_timestamp",
                type: "string",
              },
              {
                name: "lat",
                type: "string",
              },
              {
                name: "long",
                type: "string",
              },
              {
                name: "name_en",
                type: "string",
              },
              {
                name: "name_sc",
                type: "string",
              },
              {
                name: "name_tc",
                type: "string",
              },
              {
                name: "stop",
                type: "string",
              },
            ],
            location: `s3://${processingDataBucket.bucketName}/bus/citybus/stop/`,
            inputFormat: "org.apache.hadoop.mapred.TextInputFormat",
            outputFormat:
              "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat",
            serdeInfo: {
              serializationLibrary: "org.openx.data.jsonserde.JsonSerDe",
              parameters: {
                paths: "data_timestamp,lat,long,name_en,name_sc,name_tc,stop",
              },
            },
          },
        },
      }
    );

    const citybusRouteStopTable = new cdk.aws_glue.CfnTable(
      this,
      "MapOutCitybusRouteStopTable",
      {
        databaseName: glueDatabaseName,
        catalogId: this.account,
        tableInput: {
          name: "map_out-citybus_route_stop",
          parameters: {
            jsonPath: "$.data[*]",
            compressionType: "none",
            classification: "json",
            typeOfData: "file",
          },
          storageDescriptor: {
            columns: [
              {
                name: "co",
                type: "string",
              },
              {
                name: "route",
                type: "string",
              },
              {
                name: "dir",
                type: "string",
              },
              {
                name: "seq",
                type: "int",
              },
              {
                name: "stop",
                type: "string",
              },
              {
                name: "data_timestamp",
                type: "string",
              },
            ],
            location: `s3://${processingDataBucket.bucketName}/bus/citybus/route-stop/`,
            inputFormat: "org.apache.hadoop.mapred.TextInputFormat",
            outputFormat:
              "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat",
            serdeInfo: {
              serializationLibrary: "org.openx.data.jsonserde.JsonSerDe",
              parameters: {
                paths: "co,route,dir,seq,stop,data_timestamp",
              },
            },
          },
        },
      }
    );

    const kmbRouteTable = new cdk.aws_glue.CfnTable(
      this,
      "MapOutKmbRouteTable",
      {
        databaseName: glueDatabaseName,
        catalogId: this.account,
        tableInput: {
          name: "map_out-kmb_route",
          parameters: {
            jsonPath: "$.data[*]",
            compressionType: "none",
            classification: "json",
            typeOfData: "file",
          },
          storageDescriptor: {
            columns: [
              {
                name: "route",
                type: "string",
              },
              {
                name: "bound",
                type: "string",
              },
              {
                name: "service_type",
                type: "string",
              },
              {
                name: "orig_en",
                type: "string",
              },
              {
                name: "orig_tc",
                type: "string",
              },
              {
                name: "orig_sc",
                type: "string",
              },
              {
                name: "dest_en",
                type: "string",
              },
              {
                name: "dest_tc",
                type: "string",
              },
              {
                name: "dest_sc",
                type: "string",
              },
            ],
            location: `s3://${processingDataBucket.bucketName}/bus/kmb/route/`,
            inputFormat: "org.apache.hadoop.mapred.TextInputFormat",
            outputFormat:
              "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat",
            serdeInfo: {
              serializationLibrary: "org.openx.data.jsonserde.JsonSerDe",
              parameters: {
                paths:
                  "route,bound,service_type,orig_en,orig_tc,orig_sc,dest_en,dest_tc,dest_sc",
              },
            },
          },
        },
      }
    );

    const kmbStopTable = new cdk.aws_glue.CfnTable(this, "MapOutKmbStopTable", {
      databaseName: glueDatabaseName,
      catalogId: this.account,
      tableInput: {
        name: "map_out-kmb_stop",
        parameters: {
          jsonPath: "$.data[*]",
          compressionType: "none",
          classification: "json",
          typeOfData: "file",
        },
        storageDescriptor: {
          columns: [
            {
              name: "stop",
              type: "string",
            },
            {
              name: "name_en",
              type: "string",
            },
            {
              name: "name_tc",
              type: "string",
            },
            {
              name: "name_sc",
              type: "string",
            },
            {
              name: "lat",
              type: "string",
            },
            {
              name: "long",
              type: "string",
            },
          ],
          location: `s3://${processingDataBucket.bucketName}/bus/kmb/stop/`,
          inputFormat: "org.apache.hadoop.mapred.TextInputFormat",
          outputFormat:
            "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat",
          serdeInfo: {
            serializationLibrary: "org.openx.data.jsonserde.JsonSerDe",
            parameters: {
              paths: "stop,name_en,name_tc,name_sc,lat,long",
            },
          },
        },
      },
    });

    const kmbRouteStopTable = new cdk.aws_glue.CfnTable(
      this,
      "MapOutKmbRouteStopTable",
      {
        databaseName: glueDatabaseName,
        catalogId: this.account,
        tableInput: {
          name: "map_out-kmb_route_stop",
          parameters: {
            jsonPath: "$.data[*]",
            compressionType: "none",
            classification: "json",
            typeOfData: "file",
          },
          storageDescriptor: {
            columns: [
              {
                name: "route",
                type: "string",
              },
              {
                name: "bound",
                type: "string",
              },
              {
                name: "service_type",
                type: "string",
              },
              {
                name: "seq",
                type: "string",
              },
              {
                name: "stop",
                type: "string",
              },
            ],
            location: `s3://${processingDataBucket.bucketName}/bus/kmb/route-stop/`,
            inputFormat: "org.apache.hadoop.mapred.TextInputFormat",
            outputFormat:
              "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat",
            serdeInfo: {
              serializationLibrary: "org.openx.data.jsonserde.JsonSerDe",
              parameters: {
                paths: "route,bound,service_type,seq,stop",
              },
            },
          },
        },
      }
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
