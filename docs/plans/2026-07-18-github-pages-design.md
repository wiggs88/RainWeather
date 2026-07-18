# GitHub Pages deployment design

## Goal

Publish RainWeather as a public GitHub repository and a phone-accessible GitHub Pages site that redeploys automatically after changes land on `main`.

## Decision

Use a GitHub Actions Pages workflow. The workflow will install locked dependencies, type-check and test the application, build the Vite output with the `/RainWeather/` repository base path, upload `dist`, and deploy it through the protected `github-pages` environment.

## Alternatives considered

- Commit `dist` to a `gh-pages` branch: works, but mixes generated output into Git history and requires separate branch management.
- Manually upload each build: simple once, but every update becomes a manual deployment.
- GitHub Actions Pages deployment: reproducible, visible in Actions, and automatically updates from `main`.

## Application changes

- Add a `build:pages` script that applies the repository subpath only to the Pages build, preserving the current root-based local development URL.
- Make the PWA manifest icon relative so it resolves inside the Pages subpath.
- Add `.github/workflows/deploy-pages.yml` with Pages permissions, concurrency control, verification, artifact upload, and deployment.

## Verification

- Run type checking and all tests locally.
- Build the Pages variant and confirm generated HTML, manifest, service worker, and assets use the `/RainWeather/` scope correctly.
- Push the public repository, enable Pages through the API, wait for the Actions deployment, and load the published URL.
