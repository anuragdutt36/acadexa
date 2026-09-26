# Deployment Guide

**Acadexa**

---

## Prerequisites

- Node.js >= 18.x
- MongoDB (local or Atlas)
- A domain name (for production)
- Google OAuth Client ID (for Google Sign-In)

---

## Option 1: Deploy to Render + MongoDB Atlas (Recommended for MCA Demo)

### Step 1 — Set up MongoDB Atlas

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and create a free account.
2. Create a new **Cluster** (M0 Free Tier is sufficient).
3. Create a **Database User** with username and password.
4. Add your IP (or `0.0.0.0/0` to allow all) to **Network Access**.
5. Copy the connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/knit-feedback
   ```

### Step 2 — Deploy Backend to Render

1. Push your code to GitHub.
2. Go to [https://render.com](https://render.com) → **New Web Service**.
3. Connect your GitHub repository.
4. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. Add environment variables:
   ```
   MONGO_URI=mongodb+srv://...
   ACCESS_TOKEN_SECRET=your_long_secret
   REFRESH_TOKEN_SECRET=your_other_long_secret
   GOOGLE_CLIENT_ID=your_google_client_id
   CORS_ORIGIN=https://your-frontend-url.vercel.app
   NODE_ENV=production
   PORT=5001
   ```
6. Click **Deploy**. Render will assign a URL like `https://knit-feedback-api.onrender.com`.

### Step 3 — Deploy Frontend to Vercel

1. Go to [https://vercel.com](https://vercel.com) → **New Project**.
2. Import your GitHub repository.
3. Configure:
   - **Root Directory:** `.` (the project root — where `index.html` and `vite.config.ts` are)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add environment variable:
   ```
   VITE_API_URL=https://knit-feedback-api.onrender.com/api
   ```
5. Click **Deploy**.

---

## Option 2: Deploy to a VPS (DigitalOcean / AWS EC2)

### Backend

```bash
# On the server
git clone https://github.com/your-username/knit-feedback-system.git
cd knit-feedback-system/backend
npm install
npm run build

# Create .env file with production values
cp .env.example .env
nano .env

# Start with PM2
npm install -g pm2
pm2 start dist/server.js --name knit-backend
pm2 startup
pm2 save
```

### Frontend

```bash
cd knit-feedback-system
npm install
npm run build
# Serve the dist/ folder with Nginx
```

**Nginx config example:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/knit-feedback/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Option 3: Local Production Build (for Demo Presentation)

```bash
# Build frontend
npm run build
# The output is in dist/ — serve it with any static server

# Build backend
cd backend
npm run build
# Start the compiled backend
npm start
```

---

## Seeding the Database

After deployment, you can seed the database with realistic KNIT Sultanpur sample data:

```bash
cd backend
npm run seed
```

> ⚠️ **Warning:** The seed command clears all existing data (except the admin user) before seeding.

---

## Environment Variables Reference

See [`.env.example`](.env.example) for all required variables.

---

## Health Check

Once deployed, verify the backend is running:

```
GET https://your-backend-url.com/health
```

Expected response:
```json
{ "status": "OK", "timestamp": "2026-08-07T..." }
```
