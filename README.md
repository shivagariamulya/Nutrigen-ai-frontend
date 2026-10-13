# 🥗 NutriGen Frontend (React + Vite)

Interactive user interface for NutriGen AI-Powered Food Image Analysis and Personalized Nutrition Management System.

---

## 🚀 Render Deployment (Static Site)

This repository is ready to deploy directly on **Render** as a **Static Site**.

### Option 1: Blueprint Deployment (Automatic)
1. In the [Render Dashboard](https://dashboard.render.com/), click **New +** > **Blueprint**.
2. Connect this repository. Render will automatically read `render.yaml`.
3. Set the `VITE_API_BASE_URL` environment variable to your deployed backend Web Service URL.

### Option 2: Manual Static Site
1. In the [Render Dashboard](https://dashboard.render.com/), click **New +** > **Static Site**.
2. Connect this repository.
3. Configure the build and publish settings:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Under **Redirects / Rewrites**, add an SPA rewrite rule:
   - **Type**: `Rewrite`
   - **Source**: `/*`
   - **Destination**: `/index.html`
5. Under **Environment Variables**, add the environment variable listed below.

---

## 🔑 Required Render Environment Variables

| Variable Name | Description | Example Value |
|---|---|---|
| `VITE_API_BASE_URL` | Full URL of the backend Spring Boot Web Service | `https://nutrigen-backend.onrender.com` |

> **Note**: Vite bakes environment variables starting with `VITE_` into static JavaScript bundles at build time. Whenever you change `VITE_API_BASE_URL` in Render, trigger a **Manual Deploy > Clear build cache & deploy**.

---

## 💻 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Run local dev server (default port: 5173)
npm run dev

# 3. Build for production
npm run build
```
