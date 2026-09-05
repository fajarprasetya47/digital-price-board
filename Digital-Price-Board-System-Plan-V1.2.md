# Digital Price Board — System Plan V1.2

> Perubahan dari V1.1: menambahkan Reset Password (in-dashboard, tanpa forgot password), session expiry via environment variable, error handling per fitur, penguatan data validation, dan dokumentasi API error response format. Tidak ada perubahan pada core feature/scope V1.

---

## 1. Overview

Digital Price Board adalah aplikasi internal untuk toko pakan yang berfungsi untuk:

1. Menyimpan daftar produk beserta harga jualnya.
2. Memudahkan owner mengubah harga jual kapan saja, dari HP maupun perangkat lain.
3. Menampilkan harga terbaru pada monitor/tablet yang digunakan oleh penjaga toko.
4. Menyimpan riwayat setiap perubahan harga.

Aplikasi ini **bukan sistem POS**. Aplikasi tidak mengelola transaksi penjualan dan tidak ditampilkan kepada pelanggan.

### Core Problem

Harga pakan dapat berubah secara berkala, dan pencatatan manual menggunakan buku rentan menimbulkan masalah berikut:

* Harga terlambat diperbarui.
* Penjaga toko masih menggunakan harga lama.
* Owner harus memberitahukan setiap perubahan harga secara manual.
* Sulit melacak kapan suatu harga terakhir kali berubah.

### Core Solution

Owner mengubah harga melalui aplikasi → sistem menyimpan harga terbaru → display toko otomatis menampilkan harga tersebut.

---

# 2. V1 Goals

V1 harus mampu mendukung hal-hal berikut:

* Owner dapat login.
* Owner dapat mengganti password miliknya sendiri melalui dashboard.
* Owner dapat melihat daftar produk.
* Owner dapat menambahkan produk baru.
* Owner dapat mengubah data produk.
* Owner dapat mengubah harga jual.
* Owner dapat mengaktifkan/menonaktifkan produk.
* Owner dapat mengelompokkan produk berdasarkan kategori.
* Owner dapat melihat riwayat perubahan harga.
* Display menampilkan produk dan harga terbaru.
* Display dapat digunakan dalam mode fullscreen.
* Perubahan harga yang dilakukan owner langsung tercermin pada display.
* Display menunjukkan waktu terakhir data diperbarui.

---

# 3. V1 Out of Scope

Fitur berikut sengaja tidak dimasukkan ke dalam V1:

* POS / kasir.
* Inventory / stok.
* Purchase order.
* Supplier management.
* Customer management.
* Member pricing.
* Grosir pricing.
* Reseller pricing.
* Discount management.
* Promotion management.
* Accounting.
* Payment.
* Sales report.
* Native mobile application.
* Marketplace integration.
* Forgot password via email/OTP (lihat Section 8 — reset password hanya tersedia dari dalam dashboard).

Aplikasi harus tetap fokus pada:

> **Price Management + Price Display**

---

# 4. Technology Stack

## 4.1 Frontend

**React**

React digunakan sebagai UI library utama.

## 4.2 Full-Stack Framework

**Next.js**

Next.js digunakan sebagai framework utama untuk menangani:

* React application.
* Routing.
* Server-side functionality.
* API / server endpoints.
* Authentication handling.
* Application deployment.

Aplikasi ini dibangun dengan pendekatan **full-stack monolith**.

## 4.3 Backend

Backend berada di dalam aplikasi Next.js yang sama.

Tidak ada project backend terpisah pada V1.

Conceptual architecture:

```text
Next.js Application
│
├── React UI
├── Server Components / Server Logic
├── API / Route Handlers
├── Authentication
└── Database Access
```

## 4.4 Database

**MySQL**

MySQL digunakan sebagai primary relational database.

## 4.5 ORM

ORM belum ditentukan pada tahap awal ini.

Kandidat yang dipertimbangkan:

* Prisma
* Drizzle ORM

Pemilihan ORM akan dilakukan sebelum masuk ke tahap implementasi.

## 4.6 Display

Display diakses melalui web browser, dengan dukungan perangkat berikut:

* Smart TV browser.
* Android TV browser.
* PC / laptop.
* Tablet.
* Monitor yang terhubung ke komputer.

Native display application tidak diperlukan untuk V1.

---

# 5. Architecture Philosophy

V1 dibangun dengan **monolithic architecture**.

```text
                         Internet
                            │
             ┌──────────────┴──────────────┐
             │                             │
             ▼                             ▼
        Owner Device                 Display Device
        HP / Tablet                  TV / Monitor
             │                             │
             └──────────────┬──────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │    Next.js      │
                   │   Application   │
                   │                 │
                   │ React UI        │
                   │ Server Logic    │
                   │ API             │
                   │ Auth            │
                   └────────┬────────┘
                            │
                            ▼
                       ┌──────────┐
                       │  MySQL   │
                       └──────────┘
```

### Why Monolith?

Untuk V1, monolith dipilih dengan pertimbangan berikut:

* Sistem masih relatif kecil.
* Hanya memiliki satu domain utama.
* Belum membutuhkan independent scaling.
* Deployment lebih sederhana.
* Development lebih cepat.
* Maintenance lebih mudah.
* Biaya infrastruktur lebih murah.
* Frontend dan backend memiliki lifecycle yang sama.

Dengan demikian, V1 tidak membutuhkan:

* Microservices.
* API gateway.
* Message broker.
* Kubernetes.
* Service mesh.

---

# 6. Application Modules

Aplikasi terbagi menjadi beberapa logical module berikut:

```text
Authentication
│
├── Users
│
├── Categories
│
├── Products
│
├── Price Management
│
├── Price History
│
└── Display Devices
```

---

# 7. User Roles

V1 hanya membutuhkan dua jenis akses.

## 7.1 Owner

Owner memiliki akses penuh, meliputi:

* Login.
* Change own password (dashboard).
* Manage categories.
* Manage products.
* Change prices.
* Activate/deactivate products.
* View price history.
* Manage display devices.

## 7.2 Display

Display bukan merupakan user biasa, melainkan menggunakan mekanisme autentikasi khusus untuk mengambil data display.

Display hanya dapat:

* Retrieve active products.
* Retrieve categories.
* Retrieve current prices.
* Retrieve last updated information.

Display tidak dapat:

* Create product.
* Edit product.
* Change price.
* Delete data.
* Access owner features.

---

# 8. Authentication

Seluruh fungsi yang digunakan owner untuk mengelola data harus dilindungi oleh mekanisme autentikasi.

Minimum yang dibutuhkan:

* Login.
* Logout.
* Session management.
* Session expiry (durasi diatur melalui environment variable, lihat Section 52).
* Protected owner routes.
* Server-side authorization.

Owner wajib ter-autentikasi sebelum dapat melakukan perubahan data apa pun.

### Reset Password (In-Dashboard)

Owner dapat mengganti password miliknya sendiri melalui dashboard, setelah login.

Ketentuan:

* Reset password hanya tersedia bagi owner yang sudah ter-autentikasi (bukan fitur publik).
* Tidak ada mekanisme **"Forgot Password"** (reset via email/OTP) pada V1.
* Proses reset membutuhkan input password lama dan password baru sebagai validasi.
* Jika owner lupa password sepenuhnya, penggantian dilakukan secara manual langsung ke database oleh developer/admin sistem, di luar aplikasi.

### Display Authentication

Display menggunakan device-specific credential/token, bukan akun owner.

Konsepnya sebagai berikut:

```text
Owner
  │
  ▼
Create Display Device
  │
  ▼
Generate Device Token
  │
  ▼
Register Display
  │
  ▼
Display dapat mengambil data
```

Display token bersifat terpisah dari credential owner.

---

# 9. Product Management

Owner dapat mengelola seluruh data produk.

### Product fields

* Product name.
* Category.
* Selling price.
* Active status.
* Display order.

### Actions

* Create product.
* Edit product.
* Change price.
* Activate product.
* Deactivate product.

Produk yang sudah tidak dijual lagi sebaiknya **dinonaktifkan**, bukan dihapus.

---

# 10. Category Management

Produk dikelompokkan berdasarkan kategori, misalnya:

```text
Pakan Ayam
Pakan Ikan
Pakan Burung
Vitamin
Obat
```

Owner dapat:

* Create category.
* Edit category.
* Change display order.
* Activate/deactivate category.

Kategori yang masih digunakan oleh produk aktif sebaiknya tidak dapat dihapus secara permanen.

---

# 11. Price Management

V1 hanya memiliki satu jenis harga:

> **Selling Price / Harga Jual**

Contoh:

```text
Bravo 511
Rp395.000
```

V1 tidak mencakup:

* Harga grosir.
* Harga reseller.
* Harga member.
* Harga promo.

### Price Update Flow

```text
Owner
  │
  ▼
Edit Price
  │
  ▼
Validate Price
  │
  ▼
Update Product
  │
  ├── Create Price History
  │
  └── Update timestamp
```

Jika terjadi perubahan nilai, misalnya:

```text
385000 → 395000
```

maka entri history baru dibuat.

Namun jika nilai tidak berubah, misalnya:

```text
385000 → 385000
```

maka history baru tidak dibuat.

---

# 12. Price History

Setiap perubahan harga harus dapat dilacak.

Data minimum yang dicatat:

* Product.
* Old price.
* New price.
* Changed by.
* Timestamp.

Contoh:

```text
Bravo 511

05 Sep 2026
Rp395.000
Changed by: Owner

28 Aug 2026
Rp385.000
Changed by: Owner

10 Aug 2026
Rp375.000
Changed by: Owner
```

Price history bersifat immutable dari sisi aplikasi — owner tidak dapat mengubah data history secara manual.

---

# 13. Price Display

Display merupakan halaman khusus yang digunakan pada perangkat toko.

Karakteristik display:

* Read-only.
* Fullscreen friendly.
* Large typography.
* High readability.
* Category based.
* Price oriented.
* Automatic synchronization.

Contoh:

```text
┌──────────────────────────────────────────┐
│          DAFTAR HARGA JUAL               │
│       Update: 05 Sep 2026 08:32          │
├──────────────────────────────────────────┤
│                                          │
│  PAKAN AYAM                              │
│                                          │
│  Bravo 511                  Rp395.000     │
│  Bravo 512                  Rp405.000     │
│  Comfeed A                  Rp410.000     │
│                                          │
│  PAKAN IKAN                              │
│                                          │
│  Lele 781                   Rp320.000     │
│  Lele 782                   Rp335.000     │
│                                          │
└──────────────────────────────────────────┘
```

---

# 14. Display Synchronization

Display harus dapat memperoleh harga terbaru tanpa perlu di-refresh secara manual.

V1 menggunakan mekanisme polling sederhana.

Contoh:

```text
Display
   │
   │ Every 30–60 seconds
   ▼
GET latest display data
   │
   ▼
Compare/update data
   │
   ▼
Render latest prices
```

WebSocket / Server-Sent Events tidak diperlukan pada V1.

### Future

Jika kebutuhan real-time meningkat di kemudian hari, mekanisme sinkronisasi dapat dikembangkan menjadi push-based.

---

# 15. Offline Display Behavior

Display harus tetap dapat digunakan meskipun koneksi internet sementara terputus.

Konsepnya sebagai berikut:

```text
Internet Available
       │
       ▼
Fetch latest data
       │
       ▼
Store last known data locally
       │
       ▼
Internet Lost
       │
       ▼
Continue showing last known data
```

Display tetap menunjukkan informasi berikut:

```text
Last updated:
05 Sep 2026 08:32
```

Jika sinkronisasi gagal dalam periode tertentu, display akan menampilkan peringatan:

```text
⚠ Last sync: 2 hours ago
```

Hal ini penting agar penjaga toko tidak salah mengira harga yang tampil adalah harga terbaru, padahal display sudah cukup lama tidak menerima update.

---

# 16. Application Criteria

Bagian ini menjelaskan kriteria aplikasi secara umum, bukan daftar fitur atau modul tersendiri.

## 16.1 Owner Usage Criteria

Aplikasi harus dapat digunakan owner melalui HP atau perangkat lain untuk:

* Mengelola produk.
* Mengelola kategori.
* Mengubah harga jual.
* Melihat riwayat perubahan harga.
* Mengelola perangkat display.
* Mengganti password sendiri.

Penggunaannya harus sederhana, responsif, dan tidak membutuhkan perangkat khusus.

## 16.2 Display Usage Criteria

Aplikasi harus dapat digunakan pada monitor, tablet, Smart TV browser, Android TV browser, atau perangkat lain di toko untuk:

* Menampilkan daftar produk aktif.
* Menampilkan harga jual terbaru.
* Mengelompokkan produk berdasarkan kategori.
* Menampilkan waktu terakhir data diperbarui.
* Tetap menampilkan data terakhir ketika koneksi sementara terputus.

## 16.3 Usability Criteria

Aplikasi harus:

* Mudah digunakan dari HP.
* Memerlukan langkah seminimal mungkin untuk mengubah harga.
* Menampilkan informasi harga secara jelas.
* Memisahkan dengan tegas antara penggunaan owner dan display.
* Tidak menampilkan fitur POS, stok, transaksi, atau fitur lain di luar scope V1.
* Memiliki tampilan display yang mudah dibaca dari jarak jauh.

## 16.4 Technical Criteria

Aplikasi harus:

* Menggunakan Next.js dan React.
* Menggunakan MySQL sebagai database.
* Dibangun sebagai satu aplikasi full-stack monolith.
* Menyimpan current price sebagai sumber data utama.
* Menyimpan riwayat setiap perubahan harga.
* Menyediakan akses display secara read-only.
* Memiliki mekanisme autentikasi untuk owner, termasuk reset password di dalam dashboard.
* Memiliki mekanisme autentikasi terpisah untuk display.
* Mendukung sinkronisasi harga secara otomatis.
* Mendukung fallback ke data terakhir pada display.
* Menerapkan validasi data di server pada seluruh input.
* Menerapkan error handling yang konsisten di setiap fitur.

---

# 17. Owner Interface Design Criteria

Interface untuk owner harus dirancang dengan pendekatan **mobile-first**.

Perangkat utama:

> HP Owner

Perangkat pendukung:

* Tablet.
* Desktop.
* Laptop.

### Design principles

* Minimal clicks.
* Fast price editing.
* Clear hierarchy.
* Search first.
* Responsive.
* Simple navigation.

Interface owner harus menyediakan akses ke seluruh kebutuhan pengelolaan data, seperti:

* Daftar produk.
* Form produk.
* Daftar kategori.
* Riwayat harga.
* Pengaturan perangkat display.
* Pengaturan akun (ganti password).

Istilah "management UI" pada dokumen ini hanya merujuk pada kriteria tampilan dan penggunaan untuk owner, bukan nama fitur tersendiri.

---

# 18. Owner Product List Criteria

Daftar produk merupakan tampilan utama untuk pengelolaan produk.

Tampilan ini harus mendukung:

* Pencarian produk.
* Pengelompokan berdasarkan kategori.
* Tampilan harga saat ini.
* Akses cepat untuk mengubah harga.
* Status aktif/nonaktif produk.

Contoh:

```text
┌────────────────────────────────────┐
│ Produk                             │
│                                    │
│ 🔎 Cari produk...                  │
│                                    │
│ PAKAN AYAM                         │
│                                    │
│ Bravo 511       Rp395.000  [Edit]  │
│ Bravo 512       Rp405.000  [Edit]  │
│ Comfeed A       Rp410.000  [Edit]  │
│                                    │
│ PAKAN IKAN                         │
│                                    │
│ Lele 781        Rp320.000  [Edit]  │
│ Lele 782        Rp335.000  [Edit]  │
└────────────────────────────────────┘
```

Fitur pencarian dibutuhkan karena jumlah produk berpotensi terus bertambah seiring waktu.

---

# 19. Quick Price Edit Criteria

Perubahan harga harus dapat dilakukan secepat mungkin.

Alur ideal:

```text
Product List
     ↓
Click Price / Edit
     ↓
Input New Price
     ↓
Save
     ↓
Success
```

Perubahan harga tidak boleh mengharuskan owner membuka halaman detail produk terlebih dahulu.

---

# 20. Product Form Criteria

Form produk minimal memuat field berikut:

```text
Nama Produk
[ Bravo 511 ]

Kategori
[ Pakan Ayam ▼ ]

Harga Jual
[ 395000 ]

Status
[ ● Aktif ]

Urutan Display
[ 1 ]

[ Simpan ]
```

---

# 21. Price History Display Criteria

Riwayat harga harus dapat dilihat per produk.

```text
Bravo 511

Harga Sekarang
Rp395.000

Riwayat Harga

05 Sep 2026
Rp395.000
Owner

28 Aug 2026
Rp385.000
Owner

10 Aug 2026
Rp375.000
Owner
```

Urutan tampilan:

> Terbaru → Terlama

---

# 22. Display Interface Criteria

Tampilan display harus berbeda secara jelas dari tampilan owner.

### Priorities

1. Readability.
2. Price visibility.
3. Category grouping.
4. Large typography.
5. Minimal controls.

Display tidak memerlukan navigasi atau kontrol pengelolaan data apa pun.

---

# 23. Display Search Criteria

Jika jumlah produk cukup banyak, display dapat menyediakan fitur pencarian.

Contoh:

```text
🔎 [ bravo ]

Bravo 511
Rp395.000

Bravo 512
Rp405.000
```

Pencarian pada display bersifat pendukung dan tidak boleh mengurangi fungsi utamanya sebagai layar referensi harga.

---

# 24. Database Design

Database menggunakan MySQL.

V1 minimal membutuhkan tabel berikut:

```text
users
categories
products
price_histories
display_devices
```

---

# 25. Database: users

```text
users
--------------------------------
id
name
email
password_hash
role
created_at
updated_at
```

### Role

Untuk V1:

```text
OWNER
```

---

# 26. Database: categories

```text
categories
--------------------------------
id
name
is_active
display_order
created_at
updated_at
```

Contoh data:

```text
1 | Pakan Ayam | true | 1
2 | Pakan Ikan | true | 2
3 | Vitamin    | true | 3
```

---

# 27. Database: products

```text
products
--------------------------------
id
category_id
name
selling_price
is_active
display_order
created_at
updated_at
```

Relationship:

```text
categories 1 ───── N products
```

Current price disimpan langsung pada kolom `products.selling_price`.

Alasannya:

* Query display menjadi lebih sederhana.
* Tidak perlu mencari harga terakhir dari history.
* Current state mudah diakses.
* Price history tetap digunakan untuk keperluan audit.

---

# 28. Database: price_histories

```text
price_histories
--------------------------------
id
product_id
old_price
new_price
changed_by
created_at
```

Relationship:

```text
products 1 ───── N price_histories

users 1 ───── N price_histories
```

---

# 29. Database: display_devices

```text
display_devices
--------------------------------
id
name
display_token
is_active
last_seen_at
created_at
updated_at
```

Contoh data:

```text
1 | Monitor Kasir | <token> | true
2 | Tablet Gudang | <token> | true
```

Token harus disimpan secara aman.

---

# 30. Database Relationships

```text
                 users
                   │
                   │ changed_by
                   ▼
categories ──── products ──── price_histories
     │              │
     └──────────────┘

display_devices
```

Logical relationship:

```text
CATEGORY
   │
   └──< PRODUCT
           │
           └──< PRICE_HISTORY
                     │
                     └── USER
```

---

# 31. Database Constraints

### categories

* `name` required.
* `name` should be indexed.
* `display_order` required.
* `is_active` default true.

### products

* `name` required.
* `category_id` required.
* `selling_price >= 0`.
* `is_active` default true.
* `display_order` required.

### price_histories

* `product_id` required.
* `old_price` required.
* `new_price` required.
* `changed_by` required.

### display_devices

* `display_token` unique.
* `is_active` default true.

---

# 32. Price Update Transaction

Price update harus dijalankan sebagai satu database transaction.

Konsepnya sebagai berikut:

```text
BEGIN TRANSACTION

1. Read current product price
2. Validate new price
3. Update products.selling_price
4. Insert price_histories
5. Commit

COMMIT
```

Jika salah satu langkah gagal, transaksi harus dibatalkan:

```text
ROLLBACK
```

Dengan cara ini, current price dan history tidak akan pernah berada dalam kondisi tidak sinkron.

---

# 33. API Design

Seluruh API berada di dalam aplikasi Next.js.

Pengelompokan API secara logis:

```text
/api/auth/*
/api/categories/*
/api/products/*
/api/price-history/*
/api/display/*
```

---

# 34. Authentication API

```text
POST  /api/auth/login
POST  /api/auth/logout
GET   /api/auth/session
PATCH /api/auth/password
```

`PATCH /api/auth/password` hanya dapat diakses oleh owner yang sudah login, dan membutuhkan password lama sebagai validasi sebelum password baru disimpan. Endpoint ini tidak menggantikan kebutuhan forgot-password — endpoint publik untuk itu memang tidak disediakan pada V1 (lihat Section 8).

---

# 35. Category API

```text
GET    /api/categories
POST   /api/categories
GET    /api/categories/:id
PATCH  /api/categories/:id
```

Delete bukan merupakan operasi utama.

Category sebaiknya menggunakan mekanisme active/inactive state.

---

# 36. Product API

```text
GET    /api/products
POST   /api/products
GET    /api/products/:id
PATCH  /api/products/:id
PATCH  /api/products/:id/price
```

Price update memiliki endpoint khusus karena perubahan harga memiliki side effect berupa pembuatan price history.

---

# 37. Price History API

```text
GET /api/products/:id/price-history
```

Endpoint ini bersifat read-only.

---

# 38. Display API

```text
GET /api/display/prices
POST /api/display/register
POST /api/display/heartbeat
```

Display API hanya mengembalikan data yang benar-benar dibutuhkan oleh display.

Contoh response:

```json
{
  "updated_at": "2026-09-05T08:32:00Z",
  "categories": [
    {
      "id": 1,
      "name": "Pakan Ayam",
      "products": [
        {
          "id": 10,
          "name": "Bravo 511",
          "price": 395000
        },
        {
          "id": 11,
          "name": "Bravo 512",
          "price": 405000
        }
      ]
    }
  ]
}
```

---

# 39. API Error Response Format

Seluruh endpoint di bawah `/api/*` (termasuk Display API) harus mengembalikan format error yang konsisten, supaya frontend dapat menanganinya dengan cara yang seragam.

Contoh format response error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Selling price harus lebih besar atau sama dengan 0"
  }
}
```

Kategori error minimum yang digunakan:

* `VALIDATION_ERROR` (HTTP 400/422) — input tidak valid.
* `UNAUTHORIZED` (HTTP 401) — belum login atau token tidak valid/kedaluwarsa.
* `FORBIDDEN` (HTTP 403) — tidak memiliki akses ke resource yang diminta.
* `NOT_FOUND` (HTTP 404) — data yang diminta tidak ditemukan.
* `SERVER_ERROR` (HTTP 500) — kesalahan tak terduga pada server.

Format ini berlaku sama untuk seluruh module (Authentication, Categories, Products, Price History, Display).

---

# 40. Next.js Application Structure

Struktur konseptual:

```text
src/
│
├── app/
│   ├── login/
│   │
│   ├── products/
│   │
│   ├── categories/
│   │
│   ├── price-history/
│   │
│   ├── display/
│   │
│   └── api/
│       ├── auth/
│       ├── products/
│       ├── categories/
│       ├── price-history/
│       └── display/
│
├── components/
│   ├── ui/
│   ├── products/
│   ├── categories/
│   └── display/
│
├── lib/
│   ├── auth/
│   ├── db/
│   ├── validation/
│   └── utils/
│
└── ...
```

Struktur final dapat berubah, menyesuaikan ORM dan authentication library yang dipilih nantinya.

---

# 41. Separation of Concerns

Meskipun menggunakan monolith, pemisahan tanggung jawab secara logis tetap harus diterapkan.

```text
UI
 │
 ▼
API / Server Actions
 │
 ▼
Business Logic
 │
 ▼
Database Layer
 │
 ▼
MySQL
```

UI tidak boleh mengakses database secara langsung.

Business rules juga sebaiknya tidak diletakkan hanya di sisi client.

---

# 42. Single Source of Truth

MySQL menjadi single source of truth untuk seluruh current prices.

```text
                    MySQL
                      ▲
                      │
              ┌───────┴───────┐
              │               │
           Owner           Display
              │               │
           Update          Read
```

Tidak ada database harga terpisah yang disimpan pada device mana pun.

---

# 43. Display URL

Display dapat diakses melalui route khusus.

Contoh:

```text
/display/<display-id>
```

atau menggunakan pairing mechanism untuk mendapatkan device identity.

Display URL tidak boleh memberikan akses apa pun ke owner interface.

---

# 44. Display State

Display harus memiliki salah satu state berikut:

```text
ONLINE
OFFLINE
SYNCING
ERROR
```

Contoh:

```text
ONLINE
Last sync: 08:32
```

Jika network gagal:

```text
OFFLINE
Last sync: 08:32
```

Data terakhir tetap ditampilkan pada layar.

---

# 45. Security

Kebutuhan keamanan minimum:

* Password menggunakan secure hashing.
* HTTPS pada environment production.
* Owner routes dilindungi (protected).
* API authorization dilakukan di sisi server.
* Input validation diterapkan secara konsisten.
* SQL injection protection melalui ORM/parameterized queries.
* Display token tidak menggunakan password owner.
* Display token dapat direvoke sewaktu-waktu.
* Database tidak boleh diekspos langsung ke internet publik.
* Reset password (dashboard) membutuhkan verifikasi password lama.

---

# 46. Data Validation

Validasi wajib dilakukan di sisi server pada **seluruh** endpoint yang menerima input dari owner, tanpa terkecuali. Client-side validation boleh ditambahkan untuk kepentingan UX, tetapi tidak menggantikan validasi server.

Aturan minimum per entitas:

```text
Category name:
required, unique untuk kategori yang aktif

Product name:
required

Category (relasi produk):
harus merujuk ke kategori yang valid/ada

Selling price:
integer / decimal
>= 0, tidak boleh kosong

Display order:
integer
>= 0

Display device name:
required

Password baru (reset password):
required, memenuhi panjang minimum yang wajar
```

Setiap kegagalan validasi harus mengembalikan response error sesuai format pada Section 39, disertai pesan yang jelas mengenai field mana yang bermasalah.

---

# 47. Error Handling

Setiap fitur (Authentication, Categories, Products, Price Management, Display) harus memiliki penanganan error yang konsisten, baik di sisi API maupun UI.

Prinsip dasar:

* Error dari API mengikuti format yang sudah didefinisikan pada Section 39.
* UI owner menampilkan pesan error yang jelas dan actionable, bukan pesan teknis mentah.
* Kegagalan pada price update transaction melakukan rollback (lihat Section 32) dan menampilkan pesan error ke owner — bukan silent fail.
* Kegagalan sinkronisasi pada display tidak menghapus data terakhir yang sudah tampil (lihat Section 15).
* Error pada satu fitur tidak boleh membuat seluruh aplikasi crash.

V1 tidak membutuhkan sistem monitoring/alerting terpisah. Fokus V1 adalah memastikan setiap fitur gagal dengan aman (*fail safely*) dan memberi informasi yang cukup bagi owner. Penyempurnaan lebih lanjut (logging terpusat, monitoring, dsb.) dapat dipertimbangkan pada versi berikutnya.

---

# 48. Performance

V1 memiliki jumlah produk yang relatif kecil.

Target performa:

* Fast owner interface.
* Fast display loading.
* Simple API response.
* Efficient database queries.
* Minimal polling frequency.

Hal-hal berikut belum diperlukan pada V1:

* Distributed caching.
* Redis.
* Elasticsearch.
* Message queue.

Database indexing tetap diterapkan pada field yang sering digunakan untuk lookup/filter.

---

# 49. Reliability

Prioritas reliability, dari yang tertinggi:

1. Database consistency.
2. Display availability.
3. Offline display behavior.
4. Safe price updates.
5. Data backup.

Price update harus bersifat transactional.

Display harus memiliki fallback ke last known data.

---

# 50. Backup

Database harus memiliki mekanisme backup rutin.

Minimum yang dibutuhkan:

* Automated MySQL backup.
* Retention policy.
* Backup verification.

Strategi backup secara detail akan ditentukan pada tahap deployment.

---

# 51. Deployment

V1 menggunakan single application deployment.

Konsepnya sebagai berikut:

```text
                  Internet
                     │
                     ▼
              Reverse Proxy
                     │
                     ▼
              Next.js Server
                     │
                     ▼
                  MySQL
```

Frontend dan backend dideploy sebagai satu aplikasi.

Database dapat ditempatkan:

* Pada server yang sama, untuk environment sederhana, atau
* Pada managed/database server terpisah, untuk kebutuhan production.

Untuk V1, Kubernetes tidak diperlukan.

---

# 52. Environment

Minimal environment yang dibutuhkan:

```text
Development
Production
```

Environment variables digunakan untuk:

```text
DATABASE_URL
AUTH_SECRET
APP_URL
DISPLAY_TOKEN_SECRET
SESSION_MAX_AGE
```

`SESSION_MAX_AGE` menentukan durasi sesi owner (dalam detik) sebelum diminta login kembali. Nilai ini tidak boleh di-hardcode di kode aplikasi.

Secret tidak boleh disimpan di dalam source code.

---

# 53. Development Phases

## Phase 1 — Project Foundation

* Next.js project.
* React UI.
* MySQL connection.
* ORM setup.
* Database migrations.
* Basic application layout.

## Phase 2 — Authentication

* Owner login.
* Session management.
* Session expiry (via env).
* Reset password (in-dashboard).
* Protected routes.
* Logout.

## Phase 3 — Category Management

* Category list.
* Create.
* Edit.
* Activate/deactivate.
* Display order.
* Validation & error handling.

## Phase 4 — Product Management

* Product list.
* Search.
* Create.
* Edit.
* Activate/deactivate.
* Display order.
* Validation & error handling.

## Phase 5 — Price Management

* Quick price edit.
* Price validation.
* Price transaction.
* Price history.
* Error handling (rollback & pesan error).

## Phase 6 — Display

* Display page.
* Category grouping.
* Price formatting.
* Fullscreen layout.
* Automatic polling.

## Phase 7 — Display Devices

* Device registration.
* Device token.
* Device status.
* Last seen.

## Phase 8 — Reliability

* Local display cache.
* Offline state.
* Last sync.
* Error handling (display sync failure).

## Phase 9 — Production

* Production deployment.
* HTTPS.
* MySQL backup.
* Environment configuration.
* Initial store setup.

---

# 54. V1 Definition of Done

### Authentication

* [ ] Owner dapat login.
* [ ] Owner dapat logout.
* [ ] Owner dapat mengganti password sendiri melalui dashboard.
* [ ] Session memiliki expiry yang dikonfigurasi via environment variable.
* [ ] Owner routes terlindungi.

### Categories

* [ ] Create category.
* [ ] Edit category.
* [ ] Activate/deactivate category.
* [ ] Set display order.

### Products

* [ ] Create product.
* [ ] Edit product.
* [ ] Search product.
* [ ] Activate/deactivate product.
* [ ] Set display order.

### Prices

* [ ] View current price.
* [ ] Change price.
* [ ] Price validation.
* [ ] Price history.
* [ ] Record changed_by.
* [ ] Record timestamp.
* [ ] Transactional update.

### Display

* [ ] Display active products.
* [ ] Group by category.
* [ ] Show selling price.
* [ ] Show last updated.
* [ ] Automatic synchronization.
* [ ] Fullscreen friendly.
* [ ] Offline fallback.

### Display Devices

* [ ] Register display.
* [ ] Unique display identity.
* [ ] Display token.
* [ ] Revoke/deactivate display.
* [ ] Last seen status.

### Validation & Error Handling

* [ ] Validasi server diterapkan pada seluruh endpoint.
* [ ] API mengembalikan format error yang konsisten (Section 39).
* [ ] UI menampilkan pesan error yang jelas untuk setiap fitur.

### Production

* [ ] HTTPS.
* [ ] Environment variables.
* [ ] MySQL backup.
* [ ] Production deployment.

---

# 55. Future Possibilities

Fitur berikut bukan bagian dari V1:

* Forgot password via email/OTP.
* Multiple price levels.
* Wholesale price.
* Customer/member price.
* Inventory.
* POS integration.
* Supplier management.
* Supplier price tracking.
* Price change notification.
* Excel import.
* Bulk price update.
* Multiple stores.
* Multiple owners/users.
* Product images.
* QR code lookup.
* WhatsApp notification.
* Sales analytics.

Fitur-fitur di masa depan harus ditambahkan berdasarkan kebutuhan nyata, bukan sekadar untuk memperbesar scope aplikasi.

---

# 56. Product Philosophy

V1 berpegang pada prinsip:

> **One source of truth for store selling prices.**

Owner cukup mengubah harga satu kali.

Penjaga toko akan selalu melihat harga yang terbaru.

```text
                 OWNER
                   │
                   │ Update Price
                   ▼
           ┌───────────────┐
           │  NEXT.JS APP  │
           └───────┬───────┘
                   │
                   ▼
                MySQL
                   │
                   │ Latest Price
                   ▼
           ┌───────────────┐
           │ STORE DISPLAY │
           └───────────────┘
                   │
                   ▼
             STORE STAFF
```

Tujuan utama V1 bukan membangun sistem toko yang kompleks.

Tujuan V1 adalah menghilangkan satu masalah spesifik:

> **Harga sudah berubah, tetapi catatan harga belum ikut berubah.**
