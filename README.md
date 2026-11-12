# Savepoint site

The website for [Savepoint](https://github.com/yozuryu/savepoint): the landing page, the live demo (the author's own hub in a frame) and the interactive setup docs.

Live at **https://yozuryu.github.io/savepoint-site/**.

[Astro](https://astro.build) with React islands. Every page is static HTML; React only runs in the parts that move or take input. Deployed by GitHub Actions (`.github/workflows/deploy.yml`) on every push to `main`.

```bash
npm install
npm run dev       # http://localhost:4321/savepoint-site/
npm run build     # type check, then the static site in dist/
npm run preview   # serve dist/
```

- `src/pages/index.astro`: landing page; `src/pages/docs/`: the setup guide (`index.astro`) and one MDX page per guide (listed in `src/lib/guides.ts`)
- `src/layouts/Base.astro`: head and SEO tags (title, description, canonical, Open Graph, JSON-LD), nav, footer; `Docs.astro`: the docs rail and pager
- `src/components/`: React islands (hero feed, feature showcases, live demo, save point; `docs/` for the setup helpers)
- `src/lib/`: the live hub's data (`hub.ts`), the Analytics port (`analytics.ts`), fallbacks shown before live data arrives, shared island state (`stores.ts`)
- `src/assets/shots/`: screenshots, resized into responsive images at build; re-take them with `npm run posters` in the template (`.posters/` holds the raw shots)
- `public/assets/`: icons, the art mosaic and the share image, served as they are
