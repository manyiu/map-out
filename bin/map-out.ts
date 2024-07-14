#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import "dotenv/config";
import "source-map-support/register";
import { MapOutBackendStack } from "../lib/map-out-backend-stack";
import { MapOutWebClientStack } from "../lib/map-out-web-client-stack";

const app = new cdk.App();

new MapOutBackendStack(app, "MapOutBackendStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

new MapOutWebClientStack(app, "MapOutWebClientStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
