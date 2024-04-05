import aws_cdk as core
import aws_cdk.assertions as assertions

from aws_cdk_sagemaker_custom_container.aws_cdk_sagemaker_custom_container_stack import AwsCdkSagemakerCustomContainerStack

# example tests. To run these tests, uncomment this file along with the example
# resource in aws_cdk_sagemaker_custom_container/aws_cdk_sagemaker_custom_container_stack.py
def test_sqs_queue_created():
    app = core.App()
    stack = AwsCdkSagemakerCustomContainerStack(app, "aws-cdk-sagemaker-custom-container")
    template = assertions.Template.from_stack(stack)

#     template.has_resource_properties("AWS::SQS::Queue", {
#         "VisibilityTimeout": 300
#     })
