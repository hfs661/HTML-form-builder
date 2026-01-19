
import { GoogleGenAI, Type, Schema } from "@google/genai";
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
          enum: ['text', 'textarea', 'checkbox', 'radio', 'select', 'button', 'reset-button', 'container', 'accordion', 'news-card', 'navbar', 'date', 'number', 'email', 'tel', 'typography', 'image', 'html-block', 'divider', 'video', 'audio', 'progress', 'rating', 'toggle', 'rich-text', 'code-block', 'bootstrap-row', 'bootstrap-col'],
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
        src: { type: Type.STRING, description: "Source URL for images/media" },
        altText: { type: Type.STRING, description: "Alt text for images" },
        code: { type: Type.STRING, description: "Source code for code blocks" },
        language: { type: Type.STRING, description: "Language for code blocks" },
        onClickScript: { type: Type.STRING, description: "JavaScript Code for onClick event" },
        onChangeScript: { type: Type.STRING, description: "JavaScript Code for onChange event" }
      },
      required: ["type", "label", "name"],
    },
};

const styleSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        backgroundColor: { type: Type.STRING },
        textColor: { type: Type.STRING },
        borderColor: { type: Type.STRING },
        borderWidth: { type: Type.STRING },
        borderStyle: { type: Type.STRING },
        borderRadius: { type: Type.STRING },
        padding: { type: Type.STRING },
        margin: { type: Type.STRING },
        fontSize: { type: Type.STRING },
        fontWeight: { type: Type.STRING },
        fontFamily: { type: Type.STRING },
        boxShadow: { type: Type.STRING },
        width: { type: Type.STRING },
        height: { type: Type.STRING },
        minWidth: { type: Type.STRING },
        minHeight: { type: Type.STRING },
        display: { type: Type.STRING, enum: ['block', 'flex', 'grid'] },
        flexDirection: { type: Type.STRING, enum: ['row', 'column', 'row-reverse', 'column-reverse'] },
        justifyContent: { type: Type.STRING, enum: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around'] },
        alignItems: { type: Type.STRING, enum: ['flex-start', 'center', 'flex-end', 'stretch'] },
        flexWrap: { type: Type.STRING, enum: ['nowrap', 'wrap', 'wrap-reverse'] },
        gap: { type: Type.STRING },
        gridTemplateColumns: { type: Type.STRING },
        textAlign: { type: Type.STRING, enum: ['left', 'center', 'right', 'justify'] },
        color: { type: Type.STRING, enum: ['primary', 'secondary', 'danger'] },
        size: { type: Type.STRING, enum: ['small', 'medium', 'large'] }
    },
    description: "CSS styles and layout configuration"
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
            Properties: "type" (one of: text, textarea, checkbox, radio, select, button, date, number, typography, image, news-card, container, divider, video, audio, code-block), "subType", "label", "name", "placeholder", "options", "required", "textContent", "headingLevel", "onClickScript", "onChangeScript".`;

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
        contents: `Analyze the following input. It could be a dataset summary, a raw CSV/JSON dump, a code snippet (HTML/JS/CSS), or a plain text description.
        
        Generate a comprehensive HTML form structure (JSON format) that best matches the fields, data types, logic, or requirements found in the input.
        
        Input Data:
        ${dataSummary.substring(0, 15000)}`,
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
    
    // Context about children helps the model decide on Layout (Flex/Grid) vs Block
    const childrenContext = element.children && element.children.length > 0 
        ? `This element is a container with ${element.children.length} children (types: ${element.children.map(c => c.type).join(', ')}). Focus on layout logic.` 
        : "This is a standalone leaf element. Focus on typography and appearance.";

    const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a UI/UX Expert specializing in modern, accessible web design.
        
        Task: Generate a CSS style configuration (JSON) for a Form Element.
        Element Type: "${element.type}" (${element.label})
        Context: ${childrenContext}
        User Request: "${stylePrompt || "Modern, clean, accessible"}"

        Design Requirements:
        1. **Modern Layout**: Use 'flex' or 'grid' for containers to organize children. Use 'gap' for spacing.
        2. **Typography**: Use legible font sizes (min 14px), font weights, and ample line height.
        3. **Spacing**: Use generous padding (e.g., 16px, 24px) and rounded corners (e.g., 8px, 12px) for a soft, friendly look.
        4. **Visual Hierarchy**: Use soft box-shadows (e.g., '0 4px 6px -1px rgba(0, 0, 0, 0.1)') for depth if it's a card/container.
        5. **Accessibility**: Ensure high contrast for 'textColor' against 'backgroundColor'. Avoid pure black (#000) on pure white (#fff); prefer softer grays (e.g., #1f2937 on #ffffff or #f9fafb).
        6. **Responsiveness**: Use 'flexWrap: wrap' if children might overflow.
        
        Return ONLY valid JSON matching the schema.`,
        config: {
            responseMimeType: "application/json",
            responseSchema: styleSchema,
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
