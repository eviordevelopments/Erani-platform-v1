
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: ".env.local" });

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    const result = await genAI.listModels();
    console.log("--- Modelos Disponibles ---");
    result.models.forEach(m => {
      console.log(`Model: ${m.name}, Methods: ${m.supportedGenerationMethods}`);
    });
  } catch (e) {
    console.error("Error listing models:", e.message);
  }
}

listModels();
