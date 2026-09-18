"""
OR-ResQ ML Component — Surgery Duration Model Trainer
Part of the OR-ResQ Dynamic Operating Room Optimization & Recovery Engine.

Trains a scikit-learn RandomForestRegressor pipeline with ColumnTransformer
to predict surgery procedure duration in minutes based on procedure type,
surgeon experience, patient risk complexity, and historical baseline averages.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestRegressor
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

RANDOM_STATE = 42

def train_and_evaluate():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    data_path = os.path.join(current_dir, "data", "surgery_duration.csv")
    model_dir = os.path.join(current_dir, "model")
    model_output_path = os.path.join(model_dir, "duration_model.joblib")
    metrics_output_path = os.path.join(model_dir, "metrics.json")

    print("==================================================")
    print("OR-ResQ: Training Surgery Duration Prediction Model")
    print("==================================================")

    # 1. Verify and Load Dataset
    if not os.path.exists(data_path):
        raise FileNotFoundError(
            f"Dataset not found at '{data_path}'!\n"
            "Please run 'python generate_dataset.py' first before training."
        )

    print(f"1. Loading dataset from: {data_path}")
    df = pd.read_csv(data_path)
    print(f"   Loaded {len(df)} rows.")

    # 2. Separate Features (X) and Target (y)
    feature_columns = [
        "procedure_type",
        "surgeon_experience",
        "patient_complexity",
        "historical_average",
    ]
    target_column = "actual_duration"

    X = df[feature_columns]
    y = df[target_column]

    # 3. Define Categorical and Numerical Preprocessors
    categorical_features = ["procedure_type"]
    numerical_features = ["surgeon_experience", "patient_complexity", "historical_average"]

    print(f"2. Feature Breakdown:")
    print(f"   - Categorical Feature(s): {categorical_features}")
    print(f"   - Numerical Feature(s):   {numerical_features}")
    print(f"   - Target Variable:        {target_column} (minutes)")

    # Preprocessing with ColumnTransformer:
    # OneHotEncoder handles unknown categories gracefully at inference time
    preprocessor = ColumnTransformer(
        transformers=[
            (
                "cat",
                OneHotEncoder(handle_unknown="ignore", sparse_output=False),
                categorical_features,
            ),
            (
                "num",
                "passthrough",
                numerical_features,
            ),
        ]
    )

    # 4. Build Random Forest Regressor
    rf_regressor = RandomForestRegressor(
        n_estimators=120,
        max_depth=12,
        min_samples_split=4,
        min_samples_leaf=2,
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )

    # 5. Assemble Complete Scikit-Learn Pipeline
    # Encapsulates both preprocessing and model into a single serialized object.
    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("regressor", rf_regressor),
        ]
    )

    # 6. Train/Test Split (80% Train, 20% Test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=RANDOM_STATE
    )
    print(f"\n3. Split dataset:")
    print(f"   - Training samples: {len(X_train)}")
    print(f"   - Testing samples:  {len(X_test)}")

    # 7. Fit Model on Training Data
    print("\n4. Fitting Random Forest Regressor Pipeline...")
    pipeline.fit(X_train, y_train)
    print("   Training complete!")

    # 8. Evaluate on Holdout Test Set
    print("\n5. Evaluating model performance on test set...")
    y_pred = pipeline.predict(X_test)

    mae = float(mean_absolute_error(y_test, y_pred))
    mse = float(mean_squared_error(y_test, y_pred))
    rmse = float(np.sqrt(mse))
    r2 = float(r2_score(y_test, y_pred))

    print("\n==================================================")
    print("MODEL EVALUATION METRICS")
    print("==================================================")
    print(f"• Mean Absolute Error (MAE):     {mae:.2f} minutes")
    print(f"  -> Explanation: On average, our prediction is within ±{mae:.1f} minutes of actual surgery duration.")
    print(f"• Root Mean Squared Error (RMSE): {rmse:.2f} minutes")
    print(f"  -> Explanation: Penalizes larger timing errors more heavily; standard deviation of the prediction residuals.")
    print(f"• Coefficient of Determination (R²): {r2:.4f}")
    print(f"  -> Explanation: Explains {r2 * 100:.1f}% of the variance in surgical procedure duration from the features.")
    print("==================================================")

    # 9. Persist Pipeline and Metrics
    os.makedirs(model_dir, exist_ok=True)

    joblib.dump(pipeline, model_output_path)
    print(f"\n[SUCCESS] Serialized Pipeline saved to: {model_output_path}")

    metrics_data = {
        "model_type": "RandomForestRegressor Pipeline",
        "n_estimators": 120,
        "random_state": RANDOM_STATE,
        "dataset_samples": len(df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "features": feature_columns,
        "target": target_column,
        "metrics": {
            "MAE_minutes": round(mae, 2),
            "RMSE_minutes": round(rmse, 2),
            "R2_score": round(r2, 4),
        },
        "metric_explanations": {
            "MAE": "Mean Absolute Error: average magnitude of prediction errors in minutes.",
            "RMSE": "Root Mean Squared Error: gives higher penalty to large schedule overruns.",
            "R2": "R-squared: proportion of surgery duration variance explained by the model.",
        },
    }

    with open(metrics_output_path, "w") as f:
        json.dump(metrics_data, f, indent=2)
    print(f"[SUCCESS] Metrics summary saved to: {metrics_output_path}")

    print("\n6. What happened:")
    print("   - Loaded synthetic records.")
    print("   - Encoded procedure categories with OneHotEncoder(handle_unknown='ignore').")
    print("   - Built an ensemble of 120 decision trees (Random Forest).")
    print("   - Verified accuracy on 20% unseen test procedures.")
    print("   - Bundled preprocessor and model together into duration_model.joblib.")
    print("   Ready for local CLI testing (predict.py) or FastAPI service (app.py)!\n")

if __name__ == "__main__":
    train_and_evaluate()
