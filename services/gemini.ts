
import { GoogleGenAI, Chat } from "@google/genai";
import { NAYLA_SYSTEM_INSTRUCTION } from "../constants";

export class NaylaService {
  private ai: GoogleGenAI;
  private chat: Chat;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    this.chat = this.ai.chats.create({
      model: "gemini-3-flash-preview",
      config: {
        systemInstruction: NAYLA_SYSTEM_INSTRUCTION,
        temperature: 0.8,
        topP: 0.95,
      },
    });
  }

  async sendMessage(message: string) {
    try {
      const response = await this.chat.sendMessage({ message });
      return response.text;
    } catch (error) {
      console.error("Gemini Error:", error);
      throw error;
    }
  }

  async sendMessageStream(message: string) {
    try {
      return await this.chat.sendMessageStream({ message });
    } catch (error) {
      console.error("Gemini Stream Error:", error);
      throw error;
    }
  }
}

export const naylaService = new NaylaService();
