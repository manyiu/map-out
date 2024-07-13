import * as glue from "@aws-cdk/aws-glue-alpha";
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
          minute: "0",
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
      ),
      { prefix: "bus/" }
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
          hour: "12",
          day: "*",
          month: "*",
          year: "*",
        }),
        target: emptyProcessingBucketFunctionInvokeTarget,
      }
    );

    const glueDatabase = new glue.Database(this, "MapOutGlueDatabase", {
      databaseName: "map-out",
    });

    const citybusRouteTable = new glue.S3Table(
      this,
      "MapOutCitybusRouteTable",
      {
        bucket: processingDataBucket,
        s3Prefix: "bus/citybus/route/",
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
      s3Prefix: "bus/citybus/stop/",
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
        s3Prefix: "bus/citybus/route-stop/",
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
      s3Prefix: "bus/kmb/route/",
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
      s3Prefix: "bus/kmb/stop/",
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
        s3Prefix: "bus/kmb/route-stop/",
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

    const busEtlJob = new glue.Job(this, "MapOutBusEtlJob", {
      executable: glue.JobExecutable.pythonEtl({
        glueVersion: glue.GlueVersion.V4_0,
        pythonVersion: glue.PythonVersion.THREE,
        script: glue.Code.fromAsset(
          path.join(__dirname, "..", "glue", "map-out-bus-job.py")
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
    processingDataBucket.grantRead(busEtlJob);
    processedDataBucket.grantWrite(busEtlJob);

    const startEtlJobPolicy = new cdk.aws_iam.PolicyStatement({
      actions: ["glue:StartJobRun"],
      resources: [busEtlJob.jobArn],
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
          GLUE_JOB_NAME: busEtlJob.jobName,
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
          minute: "15",
          hour: "0",
          day: "*",
          month: "*",
          year: "*",
        }),
        target: startEtlJobFunctionInvokeTarget,
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
