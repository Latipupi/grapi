# Architect Document & Development Plan: Sistem Apotek Modern (MVP)

Dokumen ini berisi roadmap teknikal, arsitektur, dan business flow untuk pengembangan sistem informasi apotek modern. Dirancang khusus untuk **Solo Developer** dengan pendekatan **Modular Monolith** yang dipaketkan ke dalam **Satu File JAR**, fokus pada MVP (*Minimum Viable Product*), kecepatan pengembangan, kemudahan maintenance, namun tetap siap untuk skala produksi (*production-ready*).

---

## 1. Technical Architecture & Reasoning

- **Pendekatan:** Single JAR Deployment (Frontend & Backend digabung).
  - *Reasoning:* Sebagai solo developer, proses deployment akan jauh lebih mudah. Frontend (React) akan di-*build* dan hasil statisnya diletakkan di dalam folder `src/main/resources/static` milik Spring Boot. Hasil akhirnya adalah satu file `.jar` yang bisa langsung dijalankan dengan `java -jar app.jar`.
- **Backend:** Java Spring Boot, Spring Security (JWT), Spring Data JPA.
  - *Reasoning:* Sangat stabil, ekosistem enterprise yang matang.
- **Database:** PostgreSQL + Flyway.
  - *Reasoning:* Relational DB sangat krusial untuk transaksi finansial dan inventory (ACID compliance). Flyway wajib untuk versioning skema database antar environment.
- **Frontend:** React + Vite, Tailwind CSS, shadcn/ui, Redux Toolkit, TanStack Query, React Hook Form, Framer Motion.
  - *Reasoning:* Vite untuk build time yang instan. `shadcn/ui` + Tailwind memberi komponen siap pakai yang *vibrant*, *accessible*, dan mudah dikustomisasi. **Redux Toolkit** digunakan untuk global state yang kompleks (seperti keranjang POS kasir), sedangkan **TanStack Query** untuk *server-state management* (caching, data fetching).

---

## 2. Priority & Modul yang Harus Dibuat Terlebih Dahulu

Urutan development sangat krusial agar tidak *block* di tengah jalan. 

1. **Modul Auth & Access Control:** Fondasi (Login, JWT, Role).
2. **Modul Master Data:** Data pendukung (Cabang, Kategori, Satuan Produk, Produk).
3. **Modul Inventory & Batch:** Jantung apotek (Batch, Expired Date, Kartu Stok/Ledger).
4. **Modul Inbound (Purchasing):** Memasukkan barang ke stok.
5. **Modul Outbound (POS / Kasir):** Mengurangi stok dan mencatat pendapatan.
6. **Modul Reporting:** Menampilkan rangkuman dari ledger dan transaksi.

---

## 3. Roadmap Development & Checklist (Estimasi: 8 Minggu)

### Phase 1: Foundation & Master Data (Minggu 1-2)
- [ ] Set up repository (Spring Boot).
- [ ] Set up Frontend (React Vite) di dalam folder terpisah (misal: `src/main/frontend`).
- [ ] Setup Maven/Gradle plugin (`frontend-maven-plugin`) untuk otomatis build React dan *copy* ke folder `static` Spring Boot saat packaging.
- [ ] Setup Flyway dan skema database awal (Users, Roles, Branches).
- [ ] Implementasi JWT Authentication & Role-based Authorization.
- [ ] CRUD Kategori & Satuan Produk (Unit of Measure).
- [ ] CRUD Produk (Informasi dasar & setup konversi multi-satuan).
- [ ] *Frontend*: Setup Redux Toolkit (Store, Slices) & Layouting, Sidebar, Login Page.
- [ ] *Frontend*: UI Master Data (Tabel, Form dengan `react-hook-form` & `zod`).

### Phase 2: Inventory Engine & Purchasing (Minggu 3-4)
- [ ] Skema DB untuk `inventory_batches` dan `stock_movements`.
- [ ] API untuk Purchase Order (PO) & Penerimaan Barang (Goods Receipt).
- [ ] Logic penambahan stok ke spesifik cabang dan batch saat barang diterima.
- [ ] API List Stok saat ini per cabang (beserta warning Expired Date).
- [ ] *Frontend*: Form Purchase Order (Master-Detail input form). Gunakan Redux jika perlu track *draft PO* secara global.
- [ ] *Frontend*: Halaman Inventory List.

### Phase 3: Point of Sales (POS) (Minggu 5-6)
- [ ] Skema DB untuk `sales` dan `sales_details`.
- [ ] **Core Logic:** Engine pengurang stok dengan metode **FEFO** (First Expired First Out).
- [ ] Transaksi API dengan `@Transactional` (Rollback jika stok tidak cukup).
- [ ] *Frontend*: Halaman Kasir Khusus.
- [ ] *Frontend*: Setup **Redux Slice** khusus POS (menyimpan cart items, subtotal, diskon, tax). Redux sangat cocok di sini untuk mengelola *complex interactive state*.
- [ ] Integrasi Framer Motion untuk animasi ketika item masuk ke keranjang POS.

### Phase 4: Reporting, Polish & Deployment (Minggu 7-8)
- [ ] API Kartu Stok (Historical movement per produk per batch).
- [ ] API Laporan Penjualan harian/bulanan.
- [ ] *Frontend*: Halaman Laporan berupa Chart / Tabel agregat.
- [ ] *Backend*: Konfigurasi Spring Boot Web MVC untuk *catch-all routing* ke `index.html` agar client-side routing React (React Router) berjalan lancar dalam satu JAR.
- [ ] *DevOps*: Deployment VPS.

---

## 4. Best Practice Inventory System & Business Flow

Sistem inventory apotek adalah salah satu yang paling rumit karena memiliki faktor **Multi-Unit** dan **Expired Date (FEFO)**. 

### A. Multi-Unit (Base Unit Rule)
- **Aturan Emas:** Semua perhitungan stok di database **HARUS** disimpan dalam bentuk satuan terkecil (Base Unit). 
- *Contoh:* Obat Paracetamol. 1 Box = 10 Strip. 1 Strip = 10 Tablet. (Base Unit: Tablet).
- Jika ada pembelian masuk 2 Box, backend langsung mengalikan (2 x 10 x 10 = 200 Tablet) ke dalam stok.
- *Reasoning:* Menghindari pusing konversi desimal di database. Frontend bertugas mengonversi kembali ke Box/Strip jika butuh ditampilkan.

### B. Immutable Stock Ledger (Kartu Stok)
- Jangan pernah update nilai di tabel `stocks` secara statis tanpa *history*.
- Buat tabel `stock_movements`.
- Saldo stok saat ini adalah hasil agregasi (SUM) dari `stock_movements`. 

### C. FEFO (First Expired First Out)
- Transaksi POS hanya mengirim `product_id` dan `qty_dijual`. Backend yang bertugas mencari batch mana yang expired date-nya paling dekat dan memiliki stok mencukupi, lalu memotong stok dari batch tersebut.

---

## 5. Database & API Planning

### Core Entities (Table Ideas)
1. `users`, `roles`, `branches`
2. `products`, `product_categories`, `product_units`
3. `inventory_batches` (id, branch_id, product_id, batch_number, expired_date, current_qty)
4. `stock_movements` (id, branch_id, product_id, batch_id, movement_type, qty, reference_no, created_at)
5. `purchases`, `purchase_details`
6. `sales`, `sales_details`

### API Architecture (RESTful)
Semua API harus memiliki prefix `/api/v1/` untuk membedakan dengan aset statis frontend.
- `POST /api/v1/auth/login`
- `GET /api/v1/products`, `POST /api/v1/products`
- `GET /api/v1/inventory/branches/{id}/stocks`
- `POST /api/v1/sales`

---

## 6. Folder Structure Plan (Single JAR Setup)

Struktur folder dirancang agar Frontend dan Backend menyatu dalam project yang sama. Saat build Maven dijalankan, Maven akan men-trigger `npm build` dan memindahkan hasilnya ke `/static`.

```text
apotek-app/
├── src/
│   ├── main/
│   │   ├── java/com/apotek/    # Backend Spring Boot
│   │   │   ├── core/           # Security, Exceptions, Utils
│   │   │   ├── modules/        # Auth, Masterdata, Inventory, Sales
│   │   │   └── ApotekApp.java
│   │   ├── resources/
│   │   │   ├── application.yml
│   │   │   └── db/migration/   # Flyway scripts
│   │   └── frontend/           # Project React Vite
│   │       ├── package.json
│   │       ├── vite.config.ts
│   │       └── src/
│   │           ├── api/        # TanStack Query
│   │           ├── components/
│   │           ├── features/
│   │           ├── store/      # Redux Toolkit (store.ts, posSlice.ts)
│   │           └── App.tsx
├── pom.xml                     # Maven config (dengan frontend-maven-plugin)
└── README.md
```

---

## 7. Rekomendasi Reusable Component React
1. **DataTable (TanStack Table + shadcn)**
2. **Form Input (react-hook-form + shadcn)**
3. **Product Search Async Select**

---

## 8. Risk Analysis

| Risk | Impact | Mitigation Plan |
| :--- | :--- | :--- |
| **Routing React Error (404)** setelah di-deploy di Spring Boot | High | Buat filter di Spring Boot untuk me-redirect request *non-API* (yang tidak berawalan `/api/`) ke `index.html` statis. |
| **Race condition saat POS** | High | Gunakan **Optimistic Locking** (`@Version` di JPA) pada entitas `inventory_batches`. |
| **Data Stok tidak sinkron** | High | Seluruh update stok **wajib** menggunakan satu layer abstraksi `StockMovementService` dengan `@Transactional`. |

---

## 9. Monitoring, Logging, dan Deployment Plan

### Deployment Plan (Sangat Mudah via Single JAR)
1. Cukup jalankan `./mvnw clean package` atau `./gradlew build` di lokal/CI.
2. Maven otomatis men-download Node, menjalankan `npm install`, `npm run build`, dan meletakkan aset di dalam JAR.
3. Upload `apotek-app-0.0.1-SNAPSHOT.jar` ke VPS.
4. Setup `systemd` service untuk me-run JAR (cth: `java -Xmx1G -jar apotek-app.jar`) sebagai *background process*.
5. Setup Nginx di VPS hanya sebagai Reverse Proxy ke port localhost Spring Boot.

### Monitoring & Logging
- **Backend:** Enable `Spring Boot Actuator`. Logback untuk log file.
- **Frontend:** Redux DevTools untuk debug state di lokal. Sentry untuk melacak error JS di browser.

### Future Scalability Plan
1. Mengubah Single JAR menjadi Frontend dan Backend terpisah (microservice style) sangat mudah karena API menggunakan REST dan frontend React sudah terstruktur dengan baik.
2. Pindahkan db ke layanan ter-managed (RDS).
3. Scale web server Spring Boot menggunakan Load Balancer jika traffic apotek sudah sangat tinggi.

---
*End of Architect Plan.*
