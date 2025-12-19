
import React from 'react';
import type { PaletteItem, SnippetItem } from './types';

export const STANDARD_ELEMENTS: PaletteItem[] = [
  {
    type: 'container',
    label: 'Container / Section',
    icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
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
    type: 'dataLogic',
    label: 'Logic Controller',
    icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm12 4a1 1 0 10-2 0 1 1 0 002 0zM7 8H5v2h2V8zm2 0h2v2H9V8z" clipRule="evenodd" />
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
    type: 'typography',
    label: 'Text / Heading',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 5a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zm0 6a1 1 0 011-1h6a1 1 0 110 2H5a1 1 0 01-1-1zm1 5a1 1 0 100 2h6a1 1 0 100-2H5z" clipRule="evenodd" />
      </svg>
    ),
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
    type: 'button',
    label: 'Action Button',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" />
      </svg>
    ),
  },
  {
    type: 'reset-button',
    label: 'Reset / Clear Button',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
      </svg>
    ),
  }
];

export const LAYOUT_SNIPPETS: SnippetItem[] = [
    {
        label: '2-Col Grid (50/50)',
        elements: [{
            type: 'container',
            label: 'Row',
            styles: { display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1rem' },
            children: [
                { type: 'container', label: 'Column 1', styles: { gridColumn: 'span 6', borderStyle: 'dashed', borderWidth: '1px', borderColor: '#cbd5e1', minHeight: '100px' }, id: 'col1', name: 'col1' },
                { type: 'container', label: 'Column 2', styles: { gridColumn: 'span 6', borderStyle: 'dashed', borderWidth: '1px', borderColor: '#cbd5e1', minHeight: '100px' }, id: 'col2', name: 'col2' }
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
