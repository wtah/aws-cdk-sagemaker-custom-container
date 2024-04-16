import * as cdk from 'aws-cdk-lib';
import * as sagemaker from 'aws-cdk-lib/aws-sagemaker';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ecr_assets from 'aws-cdk-lib/aws-ecr-assets';
import * as path from 'path';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from "constructs";

export interface SageMakerTrainingJobStackProps extends cdk.StackProps {
  readonly directory: string;
  readonly s3ModelKey: string;
}
export class SageMakerInferenceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SageMakerTrainingJobStackProps) {

    super(scope, id, props);
    console.log('SageMakerInferenceStack directory:', props.directory);
        // Build and push the container image to ECR
        const dockerImage = new ecr_assets.DockerImageAsset(this, id + '-inference-image', {
          directory: path.join(props.directory, 'docker'),
        });

        // IAM Role for SageMaker to access resources
        const sagemakerRole = new iam.Role(this, id + '-SageMakerExecutionRole', {
            assumedBy: new iam.ServicePrincipal('sagemaker.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ContainerRegistryReadOnly'),
                iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchFullAccess'),
            ],
        });


        // Get the S3 bucket name from the output of the training job stack
        const bucketName = cdk.Fn.importValue('SageMakerTrainingJobStack-OutputDataBucketName');

        // S3 data source configuration
        const s3DataSource = {
            compressionType: 'Gzip', // Options are 'None' or 'Gzip'
            s3DataType: 'S3Prefix', // 'S3Prefix' or 'ManifestFile'
            s3Uri: 's3://' + bucketName + '/' + props.s3ModelKey, // URI to the data in S3
        };


        // Create a SageMaker model
        const model = new sagemaker.CfnModel(this, id + '-inference-model', {
            executionRoleArn: sagemakerRole.roleArn,
            primaryContainer: {
                image: dockerImage.imageUri,
                mode: 'SingleModel',
                environment: {
                    // Environment variables for the inference toolkit
                    'SAGEMAKER_CONTAINER_LOG_LEVEL': '20',
                    'SAGEMAKER_REGION': this.region,
                },
                modelDataSource: {
                  s3DataSource
                },
            },

        });


        // SageMaker Endpoint Configuration
        const endpointConfig = new sagemaker.CfnEndpointConfig(this, id+'-endpoint-config', {
            productionVariants: [{
                modelName: model.attrModelName,
                initialInstanceCount: 1,
                instanceType: 'ml.t2.medium',
                variantName: 'AllTraffic'
            }]
        });

        // SageMaker Endpoint
        new sagemaker.CfnEndpoint(this, id+'SageMakerTrainingJobStack-inference-endpoint', {
            endpointConfigName: endpointConfig.attrEndpointConfigName,
            endpointName: id+'-inference-endpoint'
        });

        // Output endpoint name
        new cdk.CfnOutput(this, id + '-EndpointName', {
            value: id + '-inference-endpoint',
        });

  }

}
