
import { GoogleGenAI, Type } from "@google/genai";
import type { FormElement, ElementStyle } from "../types";

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
          description: "Type of the form field. Must be one of: 'text', 'textarea', 'checkbox', 'radio', 'select', 'button', 'container', 'accordion', 'news-card', 'navbar'.",
          enum: ['text', 'textarea', 'checkbox', 'radio', 'select', 'button', 'container', 'accordion', 'news-card', 'navbar'],
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

const styleResponseSchema = {
    type: Type.OBJECT,
    properties: {
        backgroundColor: { type: Type.STRING },
        textColor: { type: Type.STRING },
        borderColor: { type: Type.STRING },
        borderWidth: { type: Type.STRING },
        borderRadius: { type: Type.STRING },
        padding: { type: Type.STRING },
        fontFamily: { type: Type.STRING, enum: ['sans', 'serif', 'mono'] },
        fontWeight: { type: Type.STRING, enum: ['normal', 'bold'] },
        textAlign: { type: Type.STRING, enum: ['left', 'center', 'right', 'justify'] },
        letterSpacing: { type: Type.STRING },
        lineHeight: { type: Type.STRING },
        textDecoration: { type: Type.STRING, enum: ['none', 'underline', 'line-through', 'overline'] },
        boxShadow: { type: Type.STRING },
        display: { type: Type.STRING },
        flexDirection: { type: Type.STRING },
        justifyContent: { type: Type.STRING },
        alignItems: { type: Type.STRING },
        gap: { type: Type.STRING },
        gridTemplateColumns: { type: Type.STRING },
        gridTemplateRows: { type: Type.STRING },
        focusBorderColor: { type: Type.STRING },
        focusBoxShadow: { type: Type.STRING }
    },
    required: [],
    propertyOrdering: [
        "backgroundColor", "textColor", "borderColor", "borderWidth", "borderRadius", "padding", 
        "fontFamily", "fontWeight", "textAlign", "letterSpacing", "lineHeight", "textDecoration", "boxShadow",
        "display", "flexDirection", "justifyContent", "alignItems", "gap", "gridTemplateColumns", "gridTemplateRows",
        "focusBorderColor", "focusBoxShadow"
    ]
};


export const getFormSuggestions = async (prompt: string, useGoogleSearch: boolean) => {
    if (!process.env.API_KEY) {
        throw new Error("API key is not configured.");
    }
    try {
        if (useGoogleSearch) {
            const fullPrompt = `Based on the following description, generate a list of fields for an HTML form. Use Google Search to find relevant information and best practices for this type of form.
            Description: "${prompt}"

            Your response must be ONLY a valid JSON array of objects. Do not include any text, explanation, or markdown backticks like \`\`\`json before or after the JSON array.
            Each object represents a form field and must have the following properties:
            - "type": (string) Must be one of: 'text', 'textarea', 'checkbox', 'radio', 'select', 'button'.
            - "label": (string) The user-visible label for the form field.
            - "name": (string) The HTML 'name' attribute, should be in camelCase.
            - "placeholder": (string, optional) Placeholder text for inputs.
            - "options": (array of strings, optional) For 'select' or 'radio' types.
            - "required": (boolean, optional) Whether the field is required.`;

            const response = await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: fullPrompt,
                config: {
                    tools: [{googleSearch: {}}],
                    temperature: 0.2,
                },
            });

            const text = response.text.trim();
            let jsonString = text;
            if (jsonString.startsWith('```json')) {
                jsonString = jsonString.substring(7);
            }
            if (jsonString.endsWith('```')) {
                jsonString = jsonString.substring(0, jsonString.length - 3);
            }
            
            try {
                const suggestions = JSON.parse(jsonString);
                const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
                return { suggestions, sources };
            } catch (e) {
                console.error("Failed to parse JSON from AI response:", e);
                console.error("Raw response text:", text);
                throw new Error("AI returned an invalid response. Please try again or rephrase your prompt.");
            }
            
        } else {
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
            return { suggestions, sources: null };
        }

    } catch (error) {
        console.error("Error fetching form suggestions:", error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error("Failed to get suggestions from AI. Please check the console for details.");
    }
};

export const analyzeFormContext = async (elements: FormElement[]) => {
    if (!process.env.API_KEY) {
        throw new Error("API key is not configured.");
    }
    
    // Create a simplified representation of the tree for the AI
    const simplify = (list: FormElement[]): any[] => list.map(el => ({
        type: el.type,
        label: el.label,
        name: el.name,
        children: el.children ? simplify(el.children) : undefined
    }));
    
    const structure = JSON.stringify(simplify(elements));
    
    try {
        const fullPrompt = `Analyze the following HTML form structure and context:
        ${structure}
        
        Identify missing standard fields, logical gaps, or UX improvements.
        Generate a JSON list of NEW form elements that should be added to improve this form or complete it.
        For example, if 'Shipping Address' exists, suggest 'Billing Address' fields.
        
        The 'type' property of suggested elements must be one of: 'text', 'textarea', 'checkbox', 'radio', 'select', 'button', 'container', 'accordion', 'news-card', 'navbar'.
        `;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.3,
            },
        });

        const jsonText = response.text.trim();
        const suggestions = JSON.parse(jsonText);
        return suggestions;
    } catch (error) {
         console.error("Error analyzing form context:", error);
         throw error;
    }
};

export const getStyleSuggestions = async (element: FormElement, stylePrompt?: string): Promise<ElementStyle> => {
    if (!process.env.API_KEY) {
        throw new Error("API key is not configured.");
    }
    try {
        let fullPrompt = `Suggest modern CSS styles for a form element with the following properties:
        Type: ${element.type}
        Label: ${element.label}
        Name: ${element.name}`;

        if (stylePrompt) {
            fullPrompt += `\n\nUser Style Request: "${stylePrompt}"\nPlease ensure the generated styles strictly match this request. 
            If the user asks for focus states, provide values for 'focusBorderColor' and 'focusBoxShadow'.`;
        } else {
             fullPrompt += `\n\nProvide a JSON object with style properties that make this element look professional and modern.`;
        }
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: styleResponseSchema,
                temperature: 0.5,
            },
        });

        const jsonText = response.text.trim();
        const styles = JSON.parse(jsonText);
        return styles;
    } catch (error) {
         console.error("Error fetching style suggestions:", error);
        throw error;
    }
}

export const getScriptSuggestions = async (prompt: string): Promise<string> => {
    if (!process.env.API_KEY) {
        throw new Error("API key is not configured.");
    }
    try {
        const fullPrompt = `Write a JavaScript code snippet for a web form based on this request: "${prompt}".
        
        - The code should be plain JavaScript (ES6+).
        - It should assume it runs in the browser.
        - Use document.querySelector to target elements by their 'name' attribute (e.g., document.querySelector('input[name="myField"]')).
        - Do not include any explanation or markdown formatting (no \`\`\`js). Just valid JavaScript code.
        - Ensure event listeners are added safely (check if element exists).`;
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                temperature: 0.3,
            },
        });

        let script = response.text.trim();
        if (script.startsWith('```javascript')) {
            script = script.substring(13);
        } else if (script.startsWith('```js')) {
            script = script.substring(5);
        } else if (script.startsWith('```')) {
            script = script.substring(3);
        }
        if (script.endsWith('```')) {
            script = script.substring(0, script.length - 3);
        }
        return script.trim();
    } catch (error) {
         console.error("Error fetching script suggestions:", error);
        throw error;
    }
}
