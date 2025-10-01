/** @type {import('tailwindcss').Config} */

import typography from '@tailwindcss/typography';

export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#f6f6f7',
        backgroundDark: '#1e293b',
        surface: '#f3f4f6',
        surfaceDark: '#334155',
        primary: '#10b981',
        primaryDark: '#34d399',
        accent: '#f43f5e',
        accentDark: '#fb7185',
        text: '#22292f',
        textDark: '#f3f4f6',
      },
    },
  },
  plugins: [typography],
};
