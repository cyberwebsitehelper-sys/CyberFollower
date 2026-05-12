# Cyber Complaint Portal — Django Backend

Django REST Framework backend with **MongoDB** (via `djongo`), **SimpleJWT** auth, and **Cloudflare R2** (S3-compatible) for file uploads.

## Quick start

```bash
# 1) create venv
python -m venv venv
source venv/bin/activate         # Windows: venv\Scripts\activate

# 2) install deps
pip install -r requirements.txt

# 3) configure environment
cp .env.example .env
# edit .env with your MongoDB URI + Cloudflare R2 credentials

# 4) make sure MongoDB is running (local or Atlas)
# 5) migrate + create superuser
python manage.py makemigrations core
python manage.py migrate
python manage.py createsuperuser    # uses phone_number as username
# OR setup a default admin via environment variables
# (Add DEFAULT_ADMIN_PHONE and DEFAULT_ADMIN_PASSWORD to .env)
# python manage.py create_default_admin

# 6) run
python manage.py runserver 0.0.0.0:8000
```

## Cloudflare R2 setup

1. Cloudflare dashboard → R2 → create bucket (e.g. `cyberportal-uploads`).
2. R2 → Manage R2 API Tokens → create an **Access Key** (gives Access Key ID + Secret).
3. Enable public access on the bucket (or attach a custom domain) and copy the public URL.
4. Fill the `CF_*` variables in `.env`. The backend uploads to:
   `https://<CF_ACCOUNT_ID>.r2.cloudflarestorage.com/<bucket>` and serves files from `CF_R2_PUBLIC_URL`.

If you leave `CF_R2_BUCKET` empty, files are stored locally under `./media/`.

## API

All endpoints require `Authorization: Bearer <access_token>` except `/api/auth/login/`.

| Method | Path | Notes |
|---|---|---|
| POST | `/api/auth/login/` | `{phone_number, password}` → `{access, refresh, user}` |
| POST | `/api/auth/refresh/` | SimpleJWT refresh |
| GET  | `/api/dashboard/stats/` | active/closed counts + ADV/Cyber fee totals |
| GET  | `/api/complaints/` | list (scoped to user, or all if `is_super_role`) |
| POST | `/api/complaints/` | multipart create (`noc_file` upload). Requires `password_confirm` |
| GET  | `/api/complaints/active/` | only `is_complete=False` |
| GET  | `/api/complaints/closed/` | only `is_complete=True` |
| PATCH| `/api/complaints/<id>/` | update. Requires `password_confirm` |
| POST | `/api/complaints/<id>/close/` | sets `is_complete=True`, `completed_at=now()`. Requires `password_confirm` |
| GET/POST | `/api/fees/adv/` | ADV fee entries |
| GET/POST | `/api/fees/cyber/` | Cyber fee entries |

### Password confirmation
Sensitive writes (create/update/close) accept a `password_confirm` field — the backend re-checks it against the logged-in user's password and rejects with 400 if wrong.

### Data isolation
Employees see only their own rows. Users with `is_super_role=True` (or Django superuser) see everything.

## Notes
- `djongo` translates Django ORM to MongoDB queries. Atlas works — set `MONGO_HOST` to your `mongodb+srv://...` URI.
- If you hit `djongo`/`pymongo` compatibility errors on newer Python, pin Python 3.10 or 3.11.
- For production: set `DEBUG=False`, restrict `ALLOWED_HOSTS` and `CORS`, and put Django behind gunicorn + a reverse proxy.
