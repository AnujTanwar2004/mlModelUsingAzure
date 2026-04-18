const form = document.getElementById("score-form");
const sampleBtn = document.getElementById("sample-btn");
const resultEl = document.getElementById("result");
const rawEl = document.getElementById("raw-response");

const fields = {
  sepal_length: document.getElementById("sepal_length"),
  sepal_width: document.getElementById("sepal_width"),
  petal_length: document.getElementById("petal_length"),
  petal_width: document.getElementById("petal_width"),
};

const irisLabelMap = {
  0: "Iris-setosa",
  1: "Iris-versicolor",
  2: "Iris-virginica",
};

const samples = [
  [5.1, 3.5, 1.4, 0.2],
  [6.1, 2.8, 4.0, 1.3],
  [6.3, 3.3, 6.0, 2.5],
  [5.8, 2.7, 5.1, 1.9],
  [4.9, 3.1, 1.5, 0.1],
];

function setResultState(type, message) {
  resultEl.className = `result ${type}`;
  resultEl.textContent = message;
}

function readFormValues() {
  return {
    sepal_length: Number(fields.sepal_length.value),
    sepal_width: Number(fields.sepal_width.value),
    petal_length: Number(fields.petal_length.value),
    petal_width: Number(fields.petal_width.value),
  };
}

sampleBtn.addEventListener("click", () => {
  const random = samples[Math.floor(Math.random() * samples.length)];
  fields.sepal_length.value = random[0];
  fields.sepal_width.value = random[1];
  fields.petal_length.value = random[2];
  fields.petal_width.value = random[3];
  setResultState("waiting", "Sample loaded. Click Predict Species.");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = readFormValues();
  rawEl.textContent = "";
  setResultState("waiting", "Scoring in progress...");

  try {
    const response = await fetch("/api/score", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      setResultState(
        "error",
        data?.error ? `Error: ${data.error}` : "Scoring failed.",
      );
      rawEl.textContent = JSON.stringify(data, null, 2);
      return;
    }

    const prediction = data?.prediction;
    const mapped =
      prediction !== null && prediction !== undefined
        ? irisLabelMap[prediction] || prediction
        : "Unknown";

    setResultState("success", `Predicted class: ${mapped}`);
    rawEl.textContent = JSON.stringify(data, null, 2);
  } catch (error) {
    setResultState("error", `Network error: ${error.message}`);
  }
});
