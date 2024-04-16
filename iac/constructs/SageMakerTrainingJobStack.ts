import * as cdk from 'aws-cdk-lib';
import * as lambdaNodeJs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecr_assets from 'aws-cdk-lib/aws-ecr-assets';
import * as path from 'path';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from "constructs";

export interface SageMakerTrainingJobStackProps extends cdk.StackProps {
  readonly directory: string;
}
export class SageMakerTrainingJobStack extends cdk.Stack {


  constructor(scope: Construct, id: string, props: SageMakerTrainingJobStackProps) {
    super(scope, id, props);
    // Build and push the container image to ECR
    const dockerImage = new ecr_assets.DockerImageAsset(this, id + '-train-image', {
      directory: path.join(props.directory, 'docker'),
    });
    // Create S3 buckets for input data and output data
    const inputTrainDataBucket = new s3.Bucket(this, id + '-InputTrainDataBucket', {
      // Enables the deletion of non-empty buckets
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // specify removal policy according to your needs
    });
    const inputValidDataBucket = new s3.Bucket(this, id + '-InputValidationDataBucket', {
      // Enables the deletion of non-empty buckets
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // specify removal policy according to your needs
    });

    const inputTestDataBucket = new s3.Bucket(this, id + '-InputTestDataBucket', {
      // Enables the deletion of non-empty buckets
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // specify removal policy according to your needs
    });

    const outputDataBucket = new s3.Bucket(this, id + '-OutputDataBucket', {
            // Enables the deletion of non-empty buckets
      autoDeleteObjects: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // specify removal policy according to your needs
    });

    // IAM role for Lambda function
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSageMakerFullAccess'),
      ],
    });

    // Add S3 access policies to Lambda role
    const s3Policy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:ListBucket'
      ],
      resources: [
        inputTrainDataBucket.bucketArn,
        `${inputTrainDataBucket.bucketArn}/*`,
        inputValidDataBucket.bucketArn,
        `${inputValidDataBucket.bucketArn}/*`,
        inputTestDataBucket.bucketArn,
        `${inputTestDataBucket.bucketArn}/*`,
        outputDataBucket.bucketArn,
        `${outputDataBucket.bucketArn}/*`
      ],
    });
    lambdaRole.addToPolicy(s3Policy);

    // Create the Lambda function
    const sagemakerLambda =  new lambdaNodeJs.NodejsFunction(this, 'start-training-job-lambda', {
      entry: path.join(props.directory, 'lambda', 'index.js'), // Path to your Lambda entry file
      handler: 'handler', // Your handler method
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X, // Specify your Node.js runtime
         environment: {
        IMAGE_URI: dockerImage.imageUri,
        TRAIN_DATA_BUCKET: 's3://'+ inputTrainDataBucket.bucketName,
        VALID_DATA_BUCKET: 's3://'+ inputValidDataBucket.bucketName,
        TEST_DATA_BUCKET: 's3://'+ inputTestDataBucket.bucketName,
        OUTPUT_DATA_BUCKET: 's3://'+ outputDataBucket.bucketName,
      },
       role: lambdaRole,
    });

    // Grant the Lambda function permission to access the ECR repository
    dockerImage.repository.grantPull(lambdaRole);

    // IAM role for SageMaker training jobs (to be assumed by SageMaker)
    const sagemakerRole = new iam.Role(this, id + '-SageMakerExecutionRole', {
      assumedBy: new iam.ServicePrincipal('sagemaker.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3FullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchFullAccess'),
      ],
    });

    // Pass the SageMaker role ARN to the Lambda function
    sagemakerLambda.addEnvironment('SAGEMAKER_ROLE_ARN', sagemakerRole.roleArn);

    // Output the Lambda function name
    new cdk.CfnOutput(this, id + '-LambdaFunctionName', {
      value: sagemakerLambda.functionName,
    });

    new cdk.CfnOutput(this, id + '-InputTrainDataBucketName', {
      value: inputTrainDataBucket.bucketName,
    });

    new cdk.CfnOutput(this, id + '-InputValidationDataBucketName', {
      value: inputValidDataBucket.bucketName,
    });

    new cdk.CfnOutput(this, id + '-InputTestDataBucketName', {
      value: inputTestDataBucket.bucketName,
    });

    new cdk.CfnOutput(this, id + '-OutputDataBucketName', {
      value: outputDataBucket.bucketName,
      exportName: id + '-OutputDataBucketName'
    });

    new cdk.CfnOutput(this, id + '-OutputDataBucketURL', {
      value: outputDataBucket.bucketDomainName,
      exportName: id + '-OutputDataBucketURL'
    });
  }

}
