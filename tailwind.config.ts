import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    darkMode: ['class', '[data-theme="dark"]'],
    theme: {
        extend: {
            colors: {
                background: "hsl(var(--background) / <alpha-value>)",
                foreground: "hsl(var(--foreground) / <alpha-value>)",
                surface: "hsl(var(--surface) / <alpha-value>)",
                muted: "hsl(var(--muted) / <alpha-value>)",
                border: "hsl(var(--border) / <alpha-value>)",
                primary: {
                    DEFAULT: "hsl(var(--primary) / <alpha-value>)",
                    foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
                },
                "primary-light": "hsl(var(--primary-light) / <alpha-value>)",
                accent: "hsl(var(--accent) / <alpha-value>)",
            },
        },
    },
    plugins: [],
};
export default config;
