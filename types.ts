
export interface CharPosition {
  top: string;
  left: string;
}

export interface BoardLayout {
  [key: string]: string[];
}

export interface Persona {
  id: string;
  name: string;
  backstory: string;
  systemInstruction: string;
}

// Represents the chat history for a persona
export type ConversationHistory = {
    role: string;
    parts: { text: string }[];
}[];
