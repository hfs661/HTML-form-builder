
import React, { useState } from 'react';
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
    type: 'bootstrap-row',
    label: 'Flex Row (Wrapper)',
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
    type: 'text',
    label: 'Text Input',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 8a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 12a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
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
    type: 'code-block',
    label: 'Code Block (Java/Py)',
    icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
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
    type: 'audio',
    label: 'Audio Player',
    icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd" />
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
    type: 'select',
    label: 'Dropdown / Select',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    type: 'inputMask',
    label: 'Masked Input',
    icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path d="M7 9a1 1 0 011-1h4a1 1 0 110 2H8a1 1 0 01-1-1zM5 5a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zM9 13a1 1 0 011-1h2a1 1 0 110 2h-2a1 1 0 01-1-1z" />
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

export const WEBSITE_SNIPPETS: SnippetItem[] = [
    {
        label: 'Hero Section',
        elements: [
            {
                type: 'container',
                label: 'Hero',
                styles: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', backgroundColor: '#f9fafb', textAlign: 'center' },
                children: [
                    { type: 'typography', headingLevel: 'h1', textContent: 'Welcome to Our Service', styles: { fontSize: '48px', fontWeight: '800', marginBottom: '20px', textColor: '#111827' }, name: 'hero_title' },
                    { type: 'typography', headingLevel: 'p', textContent: 'We provide the best solutions for your business needs. Join us today and start your journey.', styles: { fontSize: '18px', textColor: '#6b7280', maxWidth: '600px', marginBottom: '30px' }, name: 'hero_desc' },
                    { type: 'container', label: 'Buttons', styles: { display: 'flex', gap: '15px' }, children: [
                        { type: 'button', label: 'Get Started', styles: { backgroundColor: '#2563eb', textColor: '#ffffff', padding: '12px 24px', borderRadius: '8px' }, name: 'btn_start' },
                        { type: 'button', label: 'Learn More', styles: { backgroundColor: '#ffffff', textColor: '#374151', padding: '12px 24px', borderRadius: '8px', borderWidth: '1px', borderColor: '#d1d5db' }, name: 'btn_learn' }
                    ]}
                ]
            }
        ]
    },
    {
        label: 'Pricing Table',
        elements: [
            {
                type: 'container',
                label: 'Pricing Grid',
                styles: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', padding: '40px' },
                children: [
                    { type: 'container', label: 'Basic Plan', styles: { padding: '24px', borderWidth: '1px', borderColor: '#e5e7eb', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }, children: [
                        { type: 'typography', headingLevel: 'h3', textContent: 'Basic', styles: { fontWeight: 'bold' } },
                        { type: 'typography', headingLevel: 'h2', textContent: '$19/mo', styles: { fontSize: '32px', fontWeight: 'bold', margin: '15px 0' } },
                        { type: 'button', label: 'Choose Plan', styles: { width: '100%' } }
                    ]},
                    { type: 'container', label: 'Pro Plan', styles: { padding: '24px', borderWidth: '1px', borderColor: '#2563eb', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#eff6ff' }, children: [
                        { type: 'typography', headingLevel: 'h3', textContent: 'Pro', styles: { fontWeight: 'bold', textColor: '#2563eb' } },
                        { type: 'typography', headingLevel: 'h2', textContent: '$49/mo', styles: { fontSize: '32px', fontWeight: 'bold', margin: '15px 0' } },
                        { type: 'button', label: 'Choose Plan', styles: { width: '100%', backgroundColor: '#2563eb', textColor: 'white' } }
                    ]},
                    { type: 'container', label: 'Enterprise Plan', styles: { padding: '24px', borderWidth: '1px', borderColor: '#e5e7eb', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }, children: [
                        { type: 'typography', headingLevel: 'h3', textContent: 'Enterprise', styles: { fontWeight: 'bold' } },
                        { type: 'typography', headingLevel: 'h2', textContent: '$99/mo', styles: { fontSize: '32px', fontWeight: 'bold', margin: '15px 0' } },
                        { type: 'button', label: 'Choose Plan', styles: { width: '100%' } }
                    ]}
                ]
            }
        ]
    },
    {
        label: 'Contact Form',
        elements: [
            {
                type: 'container',
                label: 'Contact Section',
                styles: { maxWidth: '600px', margin: '0 auto', padding: '30px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
                children: [
                    { type: 'typography', headingLevel: 'h2', textContent: 'Contact Us', styles: { marginBottom: '20px', textAlign: 'center' } },
                    { type: 'text', label: 'Full Name', placeholder: 'John Doe', required: true, name: 'contact_name' },
                    { type: 'text', label: 'Email Address', subType: 'email', placeholder: 'john@example.com', required: true, name: 'contact_email' },
                    { type: 'textarea', label: 'Message', placeholder: 'How can we help you?', required: true, name: 'contact_message' },
                    { type: 'button', label: 'Send Message', styles: { width: '100%', marginTop: '10px' }, name: 'contact_submit' }
                ]
            }
        ]
    }
];

export const LAYOUT_SNIPPETS: SnippetItem[] = [
    {
        label: 'Bootstrap Grid (2 Cols)',
        icon: (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 5a1 1 0 011-1h14a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V5zm8 1H4v8h6V6zm2 0v8h6V6h-6z" />
             </svg>
        ),
        elements: [{
            type: 'bootstrap-row',
            label: '2-Col Row',
            children: [
                { type: 'bootstrap-col', label: 'Column 1', styles: { padding: '10px', minHeight: '60px', borderStyle: 'dashed', borderWidth: '1px', borderColor: '#cbd5e1' } },
                { type: 'bootstrap-col', label: 'Column 2', styles: { padding: '10px', minHeight: '60px', borderStyle: 'dashed', borderWidth: '1px', borderColor: '#cbd5e1' } }
            ]
        }]
    },
    {
        label: 'Bootstrap Grid (3 Cols)',
         icon: (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 5a1 1 0 011-1h14a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V5zm5 1H4v8h3V6zm1 0v8h4V6H8zm5 0v8h3V6h-3z" />
             </svg>
        ),
        elements: [{
            type: 'bootstrap-row',
            label: '3-Col Row',
            children: [
                { type: 'bootstrap-col', label: 'Column 1', styles: { padding: '10px', minHeight: '60px', borderStyle: 'dashed', borderWidth: '1px', borderColor: '#cbd5e1' } },
                { type: 'bootstrap-col', label: 'Column 2', styles: { padding: '10px', minHeight: '60px', borderStyle: 'dashed', borderWidth: '1px', borderColor: '#cbd5e1' } },
                { type: 'bootstrap-col', label: 'Column 3', styles: { padding: '10px', minHeight: '60px', borderStyle: 'dashed', borderWidth: '1px', borderColor: '#cbd5e1' } }
            ]
        }]
    },
    {
        label: 'Bootstrap Grid (12 Cols)',
         icon: (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm2 2v2h2V5H5zm4 0v2h2V5H9zm4 0v2h2V5h-2zM5 9v2h2V9H5zm4 0v2h2V9H9zm4 0v2h2V9h-2zM5 13v2h2v-2H5zm4 0v2h2v-2H9zm4 0v2h2v-2h-2z" clipRule="evenodd" />
             </svg>
        ),
        elements: [{
            type: 'bootstrap-row',
            label: '12-Col Row',
            children: Array.from({length: 12}).map((_, i) => ({
                type: 'bootstrap-col',
                label: `Col ${i+1}`,
                styles: { padding: '4px', minHeight: '40px', borderStyle: 'dashed', borderWidth: '1px', borderColor: '#cbd5e1', fontSize: '10px', textAlign: 'center' }
            }))
        }]
    },
    {
        label: 'Sidebar Left',
         icon: (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 5a1 1 0 011-1h14a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V5zm5 1H4v8h3V6zm1 0v8h8V6H8z" />
             </svg>
        ),
        elements: [{
            type: 'bootstrap-row',
            label: 'Sidebar Layout',
            children: [
                { type: 'bootstrap-col', label: 'Sidebar', styles: { flexGrow: '0', flexBasis: '25%', minWidth: '200px', padding: '10px', minHeight: '60px', borderStyle: 'dashed', borderWidth: '1px', borderColor: '#cbd5e1' } },
                { type: 'bootstrap-col', label: 'Main', styles: { flexGrow: '1', padding: '10px', minHeight: '60px', borderStyle: 'dashed', borderWidth: '1px', borderColor: '#cbd5e1' } }
            ]
        }]
    },
    {
        label: 'Sidebar Right',
         icon: (
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 5a1 1 0 011-1h14a1 1 0 011 1v10a1 1 0 01-1 1H3a1 1 0 01-1-1V5zm10 1H4v8h8V6zm1 0v8h3V6h-3z" />
             </svg>
        ),
        elements: [{
            type: 'bootstrap-row',
            label: 'Sidebar Layout',
            children: [
                { type: 'bootstrap-col', label: 'Main', styles: { flexGrow: '1', padding: '10px', minHeight: '60px', borderStyle: 'dashed', borderWidth: '1px', borderColor: '#cbd5e1' } },
                { type: 'bootstrap-col', label: 'Sidebar', styles: { flexGrow: '0', flexBasis: '25%', minWidth: '200px', padding: '10px', minHeight: '60px', borderStyle: 'dashed', borderWidth: '1px', borderColor: '#cbd5e1' } }
            ]
        }]
    }
];

export const SCRIPT_SNIPPETS: SnippetItem[] = [
    {
        label: 'Interactive User Fetch',
        elements: [
            { 
                type: 'container', 
                label: 'Fetch Section', 
                styles: { display: 'flex', flexDirection: 'column', gap: '10px' },
                children: [
                    { type: 'select', label: 'Target User List', name: 'targetUserSelect', options: ['Click fetch to load...'] },
                    { 
                        type: 'button', 
                        label: 'Fetch Users Now', 
                        name: 'fetchTriggerBtn', 
                        onClickScript: `const select = document.querySelector('select[name="targetUserSelect"]'); if(select) { select.innerHTML = '<option>Loading...</option>'; fetch('https://jsonplaceholder.typicode.com/users').then(res => res.json()).then(data => { select.innerHTML = '<option value="">-- Choose User --</option>'; data.forEach(user => { const opt = document.createElement('option'); opt.value = user.id; opt.text = user.name; select.appendChild(opt); }); }); }`
                    }
                ]
            }
        ]
    }
];

export const STYLE_SNIPPETS: SnippetItem[] = [
  {
    label: 'Modern Profile Card',
    elements: [
      {
        type: 'container',
        label: 'Profile Card',
        styles: {
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: '320px',
          borderWidth: '1px',
          borderColor: '#f3f4f6'
        },
        children: [
          { type: 'image', label: 'Avatar', src: 'https://i.pravatar.cc/150?u=a042581f4e29026704d', styles: { width: '80px', height: '80px', borderRadius: '50%', marginBottom: '16px' }, name: 'avatar' },
          { type: 'typography', headingLevel: 'h3', textContent: 'Jane Cooper', styles: { fontWeight: 'bold', marginBottom: '4px' }, id: 'p-n', name: 'profile_name' },
          { type: 'typography', headingLevel: 'p', textContent: 'Senior Software Engineer', styles: { textColor: '#6b7280', fontSize: '14px', marginBottom: '16px' }, id: 'p-t', name: 'profile_title' },
          { type: 'button', label: 'Follow User', styles: { backgroundColor: '#3b82f6', textColor: '#ffffff', borderRadius: '8px', padding: '8px 16px', width: '100%' }, name: 'follow_btn' }
        ]
      }
    ]
  }
];

export const SNIPPETS: SnippetItem[] = [
    {
        label: 'Modern Login',
        elements: [
            { type: 'container', label: 'Login Box', id: 'login-box', name: 'loginBox', styles: { maxWidth: '400px', margin: '0 auto', padding: '2rem', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }, children: [
                { type: 'typography', headingLevel: 'h2', textContent: 'Sign In', styles: { textAlign: 'center', marginBottom: '1.5rem' }, id: 'l-h', name: 'l-h', label: 'H' },
                { type: 'text', label: 'Email', subType: 'email', name: 'email', id: 'email-input', required: true, placeholder: 'name@company.com' },
                { type: 'text', label: 'Password', subType: 'password', name: 'password', id: 'password-input', required: true, placeholder: '••••••••' },
                { type: 'button', label: 'Continue', id: 'submit-btn', name: 'submit', styles: { width: '100%', backgroundColor: '#000', textColor: '#fff', padding: '12px', borderRadius: '6px', marginTop: '1rem' } }
            ]}
        ]
    }
];
