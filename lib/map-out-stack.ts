import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import path = require("path");

const subdomainPrefix =
  process.env.GITHUB_REF_NAME === "main"
    ? ""
    : `${process.env.GITHUB_REF_NAME}.`;

export class MapOutStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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
        domainName: process.env.HOST_ZONE!,
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
