@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
  --border-color: #e5e7eb;

  /* Performance: reduce repaints */
  --transition-fast: 150ms ease-out;
  --transition-normal: 250ms ease-out;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
    --border-color: #2e2e2e;
  }
}

*,
*::before,
*::after {
  border-color: var(--border-color);
  box-sizing: border-box;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* GPU acceleration for animated elements */
.gpu-accelerated {
  transform: translateZ(0);
  will-change: transform;
  backface-visibility: hidden;
}

/* Optimize images */
img {
  content-visibility: auto;
}

/* Reduce layout shifts */
.stable-layout {
  contain: layout style;
}

export const config = {
  appName: 'Infi Commerce POS Admin',
};