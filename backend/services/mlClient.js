/**
 * OR-ResQ — ML Surgery Duration Client
 *
 * Calls the FastAPI ML microservice and falls back to
 * historical_average if the service is unavailable.
 */

export async function getPredictedSurgeryDuration({
  procedure_type,
  surgeon_experience,
  patient_complexity,
  historical_average
}) {
  const ML_SERVICE_URL =
    process.env.ML_SERVICE_URL || "http://localhost:8000/predict-duration";

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(ML_SERVICE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        procedure_type,
        surgeon_experience: Number(surgeon_experience),
        patient_complexity: Number(patient_complexity),
        historical_average: Number(historical_average)
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(
        `[ML-Service] Returned status ${response.status}. Using historical average.`
      );
      return Number(historical_average);
    }

    const data = await response.json();

    if (!Number.isFinite(Number(data.predicted_duration))) {
      console.warn("[ML-Service] Invalid prediction. Using historical average.");
      return Number(historical_average);
    }

    return Number(data.predicted_duration);
  } catch (error) {
    console.warn(
      `[ML-Service] Unreachable or timed out (${error.message}). Using historical average.`
    );

    return Number(historical_average);
  }
}