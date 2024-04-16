#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

import {SageMakerTrainingJobStack} from '../iac/constructs/SageMakerTrainingJobStack';
import {SageMakerInferenceStack} from "../iac/constructs/SageMakerInferenceStack";

const app = new cdk.App();

// Hardcoded S3 Data URI, should be replaced with a dynamic value managed by SSM or other parameter store, Confif file
const s3ModelKey = "MyTrainingJob-1713263115226/output/model.tar.gz";

// Print the config
console.log('S3 Data Key:', s3ModelKey);

new SageMakerTrainingJobStack(app, 'SageMakerTrainingJobStack', { directory: 'src/train_custom_container'});
new SageMakerInferenceStack(app, 'SageMakerInferenceStack', { directory: 'src/inference_custom_container', s3ModelKey});