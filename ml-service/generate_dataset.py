"""
OR-ResQ ML Component — Synthetic Surgery Duration Dataset Generator
Part of the OR-ResQ Dynamic Operating Room Optimization & Recovery Engine.

Generates a synthetic dataset modeling relationships between surgical procedures,
surgeon experience, patient risk complexity, historical averages, and actual surgery duration.

DISCLAIMER:
This dataset is completely synthetic and generated for demonstration and academic hackathon
purposes only. It is NOT medically validated and must NOT be used for clinical diagnosis,
treatment decisions, or patient risk assessment.
"""

import os
import numpy as np
import pandas as pd

# Set fixed random seed for 100% reproducible data generation
RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)

# Baseline procedure profiles (procedure name, typical institutional average minutes, typical variance)
PROCEDURE_CATALOG = [
    {"name": "Appendectomy", "base_avg": 55, "min_hist": 40, "max_hist": 75},
    {"name": "Cholecystectomy", "base_avg": 80, "min_hist": 60, "max_hist": 105},
    {"name": "Knee Replacement", "base_avg": 120, "min_hist": 95, "max_hist": 150},
    {"name": "Hip Replacement", "base_avg": 135, "min_hist": 110, "max_hist": 170},
    {"name": "Hernia Repair", "base_avg": 65, "min_hist": 45, "max_hist": 90},
    {"name": "Spinal Fusion", "base_avg": 195, "min_hist": 150, "max_hist": 260},
    {"name": "Coronary Artery Bypass", "base_avg": 240, "min_hist": 190, "max_hist": 320},
    {"name": "Cataract Surgery", "base_avg": 30, "min_hist": 20, "max_hist": 45},
]

def generate_surgery_data(num_samples: int = 1200) -> pd.DataFrame:
    """
    Generates synthetic surgery duration records based on realistic surgical factors.

    Features:
    - procedure_type (str): The name of the procedure.
    - surgeon_experience (float/int): Years of post-residency surgical practice (1 - 25 years).
    - patient_complexity (int): Pre-operative surgical risk index (1 = low, 5 = severe comorbidity).
    - historical_average (float): Historical benchmark duration for this hospital/dept in minutes.

    Target:
    - actual_duration (float/int): The actual operating room procedure duration in minutes.
    """
    records = []

    for _ in range(num_samples):
        # 1. Randomly sample a procedure type
        proc = PROCEDURE_CATALOG[np.random.randint(0, len(PROCEDURE_CATALOG))]
        procedure_type = proc["name"]

        # 2. Historical average has slight variation between hospital suites/departments
        historical_average = round(
            float(np.random.uniform(proc["min_hist"], proc["max_hist"])), 1
        )

        # 3. Surgeon experience in years (skewed slightly toward mid-career)
        # 1 to 25 years of experience
        surgeon_experience = int(np.clip(np.random.normal(loc=9.5, scale=5.0), 1, 28))

        # 4. Patient complexity score from 1 (healthy/routine) to 5 (high-risk/comorbidities)
        # Discrete integer scale
        patient_complexity = int(np.random.choice([1, 2, 3, 4, 5], p=[0.20, 0.30, 0.28, 0.15, 0.07]))

        # 5. Synthetic Formula for actual duration:
        # Base starts at the historical average.
        # - Patient complexity: each level above 2.5 adds ~7% duration; below 2.5 reduces ~7%.
        complexity_factor = 1.0 + (patient_complexity - 2.5) * 0.07

        # - Surgeon experience: Senior surgeons are faster and handle complications smoothly.
        # Every year above 8 reduces duration by ~0.8%, capped between -15% and +15%.
        exp_delta = surgeon_experience - 8.0
        exp_factor = 1.0 - np.clip(exp_delta * 0.009, -0.15, 0.15)

        # - Controlled stochastic noise (equipment prep, unexpected tissue adhesions, minor delays)
        # Scaled to ~6% of procedure duration
        noise_std = 0.065 * historical_average
        noise = np.random.normal(0, noise_std)

        # Calculate synthesized duration
        synthesized_duration = (historical_average * complexity_factor * exp_factor) + noise

        # Floor constraint: Surgery must be at least 15 minutes and realistic
        actual_duration = max(15, int(round(synthesized_duration)))

        records.append({
            "procedure_type": procedure_type,
            "surgeon_experience": surgeon_experience,
            "patient_complexity": patient_complexity,
            "historical_average": historical_average,
            "actual_duration": actual_duration
        })

    df = pd.DataFrame(records)
    return df

def main():
    # Ensure data directory exists
    output_dir = os.path.join(os.path.dirname(__file__), "data")
    os.makedirs(output_dir, exist_ok=True)
    output_filepath = os.path.join(output_dir, "surgery_duration.csv")

    print("==================================================")
    print("OR-ResQ: Generating Synthetic Surgery Duration Dataset")
    print("==================================================")
    print(f"Random Seed: {RANDOM_SEED}")
    print(f"Total Records to Generate: 1,200")

    df = generate_surgery_data(num_samples=1200)

    # Save to CSV
    df.to_csv(output_filepath, index=False)
    print(f"\n[SUCCESS] Dataset saved to: {output_filepath}")

    print("\n--------------------------------------------------")
    print(f"Dataset Summary:")
    print(f"Total Rows: {len(df)}")
    print(f"Columns: {list(df.columns)}")
    print("--------------------------------------------------")

    print("\nFirst 5 Records:")
    print(df.head())

    print("\nStatistical Overview:")
    print(df.describe())
    print("\n==================================================")
    print("Data generation complete. Ready for model training.")
    print("==================================================")

if __name__ == "__main__":
    main()
