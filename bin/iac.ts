#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { IacStack } from '../lib/iac-stack';
import {SageMakerTrainingJobStack} from '../iac/constructs/SageMakerTrainingJobStack';
import {SageMakerInferenceStack} from "../iac/constructs/SageMakerInferenceStack";

const app = new cdk.App();
new IacStack(app, 'IacStack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  // env: { account: '123456789012', region: 'us-east-1' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});


// Hardcoded S3 Data URI, should be replaced with a dynamic value managed by SSM or other parameter store, Confif file
const s3ModelKey = "MyTrainingJob-1713250453263/output/model.tar.gz";

// Print the config
console.log('S3 Data Key:', s3ModelKey);

new SageMakerTrainingJobStack(app, 'SageMakerTrainingJobStack', { directory: 'src/train_custom_container'});


new SageMakerInferenceStack(app, 'SageMakerInferenceStack', { directory: 'src/inference_custom_container', s3ModelKey});