# GitHub Pages implementation plan

1. Add a Pages-specific Vite build script using the `/RainWeather/` base path.
2. Change the PWA icon URL from root-absolute to manifest-relative.
3. Add a GitHub Actions workflow that verifies, builds, uploads, and deploys `dist`.
4. Run the Pages build and inspect its generated asset and service-worker paths.
5. Create the public `wiggs88/RainWeather` repository and push `main`.
6. Configure Pages for Actions, wait for the deployment, and verify the published site.
