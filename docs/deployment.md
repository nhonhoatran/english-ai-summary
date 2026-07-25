# Production VPS Deployment Guide

This guide documents how to deploy the YouTube English Lesson App on a VPS using Docker Compose.

---

## Prerequisites

- VPS running Linux (Ubuntu 22.04+ or similar) with **x86_64** architecture.
- **Docker** and **Docker Compose** installed.
- A domain name pointing to your VPS IP address.
- Reverse proxy (e.g. Caddy or Nginx) with SSL/TLS certificate (HTTPS is mandatory because session cookies are marked `Secure`).

---

## Step 1: Initial VPS Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url> /opt/english-summary
   cd /opt/english-summary
   ```

2. **Generate Auth Secret:**
   Generate a 32+ byte random hex string:
   ```bash
   openssl rand -hex 32
   ```

3. **Create `.env` File:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your actual production credentials:
   ```env
   # Gemini API Key
   GEMINI_API_KEY=your_actual_gemini_api_key

   # Single shared password to access the app
   APP_PASSWORD=your_strong_password_here

   # HMAC Secret generated in step 2
   AUTH_SECRET=the_generated_openssl_hex_string

   # Internal Docker database connection URL (points to 'postgres' service)
   DATABASE_URL=postgresql://postgres:postgrespassword@postgres:5432/english_summary

   # Gemini Model
   GEMINI_MODEL=gemini-3.6-flash
   ```

---

## Step 2: Build and Launch Containers

Run Docker Compose to build the Next.js standalone image and start the PostgreSQL database and application containers:

```bash
docker compose up -d --build
```

**What happens on boot:**
1. Postgres starts up and runs its health check (`pg_isready`).
2. App container waits until Postgres is ready (`service_healthy`).
3. Entrypoint executes `npx prisma migrate deploy` automatically applying database migrations.
4. Next.js standalone server starts on `127.0.0.1:3000`.

Check container status and logs:
```bash
docker compose ps
docker compose logs -f app
```

---

## Step 3: Configure Reverse Proxy & TLS (HTTPS)

Session cookies use `HttpOnly; Secure; SameSite=Lax`. Browsers will **not** save `Secure` cookies over plain HTTP (non-localhost). You **must** serve the app behind HTTPS.

### Option A: Caddy (Recommended)

Install Caddy and add to `/etc/caddy/Caddyfile`:

```caddy
yourdomain.com {
    reverse_proxy 127.0.0.1:3000
}
```

Reload Caddy:
```bash
sudo systemctl reload caddy
```

### Option B: Nginx + Certbot

Nginx configuration block (`/etc/nginx/sites-available/english-summary`):

```nginx
server {
    server_name yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Obtain TLS certificate:
```bash
sudo certbot --nginx -d yourdomain.com
```

---

## Step 4: Database Backup & Maintenance

Database files are persisted in a named Docker volume (`pgdata`).

### Backup Database

To create a single-file database backup:
```bash
docker exec -t english_summary_db pg_dump -U postgres english_summary > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Restore Database

To restore from a SQL backup:
```bash
cat backup_filename.sql | docker exec -i english_summary_db psql -U postgres -d english_summary
```

---

## Step 5: Application Updates / Upgrades

When pulling new code changes:

```bash
git pull origin main
docker compose up -d --build
```

Docker Compose will rebuild the app container and apply any new Prisma database migrations automatically during container startup.
