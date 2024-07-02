#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import "dotenv/config";
import "source-map-support/register";
import { MapOutStack } from "../lib/map-out-stack";

const app = new cdk.App();

new MapOutStack(app, "MapOutStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
