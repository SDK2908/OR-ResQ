# OR-ResQ — ML Component: Surgery Duration Prediction Microservice

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-009688.svg)](https://fastapi.tiangolo.com/)
[![scikit-learn](https://img.shields.io/badge/scikit--learn-RandomForest-orange.svg)](https://scikit-learn.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **Component Role**: Machine Learning Procedure Duration Predictor  
> **System**: OR-ResQ — Dynamic Operating Room Optimization & Recovery Engine  
> **Author**: CSE Student (ML Engineer)  
> **Team Architecture**: Python FastAPI (ML) ➔ Node.js (Core Scheduling & Recovery Engine) ➔ React (Frontend Dashboard)

---

## 1. What is OR-ResQ?

**OR-ResQ** is an intelligent, dynamic operating room scheduling and recovery platform designed for hospital surgical suites. 

While standard hospital software merely creates static, rigid schedules, OR-ResQ specializes in **dynamic recovery and re-optimization** when disruptions occur in real time:
* Emergency trauma surgery arrivals requiring immediate room preemption.
* Surgeries running longer than expected, creating cascading delays.
* Sudden surgeon unavailabilities, illness, or emergency call-outs.
* Operating room or specialized surgical equipment malfunctions.

The OR-ResQ scheduling engine analyzes disruptions, evaluates feasible recovery plans (swapping rooms, delaying non-urgent elective cases, adjusting buffer blocks), and minimizes total disruption cost.

---

## 2. What This ML Component Does

The ML component has a tightly scoped, critical task: **estimating the duration of surgical procedures in minutes.**

Traditional operating room schedulers rely on a single, rigid number (the departmental average). For example, every "Knee Replacement" is booked for 120 minutes. But in reality:
* A senior surgeon with 18 years of experience may finish smoothly in 105 minutes.
* A patient with severe cardiovascular comorbidities (complexity 5) operated on by a junior surgeon (2 years experience) may require 145 minutes.

By providing **context-aware procedure duration predictions**, our ML model empowers the OR-ResQ Node.js scheduling engine to:
1. Allocate realistic time blocks rather than generic averages.
2. Prevent cascade overruns before they start.
3. Compute precise schedule recovery adjustments when an emergency arrives.

---

## 3. Explicit Clinical Boundaries & Non-Clinical Disclaimer

> ⚠️ **IMPORTANT HACKATHON DISCLAIMER**:  
> This project is a college hackathon prototype built on **entirely synthetic data**.  
> The Machine Learning model:
> * Does **NOT** diagnose medical conditions.
> * Does **NOT** recommend treatments or surgical techniques.
> * Does **NOT** prioritize patients based on medical necessity.
> * Does **NOT** determine whether an operation should proceed.
> * Does **NOT** claim clinical validation or regulatory compliance.
>
> The model's sole function is operational time estimation for scheduling logistics.

---

## 4. Input Features & Output Schema

### Inputs
| Feature Name | Type | Range / Example | Description |
| :--- | :--- | :--- | :--- |
| `procedure_type` | `string` | `"Knee Replacement"`, `"Appendectomy"` | Categorical surgical procedure name. |
| `surgeon_experience` | `number` | `0` to `60` years (e.g. `8`) | Years of surgical practice post-residency. |
| `patient_complexity` | `integer`| `1` to `5` (e.g. `3`) | Surgical risk index (1 = routine, 5 = high-risk comorbidities). |
| `historical_average` | `number` | `> 0` minutes (e.g. `120`) | Departmental baseline average duration in minutes. |

### Target / Output
| Output Field | Type | Unit | Description |
| :--- | :--- | :--- | :--- |
| `predicted_duration` | `integer` | Minutes | Estimated duration for OR slot allocation (e.g. `127`). |

---

## 5. Machine Learning Methodology

* **Algorithm**: `RandomForestRegressor` from `scikit-learn`.
* **Preprocessing**: `ColumnTransformer` with `OneHotEncoder(handle_unknown='ignore')` for categorical procedure names, preventing crashes on novel or casing-varied procedure names.
* **Pipeline Encapsulation**: Preprocessing and regression are serialized together into a single `duration_model.joblib` file.
* **Evaluation Metrics**:
  * **MAE (Mean Absolute Error)**: Average absolute error in minutes (~4 to 7 minutes).
  * **RMSE (Root Mean Squared Error)**: Penalizes larger timing outliers that threaten schedule cascades.
  * **R² (Coefficient of Determination)**: Percentage of surgery duration variance captured by the model (>0.90 on synthetic benchmark).

---

## 6. Project Structure

```
or_resq_ml/
│
├── data/
│   └── surgery_duration.csv       # Synthetic training dataset (1,200 records)
│
├── model/
│   ├── duration_model.joblib     # Serialized scikit-learn Pipeline
│   └── metrics.json              # Evaluated metrics (MAE, RMSE, R²)
│
├── generate_dataset.py           # Generates synthetic data with fixed seed
├── train_model.py                # Preprocesses, trains pipeline, evaluates & saves
├── predict.py                    # Standalone CLI test script
├── app.py                        # FastAPI REST microservice
├── requirements.txt              # Minimal Python dependencies
├── README.md                     # This documentation
├── INTEGRATION_CONTRACT.md       # API specification for Node.js backend developer
└── .gitignore                    # Prevents checking in .venv and pycache
```

---

## 7. Step-by-Step Local Setup Guide (Windows)

Open **Command Prompt (`cmd`)** or **PowerShell** on Windows.

### Step 1: Clone or Enter the Project Root
```cmd
cd or_resq_ml
```

### Step 2: Create a Dedicated Virtual Environment
```cmd
python -m venv .venv
```

### Step 3: Activate the Virtual Environment
* On Windows (Command Prompt):
  ```cmd
  .venv\Scripts\activate
  ```
* On Windows (PowerShell):
  ```powershell
  .venv\Scripts\Activate.ps1
  ```
*(You will see `(.venv)` appear at the start of your command line).*

### Step 4: Install Dependencies
```cmd
pip install -r requirements.txt
```

---

## 8. Data Generation & Model Training

### Step 5: Generate the Synthetic Dataset
```cmd
python generate_dataset.py
```
*Creates `data/surgery_duration.csv` (1,200 records) and prints dataset statistics.*

### Step 6: Train and Evaluate the Model
```cmd
python train_model.py
```
*Outputs MAE, RMSE, and R² scores, then saves `model/duration_model.joblib` and `model/metrics.json`.*

### Step 7: Test Local Prediction via CLI
```cmd
python predict.py
```
*Runs inference on a sample Knee Replacement case and prints predicted duration in minutes.*

---

## 9. Launching & Testing the FastAPI Service

### Step 8: Start the API Microservice
```cmd
uvicorn app:app --reload --port 8000
```
*You will see:*
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
[OR-ResQ ML] Model successfully loaded into memory from: .../duration_model.joblib
```

### Step 9: Test the API (3 Methods)

#### Method 1: Browser (Health Check)
Open: `http://localhost:8000/`  
Expected response:
```json
{"service": "OR-ResQ Surgery Duration Prediction API", "status": "running"}
```

#### Method 2: Swagger UI (Interactive Test)
Open: `http://localhost:8000/docs`  
Click on `POST /predict-duration` ➔ `Try it out` ➔ click `Execute`.

#### Method 3: PowerShell CLI
```powershell
Invoke-RestMethod -Uri "http://localhost:8000/predict-duration" -Method Post -ContentType "application/json" -Body '{"procedure_type":"Knee Replacement","surgeon_experience":8,"patient_complexity":3,"historical_average":120}'
```
Expected response:
```json
{
  "predicted_duration": 127
}
```

---

## 10. What "Integration" Means (And What It Does NOT Mean)

A common point of confusion in student hackathons is what integrating with the backend entails:

| What Integration IS NOT | What Integration IS |
| :--- | :--- |
| ❌ Emailing the `.joblib` file to the Node.js developer | ✅ Running FastAPI on port 8000 |
| ❌ Copying Python scripts into the Node.js project folder | ✅ Node.js sending an HTTP `POST` request to `http://localhost:8000/predict-duration` |
| ❌ Connecting the Python model directly to React | ✅ Node.js receiving `{ "predicted_duration": 127 }` JSON |
| ❌ Rewriting scikit-learn algorithms in JavaScript | ✅ Node.js scheduler using `predicted_duration` to calculate room recovery slots |

---

## 11. Git & Version Control Instructions

### Initial Git Setup (One-time)
```cmd
git init
git add .
git commit -m "feat: complete OR-ResQ ML duration prediction microservice"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

### Team Update Workflow (Safe Pull & Push)
```cmd
# Check current status
git status

# If working directory is clean:
git pull origin main

# When you make changes:
git add .
git commit -m "feat: update prediction bounds"
git push origin main
```

---

## 12. Fail-Safe Fallback Recommendation

If the ML service is down or fails, the Node.js backend must gracefully fall back:
```javascript
// Node.js fallback logic:
const duration = mlResponse?.predicted_duration || surgeryData.historical_average;
```
This guarantees the hospital schedule engine remains operational 100% of the time.
