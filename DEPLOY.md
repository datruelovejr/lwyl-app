# LWYL Deployment Protocol

## Quick Deploy

```bash
cd lwyl-app
git add <files>
git commit -m "Description"
git push origin main
npx vercel --prod
```

## URLs

| Environment | URL |
|------------|-----|
| Production | https://lwyl-app.vercel.app |
| GitHub | https://github.com/datruelovejr/lwyl-app |
| Vercel Dashboard | https://vercel.com/daniel-truelove-jrs-projects/lwyl-app |

## Checklist (before every deploy)

1. **Build locally first** — `npm run build` catches errors before they hit Vercel
2. **Check env vars** — Supabase keys must be set in Vercel project settings (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
3. **Test the login page** — it's the first thing users see; confirm it renders on mobile
4. **Commit and push to GitHub** — Vercel can also auto-deploy from GitHub, but `npx vercel --prod` gives immediate feedback

## Vercel Project Settings

- **Framework:** Next.js (auto-detected)
- **Build command:** `npm run build`
- **Output directory:** `.next`
- **Node version:** 18.x+

## Environment Variables (Vercel Dashboard)

| Variable | Required |
|----------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes |

## Rollback

```bash
# List recent deployments
npx vercel ls

# Promote a previous deployment to production
npx vercel promote <deployment-url>
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails | Run `npm run build` locally to see errors |
| Login page broken on mobile | Check `globals.css` login classes + viewport in `layout.tsx` |
| Env vars not working | Must be prefixed with `NEXT_PUBLIC_` for client-side access |
| Stale deployment | Clear Vercel build cache: `npx vercel --prod --force` |
