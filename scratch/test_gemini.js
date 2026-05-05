const { GoogleGenerativeAI } = require("@google/generative-ai");


async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello");
    console.log("Gemini 1.5 Flash test successful:", result.response.text());
  } catch (e) {
    console.error("Gemini 1.5 Flash test failed:", e.message);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("Hello");
    console.log("Gemini 2.0 Flash test successful:", result.response.text());
  } catch (e) {
    console.error("Gemini 2.0 Flash test failed:", e.message);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Hello");
    console.log("Gemini 2.5 Flash test successful:", result.response.text());
  } catch (e) {
    console.error("Gemini 2.5 Flash test failed:", e.message);
  }
}

listModels();
