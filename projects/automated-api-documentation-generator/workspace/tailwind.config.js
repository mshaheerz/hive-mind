/** @type {import('tailwindcss').Config} */
module.exports = {
  // Tailwind scans all files under src and pages for class names
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {}
  },
  plugins: [
    // Aspect ratio plugin is optional but added for future UI components
    // Requires version ^0.4.2 as per project policy
    require('@tailwindcss/aspect-ratio')
  ]
};
