
import { GoogleGenAI, Type } from "@google/genai";
import type { Persona } from '../types';
import { DEFAULT_PERSONA } from '../personas';
import * as dbService from './dbService';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const BATCH_SIZE = 5;

const generationPrompt = (count: number) => `
Generate ${count} unique spirit personas for a Ouija board application.
For each spirit, provide a full name, a short backstory (one or two sentences, max 25 words), and a very short description of their communication style (e.g., "cryptic and formal", "playful and childlike", "blunt and to the point").
The personas should be distinct and interesting. Do not use the names Eleanor Vance, Pip, or Sergeant Graves.
The name should sound like it could be a real person's name from some historical period.
Ensure the personas are unique from each other and from any previous examples.
`;

const responseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "The full name of the spirit." },
      backstory: { type: Type.STRING, description: "A short backstory for the spirit, max 25 words." },
      communicationStyle: { type: Type.STRING, description: "A very short description of the spirit's communication style." }
    },
    required: ['name', 'backstory', 'communicationStyle'],
  }
};

interface RawPersonaData {
    name: string;
    backstory: string;
    communicationStyle: string;
}

export const generateAndStoreInitialPersonas = async (totalCount: number, onProgress: (progress: number) => void): Promise<Persona[]> => {
    try {
        const existingPersonas = await dbService.getPersonas();
        if (existingPersonas && existingPersonas.length >= totalCount) {
            onProgress(100);
            return existingPersonas.slice(0, totalCount);
        }

        const allPersonas: Persona[] = [];
        const existingNames = new Set<string>();

        while (allPersonas.length < totalCount) {
            const remaining = totalCount - allPersonas.length;
            const currentBatchSize = Math.min(BATCH_SIZE, remaining);
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: generationPrompt(currentBatchSize),
                config: {
                    responseMimeType: "application/json",
                    responseSchema: responseSchema,
                },
            });
            
            const personaDataArray: RawPersonaData[] = JSON.parse(response.text);

            for (const personaData of personaDataArray) {
                 if (!personaData.name || !personaData.backstory || !personaData.communicationStyle || existingNames.has(personaData.name)) {
                    continue; // Skip invalid or duplicate persona
                }

                const systemInstruction = `You are the spirit of ${personaData.name}. ${personaData.backstory}. Your communication style is ${personaData.communicationStyle}. Your responses must be a SINGLE WORD, or 'YES', 'NO', 'GOOD BYE' or a number. Only use uppercase letters (A-Z) and numbers (0-9). Do not use any punctuation. Your single-word answer must not contain spaces.`;
                
                const newPersona: Persona = {
                    id: crypto.randomUUID(),
                    name: personaData.name,
                    backstory: personaData.backstory,
                    systemInstruction: systemInstruction,
                };
                
                allPersonas.push(newPersona);
                existingNames.add(newPersona.name);
                
                if (allPersonas.length >= totalCount) break;
            }
            onProgress(Math.floor((allPersonas.length / totalCount) * 100));
        }

        await dbService.savePersonas(allPersonas);
        return allPersonas;
    } catch (error) {
        console.error("Failed to generate personas, returning default.", error);
        onProgress(100);
        const defaultPersona = { ...DEFAULT_PERSONA, id: crypto.randomUUID() };
        await dbService.savePersonas([defaultPersona]);
        return [defaultPersona];
    }
};
