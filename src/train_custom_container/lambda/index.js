const AWS = require('aws-sdk');
const sagemaker = new AWS.SageMaker();

exports.handler = async (event) => {

    let trainDataS3Uri = event.trainDataS3Uri ?? process.env.TRAIN_DATA_BUCKET;
    let validationDataS3Uri = event.validationDataS3Uri ?? process.env.VALID_DATA_BUCKET;
    let testDataS3Uri = event.testDataS3Uri ?? process.env.TEST_DATA_BUCKET;

    let outputDataS3Uri = event.outputDataS3Uri ?? process.env.OUTPUT_DATA_BUCKET;

    let trainingJobName = event.trainingJobName ?? 'MyTrainingJob-' + Date.now();

    if (!trainDataS3Uri || !outputDataS3Uri) {
        return {statusCode: 400, body: 'Missing input or output data S3 URI'};
    }

    let inputDataConfig = [
        {
            ChannelName: 'train',
            DataSource: {
                S3DataSource: {
                    S3DataType: 'S3Prefix',
                    S3Uri: trainDataS3Uri,
                    S3DataDistributionType: 'FullyReplicated',
                }
            },
            ContentType: 'text/csv',
            CompressionType: 'None',
            RecordWrapperType: 'None',
        },
        {
            ChannelName: 'validation',
            DataSource: {
                S3DataSource: {
                    S3DataType: 'S3Prefix',
                    S3Uri: validationDataS3Uri,
                    S3DataDistributionType: 'FullyReplicated',
                }
            },
            ContentType: 'text/csv',
            CompressionType: 'None',
            RecordWrapperType: 'None',
        },
        {
            ChannelName: 'test',
            DataSource: {
                S3DataSource: {
                    S3DataType: 'S3Prefix',
                    S3Uri: testDataS3Uri,
                    S3DataDistributionType: 'FullyReplicated',
                }
            },
            ContentType: 'text/csv',
            CompressionType: 'None',
            RecordWrapperType: 'None',
        },
    ];

    console.log('Starting training job with the following parameters:');
    console.log('Training Job Name: ' + trainingJobName);
    console.log('Input Data Config: ' + JSON.stringify(inputDataConfig));
    console.log('Output Data S3 URI: ' + outputDataS3Uri);

    const params = {
        TrainingJobName: trainingJobName, // Ensure this is unique
        RoleArn: process.env.SAGEMAKER_ROLE_ARN,
        AlgorithmSpecification: {
            TrainingImage: process.env.IMAGE_URI,
            TrainingInputMode: 'File',
            MetricDefinitions: [
                {
                    Name: 'train:accuracy',
                    Regex: 'train:accuracy=([0-9\\.]+)'
                },
                {
                    Name: 'train:f1',
                    Regex: 'train:f1=([0-9\\.]+)'
                },
                {
                    Name: 'val:accuracy',
                    Regex: 'val:accuracy=([0-9\\.]+)'
                },
                {
                    Name: 'val:f1',
                    Regex: 'val:f1=([0-9\\.]+)'
                },
                {
                    Name: 'test:accuracy',
                    Regex: 'test:accuracy=([0-9\\.]+)'
                },
                {
                    Name: 'test:f1',
                    Regex: 'test:f1=([0-9\\.]+)'
                },
                // Add additional metric definitions as needed
            ],
        },
        InputDataConfig: inputDataConfig,
        OutputDataConfig: {
            S3OutputPath: outputDataS3Uri,
        },
        ResourceConfig: {
            InstanceType: 'ml.m5.large',       //'ml.m4.xlarge', // Example instance type, choose as necessary
            InstanceCount: 1,
            VolumeSizeInGB: 10, // Example volume size, adjust as necessary
        },
        StoppingCondition: {
            MaxRuntimeInSeconds: 86400, // Example stopping condition (24 hours), adjust as necessary
        },
    };

    try {
        const data = await sagemaker.createTrainingJob(params).promise();
        console.log(data);
        return {statusCode: 200, body: {message: 'Training Job Started Successfully', data: data}};
    } catch (error) {
        console.error(error);
        return {statusCode: 500, body: 'Error Starting Training Job'};
    }
};