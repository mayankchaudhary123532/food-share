const { GoogleGenerativeAI } = require("@google/generative-ai");

// Make sure your .env file has GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Verifies food freshness using Gemini 1.5 Flash
 */
const verifyFoodImage = async (imageBuffer, mimeType) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY is missing. Skipping AI verification.");
      return { isFresh: true, category: "Unverified", reason: "API Key missing" };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analyze this food image. 
    1. Is it edible/fresh? (true/false)
    2. What category of food is it?
    3. Provide a brief reason.
    Return ONLY a JSON object: {"isFresh": boolean, "category": "string", "reason": "string"}`;

    const imageParts = [
      {
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType
        },
      },
    ];

    const result = await model.generateContent([prompt, ...imageParts]);
    const response = await result.response;
    const text = response.text();
    
    // Clean JSON response from AI
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Service Error:", error.message);
    // Fallback: don't block the user if the AI service is just having a hiccup
    return { isFresh: true, category: "General", reason: "AI Verification temporarily unavailable" };
  }
};

module.exports = { verifyFoodImage };