
import { GoogleGenAI, Type } from "@google/genai";

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          description: "Type of the form field. Must be one of: 'text', 'textarea', 'checkbox', 'radio', 'select', 'button'.",
          enum: ['text', 'textarea', 'checkbox', 'radio', 'select', 'button'],
        },
        label: {
          type: Type.STRING,
          description: 'The user-visible label for the form field. Example: "Full Name"',
        },
        name: {
            type: Type.STRING,
            description: "The HTML 'name' attribute for the field. Should be in camelCase. Example: 'fullName'",
        },
        placeholder: {
          type: Type.STRING,
          description: 'Placeholder text for text inputs or textareas. Example: "Enter your full name"',
        },
        options: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
          },
          description: "An array of string options for 'select' or 'radio' types. Example: ['Red', 'Green', 'Blue']",
        },
        required: {
          type: Type.BOOLEAN,
          description: 'Whether the field is required.'
        }
      },
      required: ["type", "label", "name"],
      propertyOrdering: ["type", "label", "name", "placeholder", "options", "required"],
    },
};


export const getFormSuggestions = async (prompt: string) => {
    if (!process.env.API_KEY) {
        throw new Error("API key is not configured.");
    }
    try {
        const fullPrompt = `Based on the following description, generate a list of fields for an HTML form.
        Description: "${prompt}"`;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.2,
            },
        });

        const jsonText = response.text.trim();
        const suggestions = JSON.parse(jsonText);
        return suggestions;

    } catch (error) {
        console.error("Error fetching form suggestions:", error);
        throw new Error("Failed to get suggestions from AI. Please check the console for details.");
    }
};
