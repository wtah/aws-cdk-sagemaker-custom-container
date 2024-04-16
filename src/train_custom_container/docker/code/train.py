from __future__ import absolute_import

import argparse

from utils import print_files_in_path

import os
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import f1_score, accuracy_score

import joblib




def print_files_in_path(path):
    """
    Utility function to print file names in the specified directory path
    """
    for dirname, _, filenames in os.walk(path):
        for filename in filenames:
            print(os.path.join(dirname, filename))


def train(hp1, hp2):
    print("\nList of files in train channel: ")
    print_files_in_path(os.environ.get("SM_CHANNEL_TRAIN"))

    print("\nList of files in validation channel: ")
    print_files_in_path(os.environ.get("SM_CHANNEL_VALIDATION"))

    # Load training data
    train_df = pd.read_csv(os.path.join(os.environ.get("SM_CHANNEL_TRAIN"), 'train.csv'))

    # Assuming the last column is the target variable
    X_train = train_df.iloc[:, :-1]
    y_train = train_df.iloc[:, -1]

    # Initialize RandomForest model with hyperparameters
    # You can use the hp1, hp2, hp3 for model hyperparameters as needed
    model = RandomForestClassifier(n_estimators=int(hp1), max_depth=int(hp2), random_state=42)

    # Train the model
    model.fit(X_train, y_train)

    train_predictions = model.predict(X_train)
    train_f1 = f1_score(y_train, train_predictions, average='macro')
    train_accuracy = accuracy_score(y_train, train_predictions)

    print(f"train:accuracy={train_accuracy}")
    print(f"train:f1={train_f1}")

    print("\nModel training completed.")

    # Load validation data to evaluate the model
    validation_df = pd.read_csv(os.path.join(os.environ.get("SM_CHANNEL_VALIDATION"), 'validation.csv'))
    X_validation = validation_df.iloc[:, :-1]
    y_validation = validation_df.iloc[:, -1]

    # Predictions
    predictions = model.predict(X_validation)

    # Calculate metrics
    f1 = f1_score(y_validation, predictions, average='macro')
    accuracy = accuracy_score(y_validation, predictions)

    print(f"val:accuracy={accuracy}")
    print(f"val:f1={f1}")

    # At the end of the training loop, we have to save model artifacts.
    model_dir = os.environ["SM_MODEL_DIR"]
    joblib.dump(model, os.path.join(model_dir, "model.joblib"))

    print("\nModel artifacts saved to: ", model_dir)


if __name__ == "__main__":

    parser = argparse.ArgumentParser()

    # sagemaker-containers passes hyperparameters as arguments
    parser.add_argument("--hp1", type=str, default="100")
    parser.add_argument("--hp2", type=int, default=3)

    args = parser.parse_args()

    train(args.hp1, args.hp2)
