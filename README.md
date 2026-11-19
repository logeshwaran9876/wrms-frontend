# WRMS - Windows Restriction Management System (Frontend)

Modern React + TypeScript single-page application for the Windows Restriction Management System (WRMS) administrative console and employee portal.

## 🚀 Quick Start (Local Development)

```bash
# Install dependencies
npm install

# Start local development server (defaults to port 5173)
npm run dev

# Run TypeScript checks
npm run typecheck

# Build for production
npm run build
```

---

## ⚡ Deployment on Vercel

1. Push this repository to your GitHub account under your profile (`logeshvaran.9876@gmail.com`).
2. Log in to [Vercel](https://vercel.com).
3. Click **"Add New..."** -> **"Project"**.
4. Import your `wrms-frontend` repository from GitHub.
5. In **Build and Output Settings**:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (leave default)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
6. In **Environment Variables**:
   - `VITE_API_URL`: `https://wrms-backend-2m6u.onrender.com`
7. Click **Deploy**!
8. `vercel.json` already contains the SPA rewrite configuration to prevent 404 errors on browser page reloads.
