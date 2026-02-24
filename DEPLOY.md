# Deploy Agent Suite — one step at a time

Use these steps in order. Each step is one concrete action.

**Deploy to production (after initial setup):**
```bash
git push origin main
```
If Vercel is connected to your repo, it will auto-deploy. Or run:
```bash
vercel --prod
```

---

## Step 1: Put the app in Git and push to GitHub

1. In the project root (`agent-suite/`), run:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
2. Create a new **empty** repository on GitHub (no README, no .gitignore).
3. Add the remote and push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git branch -M main
   git push -u origin main
   ```
   Replace `YOUR_USERNAME` and `YOUR_REPO` with your repo name.

You need this so your hosting provider (e.g. Vercel) can clone and build the app.

---

## Step 2: Create a PostgreSQL database

The app needs a Postgres DB for Prisma (orgs, users, agents, messages, OKRs, tasks, reports).

1. Sign up at one of:
   - **[Neon](https://neon.tech)** (free tier, good for Next.js), or  
   - **[Supabase](https://supabase.com)** (free tier, or use their Postgres only), or  
   - **[Railway](https://railway.app)** / **[Render](https://render.com)** Postgres.
2. Create a new project and a **PostgreSQL** database.
3. Copy the connection string. It looks like:
   ```text
   postgresql://USER:PASSWORD@HOST/database?sslmode=require
   ```
   Save it somewhere safe — you’ll use it as `DATABASE_URL` in the next steps.

---

## Step 3: Set up Clerk (auth) for production

1. Go to [clerk.com](https://clerk.com) and sign in (or create an account).
2. Create a new **Application** (or use an existing one).
3. In the Clerk dashboard, open **API Keys** and copy:
   - **Publishable key** → you’ll use as `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - **Secret key** → `CLERK_SECRET_KEY`
4. Under **Paths** (or **URLs**), set:
   - **Sign-in URL**: `/sign-in`
   - **Sign-up URL**: `/sign-up`
   - **After sign-in / sign-up**: `/onboarding` (or `/` if you prefer)
5. Later, when you have a live app URL (e.g. `https://yourapp.vercel.app`), add it to Clerk’s **Allowed redirect URLs** / **Domains** so sign-in works in production.

---

## Step 4: Deploy the Next.js app to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub is easiest).
2. Click **Add New…** → **Project** and **import** your GitHub repo.
3. Leave **Framework Preset** as Next.js and **Root Directory** as `.` (or `agent-suite` if the repo root is the parent folder).
4. Before deploying, add **Environment Variables** in the Vercel project settings:

   | Name | Value | Notes |
   |------|--------|--------|
   | `DATABASE_URL` | (your Postgres URL from Step 2) | Required |
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | (from Step 3) | Required |
   | `CLERK_SECRET_KEY` | (from Step 3) | Required |
   | `ANTHROPIC_API_KEY` | (your Anthropic API key) | Required for chat/agents |
   | `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` | Optional, if you use defaults |
   | `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` | Optional |
   | `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/onboarding` | Optional |
   | `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/onboarding` | Optional |

   Add these for **Production** (and optionally Preview if you use branches).

5. Click **Deploy**. Vercel will run `next build`. If the build fails, fix any errors (often missing env vars or TypeScript/Prisma issues).

You now have a live URL (e.g. `https://your-project.vercel.app`), but the DB schema is not applied yet.

---

## Step 5: Run database migrations

Prisma needs to create/update tables in your production database.

1. **Option A — Run migrations from your machine (easiest)**  
   In the project root, with `DATABASE_URL` pointing at your **production** DB:
   ```bash
   export DATABASE_URL="postgresql://..."   # your production URL
   npx prisma migrate deploy
   ```
   This applies all existing migrations. If you have none yet:
   ```bash
   npx prisma migrate dev --name init
   git add prisma/migrations
   git commit -m "Add initial migration"
   git push
   ```
   Then run `npx prisma migrate deploy` again with production `DATABASE_URL`.

2. **Option B — Run migrations in Vercel build**  
   In **Project → Settings → General → Build & Development Settings**, set **Build Command** to:
   ```bash
   npx prisma generate && npx prisma migrate deploy && next build
   ```
   Ensure `DATABASE_URL` is set in Vercel so the migration runs during build. (Some teams prefer not to run migrations in the build; then use Option A.)

After this, your app can read/write the database in production.

---

## Step 6: Point Clerk to your production URL

1. In the Clerk dashboard, open your application.
2. Add your Vercel URL (e.g. `https://your-project.vercel.app`) to **Allowed redirect URLs** and **Domains** (or the equivalent in your Clerk version).
3. Save. Now sign-in and sign-up should work on the live site.

---

## Step 7 (optional): Redis and the agent worker

The app can run without Redis; chat and one-off runs work. For **scheduled/background agent runs** (BullMQ), you need Redis and a long-running process.

1. **Redis**  
   Create a Redis instance (e.g. [Upstash](https://upstash.com) Redis, or Redis on Railway/Render). Copy the URL (e.g. `rediss://...` for TLS).
2. **Env var**  
   In Vercel, add `REDIS_URL` with that URL. (The Next.js app may use it for queue *enqueue*; the worker needs it to *process* jobs.)
3. **Worker process**  
   Vercel runs only the Next.js app (serverless). To run `scripts/run-agent-worker.ts`, you need a separate host, for example:
   - A small **Railway** or **Render** service that runs `npx ts-node scripts/run-agent-worker.ts` (or a compiled version) with the same `DATABASE_URL` and `REDIS_URL`.
   - Or a **VM/container** where you run the worker and keep it running.

If you skip this step, the rest of the app still works; only the background agent queue depends on it.

---

## Quick checklist

- [ ] Code in Git and pushed to GitHub  
- [ ] Postgres DB created; `DATABASE_URL` copied  
- [ ] Clerk app created; publishable and secret keys copied  
- [ ] Vercel project created; env vars set (DB, Clerk, Anthropic)  
- [ ] First deploy successful  
- [ ] `prisma migrate deploy` run against production DB  
- [ ] Clerk configured with production domain  
- [ ] (Optional) Redis + worker host for background jobs  

If something fails at a step, fix that step (e.g. build errors → fix code or env; sign-in fails → check Clerk URLs and domain). Then move to the next.
