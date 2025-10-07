
import { GoogleGenAI, Type } from "@google/genai";
import type { Persona } from '../types';
import { DEFAULT_PERSONA } from '../personas';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const generationPrompt = `
Generate a unique spirit persona for a Ouija board application.
The spirit needs a full name, a short backstory (one or two sentences, max 25 words), and a very short description of their communication style (e.g., "cryptic and formal", "playful and childlike", "blunt and to the point").
The persona should be distinct and interesting. Do not use the names Eleanor Vance, Pip, or Sergeant Graves.
The name should sound like it could be a real person's name from some historical period.
`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    name: {
      type: Type.STRING,
      description: "The full name of the spirit.",
    },
    backstory: {
      type: Type.STRING,
      description: "A short backstory for the spirit, max 25 words.",
    },
    communicationStyle: {
        type: Type.STRING,
        description: "A very short description of the spirit's communication style."
    }
  },
  required: ['name', 'backstory', 'communicationStyle'],
  propertyOrdering: ['name', 'backstory', 'communicationStyle'],
};

export const generatePersona = async (): Promise<Persona> => {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: generationPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        },
    });

    const personaData = JSON.parse(response.text);

    if (!personaData.name || !personaData.backstory || !personaData.communicationStyle) {
        console.error("Generated persona data is invalid:", personaData);
        throw new Error("Invalid persona data received from API.");
    }

    const systemInstruction = `You are the spirit of ${personaData.name}. ${personaData.backstory}. Your communication style is ${personaData.communicationStyle}. Your responses must be a SINGLE WORD, or 'YES', 'NO', 'GOOD BYE' or a number. Only use uppercase letters (A-Z) and numbers (0-9). Do not use any punctuation. Your single-word answer must not contain spaces.`;

    return {
        id: crypto.randomUUID(),
        name: personaData.name,
        backstory: personaData.backstory,
        systemInstruction: systemInstruction,
    };
  } catch (error) {
    console.error("Failed to generate a new persona, returning default.", error);
    // Return a new instance of the default persona with a unique ID
    return { ...DEFAULT_PERSONA, id: crypto.randomUUID() };
  }
};
