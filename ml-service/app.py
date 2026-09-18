"""
OR-ResQ ML Component — FastAPI Microservice
Part of the OR-ResQ Dynamic Operating Room Optimization & Recovery Engine.

Exposes a RESTful prediction microservice for procedure duration estimation.
Called directly by the Node.js scheduling & recovery engine.
"""

import os
from contextlib import asynccontextmanager
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Global model container (loaded once at startup)
model_container = {"pipeline": None}

MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model", "duration_model.joblib")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifecycle manager that loads the trained scikit-learn pipeline into memory once
    at application startup. This ensures fast O(1) inference per request without re-training.
    """
    if os.path.exists(MODEL_PATH):
        try:
            model_container["pipeline"] = joblib.load(MODEL_PATH)
            print(f"[OR-ResQ ML] Model successfully loaded into memory from: {MODEL_PATH}")
        except Exception as e:
            print(f"[OR-ResQ ML ERROR] Failed loading model file: {e}")
            model_container["pipeline"] = None
    else:
        print(f"[OR-ResQ ML WARNING] Model file not found at: {MODEL_PATH}")
        print("[OR-ResQ ML WARNING] Please execute 'python train_model.py' to generate the model artifact.")
        model_container["pipeline"] = None

    yield
    # Clean up on shutdown
    model_container.clear()

# Initialize FastAPI application
app = FastAPI(
    title="OR-ResQ Surgery Duration Prediction API",
    description=(
        "Machine learning inference microservice estimating surgery procedure durations "
        "for the OR-ResQ dynamic operating room schedule recovery engine. "
        "Academic hackathon component — not for clinical decision-making."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS to allow direct requests if testing from frontend or cross-origin tools
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------
# Request & Response Schemas (Pydantic Validation)
# --------------------------------------------------
class SurgeryDurationRequest(BaseModel):
    procedure_type: str = Field(
        ...,
        min_length=1,
        examples=["Knee Replacement"],
        description="Name or clinical code of the surgical procedure (cannot be empty).",
    )
    surgeon_experience: float = Field(
        ...,
        ge=0.0,
        le=60.0,
        examples=[8],
        description="Years of surgical experience (non-negative, realistic up to 60).",
    )
    patient_complexity: int = Field(
        ...,
        ge=1,
        le=5,
        examples=[3],
        description="Patient surgical complexity / comorbidity rating on a 1 (low risk) to 5 (high risk) scale.",
    )
    historical_average: float = Field(
        ...,
        gt=0.0,
        le=1440.0,
        examples=[120],
        description="Departmental or institutional baseline historical duration in minutes (> 0).",
    )

class SurgeryDurationResponse(BaseModel):
    predicted_duration: int = Field(
        ...,
        examples=[127],
        description="Estimated procedure duration in minutes (rounded integer).",
    )

class ServiceStatusResponse(BaseModel):
    service: str
    status: str

# --------------------------------------------------
# API Endpoints
# --------------------------------------------------
@app.get(
    "/",
    response_model=ServiceStatusResponse,
    summary="Service Health & Root Status",
    tags=["Health"],
)
def root():
    """
    Returns the basic status of the OR-ResQ ML Prediction service.
    """
    return {
        "service": "OR-ResQ Surgery Duration Prediction API",
        "status": "running",
    }

@app.get(
    "/health",
    summary="Detailed Health Check",
    tags=["Health"],
)
def health_check():
    """
    Returns health diagnostic indicating if the model pipeline is loaded and ready.
    """
    is_loaded = model_container.get("pipeline") is not None
    return {
        "status": "healthy" if is_loaded else "degraded",
        "model_loaded": is_loaded,
        "model_path": MODEL_PATH,
    }

@app.post(
    "/predict-duration",
    response_model=SurgeryDurationResponse,
    status_code=status.HTTP_200_OK,
    summary="Predict Surgery Procedure Duration",
    tags=["Prediction"],
)
def predict_duration(payload: SurgeryDurationRequest):
    """
    Predicts surgical duration in minutes for OR scheduling optimization.

    - **procedure_type**: Surgical procedure name (e.g. 'Knee Replacement', 'Appendectomy')
    - **surgeon_experience**: Years of surgical experience
    - **patient_complexity**: Scale 1 (low) to 5 (high)
    - **historical_average**: Baseline minutes (> 0)

    Returns:
    - **predicted_duration**: Estimated integer minutes.
    """
    pipeline = model_container.get("pipeline")

    # 1. Guard against missing model artifact
    if pipeline is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "ML model is not loaded in the service. Ensure 'train_model.py' has been run "
                "to generate 'model/duration_model.joblib', and restart the service."
            ),
        )

    try:
        # 2. Structure input matching the exact feature order of the training pipeline
        input_data = pd.DataFrame([
            {
                "procedure_type": payload.procedure_type.strip(),
                "surgeon_experience": payload.surgeon_experience,
                "patient_complexity": payload.patient_complexity,
                "historical_average": payload.historical_average,
            }
        ])

        # 3. Perform inference
        prediction_val = pipeline.predict(input_data)[0]

        # 4. Constrain to positive realistic duration (minimum 10 minutes)
        final_duration = max(10, int(round(prediction_val)))

        return {"predicted_duration": final_duration}

    except Exception as exc:
        # Return clean error response without exposing private stack traces
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference calculation failed: {str(exc)}",
        )
