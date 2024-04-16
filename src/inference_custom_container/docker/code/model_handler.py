import json
import os
import numpy as np
import joblib  # Assuming model is serialized with joblib
import boto3
import tarfile

class ModelHandler(object):
    """
    A sample Model handler implementation.
    """
    def __init__(self):
        self.initialized = False
        self.model = None

    def initialize(self, context):
        """
        Initialize model. This will be called during model loading time.
        :param context: Initial context contains model server system properties.
        :return:
        """
        properties = context.system_properties

        # Log all system properties
        for key, value in properties.items():
            print("System Properties: Key: {} Value: {}".format(key, value))

        model_dir = properties.get("model_dir")

        # Print files in model dir
        print(f"Files in model dir: {os.listdir(model_dir)}")

        self.model = joblib.load(os.path.join(model_dir, "model.joblib"))
        self.initialized = True

    def extract_tar_gz(self, tar_path, extract_path):
        # Open the tar.gz file
        with tarfile.open(tar_path, 'r:gz') as tar:
            # Extract all the contents into the directory
            tar.extractall(path=extract_path)
            print(f"Extracted all contents to {extract_path}")

    def download_model_from_s3(self, bucket, key, download_path):
        """Download model artifact from S3 to a specific path."""
        s3_client = boto3.client('s3')
        if not os.path.exists(download_path):
            os.makedirs(download_path)
        local_filename = os.path.join(download_path, key.split('/')[-1])
        s3_client.download_file(bucket, key, local_filename)
        return local_filename

    def preprocess(self, request):
        """
        Transform raw input into model input data.
        :param request: list of raw requests
        :return: list of preprocessed model input data
        """
        preprocessed_data = []
        for req in request:
            payload = req.get("body")
            if payload:
                # Assuming payload is in JSON format
                inp = json.loads(payload)
                # Convert input data into a numpy array or other desired format
                preprocessed_data.append(np.array(inp))
        # Log the preprocessed data
        print(f"Preprocessed data: {preprocessed_data}")
        return preprocessed_data

    def inference(self, model_input):
        """
        Run model inference on the processed data.
        :param model_input: List of preprocessed data
        :return: List of inference results
        """
        inference_results = []
        for inp in model_input:
            result = self.model.predict(inp)
            inference_results.append(result)
        return inference_results

    def postprocess(self, inference_output):
        """
        Process model inference output into a format that's easier to interpret.
        :param inference_output: List of inference results
        :return: List of processed inference results
        """
        # Convert numpy arrays to lists for JSON serialization
        postprocessed_output = [output.tolist() for output in inference_output]
        return postprocessed_output

    def handle(self, data, context):
        """
        Call preprocess, inference and post-process functions
        :param data: input data
        :param context: mms context
        """
        if not self.initialized:
            self.initialize(context)
            
        model_input = self.preprocess(data)
        model_out = self.inference(model_input)
        return self.postprocess(model_out)

_service = ModelHandler()

def handle(data, context):
    if not _service.initialized:
        _service.initialize(context)

    if data is None:
        return None

    return _service.handle(data, context)
