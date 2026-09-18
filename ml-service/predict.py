"""
OR-ResQ ML Component — Local Prediction Script
Part of the OR-ResQ Dynamic Operating Room Optimization & Recovery Engine.

Loads the trained Random Forest pipeline and demonstrates a standalone
inference call matching the exact input structure expected by the FastAPI service.
"""

import os
import sys
import joblib
import pandas as pd

def main():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    model_path = os.path.join(current_dir, "model", "duration_model.joblib")

    print("==================================================")
    print("OR-ResQ: Local Surgery Duration Prediction Test")
    print("==================================================")

    # 1. Verify model artifact exists
    if not os.path.exists(model_path):
        print(f"[ERROR] Model artifact not found at: {model_path}")
        print("Please train the model first by running:")
        print("    python train_model.py")
        sys.exit(1)

    # 2. Load the trained scikit-learn pipeline (preprocessor + Random Forest)
    print(f"Loading pipeline from: {model_path}")
    pipeline = joblib.load(model_path)

    # 3. Define sample test input (matches exact schema required by FastAPI)
    sample_input = {
        "procedure_type": "Knee Replacement",
        "surgeon_experience": 8,
        "patient_complexity": 3,
        "historical_average": 120,
    }

    print("\nInput Parameters:")
    print(f"  • Procedure Type:       {sample_input['procedure_type']}")
    print(f"  • Surgeon Experience:   {sample_input['surgeon_experience']} years")
    print(f"  • Patient Complexity:   {sample_input['patient_complexity']} (scale 1-5)")
    print(f"  • Historical Average:   {sample_input['historical_average']} minutes")

    # 4. Construct DataFrame for the pipeline
    input_df = pd.DataFrame([sample_input])

    # 5. Run inference
    raw_prediction = pipeline.predict(input_df)[0]
    predicted_duration = int(round(raw_prediction))

    diff = predicted_duration - sample_input["historical_average"]
    diff_str = f"+{diff}" if diff > 0 else f"{diff}"

    print("\n==================================================")
    print("PREDICTION RESULT")
    print("==================================================")
    print(f"Procedure:          {sample_input['procedure_type']}")
    print(f"Predicted Duration: {predicted_duration} minutes")
    print(f"Scheduling Delta:   {diff_str} minutes compared to historical average")
    print("==================================================")
    print("Local inference test successful! Ready for FastAPI deployment.")

if __name__ == "__main__":
    main()
