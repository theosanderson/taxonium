// tailwind.config.js
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  plugins: [
    require('@tailwindcss/forms')
  ],
  theme: {
    customForms: theme => ({
      default: {
        input: {
       
          borderColor: theme('colors.gray.200'),
        
        },
    
      },
    })
  },
};
