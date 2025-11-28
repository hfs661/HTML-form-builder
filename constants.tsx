
import type { PaletteItem, SnippetItem } from './types';

export const STANDARD_ELEMENTS: PaletteItem[] = [
  {
    type: 'container',
    label: 'Container',
    icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
        </svg>
    )
  },
  {
    type: 'accordion',
    label: 'Accordion',
    icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
            <path d="M10 14a1 1 0 01-.707-.293l-3-3a1 1 0 011.414-1.414L10 11.586l2.293-2.293a1 1 0 011.414 1.414l-3 3A1 1 0 0110 14z" />
        </svg>
    )
  },
  {
      type: 'html-block',
      label: 'Custom HTML',
      icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
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
    type: 'image',
    label: 'Image',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
      type: 'divider',
      label: 'Divider',
      icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
      )
  },
  {
      type: 'script',
      label: 'JavaScript',
      icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
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
    type: 'number',
    label: 'Number Input',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v2h2a1 1 0 110 2h-2v2a1 1 0 11-2 0V8H7a1 1 0 110-2h2V4a1 1 0 011-1zM5 13a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    type: 'textarea',
    label: 'Text Area',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" />
      </svg>
    ),
  },
  {
    type: 'select',
    label: 'Select Dropdown',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 3a1 1 0 01.707.293l3 3a1 1 0 01-1.414 1.414L10 5.414 7.707 7.707a1 1 0 01-1.414-1.414l3-3A1 1 0 0110 3zm-3.707 9.293a1 1 0 011.414 0L10 14.586l2.293-2.293a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    type: 'checkbox',
    label: 'Checkbox',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    type: 'radio',
    label: 'Radio Button',
    icon: (
       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 10a2 2 0 114 0 2 2 0 01-4 0z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    type: 'date',
    label: 'Date Input',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm10 5H4v8h12V7z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    type: 'range',
    label: 'Range Slider',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    type: 'file',
    label: 'File Input',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3 17a2 2 0 012-2h10a2 2 0 110 4H5a2 2 0 01-2-2zm3.293-7.707a1 1 0 011.414 0L10 11.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v6.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 10.586V4a1 1 0 011-1z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    type: 'color',
    label: 'Color Picker',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm12 14H4V4h12v12zM6 6a2 2 0 100 4 2 2 0 000-4zm4 0a2 2 0 100 4 2 2 0 000-4zm4 0a2 2 0 100 4 2 2 0 000-4zm-8 6a2 2 0 100 4 2 2 0 000-4zm4 0a2 2 0 100 4 2 2 0 000-4zm4 0a2 2 0 100 4 2 2 0 000-4z" clipRule="evenodd" />
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
    type: 'reset-button',
    label: 'Reset Button',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
      </svg>
    ),
  },
  {
    type: 'table',
    label: 'Table',
    icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 4a3 3 0 00-3 3v6a3 3 0 003 3h10a3 3 0 003-3V7a3 3 0 00-3-3H5zm-1 9v-1h5v2H5a1 1 0 01-1-1zm7 1h4a1 1 0 001-1v-1h-5v2zm0-4h5V8h-5v2zM9 8H4v2h5V8z" clipRule="evenodd" />
        </svg>
    )
  },
  {
      type: 'iframe',
      label: 'Iframe',
      icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
      )
  },
  {
      type: 'navbar',
      label: 'Navigation Bar',
      icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
      )
  },
  {
      type: 'news-card',
      label: 'News Card',
      icon: (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3 2a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 4a1 1 0 100 2h4a1 1 0 100-2H6z" />
          </svg>
      )
  }
];

export const SNIPPETS: SnippetItem[] = [
    {
        label: 'Login Form',
        elements: [
            { type: 'text', label: 'Email Address', subType: 'email', name: 'email', required: true, placeholder: 'Enter your email' },
            { type: 'text', label: 'Password', subType: 'password', name: 'password', required: true, placeholder: 'Enter your password' },
            { type: 'button', label: 'Sign In', styles: { color: 'primary' } }
        ]
    },
    {
        label: 'User Profile',
        elements: [
             { type: 'text', label: 'Username', name: 'username', required: true },
             { type: 'file', label: 'Profile Photo', name: 'profilePhoto', accept: 'image/*' },
             { type: 'textarea', label: 'Bio', name: 'bio', placeholder: 'Tell us about yourself' },
             { type: 'text', label: 'Website', subType: 'url', name: 'website', placeholder: 'https://' }
        ]
    },
    {
        label: 'Auto-Format Phone',
        elements: [
            { type: 'text', label: 'Phone Number', name: 'phoneNumber', placeholder: '(555) 555-5555', required: true, subType: 'tel' },
            { type: 'script', label: 'Format Script', scriptContent: `
const phoneInput = document.querySelector('input[name="phoneNumber"]');
if (phoneInput) {
  phoneInput.addEventListener('input', function (e) {
    var x = e.target.value.replace(/\\D/g, '').match(/(\\d{0,3})(\\d{0,3})(\\d{0,4})/);
    e.target.value = !x[2] ? x[1] : '(' + x[1] + ') ' + x[2] + (x[3] ? '-' + x[3] : '');
  });
}
` }
        ]
    },
    {
        label: 'Character Counter',
        elements: [
            { type: 'textarea', label: 'Message', name: 'messageWithCount', placeholder: 'Type your message...', required: true },
            { type: 'text', label: 'Character Count', name: 'charCount', placeholder: '0', disabled: true, styles: { size: 'small' } },
            { type: 'script', label: 'Count Script', scriptContent: `
const msgInput = document.querySelector('textarea[name="messageWithCount"]');
const countOutput = document.querySelector('input[name="charCount"]');
if (msgInput && countOutput) {
  msgInput.addEventListener('input', function(e) {
    countOutput.value = e.target.value.length + ' characters';
  });
}
` }
        ]
    },
    {
        label: 'Password Match',
        elements: [
            { type: 'text', label: 'Password', name: 'pass1', subType: 'password', required: true },
            { type: 'text', label: 'Confirm Password', name: 'pass2', subType: 'password', required: true },
            { type: 'script', label: 'Match Validator', scriptContent: `
const p1 = document.querySelector('input[name="pass1"]');
const p2 = document.querySelector('input[name="pass2"]');
if(p1 && p2) {
  const validate = () => {
     if(p1.value !== p2.value) {
        p2.setCustomValidity("Passwords do not match");
        p2.style.borderColor = "red";
     } else {
        p2.setCustomValidity("");
        p2.style.borderColor = "";
     }
  };
  p1.addEventListener('input', validate);
  p2.addEventListener('input', validate);
}
` }
        ]
    },
    {
        label: 'Shipping Address',
        elements: [
            { type: 'text', label: 'Street Address', name: 'address1', required: true },
            { type: 'text', label: 'City', name: 'city', required: true, styles: { size: 'medium' } },
            { type: 'text', label: 'State', name: 'state', required: true, styles: { size: 'medium' } },
            { type: 'text', label: 'Zip Code', name: 'zip', required: true, styles: { size: 'small' } },
            { type: 'select', label: 'Country', name: 'country', options: ['USA', 'Canada', 'UK', 'Australia'], required: true }
        ]
    },
    {
        label: 'Survey',
        elements: [
             { type: 'radio', label: 'How satisfied are you?', name: 'satisfaction', options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied'] },
             { type: 'textarea', label: 'How can we improve?', name: 'feedback' },
             { type: 'checkbox', label: 'I agree to be contacted for follow-up', name: 'contactConsent' },
             { type: 'button', label: 'Submit Survey', styles: { color: 'secondary' } }
        ]
    },
    {
        label: 'Contact Us',
        elements: [
             { type: 'text', label: 'Name', name: 'name', required: true, placeholder: 'Your Name' },
             { type: 'text', label: 'Email', subType: 'email', name: 'email', required: true, placeholder: 'Your Email' },
             { type: 'textarea', label: 'Message', name: 'message', required: true, placeholder: 'How can we help?' },
             { type: 'button', label: 'Send Message', styles: { color: 'secondary' } }
        ]
    },
    {
        label: 'Address Block',
        elements: [
            { type: 'text', label: 'Street Address', name: 'address1', required: true },
            { type: 'text', label: 'Apartment, suite, etc.', name: 'address2' },
            { type: 'text', label: 'City', name: 'city', required: true, styles: { size: 'medium' } },
            { type: 'text', label: 'State/Province', name: 'state', required: true, styles: { size: 'medium' } },
            { type: 'text', label: 'Zip/Postal Code', name: 'zip', required: true, styles: { size: 'small' } }
        ]
    },
    {
        label: 'Feedback Form',
        elements: [
            { type: 'range', label: 'Rate your experience (1-10)', name: 'rating', min: 1, max: 10, step: 1 },
            { type: 'textarea', label: 'Comments', name: 'comments', placeholder: 'Tell us what you think...' },
            { type: 'button', label: 'Submit Feedback', styles: { color: 'primary' } }
        ]
    },
    {
        label: 'Event Registration',
        elements: [
            { type: 'text', label: 'Full Name', name: 'fullName', required: true },
            { type: 'text', label: 'Email', subType: 'email', name: 'email', required: true },
            { type: 'select', label: 'Ticket Type', name: 'ticketType', options: ['General Admission', 'VIP', 'Student'], required: true },
            { type: 'button', label: 'Register Now', styles: { color: 'primary' } }
        ]
    },
    {
        label: 'Payment Details',
        elements: [
            { type: 'text', label: 'Card Number', name: 'cardNumber', placeholder: '0000 0000 0000 0000', required: true, styles: { size: 'medium' } },
            { type: 'text', label: 'Expiry Date', name: 'expiry', placeholder: 'MM/YY', required: true, styles: { size: 'small' } },
            { type: 'text', label: 'CVC', name: 'cvc', placeholder: '123', required: true, maxLength: 4, styles: { size: 'small' } },
            { type: 'button', label: 'Pay Securely', styles: { color: 'primary', backgroundColor: '#28a745', borderColor: '#28a745', textColor: '#ffffff' } }
        ]
    },
    {
        label: 'Newsletter Signup',
        elements: [
             { type: 'text', label: 'Subscribe to our newsletter', subType: 'email', name: 'newsletterEmail', placeholder: 'you@example.com', required: true },
             { type: 'button', label: 'Subscribe', styles: { color: 'secondary' } }
        ]
    }
];