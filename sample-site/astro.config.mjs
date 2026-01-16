import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  outDir: './dist',
  build: {
    format: 'file', // Generate .html files instead of directories
  },
});
