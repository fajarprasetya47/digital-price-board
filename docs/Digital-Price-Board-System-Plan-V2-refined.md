# Digital Price Board — System Plan V2

## 1. Overview

V2 merupakan pengembangan dari **Digital Price Board V1.2** yang telah selesai dikembangkan dan berjalan.

V2 tidak mengubah tujuan utama aplikasi:

> **One source of truth for store selling prices.**

Fokus V2 adalah meningkatkan fleksibilitas dan scalability pada sisi **display**.

V2 memiliki dua fokus utama:

1. **Per-device category selection**
2. **Automatic display page rotation untuk jumlah produk yang besar**

---

# 2. Baseline

V2 dikembangkan di atas codebase V1.2.

Seluruh fitur V1.2 yang sudah tersedia harus tetap berfungsi seperti semula; V2 tidak boleh mengubah behavior yang sudah berjalan di V1.2.

Baseline V1.2 mencakup:

* Owner authentication.
* Product management.
* Category management.
* Price management.
* Price history.
* Display devices.
* Display token authentication.
* Display price endpoint.
* Display UI.
* Automatic display synchronization.
* Offline display fallback.
* Session expiry.
* Owner password reset dari dashboard.
* Centralized API error response.
* Server-side validation.

V2 harus mempertahankan backward compatibility terhadap data dan device yang sudah ada.

---

# 3. V2 Goals

V2 memiliki dua tujuan utama.

## Goal 1 — Per-device Category Selection

Owner dapat menentukan kategori mana yang ditampilkan oleh masing-masing display device.

Contoh:

```text
Monitor Kasir
├── Pakan Ayam
└── Vitamin
```

sementara display lain dapat memiliki:

```text
Tablet Gudang
├── Pakan Ikan
├── Pakan Ayam
└── Vitamin
```

Setiap display memiliki konfigurasi kategori masing-masing.

## Goal 2 — Display Pagination

Display harus dapat menampilkan produk dalam beberapa halaman apabila jumlah produk terlalu banyak untuk satu layar.

Contoh:

```text
Page 1 / 3
Pakan Ayam
...

Page 2 / 3
Pakan Ikan
...

Page 3 / 3
Vitamin
...
```

Halaman berganti otomatis berdasarkan interval yang dikonfigurasi.

---

# 4. V2 Scope

## In Scope

### Stage 1

* Display device category configuration.
* Display device mode:

  * All categories.
  * Selected categories.
* Category selection UI.
* Server-side category filtering.
* Display device category persistence.
* Backward compatibility untuk existing display devices.

### Stage 2

* Display pagination.
* Automatic page rotation.
* Configurable rotation interval.
* Responsive page calculation.
* Dynamic page sizing berdasarkan viewport.
* 2-column desktop grid.
* 1-column layout untuk layar kecil.
* Category splitting jika category terlalu besar.
* Rotation pause ketika search aktif.
* Static mode ketika seluruh data dapat dimuat dalam satu layar.
* Basic page indicator.
* Preparation untuk future scrolling/marquee mode.

---

# 5. Out of Scope

V2 tidak mencakup:

* Highlight harga berubah.
* Price change notification.
* Multi-level pricing.
* Wholesale pricing.
* Inventory.
* POS.
* Supplier management.
* Sales reporting.
* Multiple stores.
* Native TV application.
* Real-time WebSocket synchronization.
* Marquee/scroller implementation.
* Automatic content scheduling.
* Per-category rotation interval.

---

# 6. V2 Architecture

V2 tetap menggunakan architecture V1.2.

```text
                    Owner Device
                    HP / Tablet
                         │
                         ▼
                  ┌─────────────┐
                  │   Next.js   │
                  │ Application │
                  └──────┬──────┘
                         │
                         ▼
                      MySQL
                         │
                ┌────────┴────────┐
                │                 │
                ▼                 ▼
          Display Device A  Display Device B
                │                 │
                ▼                 ▼
             Filter A          Filter B
                │                 │
                └────────┬────────┘
                         ▼
                  Display Screen
                         │
                         ▼
                   Pagination
```

Tidak ada perubahan dari monolithic architecture menjadi microservices.

---

# 7. Stage 1 — Per-device Category Selection

## 7.1 Problem

Pada V1.2, display mengambil seluruh kategori yang tersedia.

Hal ini menjadi kurang fleksibel ketika toko memiliki banyak kategori.

Contoh:

```text
Pakan Ayam
Pakan Ikan
Pakan Burung
Vitamin
Obat
Aksesoris
```

Namun monitor tertentu mungkin hanya dibutuhkan untuk:

```text
Pakan Ayam
Pakan Ikan
```

V2 memungkinkan konfigurasi tersebut dilakukan per display device.

---

# 8. Display Category Configuration

Setiap display memiliki dua mode:

```text
ALL_CATEGORIES
SELECTED_CATEGORIES
```

Secara database, mode ini direpresentasikan dengan:

```text
showAllCategories = true
```

atau:

```text
showAllCategories = false
```

Jika:

```text
showAllCategories = true
```

display mengambil seluruh kategori yang memenuhi aturan display.

Jika:

```text
showAllCategories = false
```

display hanya mengambil kategori yang telah dipilih.

---

# 9. Data Model Changes

## DisplayDevice

Tambahkan:

```text
showAllCategories Boolean @default(true)
```

dan relationship:

```text
categories DisplayCategory[]
```

## DisplayCategory

Gunakan relationship many-to-many dengan `DisplayDevice`.

Concept:

```text
DisplayDevice
      │
      │ M:N
      │
      ▼
Category
```

Satu display dapat memiliki banyak kategori.

Satu kategori dapat digunakan oleh banyak display.

---

# 10. Database Relationship

Conceptual relationship:

```text
DisplayDevice
      │
      │
      │ M:N
      ▼
Category
```

Contoh:

```text
Display A
├── Pakan Ayam
└── Vitamin

Display B
├── Pakan Ikan
└── Pakan Ayam
```

Kategori yang sama dapat digunakan oleh beberapa display tanpa membuat kategori duplikat.

---

# 11. Prisma Schema Changes

File:

```text
prisma/schema.prisma
```

Perubahan:

```text
DisplayDevice
├── showAllCategories Boolean @default(true)
└── categories DisplayCategory[]

DisplayCategory
└── displayDevices DisplayDevice[]
```

Relationship menggunakan implicit many-to-many relation Prisma.

Migration:

```bash
npx prisma migrate dev --name display_category_selection
```

Migration akan membuat tabel join yang diperlukan Prisma.

---

# 12. Backward Compatibility

Existing display devices harus tetap menampilkan data yang sama setelah deployment V2.

Untuk device existing:

```text
showAllCategories = true
```

Artinya:

```text
Existing Device
      │
      ▼
All Categories
```

Owner belum perlu melakukan konfigurasi ulang.

Behavior existing display tetap sama sampai owner memilih kategori tertentu.

---

# 13. Display Authentication Changes

File:

```text
src/lib/auth/display-token.ts
```

`authenticateDisplay` harus mengambil konfigurasi kategori display.

Conceptual select:

```text
{
  id,
  name,
  showAllCategories,
  categories: {
    select: {
      id
    }
  }
}
```

Authentication result menjadi:

```text
{
  id,
  name,
  showAllCategories,
  categoryIds
}
```

`categoryIds` digunakan oleh display API untuk menentukan kategori yang boleh ditampilkan.

---

# 14. Display Price API Changes

Endpoint:

```text
GET /api/display/prices
```

Filtering dilakukan pada server.

## All Categories

Jika:

```text
showAllCategories = true
```

maka API mengambil seluruh kategori yang berhak ditampilkan pada display.

## Selected Categories

Jika:

```text
showAllCategories = false
```

maka query menggunakan category IDs milik display.

Concept:

```text
where:
{
  category:
  {
    id:
    {
      in: categoryIds
    }
  }
}
```

---

# 15. Display API Response Compatibility

Response structure **tidak berubah**.

Tujuannya:

> DisplayScreen tidak perlu mengetahui apakah filtering berasal dari "all categories" atau "selected categories".

Server bertanggung jawab menentukan data yang boleh ditampilkan.

Concept:

```text
Display Device
      │
      ▼
authenticateDisplay()
      │
      ▼
categoryIds
      │
      ▼
GET /api/display/prices
      │
      ▼
Filtered Data
      │
      ▼
Existing Display Response
```

Dengan demikian Stage 1 tidak memerlukan perubahan besar pada rendering display.

---

# 16. Display Device Update API

Endpoint:

```text
PATCH /api/display/devices/[id]
```

Update schema diperluas untuk menerima:

```text
showAllCategories
categoryIds
```

Conceptual request:

```json
{
  "showAllCategories": false,
  "categoryIds": [1, 3]
}
```

---

# 17. Category Selection Validation

Server harus melakukan validasi terhadap `categoryIds`.

Requirements:

* Harus berupa array.
* ID harus valid.
* ID duplikat harus dihapus.
* Category IDs harus benar-benar ada di database.
* Kategori yang nonaktif harus diperlakukan sesuai business rule.
* Jika `showAllCategories = false`, minimal satu kategori harus dipilih.

Jika tidak ada kategori yang dipilih:

```text
showAllCategories = false
categoryIds = []
```

maka API mengembalikan:

```text
HTTP 422
```

dengan error code:

```text
VALIDATION_ERROR
```

---

# 18. Category Assignment Update

Penggantian category list dilakukan secara atomic.

Concept:

```text
categories:
{
  set: [
    { id: 1 },
    { id: 3 }
  ]
}
```

Dengan demikian konfigurasi sebelumnya digantikan seluruhnya oleh konfigurasi baru.

Contoh:

```text
Before:
[1, 2, 4]

After:
[1, 3]

Result:
[1, 3]
```

Tidak dilakukan incremental add/remove secara manual.

---

# 19. Display Device List API

Endpoint:

```text
GET /api/display/devices
```

DTO harus diperluas untuk mengembalikan:

```text
showAllCategories
categoryIds
categories
```

Category data untuk UI minimal:

```text
{
  id,
  name
}
```

Conceptual DTO:

```json
{
  "id": 1,
  "name": "Monitor Kasir",
  "showAllCategories": false,
  "categoryIds": [1, 3],
  "categories": [
    {
      "id": 1,
      "name": "Pakan Ayam"
    },
    {
      "id": 3,
      "name": "Vitamin"
    }
  ]
}
```

---

# 20. API Types

File:

```text
src/lib/api-types.ts
```

`DisplayDeviceDto` harus diperluas.

Minimum fields:

```text
showAllCategories
categoryIds
categories
```

DTO harus konsisten antara server dan client.

---

# 21. Owner UI — Display Device Manager

File:

```text
src/components/display/device-manager.tsx
```

Setiap display device mendapatkan tombol aksi:

> **Atur Kategori**

Contoh:

```text
Monitor Kasir
Status: Active

[ Atur Kategori ]
```

---

# 22. Category Configuration Modal

Ketika owner memilih:

> Atur Kategori

muncul modal.

```text
┌─────────────────────────────────┐
│ Atur Kategori                   │
│                                 │
│ ◉ Semua kategori                │
│ ○ Kategori tertentu             │
│                                 │
│ ─────────────────────────────── │
│                                 │
│ ☐ Pakan Ayam                    │
│ ☐ Pakan Ikan                    │
│ ☐ Pakan Burung                  │
│ ☐ Vitamin                       │
│                                 │
│             [ Batal ] [ Simpan ]│
└─────────────────────────────────┘
```

---

# 23. Category Mode Behavior

## All Categories

Jika owner memilih:

```text
◉ Semua kategori
```

checkbox kategori tidak perlu menjadi input aktif.

Saat disimpan:

```text
showAllCategories = true
```

Category assignment dapat dikosongkan karena tidak digunakan ketika mode all categories aktif.

## Selected Categories

Jika owner memilih:

```text
◉ Kategori tertentu
```

checkbox kategori menjadi aktif.

Minimal satu kategori harus dipilih.

Saat disimpan:

```text
showAllCategories = false
categoryIds = [...]
```

---

# 24. Category List in Modal

Category diambil melalui:

```text
GET /api/categories
```

UI hanya perlu menampilkan kategori aktif.

Sorting:

```text
displayOrder ASC
```

Tujuannya agar urutan pilihan konsisten dengan urutan kategori pada display.

---

# 25. Display Device Row Summary

Setelah konfigurasi disimpan, row display harus memberikan summary.

Jika:

```text
showAllCategories = true
```

tampilkan:

```text
Semua kategori
```

Jika selected:

```text
Pakan Ayam, Vitamin
```

Jika banyak:

```text
Pakan Ayam, Vitamin +2 lainnya
```

Tujuannya agar owner dapat melihat konfigurasi tanpa membuka modal kembali.

---

# 26. Stage 1 User Flow

```text
Owner
  │
  ▼
Display Devices
  │
  ▼
Pilih device
  │
  ▼
Atur Kategori
  │
  ├── Semua kategori
  │
  └── Kategori tertentu
          │
          ▼
     Select categories
          │
          ▼
        Simpan
          │
          ▼
     PATCH Device
          │
          ▼
    Configuration saved
          │
          ▼
     Display polling
          │
          ▼
    Filtered display
```

---

# 27. Stage 1 Acceptance Criteria

Stage 1 selesai jika:

* [ ] Existing display device tetap menampilkan semua kategori.
* [ ] `showAllCategories` default `true`.
* [ ] Owner dapat memilih "Semua kategori".
* [ ] Owner dapat memilih "Kategori tertentu".
* [ ] Owner dapat memilih satu atau lebih kategori.
* [ ] ID kategori duplikat tidak disimpan.
* [ ] ID kategori yang tidak valid ditolak.
* [ ] Selected mode tanpa kategori ditolak dengan HTTP 422.
* [ ] Display API melakukan filtering server-side.
* [ ] Display response structure tidak berubah.
* [ ] Display UI existing tetap dapat digunakan.
* [ ] Display device list menampilkan konfigurasi kategori.
* [ ] Owner dapat mengubah konfigurasi kategori kapan saja.

---

# 28. Stage 2 — Display Pagination

## Problem

Jumlah produk dapat bertambah sampai tidak seluruhnya dapat ditampilkan pada satu layar.

Contoh:

```text
50+ Products
      │
      ▼
One viewport tidak cukup
      │
      ▼
Content overflow
```

V2 menyelesaikan masalah ini dengan pagination otomatis.

---

# 29. Display Modes

V2 memperkenalkan konfigurasi display mode.

Environment variable:

```text
DISPLAY_MODE
```

Default:

```text
pages
```

V2 hanya mengimplementasikan:

```text
pages
```

Future:

```text
scroller
```

---

# 30. Rotation Interval

Environment variable:

```text
DISPLAY_ROTATE_SECONDS
```

Default:

```text
10
```

Artinya halaman berganti setiap 10 detik.

Contoh:

```text
Page 1
   ↓ 10 sec
Page 2
   ↓ 10 sec
Page 3
   ↓ 10 sec
Page 1
```

---

# 31. Environment Configuration

Tambahkan konfigurasi ke:

```text
docker-compose.yml
.env.example
README
```

Example:

```text
DISPLAY_MODE=pages
DISPLAY_ROTATE_SECONDS=10
```

`docker-entrypoint.sh` tidak perlu diubah.

---

# 32. Display Rendering Flow

Display page:

```text
/display/[token]
```

Server page membaca environment configuration.

Concept:

```text
Environment
    │
    ├── DISPLAY_MODE
    │
    └── DISPLAY_ROTATE_SECONDS
             │
             ▼
       DisplayScreen
             │
             ▼
       Render strategy
```

DisplayScreen menerima configuration sebagai props.

---

# 33. Pagination Responsibility

Pagination dilakukan pada client/display layer.

Server tetap bertanggung jawab untuk:

* Authentication.
* Category filtering.
* Product filtering.
* Returning display data.

Client bertanggung jawab untuk:

* Mengukur viewport.
* Menghitung kapasitas halaman.
* Membagi data menjadi pages.
* Rotasi halaman.
* Transition.
* Pause ketika search aktif.

---

# 34. Pagination Data Source

Pagination harus menggunakan **hasil akhir filtering dari Stage 1**.

Urutannya:

```text
Database
   ↓
Display Authentication
   ↓
Category Filtering
   ↓
Display API Response
   ↓
DisplayScreen
   ↓
Pagination
   ↓
Pages
```

Pagination tidak boleh mengambil seluruh product database secara langsung.

---

# 35. Responsive Layout

Desktop:

```text
2 columns
```

Small screen:

```text
1 column
```

Concept:

```text
Desktop

┌──────────────┬──────────────┐
│ Product      │ Product      │
│ Product      │ Product      │
│ Product      │ Product      │
└──────────────┴──────────────┘
```

Small screen:

```text
┌──────────────────────────────┐
│ Product                      │
│ Product                      │
│ Product                      │
└──────────────────────────────┘
```

---

# 36. Dynamic Page Calculation

Display harus menghitung jumlah item yang dapat ditampilkan berdasarkan viewport aktual.

Tidak menggunakan jumlah item fixed seperti:

```text
10 products per page
```

karena ukuran layar dapat berbeda.

Contoh:

```text
Screen A
1920 × 1080
→ 14 products/page

Screen B
1366 × 768
→ 10 products/page

Screen C
800 × 600
→ 6 products/page
```

Angka di atas merupakan contoh saja.

Kapasitas aktual dihitung berdasarkan layout yang dirender.

---

# 37. ResizeObserver

Display menggunakan `ResizeObserver` untuk mendeteksi perubahan ukuran layout.

Trigger yang dapat menyebabkan recalculation:

* Browser resize.
* Orientation change.
* TV resolution change.
* Window resize.
* Responsive breakpoint change.

Flow:

```text
Viewport Change
      │
      ▼
ResizeObserver
      │
      ▼
Recalculate capacity
      │
      ▼
Rebuild pages
      │
      ▼
Adjust current page
```

---

# 38. Category Splitting

Satu kategori tidak harus selalu berada dalam satu halaman.

Contoh:

```text
Pakan Ayam
50 products
```

Jika satu halaman hanya dapat memuat 12 product:

```text
Page 1
Pakan Ayam
Product 1–12

Page 2
Pakan Ayam
Product 13–24

Page 3
Pakan Ayam
Product 25–36

Page 4
Pakan Ayam
Product 37–48

Page 5
Pakan Ayam
Product 49–50
```

Kategori boleh berlanjut ke halaman berikutnya.

---

# 39. Page Building Algorithm

Conceptual algorithm:

```text
Input:
Filtered categories + products
        │
        ▼
Measure available viewport
        │
        ▼
Determine grid capacity
        │
        ▼
Iterate categories/products
        │
        ▼
Fill current page
        │
        ├── Capacity available
        │       ↓
        │     Continue
        │
        └── Capacity full
                ↓
            Create page
                ↓
            Continue
```

Algoritma ini harus mampu menangani:

* Banyak kategori.
* Kategori besar.
* Kategori kecil.
* Kategori yang berpindah halaman.
* Perubahan viewport.

---

# 40. Static Mode

Jika seluruh data dapat ditampilkan dalam satu halaman:

```text
pages.length === 1
```

maka rotation tidak diperlukan.

Display tetap statis.

Contoh:

```text
10 products
Screen capacity: 20

Result:
1 page
No rotation
```

Ini mencegah animasi yang tidak diperlukan.

---

# 41. Auto Rotation

Jika:

```text
pages.length > 1
```

maka rotation aktif.

Concept:

```text
Page 1
  │
  │ 10 sec
  ▼
Page 2
  │
  │ 10 sec
  ▼
Page 3
  │
  │ 10 sec
  ▼
Page 1
```

Rotation harus berjalan secara loop.

---

# 42. Rotation Pause During Search

Ketika user melakukan search:

```text
Search active = true
```

rotation harus dihentikan.

Concept:

```text
Normal
   │
   ▼
Auto rotation

Search activated
   │
   ▼
Pause rotation
   │
   ▼
User sees search result
```

Ketika search dibersihkan:

```text
Search cleared
   │
   ▼
Resume normal display
```

---

# 43. Page Transition

V2 menggunakan transition sederhana:

* Slide, atau
* Fade.

Tujuannya membuat pergantian halaman tidak terasa abrupt.

Tidak perlu animation yang kompleks.

Transition harus:

* Smooth.
* Ringan.
* Tidak mengganggu readability.
* Tidak menyebabkan layout overflow.

---

# 44. Page Indicator

Display dapat menunjukkan indicator sederhana:

```text
Page 1 / 3
```

atau:

```text
● ○ ○
```

Indicator harus bersifat subtle dan tidak mengganggu informasi harga.

---

# 45. Display State During Recalculation

Ketika viewport berubah:

```text
Resize
   ↓
Recalculate pages
   ↓
Render new page structure
```

Display tidak boleh:

* Menampilkan layar kosong (blank).
* Menampilkan produk duplikat.
* Menghilangkan produk.
* Menampilkan halaman kosong.

Current page harus disesuaikan dengan jumlah page baru.

Contoh:

```text
Before:
Page 4 / 4

After resize:
Only 2 pages

Result:
Page 2 / 2
```

---

# 46. Data Refresh + Pagination

Ketika polling mendapatkan data baru:

```text
New Display Data
      │
      ▼
Update data state
      │
      ▼
Recalculate pages
      │
      ▼
Continue rotation
```

Pagination harus selalu menggunakan data terbaru.

Jika perubahan data menyebabkan jumlah page berubah, current page harus dinormalisasi.

---

# 47. Rotation Timer Safety

Rotation timer harus dikelola dengan benar agar tidak terjadi:

* Multiple interval.
* Memory leak.
* Rotation setelah component unmount.
* Rotation ketika search aktif.
* Multiple page transitions sekaligus.

Ketika display component di-unmount:

```text
clear timer
```

Ketika search aktif:

```text
pause timer
```

Ketika search selesai:

```text
resume timer
```

---

# 48. Future Scroller Mode

V2 hanya mengimplementasikan:

```text
DISPLAY_MODE=pages
```

Namun architecture harus memungkinkan future mode:

```text
DISPLAY_MODE=scroller
```

Concept:

```text
DisplayScreen
      │
      ▼
Display Mode
      │
 ┌────┴────┐
 ▼         ▼
pages    scroller
```

Scroller/marquee tidak diimplementasikan pada V2.

---

# 49. Stage 2 Acceptance Criteria

Stage 2 selesai jika:

* [ ] Default `DISPLAY_MODE=pages`.
* [ ] Default rotation interval 10 seconds.
* [ ] Environment configuration terdokumentasi.
* [ ] Display dapat membagi data menjadi beberapa halaman.
* [ ] Desktop menggunakan 2-column layout.
* [ ] Small screen menggunakan 1-column layout.
* [ ] Pagination mengikuti ukuran viewport.
* [ ] ResizeObserver digunakan untuk recalculation.
* [ ] Kategori besar dapat terpecah ke beberapa halaman.
* [ ] Tidak ada produk yang hilang dari pagination.
* [ ] Tidak ada produk duplikat.
* [ ] Jika semua produk muat dalam satu layar, display tetap statis.
* [ ] Jika lebih dari satu halaman, auto rotation aktif.
* [ ] Rotation menggunakan configured interval.
* [ ] Search menghentikan rotation.
* [ ] Search selesai → display kembali ke mode normal.
* [ ] Page transition berjalan tanpa layout overflow.
* [ ] Page indicator tersedia.
* [ ] Resize tidak menyebabkan blank page.
* [ ] Data baru dari polling menyebabkan pagination dihitung ulang.
* [ ] Timer tidak menyebabkan memory leak atau duplicate interval.
* [ ] Architecture dapat diperluas ke future scroller mode.

---

# 50. Files Expected to Change

## Stage 1

### Database

```text
prisma/schema.prisma
```

### Authentication

```text
src/lib/auth/display-token.ts
```

### API

```text
src/app/api/display/prices/...
src/app/api/display/devices/[id]/...
src/app/api/display/devices/...
```

### Shared Types

```text
src/lib/api-types.ts
```

### Owner UI

```text
src/components/display/device-manager.tsx
```

### Migration

```text
prisma/migrations/...
```

---

## Stage 2

### Display Page

```text
src/app/display/[token]/page.tsx
```

### Display Screen

```text
src/components/display/display-screen.tsx
```

### New Layout Component

```text
src/components/display/paged-grid.tsx
```

### Configuration

```text
docker-compose.yml
.env.example
README.md
```

No change required:

```text
docker-entrypoint.sh
```

---

# 51. Testing Strategy

Testing V2 dilakukan pada dua stage secara terpisah.

## Stage 1

### Test 1 — Existing Device

Device existing:

```text
showAllCategories = true
```

Expected:

```text
All categories returned
```

### Test 2 — Selected Categories

Set device:

```text
showAllCategories = false
categoryIds = [1, 3]
```

Expected:

```text
Only category 1 and 3 returned
```

### Test 3 — Invalid Category

Request:

```text
categoryIds = [999999]
```

Expected:

```text
422 VALIDATION_ERROR
```

### Test 4 — Empty Selection

Request:

```text
showAllCategories = false
categoryIds = []
```

Expected:

```text
422 VALIDATION_ERROR
```

### Test 5 — Duplicate IDs

Request:

```text
categoryIds = [1, 1, 3, 3]
```

Expected:

```text
[1, 3]
```

### Test 6 — Multiple Displays

Display A:

```text
Categories [1, 2]
```

Display B:

```text
Categories [3, 4]
```

Expected each display receives its own data set.

---

# 52. Stage 2 Display Testing

Test dengan:

```text
50+ products
```

Verify:

* Page creation.
* Rotation.
* Category splitting.
* Page indicator.
* Search pause.
* Search resume.
* Resize behavior.
* Static mode.

---

# 53. Build Verification

Minimum verification:

```bash
npm run db:migrate
```

Prisma client regeneration sesuai package configuration.

Kemudian:

```bash
npm run lint
npm run build
```

Application harus dapat:

* Compile.
* Pass lint.
* Start successfully.
* Connect to MySQL.
* Authenticate owner.
* Authenticate display.
* Render display.

---

# 54. Integration Verification

Minimum integration flow:

```text
Login Owner
    ↓
Display Devices
    ↓
Select one device
    ↓
Set specific categories
    ↓
PATCH device
    ↓
Open display
    ↓
GET display prices
    ↓
Verify filtering
```

Expected:

```text
Device A
showAllCategories=false
categoryIds=[1,3]

→ Display only contains categories 1 and 3
```

Existing device:

```text
showAllCategories=true

→ Display still contains all categories
```

---

# 55. Display Stress Test

Gunakan dataset minimal:

```text
50+ products
```

Test:

* 1920×1080.
* 1366×768.
* Smaller viewport.
* Browser resize.
* Refresh.
* Search.
* Network reconnect.
* Data update during rotation.

Expected:

* Tidak ada blank page.
* Tidak ada produk duplikat.
* Tidak ada produk yang hilang.
* Rotation tetap stabil.
* Resize menghasilkan pagination baru.
* Display tetap menggunakan data terbaru.

---

# 56. Deployment Considerations

V2 tetap menggunakan deployment architecture V1.2.

```text
                Internet
                   │
                   ▼
             Next.js Server
                   │
                   ▼
                MySQL
```

Environment configuration ditambahkan:

```text
DISPLAY_MODE=pages
DISPLAY_ROTATE_SECONDS=10
```

Tidak diperlukan perubahan infrastructure besar.

Tidak diperlukan:

* Kubernetes.
* Redis.
* WebSocket server.
* Message queue.
* Additional microservice.

---

# 57. Rollback Considerations

Stage 1 harus dapat di-rollback dengan aman.

Karena:

```text
showAllCategories
```

memiliki default:

```text
true
```

maka existing device memiliki behavior yang sama dengan V1.2.

Stage 2 juga dapat dinonaktifkan melalui:

```text
DISPLAY_MODE
```

jika implementation menyediakan mode static sebagai fallback.

Database migration harus diuji sebelum production deployment.

---

# 58. V2 Definition of Done

## Stage 1

* [ ] Per-device category configuration tersedia.
* [ ] All categories mode tersedia.
* [ ] Selected categories mode tersedia.
* [ ] M2M relationship tersedia.
* [ ] Existing devices backward compatible.
* [ ] Server-side filtering berjalan.
* [ ] Display response tetap compatible.
* [ ] Owner UI dapat mengatur kategori.
* [ ] Category summary tampil pada device row.
* [ ] Validation lengkap.
* [ ] Error handling mengikuti format V1.2.

## Stage 2

* [ ] Page mode tersedia.
* [ ] Automatic rotation tersedia.
* [ ] Rotation interval configurable.
* [ ] Responsive pagination tersedia.
* [ ] ResizeObserver digunakan.
* [ ] Desktop 2-column.
* [ ] Small screen 1-column.
* [ ] Category dapat split antar halaman.
* [ ] Static mode jika satu halaman cukup.
* [ ] Search pause rotation.
* [ ] Page transition tersedia.
* [ ] Page indicator tersedia.
* [ ] Dynamic data refresh terintegrasi.
* [ ] Rotation timer aman.
* [ ] Tidak ada memory leak.
* [ ] Future scroller mode tetap memungkinkan.

## Verification

* [ ] Database migration berhasil.
* [ ] Prisma client berhasil regenerate.
* [ ] Lint berhasil.
* [ ] Build berhasil.
* [ ] Existing device test berhasil.
* [ ] Selected category test berhasil.
* [ ] Invalid category test berhasil.
* [ ] 50+ product display test berhasil.
* [ ] Resize test berhasil.
* [ ] Search/rotation test berhasil.
* [ ] Offline behavior V1.2 tetap bekerja.

---

# 59. V2 Design Principles

V2 harus mengikuti prinsip berikut:

### 1. Backward Compatible

Perubahan V2 tidak boleh merusak behavior V1.2.

### 2. Server Owns Filtering

Backend menentukan data apa yang boleh dilihat oleh display.

### 3. Client Owns Presentation

Display menentukan bagaimana data tersebut ditampilkan pada viewport.

### 4. Configuration Over Hardcoding

Rotation interval dan display mode dikonfigurasi melalui environment.

### 5. Responsive By Design

Pagination tidak boleh bergantung pada ukuran layar tertentu.

### 6. Keep V1 Simple

V2 hanya menyelesaikan dua masalah:

> **Display-specific category selection**

dan

> **Too many products for one screen**

Tidak menambahkan fitur bisnis lain.

---

# 60. V2 Architecture Summary

```text
                         OWNER
                           │
                           │ Configure
                           ▼
                  ┌──────────────────┐
                  │    Next.js App   │
                  └────────┬─────────┘
                           │
                           ▼
                         MySQL
                           │
                  ┌────────┴────────┐
                  │                 │
                  ▼                 ▼
              Display A          Display B
                  │                 │
          Category Filter     Category Filter
                  │                 │
                  ▼                 ▼
             Filtered Data      Filtered Data
                  │                 │
                  └────────┬────────┘
                           ▼
                    DisplayScreen
                           │
                           ▼
                    Viewport Measure
                           │
                           ▼
                       Paged Grid
                           │
                           ▼
                    Auto Rotation
                           │
                           ▼
                     Store Staff
```

---

# 61. Final V2 Objective

Setelah V2 selesai:

Owner dapat mengatakan:

> "Monitor A hanya tampilkan kategori Pakan Ayam dan Vitamin."

Dan sistem akan memastikan monitor tersebut hanya menerima data kategori tersebut.

Jika produk semakin banyak:

> "Tidak masalah kalau ada 50 atau 100 produk."

Display akan otomatis membagi data menjadi beberapa halaman dan menampilkannya secara bergantian.

Dengan demikian V2 mempertahankan konsep utama aplikasi:

> **Owner mengelola harga satu kali → seluruh display yang relevan mendapatkan harga terbaru secara otomatis.**

V2 memperluas konsep tersebut menjadi:

> **Owner dapat menentukan apa yang ditampilkan oleh setiap display, sementara display secara otomatis menyesuaikan jumlah konten dengan ukuran layarnya.**
