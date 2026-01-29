# Feedback App — Deployment Guide

This guide walks you through deploying the Feedback App to **Vercel** with a serverless API and Vercel Postgres database.

## Project Structure

```
feedback/
├─ backend/
│  ├─ node_modules/
│  ├─ server.js          (local development only)
│  ├─ package.json
│  ├─ package-lock.json
│  ├─ feedback.db        (local SQLite, not deployed)
│  └─ test-post.js
│
├─ frontend/
│  ├─ index.html
│  ├─ cards.html
│  ├─ script.js
│  └─ styles.css
│
├─ api/                  (serverless functions for Vercel)
│  └─ feedback.js        (will be created)
│
└─ vercel.json           (routing config)
```

---

## Step 1: Prerequisites

- **GitHub account** with the repo pushed
- **Vercel account** (sign up at vercel.com)
- **Node.js 18+** installed locally

---

## Step 2: Prepare the Serverless API

Create `api/feedback.js` in the project root (same level as `frontend/` and `backend/`):

```bash
mkdir api
```

Then create `api/feedback.js`:

```javascript
import { Client } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, message } = req.body || {};
  if (!name || !message) {
    return res.status(400).json({ message: 'Name and message required' });
  }

  let client;
  try {
    // Vercel automatically provides DATABASE_URL when you attach Postgres
    client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    await client.sql`
      INSERT INTO feedback (name, message, created_at)
      VALUES (${name}, ${message}, NOW())
    `;

    await client.end();
    return res.json({ message: 'Feedback saved successfully!' });
  } catch (err) {
    console.error('DB error:', err);
    return res.status(500).json({ message: 'Failed to save feedback' });
  }
}
```

Update `package.json` (root level) to include the Postgres dependency:

```json
{
  "dependencies": {
    "@vercel/postgres": "^0.8.1"
  }
}
```

Or run:

```bash
npm install @vercel/postgres
```

---

## Step 3: Create Vercel Postgres Database

1. Open **Vercel Dashboard** → Projects → Your Project (or create new)
2. Go to **Storage** tab → **Create Database** → select **Postgres**
3. Name it (e.g., `feedback-db`)
4. Click **Create**
5. Vercel will inject `DATABASE_URL` env var automatically

---

## Step 4: Create the Feedback Table

1. In Vercel Postgres dashboard, click **SQL Editor**
2. Run this SQL:

```sql
CREATE TABLE IF NOT EXISTS feedback (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Step 5: Push to GitHub

```bash
cd C:\Users\Lokesh\Downloads\feedback

git init
git add .
git commit -m "Initial commit: feedback app with serverless API"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/feedback.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username and repo name.

---

## Step 6: Deploy to Vercel

### Option A: Via CLI (Fast)

```bash
npm install -g vercel
vercel login
vercel --prod
```

Vercel will prompt you to:
- Link to GitHub repo
- Set project name
- Confirm production deployment

### Option B: Via Dashboard

1. Go to **vercel.com/dashboard**
2. Click **Add New** → **Project**
3. Import your GitHub repo
4. Vercel auto-detects the config from `vercel.json`
5. Click **Deploy**

---

## Step 7: Verify Deployment

After deploy finishes:

1. Open your Vercel project URL (e.g., `https://feedback-xyz.vercel.app`)
2. You should see the **Home page** with "Welcome to the Feedback App"
3. Click **"Open Feedback Cards"**
4. Fill the form with a name and feedback
5. Click **Send**
6. Should see **"Feedback saved successfully!"** message

Check the **Vercel Postgres dashboard** to confirm data is in the table:

```sql
SELECT * FROM feedback ORDER BY id DESC;
```

---

## Step 8: Environment Variables (Already Set)

Vercel automatically provides `DATABASE_URL` when you attach Postgres. No manual env var setup needed.

If you need to add custom vars:
- Go to **Project Settings** → **Environment Variables**
- Add key/value pairs
- Redeploy (or it takes effect on next deploy)

---

## Troubleshooting

### "Cannot find module '@vercel/postgres'"

Make sure `package.json` (root) has:

```json
{
  "dependencies": {
    "@vercel/postgres": "^0.8.1"
  }
}
```

Then run `npm install` and push to GitHub. Vercel will install during build.

### "DATABASE_URL is undefined"

1. Confirm Postgres is **attached** to your project in Vercel dashboard
2. Redeploy after attaching

### Feedback not saving

Check **Vercel Logs** in the dashboard:
- Project → **Deployments** → Click latest → **Logs**
- Look for error messages from `api/feedback`

---

## Local Development

To test locally with Vercel Postgres:

1. Copy your `DATABASE_URL` from Vercel dashboard
2. Create `.env.local` in project root:

```
DATABASE_URL=postgresql://...
```

3. Install Vercel CLI dev tools:

```bash
npm install -g vercel
vercel env pull
```

4. Run `vercel dev` to test locally before pushing

---

## Migrate Data from SQLite (Optional)

If you want to move existing feedback from `backend/feedback.db` to Postgres:

```bash
# Export SQLite to CSV
cd backend
sqlite3 feedback.db -header -csv "SELECT name, message, createdAt as created_at FROM feedback;" > feedback.csv

# Then insert into Postgres via SQL Editor in Vercel dashboard:
COPY feedback (name, message, created_at) FROM stdin WITH (FORMAT csv, HEADER true);
<paste CSV content>
\.
```

Or write a Node script to read SQLite and insert into Postgres.

---

## Summary

✅ Frontend served statically from Vercel  
✅ Serverless API at `/api/feedback` (Vercel Functions)  
✅ Postgres DB attached (Vercel Postgres)  
✅ Feedback submissions saved to database  
✅ Fallback to localStorage if API is down (already in `script.js`)  

**You're ready to deploy!** 🚀
