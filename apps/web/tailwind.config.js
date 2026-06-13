/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: "#050A15",
          secondary: "#0A101E",
          tertiary: "#121A2F",
        },
        surface: "rgba(26, 34, 53, 0.6)",
        accent: {
          primary: "#00E5FF", // Neon Teal
          secondary: "#8B5CF6", // Purplish blue
          emergency: "#FF3366", // Neon Pink/Red
          warning: "#F59E0B",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#94A3B8",
          muted: "#64748B"
        },
        border: "rgba(255, 255, 255, 0.08)",
        success: "#10B981"
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'mesh-pattern': "url('data:image/svg+xml,%3Csvg width=\"20\" height=\"20\" viewBox=\"0 0 20 20\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"%231A2235\" fill-opacity=\"0.4\" fill-rule=\"evenodd\"%3E%3Ccircle cx=\"3\" cy=\"3\" r=\"3\"/%3E%3Cg%3E%3C/svg%3E')",
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(0, 229, 255, 0.4)',
        'glow-emergency': '0 0 25px rgba(255, 51, 102, 0.6)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      },
      animation: {
        'blob': 'blob 7s infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" }
        },
        "pulse-glow": {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: .5 }
        }
      }
    },
  },
  plugins: [],
}
