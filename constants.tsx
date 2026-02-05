import React from 'react';
import type { PaletteItem, SnippetItem } from './types';

export const STANDARD_ELEMENTS: PaletteItem[] = [
  {
    type: 'container',
    label: 'Container / Section',
    icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
    )
  },
  {
    type: 'accordion',
    label: 'Accordion',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    )
  },
  {
    type: 'bootstrap-row',
    label: 'Responsive Row',
    icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 4a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V4zm0 6a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1v-2zm0 6a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1v-2z" />
        </svg>
    )
  },
  {
    type: 'bootstrap-col',
    label: 'Flex Column',
    icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4 2a1 1 0 011-1h2a1 1 0 011 1v16a1 1 0 01-1 1H5a1 1 0 01-1-1V2zm6 0a1 1 0 011-1h2a1 1 0 011 1v16a1 1 0 01-1 1h-2a1 1 0 01-1-1V2zm6 0a1 1 0 011-1h2a1 1 0 011 1v16a1 1 0 01-1 1h-2a1 1 0 01-1-1V2z" />
        </svg>
    )
  },
  {
    type: 'text',
    label: 'Text Input',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 8a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 12a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    type: 'checkbox',
    label: 'Checkbox',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 7l2 2 4-4-1.414-1.414L9 10.172 7.414 8.586 6 10l1 1z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    type: 'radio',
    label: 'Radio Group',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    type: 'select',
    label: 'Dropdown / Select',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    type: 'typography',
    label: 'Text / Heading',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 5a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zm0 6a1 1 0 011-1h6a1 1 0 110 2H5a1 1 0 01-1-1zm1 5a1 1 0 100 2h6a1 1 0 100-2H5z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    type: 'button',
    label: 'Button',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" />
      </svg>
    ),
  },
  {
    type: 'toggle',
    label: 'Switch / Toggle',
    icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
    )
  },
  {
    type: 'rating',
    label: 'Star Rating',
    icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
    )
  },
  {
    type: 'rich-text',
    label: 'Rich Text Editor',
    icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
             <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
        </svg>
    )
  },
  {
    type: 'video',
    label: 'Video Player',
    icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
        </svg>
    )
  },
  {
    type: 'progress',
    label: 'Progress Bar',
    icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8h8V6z" clipRule="evenodd" />
        </svg>
    )
  },
  {
    type: 'validationLogic',
    label: 'Validation Logic',
    icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
    )
  },
  {
    type: 'dataLogic',
    label: 'Data Logic',
    icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
        </svg>
    )
  },
  {
    type: 'news-card',
    label: 'AI News Card',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3 2a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 4a1 1 0 100 2h4a1 1 0 100-2H6z" clipRule="evenodd" />
      </svg>
    )
  },
  {
    type: 'htmlContent',
    label: 'HTML Block',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    ),
  },
];

export const BOOTSTRAP_GRID_SNIPPETS: SnippetItem[] = [
    {
        label: 'Responsive 2-Col Grid',
        icon: (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 5a1 1 0 011-1h14a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V5zm8 1H4v8h6V6zm2 0v8h6V6h-6z" />
             </svg>
        ),
        elements: [{
            type: 'bootstrap-row',
            label: 'Two Column Row',
            styles: { flexWrap: 'wrap', gap: '0px' },
            children: [
                { type: 'bootstrap-col', label: 'Col Left', colSpan: 6, styles: { padding: '16px', backgroundColor: '#f9fafb' } },
                { type: 'bootstrap-col', label: 'Col Right', colSpan: 6, styles: { padding: '16px', backgroundColor: '#ffffff' } }
            ]
        }]
    },
    {
        label: 'Sidebar Layout (3+9)',
        icon: (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 5a1 1 0 011-1h14a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V5zm5 1H4v8h3V6zm1 0v8h8V6H8z" />
             </svg>
        ),
        elements: [{
            type: 'bootstrap-row',
            label: 'Sidebar Row',
            styles: { flexWrap: 'wrap', gap: '0px' },
            children: [
                { type: 'bootstrap-col', label: 'Sidebar', colSpan: 3, styles: { padding: '20px', backgroundColor: '#f8fafc', borderRightWidth: '1px', borderStyle: 'solid', borderColor: '#e2e8f0', minHeight: '120px' } },
                { type: 'bootstrap-col', label: 'Main Content', colSpan: 9, styles: { padding: '20px', minHeight: '120px' } }
            ]
        }]
    },
    {
        label: 'Equal 3-Col Grid',
        icon: (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 5a1 1 0 011-1h14a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V5zm5 1H4v8h3V6zm1 0v8h4V6H8zm5 0v8h3V6h-3z" />
             </svg>
        ),
        elements: [{
            type: 'bootstrap-row',
            label: 'Three Column Row',
            styles: { flexWrap: 'wrap', gap: '0px' },
            children: [
                { type: 'bootstrap-col', label: 'Col 1', colSpan: 4, styles: { padding: '12px', borderRightWidth: '1px', borderStyle: 'dotted', borderColor: '#e2e8f0' } },
                { type: 'bootstrap-col', label: 'Col 2', colSpan: 4, styles: { padding: '12px', borderRightWidth: '1px', borderStyle: 'dotted', borderColor: '#e2e8f0' } },
                { type: 'bootstrap-col', label: 'Col 3', colSpan: 4, styles: { padding: '12px' } }
            ]
        }]
    }
];

export const WEBSITE_SNIPPETS: SnippetItem[] = [
    {
        label: 'Hero Section',
        elements: [
            {
                type: 'container',
                label: 'Hero',
                styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px', backgroundColor: '#f9fafb', textAlign: 'center' },
                children: [
                    { type: 'typography', headingLevel: 'h1', textContent: 'Modern Solutions', styles: { fontSize: '42px', fontWeight: '800', marginBottom: '16px', textColor: '#1e293b' }, name: 'hero_title' },
                    { type: 'typography', headingLevel: 'p', textContent: 'Design and build professional forms in minutes with AI-assisted intelligence and visual drag-and-drop tools.', styles: { fontSize: '18px', textColor: '#64748b', maxWidth: '650px', marginBottom: '32px' }, name: 'hero_desc' },
                    { type: 'container', label: 'CTA Group', styles: { display: 'flex', gap: '12px' }, children: [
                        { type: 'button', label: 'Get Started', styles: { backgroundColor: '#0078d4', textColor: '#ffffff', padding: '12px 32px', borderRadius: '12px' }, name: 'btn_start' },
                        { type: 'button', label: 'Watch Demo', styles: { backgroundColor: '#ffffff', textColor: '#475569', padding: '12px 32px', borderRadius: '12px', borderWidth: '1px', borderColor: '#e2e8f0' }, name: 'btn_demo' }
                    ]}
                ]
            }
        ]
    }
];

export const LAYOUT_SNIPPETS: SnippetItem[] = [];
export const SCRIPT_SNIPPETS: SnippetItem[] = [];
export const STYLE_SNIPPETS: SnippetItem[] = [];
export const SNIPPETS: SnippetItem[] = [];