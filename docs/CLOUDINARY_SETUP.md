# Cloudinary setup (permanent photos)

Product listing photos and profile avatars upload to **Cloudinary** when these env vars are set. Images stay online after Render redeploys.

Without Cloudinary keys, the app falls back to `backend/uploads/` on disk (fine for local dev only).

---

## 1. Create a free Cloudinary account

1. Go to [https://cloudinary.com/users/register/free](https://cloudinary.com/users/register/free)
2. Sign up and confirm your email
3. Open the **Dashboard**

---

## 2. Copy your credentials

On the dashboard home page you will see:

| Dashboard label | Put in `.env` as |
|-----------------|------------------|
| Cloud name | `CLOUDINARY_CLOUD_NAME` |
| API Key | `CLOUDINARY_API_KEY` |
| API Secret | `CLOUDINARY_API_SECRET` |

Click **Reveal** next to API Secret to copy it.

---

## 3. Local development

Edit `backend/.env` (create from `backend/.env.example` if needed):

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Restart the backend:

```bash
cd backend
npm install
npm run dev
```

You should see:

```text
📷 Image storage: cloudinary
```

Upload a listing photo — the saved URL should start with `https://res.cloudinary.com/...`

---

## 4. Render (backend)

1. Render dashboard → your **backend** service → **Environment**
2. Add the same three variables:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
3. **Save** and wait for redeploy

Do **not** add these to Vercel — only the backend talks to Cloudinary.

---

## 5. Vercel (frontend)

No Cloudinary keys needed on the frontend. Images load directly from `https://res.cloudinary.com/...` URLs returned by the API.

Ensure `VITE_API_URL` on Vercel points to your Render backend (if you use one).

---

## 6. Old listings

Listings that still use `/uploads/...` or broken local paths need photos **re-uploaded** once Cloudinary is enabled. New uploads are permanent.

---

## 7. Optional settings

| Variable | Default | Purpose |
|----------|---------|---------|
| `CLOUDINARY_FOLDER` | `nit-patna-market` | Root folder in your Cloudinary media library |

Upload paths:

- `nit-patna-market/products/…` — listing photos  
- `nit-patna-market/avatars/…` — profile pictures  

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Image storage: local` on server | Add all three `CLOUDINARY_*` vars and redeploy |
| Upload fails with 500 | Check API secret; no extra spaces in env values |
| Photos still missing | Re-edit listing and upload images again |
| Free tier limit | Cloudinary free tier is generous for a campus app; check usage in dashboard |
