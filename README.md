# HOWDRY?!

[Open HOWDRY?!](https://wiggs88.github.io/RainWeather/)

A minimal rain radar and short-term precipitation timeline.

## Run locally

```bash
npm install
npm run dev
```

The dev server only listens on this machine. To try it on a phone on the same network, run `npm run dev -- --host`.

## Verify

```bash
npm run typecheck
npm test
npm run build
```

Pull requests run the same checks in CI; pushes to `main` deploy to GitHub Pages.
