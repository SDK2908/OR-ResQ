# OR-ResQ: ML Integration Contract & API Specification

> **Audience**: Main Node.js Backend Developer (Samyuktha) & OR-ResQ Core Team  
> **Author**: Machine Learning Engineer (Python / ML Component)  
> **Component**: `or_resq_ml` Procedure Duration Prediction Service  
> **Protocol**: HTTP/1.1 REST JSON  
> **Default Port**: `8000` (e.g., `http://localhost:8000`)

---

## 1. Executive Summary & Integration Architecture

The ML service is an independent Python microservice that predicts surgical procedure duration in **minutes**.

### What Integration Means:
* **YES**: The Node.js backend sends an HTTP `POST` request with JSON containing surgery parameters to `http://localhost:8000/predict-duration`.
* **YES**: The Node.js backend receives `{ "predicted_duration": 127 }` and uses that integer number to adjust slot blocks, calculate buffer gaps, and optimize recovery re-allocations.
* **NO**: You do **NOT** need to install Python, scikit-learn, or joblib inside your Node.js project.
* **NO**: You do **NOT** need to load `.joblib` files or write JavaScript ML models.
* **NO**: React does **NOT** call this ML service directly; all communication flows through your Node.js backend.

```
                    OR-ResQ ARCHITECTURE
                             │
               ┌─────────────┴─────────────┐
               ▼                           ▼
        React Frontend             Node.js Backend
       (Surgical Staff)           (Samyuktha's Engine)
                                           │
                                           │ POST /predict-duration
                                           │ (JSON payload)
                                           ▼
                                 Python FastAPI Service
                                   (Port 8000 - or_resq_ml)
                                           │
                                           ▼
                                 Scikit-Learn Pipeline
                                (Random Forest Regressor)
                                           │
                                           ▼
                                  predicted_duration
                                           │
                                           ▼
                                    Node.js Engine
                             (Re-schedules OR & Recovers)
```

---

## 2. API Endpoints

### Endpoint A: Health Check
* **Method**: `GET`
* **Path**: `/`
* **Description**: Verifies the ML service is running.
* **Response (200 OK)**:
```json
{
  "service": "OR-ResQ Surgery Duration Prediction API",
  "status": "running"
}
```

---

### Endpoint B: Procedure Duration Prediction (Primary)
* **Method**: `POST`
* **Path**: `/predict-duration`
* **Headers**:
  ```http
  Content-Type: application/json
  Accept: application/json
  ```

#### Request Body Schema (JSON)
| Field Name | Type | Required? | Valid Range / Format | Description |
| :--- | :--- | :--- | :--- | :--- |
| `procedure_type` | `string` | **Yes** | Non-empty string | Name of procedure, e.g. `"Knee Replacement"`, `"Appendectomy"`, `"Cholecystectomy"`, etc. |
| `surgeon_experience` | `number` | **Yes** | `0.0` to `60.0` | Years of post-training surgical experience. |
| `patient_complexity` | `integer`| **Yes** | `1` to `5` | Risk scale: `1` (healthy/routine) to `5` (severe comorbidities/prior surgeries). |
| `historical_average` | `number` | **Yes** | `> 0` | Baseline hospital average duration for this procedure in **minutes**. |

#### Example Request Payload
```json
{
  "procedure_type": "Knee Replacement",
  "surgeon_experience": 8,
  "patient_complexity": 3,
  "historical_average": 120
}
```

#### Response Body Schema (JSON)
| Field Name | Type | Description |
| :--- | :--- | :--- |
| `predicted_duration` | `integer` | Estimated procedure duration in **minutes**. |

#### Example Response (HTTP 200 OK)
```json
{
  "predicted_duration": 127
}
```

---

## 3. Error Handling & Status Codes

| HTTP Code | Reason | Cause | Node.js Mitigation |
| :--- | :--- | :--- | :--- |
| **200 OK** | Success | Valid input, model computed estimate | Use `response.predicted_duration` in scheduler. |
| **422 Unprocessable Entity** | Validation Error | Missing field, negative experience, complexity not in 1-5, negative average | Log validation message, fall back to `historical_average`. |
| **503 Service Unavailable** | Model Not Ready | Model file was not trained or missing at service startup | Use fallback `historical_average` immediately. |
| **500 Internal Error** | Inference Failure | Unhandled computation error | Log error, use fallback `historical_average`. |

---

## 4. Fallback Behavior (Critical for OR-ResQ Stability)

> **Golden Rule**: An ML service outage must **never** crash the hospital operating room scheduling engine.

If the FastAPI service is unreachable (network timeout, connection refused, or HTTP 5xx):
1. Catch the exception inside your Node.js function.
2. Log a warning: `[OR-ResQ Scheduler] ML service unavailable. Falling back to historical_average (${historical_average}m)`.
3. Use `historical_average` as the scheduled duration.
4. Flag the scheduled block with `duration_source: "fallback_historical"`.

---

## 5. Node.js Implementation Examples

### Option A: Using native `fetch` (Node.js 18+)

```javascript
/**
 * Predicts surgery duration using the Python FastAPI ML microservice.
 * Gracefully falls back to historical_average if the service is unreachable.
 *
 * @param {Object} params
 * @param {string} params.procedure_type - e.g. "Knee Replacement"
 * @param {number} params.surgeon_experience - e.g. 8
 * @param {number} params.patient_complexity - 1 to 5
 * @param {number} params.historical_average - baseline minutes, e.g. 120
 * @returns {Promise<number>} Predicted duration in minutes
 */
async function getPredictedSurgeryDuration({
  procedure_type,
  surgeon_experience,
  patient_complexity,
  historical_average,
}) {
  const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000/predict-duration";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2-second timeout

    const response = await fetch(ML_SERVICE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        procedure_type,
        surgeon_experience,
        patient_complexity,
        historical_average,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[ML-Service] Returned status ${response.status}. Using fallback historical average.`);
      return historical_average;
    }

    const data = await response.json();
    return data.predicted_duration;
  } catch (error) {
    console.warn(`[ML-Service] Unreachable or timed out (${error.message}). Using fallback historical average.`);
    return historical_average;
  }
}

// Example usage in recovery engine:
async function scheduleEmergencyRecovery() {
  const duration = await getPredictedSurgeryDuration({
    procedure_type: "Knee Replacement",
    surgeon_experience: 8,
    patient_complexity: 3,
    historical_average: 120,
  });

  console.log(`Scheduled Slot Duration: ${duration} minutes`);
}
```

### Option B: Using `axios`

```javascript
const axios = require("axios");

async function fetchSurgeryDuration(surgeryData) {
  const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000/predict-duration";

  try {
    const response = await axios.post(ML_SERVICE_URL, {
      procedure_type: surgeryData.procedure_type,
      surgeon_experience: Number(surgeryData.surgeon_experience),
      patient_complexity: Number(surgeryData.patient_complexity),
      historical_average: Number(surgeryData.historical_average),
    }, { timeout: 2500 });

    return response.data.predicted_duration;
  } catch (err) {
    console.error("[ML Client] Call failed, using default baseline:", err.message);
    return surgeryData.historical_average;
  }
}
```

---

## 6. How to Run the ML Service (For the Backend Developer)

If you clone the `or-resq-ml` repo on your local machine to test:

```bash
# 1. Open terminal inside the or_resq_ml folder
cd or_resq_ml

# 2. Activate virtual environment
# Windows:
.venv\Scripts\activate
# Mac / Linux:
source .venv/bin/activate

# 3. Start the API server
uvicorn app:app --reload --port 8000
```
Swagger UI will be viewable at: `http://localhost:8000/docs`.
