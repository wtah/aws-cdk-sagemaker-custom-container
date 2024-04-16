import json
import time

import boto3

def get_training_job_name_from_arn(arn):
    """
    Extracts the training job name from the SageMaker training job ARN.

    :param arn: The ARN of the SageMaker training job
    :return: The name of the training job
    """
    return arn.split('/')[-1]
def get_sagemaker_training_job_logs(training_job_arn):
    """
    Continuously fetch and print logs of a SageMaker training job.

    :param training_job_name: Name of the SageMaker training job
    :param region_name: AWS region where the training job is executed
    """
    sagemaker_client = boto3.client('sagemaker')
    logs_client = boto3.client('logs')
    training_job_name = get_training_job_name_from_arn(training_job_arn)
    # Fetch the training job info
    try:
        while True:
            training_job_info = sagemaker_client.describe_training_job(TrainingJobName=training_job_name)
            status = training_job_info['SecondaryStatus']
            print(f"Training job status: {status}")
            time.sleep(10)
            if status in ['Completed', 'Failed', 'Stopped', 'Training']:
                break

    except Exception as e:
        print(f"Error fetching training job info: {e}")
        return

    # Extract the log stream name
    log_group_name = f"/aws/sagemaker/TrainingJobs"
    try:
        for _ in range(10):
            log_stream_name_prefix =  training_job_name
            response = logs_client.describe_log_streams(
                logGroupName=log_group_name,
                logStreamNamePrefix=log_stream_name_prefix,
                #orderBy='LastEventTime',
                descending=True
            )
            if 'logStreams' in response and len(response['logStreams']) > 0:
                log_streams = response['logStreams']
                break
            else:
                print("No log streams found. Waiting for log streams to be created...")
                time.sleep(10)
    except Exception as e:
        print(f"Error fetching log streams: {e}")
        return

    print(f"Fetching logs for training job: {training_job_name}")

    next_token = None
    while True:
        for stream in log_streams:
            log_stream_name = stream['logStreamName']
            args = {
                'logGroupName': log_group_name,
                'logStreamName': log_stream_name,
                'startFromHead': True
            }
            if next_token:
                args['nextToken'] = next_token

            response = logs_client.get_log_events(**args)
            events = response.get('events', [])
            for event in events:
                print(event['message'])

            if 'nextForwardToken' in response:
                next_token = response['nextForwardToken']

        # Check if the training job has ended
        status = sagemaker_client.describe_training_job(TrainingJobName=training_job_name)['TrainingJobStatus']
        if status in ['Completed', 'Failed', 'Stopped']:
            print(f"Training job {training_job_name} ended with status {status}.")
            break

        print("Waiting for new logs...")
        time.sleep(10)  # Sleep for a while before checking for new logs



# Initialize a boto3 client for CloudFormation
cf = boto3.client('cloudformation')

# Your CDK stack name
stack_name = 'SageMakerTrainingJobStack'

# Retrieve the stack information to get outputs
response = cf.describe_stacks(StackName=stack_name)
stack_outputs = response['Stacks'][0]['Outputs']

# Find the Lambda function name output
lambda_function_name = None
for output in stack_outputs:
    if output['OutputKey'] == 'SageMakerTrainingJobStackLambdaFunctionName':
        lambda_function_name = output['OutputValue']
        break

if lambda_function_name:
    print(f"Lambda Function Name: {lambda_function_name}")
else:
    print("Lambda function name not found in stack outputs.")

# Make sure to include boto3 and json imports if not already done
if lambda_function_name:
    # Initialize a boto3 client for Lambda
    lambda_client = boto3.client('lambda')

    # Define the payload you want to send to your Lambda function
    payload = {
        'key': 'value'  # Update this with the actual payload you want to send
    }

    # Invoke the Lambda function using the retrieved name
    response = lambda_client.invoke(
        FunctionName=lambda_function_name,
        InvocationType='RequestResponse',  # Use 'Event' for asynchronous execution
        Payload=json.dumps(payload),
    )

    # Read the Lambda function response
    response_payload = response['Payload'].read().decode('utf-8')
    response_data = json.loads(response_payload)

    print('Response:', response_data)
    print('Waiting for training job logs...')
    time.sleep(10)  # Wait for logs to be generated
else:
    print("Can't invoke Lambda function because its name was not found.")



# Example usage

get_sagemaker_training_job_logs(training_job_arn=response_data['body']['data']['TrainingJobArn'])