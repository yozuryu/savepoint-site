# Savepoint site

The website for [Savepoint](https://github.com/yozuryu/savepoint-template): the landing page, the live demo (the author's own hub in a frame) and the interactive setup docs.

Live at **https://yozuryu.github.io/savepoint-site/**.

Plain HTML, CSS and JavaScript, no build step. Published by GitHub Pages from `main` (root).

- `index.html`: landing page and live demo
- `docs/index.html`: setup guide
- `assets/site.css`, `assets/site.js`: shared styles and behaviour
- `assets/shots/`: screenshots; re-take them with `npm run posters` in the template (`.posters/` holds the raw shots)

Run it locally with any static server, e.g. `python3 -m http.server`.
