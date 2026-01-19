
# PowerForm Builder AI - Architecture Blueprint

## 1. System Overview
**PowerForm Builder AI** is a React-based, drag-and-drop visual editor designed to generate HTML/CSS form structures compatible with Power Apps and web applications. It leverages **Google Gemini API** to provide AI-assisted form generation, styling suggestions, and logic implementation.

### Tech Stack
*   **Frontend Framework:** React 19 (Vite)
*   **Styling:** Tailwind CSS (Custom configuration for "Brand" colors)
*   **AI Integration:** `@google/genai` SDK (Gemini 2.5 Flash / 3 Pro)
*   **Data Processing:** `papaparse` (CSV), `xlsx` (Excel)
*   **State Management:** React `useState` / LocalStorage persistence

---

## 2. Data Structures (`types.ts`)

The core of the application is the **FormElement** recursive tree structure.

### `FormElement` Interface
The "Source of Truth" for the canvas.
*   **Identity:** `id` (unique UUID), `type` (component type), `name` (variable name).
*   **Configuration:** `label`, `placeholder`, `required`, `disabled`, `options` (for selects).
*   **Layout & Style:** `styles` (ElementStyle object mapping to CSS properties).
*   **Recursion:** `children` (Array of FormElements, used for containers/rows/cols).
*   **Logic:**
    *   `logic`: **Visibility Logic** (Pull). Shows/Hides based on another field's value.
    *   `dataLogic`: **Data Transformation** (Legacy). Modifies properties based on triggers.
    *   `conditionalRules`: **Bulk Logic** (Push). When this field changes, apply actions to *target* fields.
    *   `validationLogic`: **Cross-field Validation**. Compares values between fields.
*   **Scripting:** `onClickScript`, `onChangeScript` (Raw JS execution string).

---

## 3. Component Architecture

### A. Root (`App.tsx`)
*   **Responsibility:**
    *   Holds the global `formElements` state.
    *   Manages `history` (Undo/Redo).
    *   Orchestrates global modals (Preview, Code Export, AI Assistant).
    *   Persists data to `localStorage`.
*   **AI Assistant:** A collapsible toolbar connecting to `geminiService` to generate form structures from natural language.

### B. The Editor (`components/`)

#### 1. `Canvas.tsx`
*   **Function:** The drop zone and rendering area.
*   **Key Logic:**
    *   **Recursive Rendering:** Uses `RecursiveList` to render nested children (e.g., Columns inside Rows inside Containers).
    *   **Drag & Drop (DnD):** Manual HTML5 DnD implementation. Handles sorting (reordering) and nesting (dropping inside containers).
    *   **Selection:** Updates global `selectedIds`.

#### 2. `Palette.tsx`
*   **Function:** Sidebar containing available tools.
*   **Categories:**
    *   *Standard Elements:* Inputs, Buttons, Layouts.
    *   *Snippets:* Pre-built complex structures (Pricing tables, Hero sections).
    *   *AI Generated:* Elements suggested by Gemini based on user prompt.

#### 3. `PropertiesPanel.tsx`
*   **Function:** Configuration sidebar for the active `selectedElement`.
*   **Features:**
    *   **General:** Label, Name, ARIA labels, Options.
    *   **Styles:** CSS controls + **AI Style Assistant**.
    *   **Logic:** specialized UI for building Visibility, Bulk Rules, and Script injection.
    *   **Quick Actions:** E.g., "Add Log to Console Script" for buttons.

#### 4. `FormElementRenderer.tsx`
*   **Function:** The "Dumb Component" that paints the actual UI.
*   **Modes:**
    *   *Edit Mode:* Adds wrappers, hover effects, and prevents default interactions (links/buttons).
    *   *Preview Mode:* Renders raw HTML/Inputs and attaches real event listeners.
*   **Styling:** Maps `element.styles` JSON to React `style` props and Tailwind classes.

### C. Logic Engine (`PreviewModal.tsx`)
A distinct runtime environment that simulates the form.
1.  **State Map:** Creates a flat `formData` object `{ [element.name]: value }`.
2.  **Evaluation Loop:**
    *   Iterates through the element tree.
    *   Evaluates **Visibility Logic** (Pull) -> Sets `visibleElements`.
    *   Evaluates **Conditional Rules** (Push) -> Creates `dynamicOverrides` (e.g., changing background color of target).
    *   Evaluates **Validation Logic** -> Populates `errors` object.
    *   **Condition Helper:** Supports `equals`, `contains`, `starts_with`, `regex`, etc.

---

## 4. AI Services (`services/geminiService.ts`)

Centralized service for interacting with Google GenAI.

| Function | Model | Purpose |
| :--- | :--- | :--- |
| `getFormSuggestions` | `gemini-3-flash-preview` | Generates a JSON list of elements from a text prompt (with optional Google Search grounding). |
| `getStyleSuggestions` | `gemini-3-flash-preview` | Generates CSS JSON object based on design requirements. |
| `getScriptSuggestions` | `gemini-3-pro-preview` | Writes JavaScript snippets for `onClick` events. |
| `suggestContainerConfig` | `gemini-3-flash-preview` | Suggests a label and style for a group of selected elements. |
| `getFormSuggestionsFromData`| `gemini-3-flash-preview` | Analyzes CSV/Excel headers to build a matching form structure. |

---

## 5. Key Workflows

### 1. Drag and Drop
`Palette` (DragStart) -> `Canvas` (DragOver -> Detect Parent/Index) -> `Canvas` (Drop) -> `App` (Update State Tree).

### 2. AI Generation
User Prompt -> `App` -> `geminiService` -> `Palette` (Populate "AI Generated" list) -> User Drags to Canvas.

### 3. Logic Execution
User changes Input A -> `PreviewModal` updates state -> `useEffect` triggers logic calculator -> Checks `conditionalRules` on Input A -> Finds Target Input B -> Applies `dynamicOverride` (e.g., `hidden: true`) to Input B -> Re-renders.

---

## 6. Directory Structure

```text
/
├── index.html              # Entry point
├── index.tsx               # React Root
├── App.tsx                 # Main State Controller
├── types.ts                # TypeScript Interfaces
├── constants.tsx           # Static Palette Items
├── services/
│   └── geminiService.ts    # AI API Integration
└── components/
    ├── Canvas.tsx          # Visual Editor
    ├── Palette.tsx         # Component Library
    ├── PropertiesPanel.tsx # Attribute Editor
    ├── FormElementRenderer.tsx # Component UI definition
    ├── PreviewModal.tsx    # Runtime Logic Simulator
    ├── CodeModal.tsx       # HTML Export
    ├── ImportModal.tsx     # CSV/Excel Import
    └── PromptModal.tsx     # AI Prompt Export
```
