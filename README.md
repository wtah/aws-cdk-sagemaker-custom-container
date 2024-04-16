# A CDK project for Custom Docker Container Training and Inference with AWS Sagemaker

This project provides a comprehensive AWS Cloud Development Kit (CDK) setup for deploying custom Docker containers on AWS SageMaker for machine learning training and inference tasks. It's designed to streamline the process of containerizing your machine learning models and deploying them as SageMaker endpoints for scalable and managed inference, as well as running training jobs with your custom algorithms.

The project features the following components:

- A TrainingJobStack that contains the following:
  - A custom Docker container for training and inference tasks
  - Input (Train, Val, Test) and output buckets (Model) for data storage and artifacts
  - A lambda function for triggering training jobs
  - Utility scripts for uploading data to the input bucket, starting training jobs and performing inference

## Prerequisites

Before you begin, ensure you have the following prerequisites installed and configured:

- AWS CLI
- AWS CDK
- Docker
- An AWS account and credentials configured with the necessary permissions to deploy resources for SageMaker, ECR (Elastic Container Registry), and other required services.
- Node.js (tested with 18.X) and npm
- Python 3.8 or later

## Getting Started

### Create stack

To get started, clone the repository and navigate to the project directory:

```bash
git clone
cd aws-cdk-sagemaker-custom-container
```

Then install dependencies (consider creating a venv for this project):

```bash
npm install && 
pip install -r requirements.txt
```



Next, deploy the CDK Trainingstack stack:

```bash
cdk deploy SageMakerTrainingJobStack
```

This will deploy the SageMakerTrainingJobStack stack, which contains the following resources:
- An S3 bucket for storing training, validation, test data
- An S3 bucket for storing model artifacts
- A Lambda function for triggering training jobs
- A custom Docker container for training 

The current container trains a toy example on the iris dataset. To modify the container for your own use case, update the [train.py](src/train_custom_container/docker/code/train.py) script directory.

### Upload training data

The project includes a utility script for uploading data to the input buckets. To upload the toy example iris dataset, run the following command:

```bash
cd scripts && 
python upload_training_data.py
```
This loads a toy example iris dataset and uploads it to the input buckets (train,test,val).


### Trigger training job

You can use the Lambda function to trigger a training job. To do this, run the following command:

```bash
python scripts/trigger_training_job.py
```

This will use invoke the lambda function in the stack to start a training job using the custom container. 
The training job will train a toy example model on the iris dataset and save the model artifacts to the output bucket.

In order to modify the lambda function for your own use case, update the [index.js](src\train_custom_container\lambda\index.js) lambda function handler.

The script will output the training job logs to the console and finish once the training job is complete.

The model artifacts will be saved to the output bucket.

#### Monitor training job
You can set up CloudWatch metrics to monitor the training job. To do this. You can find the metrics to monitor in the lambda function that invokes the training jobs in [index.js](src/train_custom_container/lambda/index.js).



### Deploy the model for inference

After you have trained the model the output bucket will contain multiple directories for each training run. In order to deploy the model you will need to copy the S3 Key of the model run that you want to deploy in production.

This can be for example: `MyTrainingJob-1713250453263/output/model.tar.gz`.

You can get the training job key from the output of the training job script.

Set this key in the `bin/iac.ts` file in the `s3ModelKey` variable.

> This is only for demo purposes. In a production environment use config files, environment variables or other parameter stores like SSM to manage these hardcoded values.


After you have set the key you can deploy the inference stack by running:

```bash
cdk deploy SageMakerInferenceStack
```

This will deploy the SageMakerInferenceStack stack, which contains the following resources:
- A custom Docker container for inference tasks
- Configuration for the Model Artifacts
- An endpoint configuration
- An endpoint

The docker container will automatically mount the model artifacts from the S3 bucket and make them accessible for load under the model directory.

### Perform inference

To perform inference on the deployed model, you can use the utility script:

```bash
python scripts/perform_inference.py
```

This script will invoke the SageMaker endpoint with a sample input and output the inference results to the console.


# Cleaning up

To save money and avoid incurring unnecessary charges, clean up the resources you created by running the following command:

```bash
cdk destroy --all
```