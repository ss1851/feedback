# Vercel Deployment Checklist

Follow these steps in order to deploy your feedback app to Vercel with a serverless API and Postgres database.

## ✅ Pre-Deployment (Local Setup)

- [ ] Verify project structure:
  ```
  feedback/
  ├─ api/feedback.js          ← NEW serverless function
  ├─ frontend/                ← static files
  ├─ backend/                 ← local dev only (won't deploy)
  ├─ package.json             ← NEW with @vercel/postgres
  ├─ vercel.json              ← UPDATED for serverless
  └─ README.md                ← deployment guide
  ```

- [ ] Verify `api/feedback.js` exists and has the serverless code
- [ ] Verify root `package.json` has `@vercel/postgres` dependency
- [ ] Verify `vercel.json` routes to `/api/feedback.js` (not backend/server.js)

## ✅ Step 1: GitHub Setup

```bash
cd C:\Users\Lokesh\Downloads\feedback

git init
git add .
git commit -m "Initial commit: feedback app with serverless API"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/feedback.git
git push -u origin main
```

**Replace:**
- `YOUR_USERNAME` with your GitHub username
- `feedback` with your repo name

**Verify:** Repo appears on GitHub with all files

## ✅ Step 2: Create Vercel Postgres Database

1. Go to **https://vercel.com/dashboard**
2. Select or create your project (or do it in next step)
3. Click **Storage** → **Create Database** → **Postgres**
4. Name it: `feedback-db`
5. Click **Create** and wait ~2 minutes
6. **Copy the DATABASE_URL** (you'll need it in Step 5)

## ✅ Step 3: Create Database Table

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

**Verify:** Table appears in the database

## ✅ Step 4: Deploy to Vercel

### Option A: Via Vercel CLI (Recommended)

```bash
npm install -g vercel
vercel login
cd C:\Users\Lokesh\Downloads\feedback
vercel --prod
```

When prompted:
- **Link to existing project?** → No (create new)
- **Project name?** → feedback
- **Root directory?** → ./ (current)
- **Auto-detect build command?** → Yes

### Option B: Via Vercel Dashboard

1. Go to **https://vercel.com/dashboard**
2. Click **Add New** → **Project**
3. **Import Git Repository** → select your `feedback` repo
4. Click **Import**
5. Project settings auto-detected from `vercel.json`
6. Click **Deploy**

**Verify:** Deployment completes with a live URL (e.g., `https://feedback-xyz.vercel.app`)

## ✅ Step 5: Link Postgres to Vercel Project

1. In your **Vercel project** → **Storage** tab
2. Click **Connect Database** (or if you created it, it's already connected)
3. Vercel automatically adds `DATABASE_URL` environment variable

**Verify:** Environment variable shows in **Project Settings** → **Environment Variables**

## ✅ Step 6: Test the Deployment

### Test Frontend:
1. Open your Vercel URL: `https://your-project-name.vercel.app`
2. Should see **"Welcome to the Feedback App"**
3. Click **"Open Feedback Cards"**

### Test API:
1. Fill form with:
   - Name: `Test User`
   - Feedback: `This is a test!`
2. Click **Send**
3. Should see: **"Feedback saved successfully!"**

### Verify Database:
1. Go to Vercel Postgres dashboard → **SQL Editor**
2. Run:
```sql
SELECT * FROM feedback ORDER BY id DESC;
```
3. Should see your test feedback entry

## ✅ Step 7: Troubleshoot (If Needed)

### "Cannot find module '@vercel/postgres'"

- Confirm root `package.json` has the dependency
- Force redeploy: `vercel --prod` or redeploy in Vercel dashboard

### "DATABASE_URL is undefined"

- Postgres must be **attached** to the project
- Check Vercel project **Storage** tab
- Redeploy if just attached

### "Feedback not saving"

- Check Vercel project **Deployments** → latest → **Logs**
- Look for error messages from the API
- Verify SQL table exists in Postgres

### "Page is blank or 404"

- Verify `vercel.json` routes are correct
- Redeploy after fixing
- Check build logs for errors

## ✅ Step 8: Cleanup (Optional)

You can delete the local `backend/` folder since it's not deployed:

```bash
rm -r C:\Users\Lokesh\Downloads\feedback\backend
git add .
git commit -m "Remove local backend (using serverless API)"
git push
vercel --prod
```

---

## Summary

🎉 **Your app is live!**

- **Frontend:** Served statically from Vercel
- **API:** Serverless function at `/api/feedback`
- **Database:** Vercel Postgres with auto-scaling
- **Feedback:** Persisted to database on form submit

**Next steps:**
- Share your Vercel URL with others
- Monitor logs and database growth
- Add more features or customize styling as needed

---

**Questions?** Check [README.md](README.md) for detailed explanations.
