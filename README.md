# 3620 Sweetwater Mesa Rd, Malibu — site

Static site, app at the repo root. If this becomes a Vite app in `site/`, replace
`vercel.json` with `Documentation/_templates/vercel.root.json` (install/build/output pointing at `site`).

`node preflight_deploy.mjs .` must exit 0 before `bash push.sh`.
