/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Spacing
    'space-y-6', 'space-y-4', 'space-y-3', 'space-y-2',
    'gap-6', 'gap-4', 'gap-3', 'gap-2',
    'p-6', 'p-4', 'p-3', 'p-2',
    'px-6', 'px-4', 'px-3', 'py-4', 'py-3', 'py-2', 'py-1',
    'mb-4', 'mb-3', 'mb-2', 'mt-1',
    // Backgrounds
    'bg-white', 'bg-gray-50', 'bg-gray-100', 'bg-gray-400',
    'bg-primary', 'bg-success', 'bg-warning', 'bg-danger', 'bg-info',
    // Text colors
    'text-primary', 'text-success', 'text-warning', 'text-danger', 'text-info',
    'text-gray-900', 'text-gray-800', 'text-gray-700', 'text-gray-600', 'text-gray-500', 'text-gray-400',
    'text-white',
    // Border
    'border', 'border-2', 'border-primary', 'border-info', 'border-warning', 'border-success', 'border-gray-200',
    // Rounded
    'rounded-lg', 'rounded', 'rounded-t-lg', 'rounded-full',
    // Shadow
    'shadow', 'shadow-lg',
    // Typography
    'text-4xl', 'text-3xl', 'text-2xl', 'text-xl', 'text-lg', 'text-sm', 'text-xs',
    'font-bold', 'font-semibold', 'font-medium',
    // Sizing
    'w-10', 'w-8', 'w-5', 'w-4', 'w-3', 'w-16', 'h-10', 'h-8', 'h-5', 'h-4', 'h-3', 'h-16',
    // Other
    'max-h-96', 'overflow-y-auto', 'opacity-90', 'opacity-50', 'opacity-20',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#007bff',
        'primary-dark': '#0056b3',
        success: '#28a745',
        warning: '#ffc107',
        danger: '#dc3545',
        info: '#17a2b8',
      },
    },
  },
  plugins: [],
}

