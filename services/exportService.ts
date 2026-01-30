
import type { FormElement, ElementStyle } from '../types';

export const generateExportFiles = (elements: FormElement[]) => {
  let cssRules: string[] = [];
  const processedIds = new Set<string>();

  const camelToKebab = (str: string) => str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();

  const getStyleString = (styles?: ElementStyle) => {
    if (!styles) return '';
    return Object.entries(styles)
      .map(([key, value]) => {
        if (!value || key === 'size' || key === 'color' || key === 'orientation') return '';
        return `  ${camelToKebab(key)}: ${value}${typeof value === 'number' ? 'px' : ''};`;
      })
      .filter(Boolean)
      .join('\n');
  };

  const generateElementHTML = (el: FormElement): string => {
    const id = el.id || `el-${Math.random().toString(36).substr(2, 9)}`;
    const styleStr = getStyleString(el.styles);
    if (styleStr && !processedIds.has(id)) {
      cssRules.push(`#${id} {\n${styleStr}\n}`);
      processedIds.add(id);
    }

    const commonAttrs = `id="${id}" class="form-element-${el.type}" ${el.ariaLabel ? `aria-label="${el.ariaLabel}"` : ''} ${el.testId ? `data-testid="${el.testId}"` : ''}`;
    const childrenHTML = el.children?.map(generateElementHTML).join('\n') || '';

    // Fix: Removed invalid cases 'email' and 'password' from switch as they aren't in FormElementType.
    // Instead, utilize subType to determine the actual HTML input type.
    switch (el.type) {
      case 'bootstrap-row':
        return `<div ${commonAttrs} style="display: flex; flex-wrap: wrap;">\n${childrenHTML}\n</div>`;
      case 'bootstrap-col':
        const basis = el.colSpan ? `${(el.colSpan / 12) * 100}%` : 'auto';
        return `<div ${commonAttrs} style="flex-basis: ${basis}; flex-grow: 0; flex-shrink: 0;">\n${childrenHTML}\n</div>`;
      case 'container':
        return `<div ${commonAttrs}>\n${childrenHTML}\n</div>`;
      case 'typography':
        const Tag = el.headingLevel || 'p';
        return `<${Tag} ${commonAttrs}>${el.textContent || ''}</${Tag}>`;
      case 'text':
      case 'number':
      case 'date':
        return `
          <div class="field-container">
            ${el.label ? `<label for="${id}-input">${el.label}${el.required ? ' *' : ''}</label>` : ''}
            <input type="${el.subType || el.type}" name="${el.name}" id="${id}-input" placeholder="${el.placeholder || ''}" ${el.required ? 'required' : ''} ${el.disabled ? 'disabled' : ''} value="${el.defaultValue || ''}">
          </div>
        `;
      case 'textarea':
        return `
          <div class="field-container">
            ${el.label ? `<label for="${id}-input">${el.label}${el.required ? ' *' : ''}</label>` : ''}
            <textarea name="${el.name}" id="${id}-input" placeholder="${el.placeholder || ''}" ${el.required ? 'required' : ''} ${el.disabled ? 'disabled' : ''}>${el.defaultValue || ''}</textarea>
          </div>
        `;
      case 'select':
        return `
          <div class="field-container">
            ${el.label ? `<label for="${id}-input">${el.label}</label>` : ''}
            <select name="${el.name}" id="${id}-input" ${el.required ? 'required' : ''}>
              ${el.options?.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
            </select>
          </div>
        `;
      case 'radio':
        return `
          <div class="field-container" role="radiogroup">
            ${el.label ? `<label>${el.label}</label>` : ''}
            <div class="radio-options">
              ${el.options?.map((opt, i) => `
                <div class="radio-item">
                  <input type="radio" name="${el.name}" id="${id}-${i}" value="${opt}" ${el.defaultValue === opt ? 'checked' : ''}>
                  <label for="${id}-${i}">${opt}</label>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      case 'button':
      case 'reset-button':
        return `<button type="${el.type === 'reset-button' ? 'reset' : 'button'}" ${commonAttrs}>${el.label}</button>`;
      case 'divider':
        return `<hr ${commonAttrs}>`;
      case 'image':
        return `<img src="${el.src}" alt="${el.altText || ''}" ${commonAttrs}>`;
      default:
        return `<div ${commonAttrs}>${childrenHTML}</div>`;
    }
  };

  const htmlBody = elements.map(generateElementHTML).join('\n');
  
  const htmlFull = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Form</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <form id="main-form" class="exported-form">
    ${htmlBody}
  </form>
  <script src="script.js"></script>
</body>
</html>`;

  const baseCss = `
body { font-family: sans-serif; padding: 20px; background: #f4f4f4; }
.exported-form { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
.field-container { margin-bottom: 20px; }
label { display: block; font-weight: bold; margin-bottom: 5px; font-size: 14px; }
input[type="text"], input[type="email"], input[type="password"], input[type="number"], input[type="date"], textarea, select {
  width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;
}
button { padding: 10px 20px; cursor: pointer; border: none; border-radius: 4px; background: #0078d4; color: white; font-weight: bold; }
button:hover { background: #005a9e; }
.radio-item { display: flex; align-items: center; margin-bottom: 5px; }
.radio-item input { margin-right: 10px; }
`;

  const jsContent = `
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('main-form');
  const elements = ${JSON.stringify(elements, null, 2)};

  const getFormValue = (name) => {
    const field = form.elements[name];
    if (!field) return null;
    if (field.type === 'checkbox') return field.checked;
    return field.value;
  };

  const evaluateCondition = (condition, value, targetValue) => {
    const valStr = (value ?? '').toString().toLowerCase();
    const targetStr = (targetValue ?? '').toLowerCase();
    switch(condition) {
      case 'equals': return valStr === targetStr;
      case 'not_equals': return valStr !== targetStr;
      case 'contains': return valStr.includes(targetStr);
      default: return false;
    }
  };

  const updateVisibility = () => {
    const checkVisibility = (list) => {
      list.forEach(el => {
        const domEl = document.getElementById(el.id);
        if (!domEl) return;

        let visible = true;
        if (el.logic?.triggerId) {
          const trigger = document.getElementById(el.logic.triggerId); // In real export, search by name is better
          // For simplicity in this demo, logic is mapped via IDs
          // Real production logic would look up values by name
        }
        
        if (el.children) checkVisibility(el.children);
      });
    };
    // Visibility logic placeholder
  };

  form.addEventListener('input', updateVisibility);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('Form Submitted!', new FormData(form));
  });
});`;

  return {
    html: htmlFull.trim(),
    css: (baseCss + '\n' + cssRules.join('\n')).trim(),
    js: jsContent.trim()
  };
};
