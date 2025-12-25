import { GoogleGenAI, Type } from "@google/genai";
import { SubgoalSuggestion } from "../types";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key is missing");
    throw new Error("API Key not found");
  }
  return new GoogleGenAI({ apiKey });
};

export const suggestSubgoals = async (goalTitle: string, goalDescription?: string): Promise<SubgoalSuggestion[]> => {
  try {
    const ai = getAIClient();
    const prompt = `
      You are a helpful goal-setting assistant.
      User Goal: "${goalTitle}"
      ${goalDescription ? `Context: ${goalDescription}` : ''}
      
      Task: Break this goal down into 3 to 5 concrete, actionable sub-tasks.
      Output: A JSON array of objects with "title" and "description" fields.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
            },
            required: ["title", "description"],
          },
        },
      },
    });

    const text = response.text;
    if (!text) {
        console.warn("AI returned empty text");
        return [];
    }

    try {
        return JSON.parse(text) as SubgoalSuggestion[];
    } catch (parseError) {
        console.error("Failed to parse AI response:", text);
        return [];
    }
  } catch (error) {
    console.error("Error generating subgoals:", error);
    // Return empty array instead of throwing to prevent app crash
    return [];
  }
};

export const generateMotivation = async (goalTitle: string, progress: number): Promise<string> => {
    try {
        const ai = getAIClient();
        const prompt = `
          My goal is "${goalTitle}" and I am ${Math.round(progress)}% done.
          Give me a short, 1-sentence motivational boost or advice.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return response.text || "Keep going, you're doing great!";
    } catch (error) {
        console.error("Motivation error", error);
        return "Consistency is key!";
    }
}
