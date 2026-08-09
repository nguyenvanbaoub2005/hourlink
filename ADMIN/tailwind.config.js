/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary)',
          hover: 'var(--primary-hover)',
          light: 'var(--primary-light)',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          hover: 'var(--danger-hover)',
        },
        warning: 'var(--warning)',
        success: 'var(--success)',
        info: 'var(--info)',
        bg: 'var(--bg)',
        surface: {
          DEFAULT: 'var(--surface)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
          hover: 'var(--surface-hover)',
        },
        border: 'var(--border)',
        text: {
          DEFAULT: 'var(--text)',
          muted: 'var(--text-muted)',
          dim: 'var(--text-dim)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      height: {
        header: 'var(--header-height)',
      },
      width: {
        sidebar: 'var(--sidebar-width)',
      },
    },
  },
  plugins: [],
}
