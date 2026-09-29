# NewsGame

Short HTML5 games for news stories, embedded in the article with one code snippet.

Site: https://goshva.github.io/newsgame/ (published from the `gh-pages` branch, source in `site/`).

| File | What it is |
|---|---|
| [business-concept-and-requirements.md](business-concept-and-requirements.md) | Business concept and platform requirements |
| [investor-concept-seed.md](investor-concept-seed.md) | Pre-seed investment concept and first steps per region |
| [dev-task-regional-news-games.md](dev-task-regional-news-games.md) | Developer task (RU): five games for five regional news stories; web version: https://goshva.github.io/newsgame/dev-task.html |
| [teasers.md](teasers.md) | Teaser copy for publishers, per region and language |
| [commercial-offers/](commercial-offers/) | Commercial offers in EN, RU, HI, ZH, DE |
| [site/](site/) | Landing page with partnership application and feedback forms (Formspree) |

## Demo games

All games and integration: https://goshva.github.io/newsgame/games/

| Region | Game | Play | Embedded in a publisher page |
|---|---|---|---|
| USA · EN | Grow a newborn planet | https://goshva.github.io/newsgame/games/us-elias-2-24b/ | https://goshva.github.io/newsgame/demo/us/ |
| CIS · RU | ИИ-гонка: верю / не верю | https://goshva.github.io/newsgame/games/cis-gref-ai-race/ | https://goshva.github.io/newsgame/demo/cis/ |
| India · EN | Chase 296 | https://goshva.github.io/newsgame/games/in-ind-wi-odi1/ | https://goshva.github.io/newsgame/demo/in/ |
| China · ZH/EN | 猜数字：全国科普月 | https://goshva.github.io/newsgame/games/cn-science-month/ | https://goshva.github.io/newsgame/demo/cn/ |
| Europe · EN | Young scientist memory | https://goshva.github.io/newsgame/games/eu-eucys-2026/ | https://goshva.github.io/newsgame/demo/eu/ |

Widget loader: https://goshva.github.io/newsgame/widget/v1.js · catalog: https://goshva.github.io/newsgame/catalog.json · game runtime: https://goshva.github.io/newsgame/games/shared/runtime.js

## Local preview

```
npx serve --cors site
```

## Publish the site

```
git subtree push --prefix site origin gh-pages
```
