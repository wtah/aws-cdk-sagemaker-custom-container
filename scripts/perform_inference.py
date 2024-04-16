import boto3
import json

def invoke_sagemaker_endpoint(endpoint_name, payload):
    """
    Invokes a SageMaker endpoint with the provided payload.

    Args:
    - endpoint_name (str): The name of the SageMaker endpoint.
    - payload (str): JSON-formatted string payload to send to the endpoint.

    Returns:
    - dict: The response from the SageMaker endpoint.
    """
    # Create a SageMaker runtime client
    client = boto3.client('sagemaker-runtime')

    # Set the content type for the payload (assuming JSON here)
    content_type = 'application/json'

    # Invoke the SageMaker endpoint
    response = client.invoke_endpoint(
        EndpointName=endpoint_name,
        ContentType=content_type,
        Body=payload
    )

    # Decode the response from bytes to string and load into a dictionary
    result = json.loads(response['Body'].read().decode())

    return result


# Example usage
endpoint_name = 'SageMakerInferenceStack-inference-endpoint'
# Example payload - this should be modified according to your model's expected input
payload = json.dumps([[5.2,4.1,1.5,0.1], [6.7,3.0,5.2,2.3]])

result = invoke_sagemaker_endpoint(endpoint_name, payload)
print("Response from SageMaker endpoint:", result)