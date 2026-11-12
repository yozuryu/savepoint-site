// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
    site: 'https://yozuryu.github.io',
    base: '/savepoint-site',
    trailingSlash: 'always',
    integrations: [react(), mdx(), sitemap()],
});
