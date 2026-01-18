import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                adhoc: {
                    violet: '#7C6CD8',
                    lavender: '#BCAFEF',
                    coral: '#FF7348',
                    mustard: '#FEA912',
                    white: '#FFFFFF',
                },
            },
            fontFamily: {
                sans: ['var(--font-apercu)', 'system-ui', 'sans-serif'],
                display: ['var(--font-new-kansas)', 'Georgia', 'serif'],
            },
            animation: {
                "in": "in 0.5s ease-out",
                "fade-in": "fade-in 0.5s ease-out",
                "slide-in-from-bottom-4": "slide-in-from-bottom-4 0.5s ease-out",
                "slide-in-from-bottom-6": "slide-in-from-bottom-6 0.5s ease-out",
            },
            keyframes: {
                "in": {
                    "0%": { opacity: "0", transform: "scale(0.95)" },
                    "100%": { opacity: "1", transform: "scale(1)" },
                },
                "fade-in": {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                "slide-in-from-bottom-4": {
                    "0%": { opacity: "0", transform: "translateY(1rem)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                "slide-in-from-bottom-6": {
                    "0%": { opacity: "0", transform: "translateY(1.5rem)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
            },
        },
    },
    plugins: [],
};
export default config;
