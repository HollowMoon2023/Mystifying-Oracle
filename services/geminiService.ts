
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import type { ConversationHistory } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const askSpirit = async (
  question: string,
  systemInstruction: string,
  history: ConversationHistory
): Promise<{ responseText: string, updatedHistory: ConversationHistory }> => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      history,
      config: {
        systemInstruction,
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        ],
      },
    });

    const response = await chat.sendMessage({ message: question });
    
    let rawText = response.text.toUpperCase().trim();
    
    let sanitizedText: string;
    if (rawText.includes('GOOD BYE')) sanitizedText = 'GOOD BYE';
    else if (rawText === 'YES') sanitizedText = 'YES';
    else if (rawText === 'NO') sanitizedText = 'NO';
    else {
      sanitizedText = rawText.replace(/[^A-Z0-9\s]/g, '').split(' ')[0];
    }

    if (!sanitizedText) {
        sanitizedText = "SILENCE";
    }
    
    const updatedHistory = (await chat.getHistory()) as ConversationHistory;

    return { responseText: sanitizedText, updatedHistory };
  } catch (error) {
    console.error("Error communicating with the spirits:", error);
    return { responseText: "NO CONNECTION", updatedHistory: history };
  }
};
