# ActionBrief Deploy

## 1. Build Locally

```bash
cd apps/summary-report-agent-v1
npm install
npm run build
```

Build output is generated in `dist/`.

## 2. Preview Before Publish

```bash
npm run preview
```

Default preview URL:

- `http://127.0.0.1:4285`

## 3. Vercel Setup

Create a new Vercel project from this repository and use these values:

- Root Directory: `apps/summary-report-agent-v1`
- Install Command: `npm install`
- Build Command: `npm run build`
- Output Directory: `dist`

This app already uses hash routes such as `#/privacy`, `#/terms`, and `#/contact`, so no extra SPA rewrite rule is required for the current public pages.

`vercel.json` is included in this app directory to keep the build/output behavior aligned with the Vite setup.

## 4. Environment

No required public environment variables are needed for the current version.

## 5. Publish Checklist

1. Run `npm run build`
2. Confirm the homepage renders correctly
3. Open `#/privacy`, `#/terms`, and `#/contact`
4. Verify the Early Access form still submits locally
5. Deploy to Vercel
