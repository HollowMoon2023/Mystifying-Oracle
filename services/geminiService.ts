
import { GoogleGenAI, Chat, HarmCategory, HarmBlockThreshold } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

let chat: Chat | null = null;
let currentSystemInstruction: string | null = null;


function getChatSession(systemInstruction: string): Chat {
  if (!chat || currentSystemInstruction !== systemInstruction) {
    chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
      },
    });
    currentSystemInstruction = systemInstruction;
  }
  return chat;
}

export const askSpirit = async (question: string, systemInstruction: string): Promise<string> => {
  try {
    const chatSession = getChatSession(systemInstruction);
    const response = await chatSession.sendMessage({ message: question });
    
    let rawText = response.text.toUpperCase().trim();
    
    // Check for multi-word special answers first as per board layout
    if (rawText.includes('GOOD BYE')) return 'GOOD BYE';
    if (rawText === 'YES') return 'YES';
    if (rawText === 'NO') return 'NO';

    // Otherwise, sanitize to a single word/number without spaces
    const sanitizedText = rawText.replace(/[^A-Z0-9\s]/g, '').split(' ')[0];

    if (!sanitizedText) {
        return "SILENCE";
    }

    return sanitizedText;
  } catch (error) {
    console.error("Error communicating with the spirits:", error);
    // Provide a default "error" message that fits the theme
    return "NO CONNECTION";
  }
};

export const resetSpiritConversation = () => {
  chat = null;
  currentSystemInstruction = null;
};
