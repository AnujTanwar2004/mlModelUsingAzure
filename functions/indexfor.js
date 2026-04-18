module.exports = async function (context, req) {
  try {
    // 🔥 Default dummy input (auto runs in browser)
    let input = [[5.1, 3.5, 1.4, 0.2]];

    // Optional: override via query (?data=[[...]])
    if (req.query.data) {
      input = JSON.parse(req.query.data);
    }

    // 🔥 TODO: YOUR AZURE ML DETAILS
    // Replace these with your actual Azure ML endpoint credentials
    // Format: const url = "https://your-endpoint.inference.ml.azure.com/score";
    // Format: const key = "your-primary-key-here";
    const url = "TODO_INSERT_YOUR_SCORING_URI_HERE"; // e.g. https://xxxx.inference.ml.azure.com/score
    const key = "TODO_INSERT_YOUR_AZURE_ML_KEY_HERE";

    // 🔥 Call Azure ML endpoint
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + key, // ✅ IMPORTANT FIX
      },
      body: JSON.stringify({ data: input }),
    });

    // 🔥 Handle both JSON and text response safely
    const text = await response.text();

    let result;
    try {
      result = JSON.parse(text);
    } catch {
      result = text;
    }

    // 🔥 Show result in browser
    context.res = {
      status: 200,
      headers: {
        "Content-Type": "text/html",
      },
      body: `
                <h2>Azure ML Prediction</h2>
                <p><b>Input:</b> ${JSON.stringify(input)}</p>
                <p><b>Response:</b> ${JSON.stringify(result)}</p>
            `,
    };
  } catch (err) {
    context.res = {
      status: 500,
      body: "ERROR: " + err.message,
    };
  }
};
