
import { GoogleGenAI, Type } from "@google/genai";
import type { FormElement, ElementStyle } from "../types";

if (!process.env.API_KEY) {
    console.warn("API_KEY environment variable not set. AI features will be disabled.");
}

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          description: "Type of the form field.",
          enum: ['text', 'textarea', 'checkbox', 'radio', 'select', 'button', 'container', 'accordion', 'news-card', 'navbar', 'date', 'number', 'email', 'tel', 'typography', 'image', 'html-block', 'divider'],
        },
        subType: {
           type: Type.STRING,
           enum: ['text', 'email', 'password', 'tel', 'url']
        },
        label: { type: Type.STRING },
        name: { type: Type.STRING },
        placeholder: { type: Type.STRING },
        options: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        required: { type: Type.BOOLEAN },
        textContent: { type: Type.STRING, description: "Content for typography elements" },
        headingLevel: { type: Type.STRING, description: "h1-h6 or p for typography" },
        src: { type: Type.STRING, description: "Source URL for images" },
        altText: { type: Type.STRING, description: "Alt text for images" }
      },
      required: ["type", "label", "name"],
    },
};

export const suggestContainerConfig = async (elements: FormElement[]): Promise<{ label: string, styles: ElementStyle }> => {
    if (!process.env.API_KEY) throw new Error("API key is not configured.");
    const ai = getAI();
    const childrenInfo = elements.map(el => `${el.type} (${el.label})`).join(", ");
    
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `I have these form elements: [${childrenInfo}]. Suggest a professional container label and modern CSS styles (in JSON format) for a container holding them.`,
        config: {
            systemInstruction: "You are a UI/UX expert. Provide a JSON object with 'label' (string) and 'styles' (ElementStyle object). Elements often belong to 'Contact Info', 'Identity', 'Preferences', etc.",
            responseMimeType: "application/json",
            temperature: 0.4,
        },
    });

    return JSON.parse(response.text);
};

export const getContentSuggestion = async (topic: string, targetType: string): Promise<any> => {
    if (!process.env.API_KEY) throw new Error("API key is not configured.");
    const ai = getAI();
    
    let systemInstruction = "";
    let schema: any = undefined;

    if (targetType === 'news-card') {
        systemInstruction = "You are a professional journalist. Generate a news title and content based on a topic.";
        schema = {
            type: Type.OBJECT,
            properties: {
                newsTitle: { type: Type.STRING },
                newsContent: { type: Type.STRING },
                altText: { type: Type.STRING }
            },
            required: ["newsTitle", "newsContent", "altText"]
        };
    } else if (targetType === 'typography' || targetType === 'headingLevel') {
        systemInstruction = "You are a content writer. Suggest a catchy heading and identify the appropriate heading level (h1-h6).";
        schema = {
            type: Type.OBJECT,
            properties: {
                textContent: { type: Type.STRING },
                headingLevel: { type: Type.STRING, enum: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p'] }
            },
            required: ["textContent", "headingLevel"]
        };
    } else if (targetType === 'image' || targetType === 'altText') {
        systemInstruction = "Suggest a relevant alt text description for an image related to this topic.";
        schema = {
            type: Type.OBJECT,
            properties: {
                altText: { type: Type.STRING }
            },
            required: ["altText"]
        };
    }

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Topic: ${topic}`,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: schema,
            temperature: 0.7,
        },
    });

    return JSON.parse(response.text);
};

export const getFormSuggestions = async (prompt: string, useGoogleSearch: boolean) => {
    if (!process.env.API_KEY) throw new Error("API key is not configured.");
    const ai = getAI();
    try {
        if (useGoogleSearch) {
            const fullPrompt = `Based on the following description, generate a list of fields for an HTML form. Use Google Search to find relevant information and best practices for this type of form.
            Description: "${prompt}"

            Your response must be ONLY a valid JSON array of objects. Do not include markdown backticks.
            Properties: "type" (one of: text, textarea, checkbox, radio, select, button, date, number, typography, image, news-card, container, divider), "subType", "label", "name", "placeholder", "options", "required", "textContent", "headingLevel".`;

            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: fullPrompt,
                config: {
                    tools: [{googleSearch: {}}],
                    temperature: 0.2,
                },
            });

            const text = response.text.trim().replace(/^```json/, "").replace(/```$/, "");
            const suggestions = JSON.parse(text);
            const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
            return { suggestions, sources };
        } else {
            const response = await ai.models.generateContent({
                model: "gemini-3-flash-preview",
                contents: `Based on the following description, generate a list of fields for an HTML form: "${prompt}"`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: responseSchema,
                    temperature: 0.2,
                },
            });

            return { suggestions: JSON.parse(response.text), sources: null };
        }
    } catch (error) {
        console.error("Error fetching form suggestions:", error);
        throw error;
    }
};

export const getFormSuggestionsFromData = async (dataSummary: string) => {
    if (!process.env.API_KEY) throw new Error("API key is not configured.");
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze the following dataset structure and generate a comprehensive HTML form to capture this data:\n${dataSummary}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            temperature: 0.2,
        },
    });
    return JSON.parse(response.text);
}

export const analyzeFormContext = async (elements: FormElement[]) => {
    if (!process.env.API_KEY) throw new Error("API key is not configured.");
    const ai = getAI();
    const structure = JSON.stringify(elements.map(el => ({ type: el.type, label: el.label, name: el.name })));
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analyze form structure: ${structure}. Suggest improvements or missing fields in JSON format.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            temperature: 0.3,
        },
    });
    return JSON.parse(response.text);
};

export const getStyleSuggestions = async (element: FormElement, stylePrompt?: string): Promise<ElementStyle> => {
    if (!process.env.API_KEY) throw new Error("API key is not configured.");
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Suggest modern CSS styles for ${element.type} "${element.label}". ${stylePrompt || ""}`,
        config: {
            responseMimeType: "application/json",
            temperature: 0.5,
        },
    });
    return JSON.parse(response.text);
}

export const getScriptSuggestions = async (prompt: string): Promise<string> => {
    if (!process.env.API_KEY) throw new Error("API key is not configured.");
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: `Write a JavaScript code snippet for a web form: "${prompt}". No explanations.`,
        config: { temperature: 0.3 },
    });
    return response.text.trim().replace(/^```(javascript|js)?/, "").replace(/```$/, "");
}
