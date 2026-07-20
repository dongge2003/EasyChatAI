/** @type {import('tailwindcss').Config} */
// eslint-disable-next-line no-undef
module.exports = {
  content: ["./**/*.tsx"],
  theme: {
    extend: {
      colors: {
        'page-bg': '#F8F9FA',
        'surface': '#FFFFFF',
        'surface-subtle': '#F0F1F3',
        'accent': '#2563EB',
        'accent-light': '#EFF3FF',
        'primary': '#111827',
        'secondary': '#6B7280',
        'tertiary': '#9CA3AF',
        'subtle': '#E5E7EB',
      },
    },
  },
  plugins: [],
}

