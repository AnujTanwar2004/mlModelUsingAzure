const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

// TODO: ADD YOUR AZURE ML CREDENTIALS HERE
// Replace with your actual Azure ML endpoint URL and key
// Format: SCORING_URI = "https://your-endpoint.inference.ml.azure.com/score"
// Format: AZURE_ML_KEY = "your-primary-key-here"
const SCORING_URI =
  process.env.SCORING_URI || "https://iris-endpoint-2345.southeastasia.inference.ml.azure.com/score";
const AZURE_ML_KEY =
  process.env.AZURE_ML_KEY || "BcXWhF406TOiytvLGlArTxvge9EYxO2AkbFwowx6GzNnqk5ziw2FJQQJ99CDAAAAAAAAAAAAINFRAZML3UnK";

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

async function scoreModel(payload) {
  return fetch(SCORING_URI, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AZURE_ML_KEY}`,
    },
    body: JSON.stringify(payload),
  });
}

function normalizeInput(body) {
  if (Array.isArray(body?.data) && body.data.length === 4) {
    return body.data.map(Number);
  }

  if (
    Array.isArray(body?.data) &&
    body.data.length === 1 &&
    Array.isArray(body.data[0]) &&
    body.data[0].length === 4
  ) {
    return body.data[0].map(Number);
  }

  const orderedValues = [
    body?.sepal_length,
    body?.sepal_width,
    body?.petal_length,
    body?.petal_width,
  ].map(Number);

  return orderedValues;
}

function isValidFeatureArray(values) {
  return (
    Array.isArray(values) &&
    values.length === 4 &&
    values.every((value) => Number.isFinite(value))
  );
}

function extractPrediction(result) {
  if (Array.isArray(result) && result.length > 0) {
    return result[0];
  }

  if (result && Array.isArray(result?.result) && result.result.length > 0) {
    return result.result[0];
  }

  if (
    result &&
    Array.isArray(result?.predictions) &&
    result.predictions.length > 0
  ) {
    return result.predictions[0];
  }

  if (
    result &&
    result?.output &&
    Array.isArray(result.output) &&
    result.output.length > 0
  ) {
    return result.output[0];
  }

  return null;
}

app.post("/api/score", async (req, res) => {
  const features = normalizeInput(req.body);

  if (!isValidFeatureArray(features)) {
    return res.status(400).json({
      error:
        "Invalid input. Send either data: [sepal_length, sepal_width, petal_length, petal_width] or named numeric fields.",
    });
  }

  const payload = {
    data: [features],
  };

  try {
    const response = await scoreModel(payload);
    const rawText = await response.text();

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = { raw: rawText };
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Azure ML endpoint returned an error.",
        details: parsed,
      });
    }

    const prediction = extractPrediction(parsed);

    return res.json({
      prediction,
      raw: parsed,
      submitted_features: features,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Failed to reach Azure ML scoring endpoint.",
      details: error.message,
    });
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
