import * as glue from "@aws-cdk/aws-glue-alpha";
import { Schedule, ScheduleExpression } from "@aws-cdk/aws-scheduler-alpha";
import { LambdaInvoke } from "@aws-cdk/aws-scheduler-targets-alpha";
import * as cdk from "aws-cdk-lib";
import { RustFunction } from "cargo-lambda-cdk";
import { Construct } from "constructs";
import "dotenv/config";
import path = require("path");

const env = process.env.GITHUB_REF_NAME;
const subdomainPrefix = env === "main" ? "" : `${env}.`;

export class MapOutBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    //# region Data Preparation

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
          PROCESSING_DATA_BUCKET: processingDataBucket.bucketName,
        },
        timeout: cdk.Duration.minutes(1),
      }
    );
    dynamodbTable.grantWriteData(initDataUpdateFunction);
    updateDataTopic.grantPublish(initDataUpdateFunction);
    processingDataBucket.grantReadWrite(initDataUpdateFunction);

    const initDataUpdateFunctionInvokeTargetRole = new cdk.aws_iam.Role(
      this,
      "MapOutInitDataUpdateFunctionInvokeTargetRole",
      {
        assumedBy: new cdk.aws_iam.ServicePrincipal("scheduler.amazonaws.com"),
      }
    );

    const initDataUpdateFunctionInvokeTarget = new LambdaInvoke(
      initDataUpdateFunction,
      {
        retryAttempts: 5,
        role: initDataUpdateFunctionInvokeTargetRole,
      }
    );

    const initDataUpdateSchedule = new Schedule(
      this,
      "MapOutInitDataUpdateSchedule",
      {
        schedule: ScheduleExpression.cron({
          timeZone: cdk.TimeZone.ASIA_HONG_KONG,
          minute: "30",
          hour: "0",
          day: "*",
          month: "*",
          year: "*",
        }),
        target: initDataUpdateFunctionInvokeTarget,
      }
    );

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
      )
    );

    const emptyProcessingBucketFunction = new RustFunction(
      this,
      "MapOutEmptyProcessingBucketFunction",
      {
        manifestPath: path.join(
          __dirname,
          "..",
          "lambdas",
          "empty-processing-bucket",
          "Cargo.toml"
        ),
        architecture: cdk.aws_lambda.Architecture.ARM_64,
        environment: {
          PROCESSING_DATA_BUCKET: processingDataBucket.bucketName,
        },
        timeout: cdk.Duration.minutes(1),
      }
    );
    processingDataBucket.grantReadWrite(emptyProcessingBucketFunction);

    const emptyProcessingBucketFunctionInvokeTargetRole = new cdk.aws_iam.Role(
      this,
      "MapOutEmptyProcessingBucketFunctionInvokeTargetRole",
      {
        assumedBy: new cdk.aws_iam.ServicePrincipal("scheduler.amazonaws.com"),
      }
    );

    const emptyProcessingBucketFunctionInvokeTarget = new LambdaInvoke(
      emptyProcessingBucketFunction,
      {
        retryAttempts: 5,
        role: emptyProcessingBucketFunctionInvokeTargetRole,
      }
    );

    const emptyProcessingBucketSchedule = new Schedule(
      this,
      "MapOutEmptyProcessingBucketSchedule",
      {
        schedule: ScheduleExpression.cron({
          timeZone: cdk.TimeZone.ASIA_HONG_KONG,
          minute: "0",
          hour: "23",
          day: "*",
          month: "*",
          year: "*",
        }),
        target: emptyProcessingBucketFunctionInvokeTarget,
      }
    );

    const releaseDataPackFunction = new RustFunction(
      this,
      "MapOutReleaseDataPackFunction",
      {
        manifestPath: path.join(
          __dirname,
          "..",
          "lambdas",
          "release-data-pack",
          "Cargo.toml"
        ),
        architecture: cdk.aws_lambda.Architecture.ARM_64,
        environment: {
          DYNAMODB_TABLE_NAME: dynamodbTable.tableName,
          PROCESSED_DATA_BUCKET: processedDataBucket.bucketName,
        },
        timeout: cdk.Duration.minutes(1),
      }
    );
    dynamodbTable.grantReadWriteData(releaseDataPackFunction);
    processedDataBucket.grantRead(releaseDataPackFunction);

    const releaseDataPackFunctionInvokeTargetRole = new cdk.aws_iam.Role(
      this,
      "MapOutReleaseDataPackFunctionInvokeTargetRole",
      {
        assumedBy: new cdk.aws_iam.ServicePrincipal("scheduler.amazonaws.com"),
      }
    );

    const releaseDataPackFunctionInvokeTarget = new LambdaInvoke(
      releaseDataPackFunction,
      {
        retryAttempts: 5,
        role: releaseDataPackFunctionInvokeTargetRole,
      }
    );

    const releaseDataPackSchedule = new Schedule(
      this,
      "MapOutReleaseDataPackSchedule",
      {
        schedule: ScheduleExpression.cron({
          timeZone: cdk.TimeZone.ASIA_HONG_KONG,
          minute: "30",
          hour: "1",
          day: "*",
          month: "*",
          year: "*",
        }),
        target: releaseDataPackFunctionInvokeTarget,
      }
    );

    const apiGetDataUpdateFunction = new RustFunction(
      this,
      "MapOutApiGetDataUpdateFunction",
      {
        manifestPath: path.join(
          __dirname,
          "..",
          "lambdas",
          "api-get-data-update",
          "Cargo.toml"
        ),
        architecture: cdk.aws_lambda.Architecture.ARM_64,
        environment: {
          DYNAMODB_TABLE_NAME: dynamodbTable.tableName,
        },
        timeout: cdk.Duration.minutes(1),
      }
    );
    dynamodbTable.grantReadData(apiGetDataUpdateFunction);

    const httpApi = new cdk.aws_apigatewayv2.HttpApi(this, "MapOutHttpApi", {});

    const apiGetDataUpdateIntegration =
      new cdk.aws_apigatewayv2_integrations.HttpLambdaIntegration(
        "MapOutApiGetDataUpdateIntegration",
        apiGetDataUpdateFunction
      );

    httpApi.addRoutes({
      path: "/update",
      methods: [cdk.aws_apigatewayv2.HttpMethod.GET],
      integration: apiGetDataUpdateIntegration,
    });

    const existingHostedZone = cdk.aws_route53.HostedZone.fromLookup(
      this,
      "MapOutHostedZone",
      {
        domainName: process.env.HOST_ZONE || "vazue.com",
      }
    );

    const apiCertificate = new cdk.aws_certificatemanager.Certificate(
      this,
      "MapOutApiCertificate",
      {
        domainName: `${subdomainPrefix}api.map-out.${existingHostedZone.zoneName}`,
        validation:
          cdk.aws_certificatemanager.CertificateValidation.fromDns(
            existingHostedZone
          ),
      }
    );

    const apiDistributionResponseHeadersPolicyAccessControlAllowOrigins = [
      `https://${subdomainPrefix}map-out.vazue.com`,
    ];

    if (process.env.GITHUB_REF_NAME === "local") {
      apiDistributionResponseHeadersPolicyAccessControlAllowOrigins.push(`*`);
    }

    const apiDistributionResponseHeadersPolicy =
      new cdk.aws_cloudfront.ResponseHeadersPolicy(
        this,
        "MapOutApiDistributionResponseHeadersPolicy",
        {
          corsBehavior: {
            accessControlAllowCredentials: false,
            accessControlAllowHeaders: ["*"],
            accessControlAllowMethods: ["GET"],
            accessControlAllowOrigins:
              apiDistributionResponseHeadersPolicyAccessControlAllowOrigins,
            originOverride: true,
          },
        }
      );

    const apiDistributionCachePolicy = new cdk.aws_cloudfront.CachePolicy(
      this,
      "MapOutApiDistributionCachePolicy",
      {
        headerBehavior: cdk.aws_cloudfront.CacheHeaderBehavior.none(),
        cookieBehavior: cdk.aws_cloudfront.CacheCookieBehavior.none(),
        queryStringBehavior: cdk.aws_cloudfront.CacheQueryStringBehavior.none(),
        defaultTtl: cdk.Duration.days(1),
        maxTtl: cdk.Duration.days(7),
        minTtl: cdk.Duration.hours(12),
      }
    );

    const apiDistribution = new cdk.aws_cloudfront.Distribution(
      this,
      "MapOutApiDistribution",
      {
        defaultBehavior: {
          origin: new cdk.aws_cloudfront_origins.HttpOrigin(
            `${httpApi.httpApiId}.execute-api.${this.region}.amazonaws.com`,
            {
              protocolPolicy:
                cdk.aws_cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
            }
          ),
          responseHeadersPolicy: apiDistributionResponseHeadersPolicy,
          viewerProtocolPolicy:
            cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods:
            cdk.aws_cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachedMethods:
            cdk.aws_cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
          cachePolicy: apiDistributionCachePolicy,
          compress: true,
        },
        domainNames: [
          `${subdomainPrefix}api.map-out.${existingHostedZone.zoneName}`,
        ],
        certificate: apiCertificate,
      }
    );

    const apiDistributionTarget = new cdk.aws_route53_targets.CloudFrontTarget(
      apiDistribution
    );

    new cdk.aws_route53.ARecord(this, "MapOutApiARecord", {
      zone: existingHostedZone,
      recordName: `${subdomainPrefix}api.map-out`,
      target: cdk.aws_route53.RecordTarget.fromAlias(apiDistributionTarget),
    });

    new cdk.aws_route53.AaaaRecord(this, "MapOutApiAaaaRecord", {
      zone: existingHostedZone,
      recordName: `${subdomainPrefix}api.map-out`,
      target: cdk.aws_route53.RecordTarget.fromAlias(apiDistributionTarget),
    });

    //#endregion Data Preparation

    //#region Glue

    const glueDatabase = new glue.Database(this, "MapOutGlueDatabase", {});

    const citybusRouteTable = new glue.S3Table(
      this,
      "MapOutCitybusRouteTable",
      {
        bucket: processingDataBucket,
        s3Prefix: "citybus/route/",
        database: glueDatabase,
        dataFormat: glue.DataFormat.JSON,
        columns: [
          { name: "co", type: glue.Schema.STRING },
          { name: "route", type: glue.Schema.STRING },
          { name: "orig_tc", type: glue.Schema.STRING },
          { name: "orig_en", type: glue.Schema.STRING },
          { name: "dest_tc", type: glue.Schema.STRING },
          { name: "dest_en", type: glue.Schema.STRING },
          { name: "orig_sc", type: glue.Schema.STRING },
          { name: "dest_sc", type: glue.Schema.STRING },
          { name: "data_timestamp", type: glue.Schema.STRING },
        ],
        parameters: {
          jsonPath: "$.data[*]",
          compressionType: "none",
          typeOfData: "file",
        },
        storageParameters: [
          glue.StorageParameter.compressionType(glue.CompressionType.NONE),
          glue.StorageParameter.custom("classification", "json"),
        ],
      }
    );

    const citybusStopTable = new glue.S3Table(this, "MapOutCitybusStopTable", {
      bucket: processingDataBucket,
      s3Prefix: "citybus/stop/",
      database: glueDatabase,
      dataFormat: glue.DataFormat.JSON,
      columns: [
        { name: "data_timestamp", type: glue.Schema.STRING },
        { name: "lat", type: glue.Schema.STRING },
        { name: "long", type: glue.Schema.STRING },
        { name: "name_en", type: glue.Schema.STRING },
        { name: "name_sc", type: glue.Schema.STRING },
        { name: "name_tc", type: glue.Schema.STRING },
        { name: "stop", type: glue.Schema.STRING },
      ],
      parameters: {
        jsonPath: "$.data",
        compressionType: "none",
        typeOfData: "file",
      },
      storageParameters: [
        glue.StorageParameter.compressionType(glue.CompressionType.NONE),
        glue.StorageParameter.custom("classification", "json"),
      ],
    });

    const citybusRouteStopTable = new glue.S3Table(
      this,
      "MapOutCitybusRouteStopTable",
      {
        bucket: processingDataBucket,
        s3Prefix: "citybus/route-stop/",
        database: glueDatabase,
        dataFormat: glue.DataFormat.JSON,
        columns: [
          { name: "co", type: glue.Schema.STRING },
          { name: "route", type: glue.Schema.STRING },
          { name: "dir", type: glue.Schema.STRING },
          { name: "seq", type: glue.Schema.INTEGER },
          { name: "stop", type: glue.Schema.STRING },
          { name: "data_timestamp", type: glue.Schema.STRING },
        ],
        parameters: {
          jsonPath: "$.data[*]",
          compressionType: "none",
          typeOfData: "file",
        },
        storageParameters: [
          glue.StorageParameter.compressionType(glue.CompressionType.NONE),
          glue.StorageParameter.custom("classification", "json"),
        ],
      }
    );

    const kmbRouteTable = new glue.S3Table(this, "MapOutKmbRouteTable", {
      bucket: processingDataBucket,
      s3Prefix: "kmb/route/",
      database: glueDatabase,
      dataFormat: glue.DataFormat.JSON,
      columns: [
        { name: "route", type: glue.Schema.STRING },
        { name: "bound", type: glue.Schema.STRING },
        { name: "service_type", type: glue.Schema.STRING },
        { name: "orig_en", type: glue.Schema.STRING },
        { name: "orig_tc", type: glue.Schema.STRING },
        { name: "orig_sc", type: glue.Schema.STRING },
        { name: "dest_en", type: glue.Schema.STRING },
        { name: "dest_tc", type: glue.Schema.STRING },
        { name: "dest_sc", type: glue.Schema.STRING },
      ],
      parameters: {
        jsonPath: "$.data[*]",
        compressionType: "none",
        typeOfData: "file",
      },
      storageParameters: [
        glue.StorageParameter.compressionType(glue.CompressionType.NONE),
        glue.StorageParameter.custom("classification", "json"),
      ],
    });

    const kmbStopTable = new glue.S3Table(this, "MapOutKmbStopTable", {
      bucket: processingDataBucket,
      s3Prefix: "kmb/stop/",
      database: glueDatabase,
      dataFormat: glue.DataFormat.JSON,
      columns: [
        { name: "stop", type: glue.Schema.STRING },
        { name: "name_en", type: glue.Schema.STRING },
        { name: "name_tc", type: glue.Schema.STRING },
        { name: "name_sc", type: glue.Schema.STRING },
        { name: "lat", type: glue.Schema.STRING },
        { name: "long", type: glue.Schema.STRING },
      ],
      parameters: {
        jsonPath: "$.data[*]",
        compressionType: "none",
        typeOfData: "file",
      },
      storageParameters: [
        glue.StorageParameter.compressionType(glue.CompressionType.NONE),
        glue.StorageParameter.custom("classification", "json"),
      ],
    });

    const kmbRouteStopTable = new glue.S3Table(
      this,
      "MapOutKmbRouteStopTable",
      {
        bucket: processingDataBucket,
        s3Prefix: "kmb/route-stop/",
        database: glueDatabase,
        dataFormat: glue.DataFormat.JSON,
        columns: [
          { name: "route", type: glue.Schema.STRING },
          { name: "bound", type: glue.Schema.STRING },
          { name: "service_type", type: glue.Schema.STRING },
          { name: "seq", type: glue.Schema.STRING },
          { name: "stop", type: glue.Schema.STRING },
        ],
        parameters: {
          jsonPath: "$.data[*]",
          compressionType: "none",
          typeOfData: "file",
        },
        storageParameters: [
          glue.StorageParameter.compressionType(glue.CompressionType.NONE),
          glue.StorageParameter.custom("classification", "json"),
        ],
      }
    );

    const etlJob = new glue.Job(this, "MapOutEtlJob", {
      executable: glue.JobExecutable.pythonEtl({
        glueVersion: glue.GlueVersion.V4_0,
        pythonVersion: glue.PythonVersion.THREE,
        script: glue.Code.fromAsset(
          path.join(__dirname, "..", "glue", "map-out-etl-job.py")
        ),
      }),
      defaultArguments: {
        "--map_out_database": glueDatabase.databaseName,
        "--citybus_route_table": citybusRouteTable.tableName,
        "--citybus_stop_table": citybusStopTable.tableName,
        "--citybus_route_stop_table": citybusRouteStopTable.tableName,
        "--kmb_route_table": kmbRouteTable.tableName,
        "--kmb_stop_table": kmbStopTable.tableName,
        "--kmb_route_stop_table": kmbRouteStopTable.tableName,
        "--s3_output_bucket": processedDataBucket.bucketName,
        "--citybus_route_s3_output_path": `/citybus/route/`,
        "--citybus_stop_s3_output_path": `/citybus/stop/`,
        "--citybus_route_stop_s3_output_path": `/citybus/route-stop/`,
        "--kmb_route_s3_output_path": `/kmb/route/`,
        "--kmb_stop_s3_output_path": `/kmb/stop/`,
        "--kmb_route_stop_s3_output_path": `/kmb/route-stop/`,
        "--updated_at": "0",
      },
      workerType: glue.WorkerType.G_1X,
      workerCount: 2,
      timeout: cdk.Duration.minutes(10),
      executionClass: glue.ExecutionClass.FLEX,
    });
    processingDataBucket.grantRead(etlJob);
    processedDataBucket.grantWrite(etlJob);

    const startEtlJobPolicy = new cdk.aws_iam.PolicyStatement({
      actions: ["glue:StartJobRun"],
      resources: [etlJob.jobArn],
    });

    const startEtlJobFunction = new RustFunction(
      this,
      "MapOutStartEtlJobFunction",
      {
        manifestPath: path.join(
          __dirname,
          "..",
          "lambdas",
          "start-etl-job",
          "Cargo.toml"
        ),
        architecture: cdk.aws_lambda.Architecture.ARM_64,
        environment: {
          DYNAMODB_TABLE_NAME: dynamodbTable.tableName,
          GLUE_JOB_NAME: etlJob.jobName,
        },
        timeout: cdk.Duration.minutes(1),
      }
    );
    startEtlJobFunction.addToRolePolicy(startEtlJobPolicy);
    processingDataBucket.grantReadWrite(startEtlJobFunction);
    dynamodbTable.grantReadData(startEtlJobFunction);

    const startEtlJobFunctionInvokeTargetRole = new cdk.aws_iam.Role(
      this,
      "MapOutStartEtlJobFunctionInvokeTargetRole",
      {
        assumedBy: new cdk.aws_iam.ServicePrincipal("scheduler.amazonaws.com"),
      }
    );

    const startEtlJobFunctionInvokeTarget = new LambdaInvoke(
      startEtlJobFunction,
      {
        retryAttempts: 5,
        role: startEtlJobFunctionInvokeTargetRole,
      }
    );

    const startEtlJobSchedule = new Schedule(
      this,
      "MapOutStartEtlJobSchedule",
      {
        schedule: ScheduleExpression.cron({
          timeZone: cdk.TimeZone.ASIA_HONG_KONG,
          minute: "0",
          hour: "1",
          day: "*",
          month: "*",
          year: "*",
        }),
        target: startEtlJobFunctionInvokeTarget,
      }
    );

    //#endregion Glue

    //#region Data Cloudfront

    const dataCertificate = new cdk.aws_certificatemanager.Certificate(
      this,
      "MapOutDataCertificate",
      {
        domainName: `${subdomainPrefix}data.map-out.${existingHostedZone.zoneName}`,
        validation:
          cdk.aws_certificatemanager.CertificateValidation.fromDns(
            existingHostedZone
          ),
      }
    );

    const dataOriginAccessIdentity =
      new cdk.aws_cloudfront.OriginAccessIdentity(
        this,
        "MapOutDataOriginAccessIdentity"
      );
    processedDataBucket.grantRead(dataOriginAccessIdentity);

    const dataDistributionResponseHeadersPolicyAccessControlAllowOrigins = [
      `https://${subdomainPrefix}map-out.vazue.com`,
    ];

    if (process.env.GITHUB_REF_NAME === "local") {
      dataDistributionResponseHeadersPolicyAccessControlAllowOrigins.push(`*`);
    }

    const dataDistributionResponseHeadersPolicy =
      new cdk.aws_cloudfront.ResponseHeadersPolicy(
        this,
        "MapOutDataDistributionResponseHeadersPolicy",
        {
          corsBehavior: {
            accessControlAllowCredentials: false,
            accessControlAllowHeaders: ["*"],
            accessControlAllowMethods: ["GET"],
            accessControlAllowOrigins:
              dataDistributionResponseHeadersPolicyAccessControlAllowOrigins,
            originOverride: true,
          },
          customHeadersBehavior: {
            customHeaders: [
              {
                header: "Cache-Control",
                value: "max-age=31536000, immutable",
                override: false,
              },
            ],
          },
        }
      );

    const dataDistribution = new cdk.aws_cloudfront.Distribution(
      this,
      "MapOutDataDistribution",
      {
        defaultBehavior: {
          origin: new cdk.aws_cloudfront_origins.S3Origin(processedDataBucket, {
            originAccessIdentity: dataOriginAccessIdentity,
          }),
          responseHeadersPolicy: dataDistributionResponseHeadersPolicy,
          viewerProtocolPolicy:
            cdk.aws_cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cdk.aws_cloudfront.AllowedMethods.ALLOW_GET_HEAD,
          cachePolicy: cdk.aws_cloudfront.CachePolicy.CACHING_OPTIMIZED,
          compress: true,
        },
        domainNames: [
          `${subdomainPrefix}data.map-out.${existingHostedZone.zoneName}`,
        ],
        certificate: dataCertificate,
      }
    );

    const dataCloudfrontTarget = new cdk.aws_route53_targets.CloudFrontTarget(
      dataDistribution
    );

    new cdk.aws_route53.ARecord(this, "MapOutDataARecord", {
      zone: existingHostedZone,
      recordName: `${subdomainPrefix}data.map-out`,
      target: cdk.aws_route53.RecordTarget.fromAlias(dataCloudfrontTarget),
    });

    new cdk.aws_route53.AaaaRecord(this, "MapOutDataAaaaRecord", {
      zone: existingHostedZone,
      recordName: `${subdomainPrefix}data.map-out`,
      target: cdk.aws_route53.RecordTarget.fromAlias(dataCloudfrontTarget),
    });

    //#endregion Data Cloudfront

    //#region Output

    new cdk.CfnOutput(this, "MapOutHttpDataApiEndpoint", {
      value: `https://${subdomainPrefix}api.map-out.${existingHostedZone.zoneName}`,
      exportName: `MapOutHttpDataApiEndpoint-${env}`,
    });

    new cdk.CfnOutput(this, "MapOutHttpDataEndpoint", {
      value: `https://${subdomainPrefix}data.map-out.${existingHostedZone.zoneName}`,
      exportName: `MapOutHttpDataEndpoint-${env}`,
    });

    //#endregion Output
  }
}
