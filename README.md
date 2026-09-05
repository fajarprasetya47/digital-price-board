# Digital Price Board

Aplikasi internal untuk toko pakan: menyimpan daftar produk beserta harga jualnya, memungkinkan owner mengubah harga kapan saja dari HP/perangkat lain, lalu menampilkan harga terbaru pada monitor/TV/tablet di toko. Setiap perubahan harga tercatat dalam riwayat.

> **Bukan sistem POS.** Aplikasi tidak mengelola transaksi penjualan (stock, pelanggan, supplier, dsb.). Fokus V1: **Price Management + Price Display**.

System Plan lengkap: [`docs/Digital-Price-Board-System-Plan-V1.2.md`](docs/Digital-Price-Board-System-Plan-V1.2.md)

---

## Fitur (V1)

**Owner (mobile-first)**
- Login/logout + sesi dengan masa berlaku via env (`SESSION_MAX_AGE`)
- Ganti password sendiri (verifikasi password lama, tanpa forgot-password)
- Kelola kategori (buat/edit/aktif-nonaktif/urutan)
- Kelola produk (buat/edit/cari/aktif-nonaktif/urutan)
- Ubah harga jual cepat (one-step, tanpa buka halaman detail)
- Riwayat perubahan harga per produk
- Kelola perangkat display (daftarkan, token sekali pakai, aktif-nonaktif, last seen)

**Display (read-only)**
- Halaman display per token: `/display/<token>`
- Grup produk per kategori, tipografi besar, high readability
- Sinkronisasi otomatis (polling 60 detik)
- Offline fallback: tetap menampilkan data terakhir (localStorage) + peringatan `Last sync`
- Pencarian produk + tombol fullscreen

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript |
| Backend | Next.js Route Handlers (monolith), Zod validation |
| Database | MySQL 8.4 (Docker Compose) |
| ORM | Prisma 7 (driver adapter `@prisma/adapter-mariadb`) |
| Auth | JWT session (`jose`), hashing `bcryptjs`, token display HMAC-SHA256 |
| Container | Docker / Docker Compose (`node:24-alpine`) |

---

## Struktur Proyek

```
src/
├── app/
│   ├── (auth)/login/            # halaman login owner
│   ├── (dashboard)/             # shell owner + products/categories/display-devices/settings
│   ├── (display)/display/[token] # layar harga toko
│   └── api/                     # Route Handlers (auth, categories, products, display)
├── components/
│   ├── ui/                      # primitives (Button, Input, Modal, Badge, dsb.)
│   ├── products/ categories/ display/ settings/ shell/
├── lib/
│   ├── auth/                    # session, password, DAL, display-token
│   ├── db/                      # Prisma client singleton
│   ├── errors/                  # format error API (Section 39 System Plan)
│   ├── validation/              # skema Zod
│   ├── client/                  # fetchJSON client-side
│   └── utils/                   # format Rupiah/tanggal, dsb.
├── proxy.ts                     # route guard (protected/public)
prisma/
├── schema.prisma                # users, categories, products, price_histories, display_devices
├── migrations/                  # migrasi database
└── seed.ts                      # seed awal (owner + contoh data)
Dockerfile · docker-compose.yml · docker-entrypoint.sh
```

---

## Persyaratan

- Node.js 24+
- Docker + Docker Compose (untuk MySQL dan/atau menjalankan app)
- npm 10+

---

## Setup Pengembangan

### 1. Konfigurasi environment

```bash
cp .env.example .env
```

Edit `.env`, minimal ganti nilai placeholder:

- `MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD` — kata sandi DB
- `AUTH_SECRET`, `DISPLAY_TOKEN_SECRET` — generate dengan:

```bash
openssl rand -base64 32   # jalankan dua kali
```

> `.env` tidak boleh di-commit (sudah di `.gitignore`).

### 2. Jalankan database

```bash
npm run db:up          # docker compose up -d (MySQL di port 3307)
```

> Port host `3307` dipakai untuk menghindari konflik dengan instalasi MySQL lain; port internal container tetap `3306`.

### 3. Instal dependencies + migrasi + seed

```bash
npm install
npm run db:migrate     # prisma migrate dev
npm run db:seed        # membuat owner default + data contoh
```

### 4. Jalankan app

```bash
npm run dev            # http://localhost:3000
```

**Login default hasil seed:**

| Field | Nilai |
|---|---|
| Email | `owner@example.com` |
| Password | nilai `SEED_OWNER_PASSWORD` di `.env` (default dev: `owner123`) |

---

## Menjalankan dengan Docker (production-like)

Satu perintah untuk seluruh stack (DB + app):

```bash
docker compose up -d --build
```

Behavior:

- `db` (MySQL 8.4) menunggu healthy → `app` mulai
- Entrypoint `app` otomatis menjalankan `prisma migrate deploy` sebelum `next start`
- Seed hanya berjalan jika `SEED=1` di `.env` (nyalakan saat deploy DB kosong pertama kali)
- App berjalan sebagai user non-root (`nextjs`)

Jalankan seed manual di container (jika perlu):

```bash
SEED=1 docker compose up -d --force-recreate app
```

Log:

```bash
docker compose logs -f app
```

---

## Variabel Environment

| Variabel | Wajib | Keterangan |
|---|---|---|
| `MYSQL_ROOT_PASSWORD` | ✓ (compose) | Root password MySQL |
| `MYSQL_DATABASE` | ✓ (compose) | Nama database |
| `MYSQL_USER` / `MYSQL_PASSWORD` | ✓ (compose) | User aplikasi DB |
| `MYSQL_PORT` | – | Port host MySQL (default `3307`) |
| `DATABASE_URL` | ✓ | Koneksi Prisma (dipakai saat run di host / migrate) |
| `APP_URL` | ✓ | URL publik; dipakai membangun `displayUrl` saat daftarkan perangkat display |
| `AUTH_SECRET` | ✓ | Secret sign JWT sesi owner |
| `DISPLAY_TOKEN_SECRET` | ✓ | Secret HMAC token display |
| `SESSION_MAX_AGE` | ✓ | Durasi sesi owner dalam detik (tidak di-hardcode) |
| `APP_PORT` | – | Port host untuk app container (default `3000`) |
| `SEED` | – | `1` untuk menjalankan seed saat container start |
| `SEED_OWNER_PASSWORD` | – | Password owner default |
| `SEED_DISPLAY_TOKEN` | – | Token display dev yang di-seed (contoh: `dev-display-token`) |

---

## Scripts

| Script | Fungsi |
|---|---|
| `npm run dev` | Menjalankan development server |
| `npm run build` | Build production |
| `npm run start` | Menjalankan production build |
| `npm run lint` | ESLint |
| `npm run db:up` / `db:down` | Naikkan/turunkan container DB (dan app) |
| `npm run db:migrate` | Prisma migrate (dev) |
| `npm run db:seed` | Menjalankan seed |
| `npm run db:generate` | Regenerasi Prisma Client |
| `npm run db:studio` | Prisma Studio |

---

## API Ringkasan

Format error konsisten di seluruh endpoint (lihat System Plan Section 39):

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "…" } }
```

| Area | Endpoint |
|---|---|
| Auth | `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/session`, `PATCH /api/auth/password` |
| Kategori | `GET/POST /api/categories`, `GET/PATCH /api/categories/[id]` |
| Produk | `GET/POST /api/products`, `GET/PATCH /api/products/[id]`, `PATCH /api/products/[id]/price`, `GET /api/products/[id]/price-history` |
| Display | `GET /api/display/prices`, `POST /api/display/register`, `POST /api/display/heartbeat`, `GET /api/display/devices`, `PATCH /api/display/devices/[id]` |

Perubahan harga selalu melalui satu jalur transaksi (update `selling_price` + insert `price_histories`); jika harga tidak berubah, riwayat tidak dibuat.

---

## Perangkat Display

1. Login owner → menu **Display** → **Daftarkan**.
2. Masukkan nama perangkat → token unik muncul **sekali** (+ URL display).
3. Buka URL pada TV/monitor/tablet di toko (contoh: `/display/dev-display-token`).
4. Layar memuat data via token display, menyimpan cache lokal, dan sinkron tiap 60 detik.

Revoke: nonaktifkan perangkat di menu Display; token tidak akan lagi diterima (HTTP 401).

---

## Keamanan

- Password di-hash (bcrypt), tidak pernah dikirim ke client
- Sesi owner: JWT httpOnly cookie + masa berlaku dari env
- Token display disimpan sebagai HMAC-SHA256 (token mentah tidak tersimpan di DB)
- Seluruh input divalidasi di sisi server (Zod); API menolak request yang tidak sah
- Secret tidak pernah di-commit; `.env` di luar image Docker

---

## Pembatasan V1 (sengaja)

Tidak termasuk: POS/kasir, inventory/stok, purchase order, supplier/customer management, member/reseller/grosir pricing, diskon/promosi, pembukuan, pembayaran, laporan penjualan, aplikasi mobile native, integrasi marketplace, forgot-password via email/OTP.

Lihat System Plan untuk detail arah pengembangan selanjutnya.