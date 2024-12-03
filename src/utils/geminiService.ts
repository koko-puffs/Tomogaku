import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export class GeminiService {
  private model;

  constructor() {
    this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-8b-latest" });
  }

  async generateContent(prompt: string) {
    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Error generating content:', error);
      throw error;
    }
  }

  async generateContentStream(prompt: string, callback: (text: string) => void) {
    try {
      const result = await this.model.generateContentStream(prompt);
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        callback(chunkText);
      }
    } catch (error) {
      console.error('Error generating content stream:', error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();