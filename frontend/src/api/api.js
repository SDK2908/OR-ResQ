/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Centralized API Client for OR-ResQ
// Rule 1: Communicates exclusively with the Node.js Express backend.
// Rule 2: Never calls ML service directly on port 8000.
// Rule 3: Configurable via VITE_API_BASE_URL.

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

const REQUEST_TIMEOUT_MS = 6000;

/**
 * Enhanced fetch with timeout and unified JSON parsing
 */
export async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const defaultHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(id);

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData && (errorData.message || errorData.error)) {
          errorMessage = errorData.message || errorData.error;
        }
      } catch {
        // non-json response body
      }
      const error = new Error(errorMessage);
      error.status = response.status;
      throw error;
    }

    return await response.json();
  } catch (err) {
    clearTimeout(id);
    if (err.name === "AbortError") {
      const timeoutError = new Error("Backend connection timed out after 6 seconds.");
      timeoutError.isTimeout = true;
      throw timeoutError;
    }
    throw err;
  }
}
