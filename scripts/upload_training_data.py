import boto3
import pandas as pd
from sklearn.model_selection import train_test_split

# Initialize Boto3 clients
cf = boto3.client('cloudformation')
s3 = boto3.client('s3')

# Your stack name
stack_name = 'SageMakerTrainingJobStack'

# Retrieve the stack information to get the S3 bucket names
response = cf.describe_stacks(StackName=stack_name)

# Initialize the bucket names variables
train_data_bucket_name = None
validation_data_bucket_name = None
test_data_bucket_name = None

# Extract outputs and find the specific outputs for the input data buckets
for output in response['Stacks'][0]['Outputs']:
    if output['OutputKey'] == 'SageMakerTrainingJobStackInputTrainDataBucketName':
        train_data_bucket_name = output['OutputValue']
    elif output['OutputKey'] == 'SageMakerTrainingJobStackInputValidationDataBucketName':
        validation_data_bucket_name = output['OutputValue']
    elif output['OutputKey'] == 'SageMakerTrainingJobStackInputTestDataBucketName':
        test_data_bucket_name = output['OutputValue']

# Ensure the bucket names were found
if not train_data_bucket_name or not validation_data_bucket_name or not test_data_bucket_name:
    print("Error: One or more bucket names not found in stack outputs.")
else:
    # Load the dataset
    file_path = '../data/iris.csv'
    data = pd.read_csv(file_path)

    # First, split data into training and temp data with temp data being 30% of the original
    train_data, temp_data = train_test_split(data, test_size=0.3, random_state=42)

    # Then, split the temp data equally into validation and test datasets
    validation_data, test_data = train_test_split(temp_data, test_size=0.5, random_state=42)

    # Temporary CSV file paths
    train_file_path = '../data/train.csv'
    validation_file_path = '../data/validation.csv'
    test_file_path = '../data/test.csv'

    # Save the subsets to temporary files
    train_data.to_csv(train_file_path, index=False)
    validation_data.to_csv(validation_file_path, index=False)
    test_data.to_csv(test_file_path, index=False)

    # Define S3 keys for the data
    train_s3_key = 'train.csv'
    validation_s3_key = 'validation.csv'
    test_s3_key = 'test.csv'

    # Upload the files
    try:
        s3.upload_file(Filename=train_file_path, Bucket=train_data_bucket_name, Key=train_s3_key)
        print(f"Train file uploaded successfully to bucket {train_data_bucket_name} with key {train_s3_key}.")

        s3.upload_file(Filename=validation_file_path, Bucket=validation_data_bucket_name, Key=validation_s3_key)
        print(f"Validation file uploaded successfully to bucket {validation_data_bucket_name} with key {validation_s3_key}.")

        s3.upload_file(Filename=test_file_path, Bucket=test_data_bucket_name, Key=test_s3_key)
        print(f"Test file uploaded successfully to bucket {test_data_bucket_name} with key {test_s3_key}.")
    except Exception as e:
        print(f"Error uploading files: {str(e)}")
