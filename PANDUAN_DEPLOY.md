# 🚀 Panduan Deployment Produksi - Sistem Apotek Grapi

Panduan ini menjelaskan langkah-langkah untuk melakukan kompilasi, pengemasan (packaging), konfigurasi, dan deployment aplikasi **Spring Boot + React (Grapi)** ke lingkungan produksi.

Aplikasi ini menggunakan arsitektur monolit modern, di mana frontend React secara otomatis dikompilasi oleh Maven (`frontend-maven-plugin`) dan dibundel langsung ke dalam satu file executable JAR utama di bawah direktori statis Spring Boot. Ini membuat proses deployment menjadi sangat sederhana dan mandiri.

---

## 📋 Prasyarat Sistem (Prerequisites)

Sebelum memulai deployment, pastikan lingkungan server Anda memenuhi persyaratan berikut:

### Opsi A: Deployment Native (JAR Langsung)
* **Java Development Kit (JDK) atau JRE 17** terinstal di server.
* **PostgreSQL (v15 atau lebih baru)** terinstal dan berjalan.
* Port `8080` (atau port pilihan Anda) terbuka dan tidak digunakan oleh aplikasi lain.

### Opsi B: Deployment Containerized (Docker - Direkomendasikan)
* **Docker** terinstal.
* **Docker Compose** terinstal.
* Port `8080` dan `5432` siap dialokasikan.

---

## 📦 Tahap 1: Pengemasan Aplikasi (Build & Package)

Langkah pertama adalah melakukan kompilasi backend Java dan frontend React secara bersamaan untuk menghasilkan file executable JAR tunggal yang siap dijalankan.

Jalankan perintah berikut di direktori utama proyek (`d:\sela\test\grapi`):

### Di Windows (Command Prompt / PowerShell)
```powershell
.\mvnw.cmd clean package -DskipTests
```

### Di Linux / macOS (Terminal)
```bash
./mvnw clean package -DskipTests
```

> [!NOTE]
> Parameter `-DskipTests` digunakan untuk mempercepat proses build di lingkungan deployment dengan melewatkan pengujian unit sementara waktu. Jika Anda ingin menjalankan pengujian terlebih dahulu, cukup hapus parameter tersebut.

### Hasil Output
Setelah proses build selesai dengan status **BUILD SUCCESS**, file executable JAR tunggal Anda akan terbentuk di:
📂 `target/grapi-0.0.1-SNAPSHOT.jar`

---

## 🛡️ Metode A: Deployment Native (Menjalankan JAR Langsung)

Metode ini sangat cocok jika Anda melakukan deploy langsung pada Virtual Private Server (VPS) atau server fisik Windows/Linux yang telah terkonfigurasi Java dan PostgreSQL secara lokal.

### 1. Siapkan Database Produksi
Masuk ke PostgreSQL Anda dan buat database kosong untuk aplikasi:
```sql
CREATE DATABASE apotekdb;
```

### 2. Jalankan Aplikasi dengan Variabel Lingkungan (Environment Variables)
Anda tidak perlu mengubah file `application.yml` bawaan di dalam proyek. Spring Boot memungkinkan Anda untuk meng-override konfigurasi database secara aman melalui variabel lingkungan saat menjalankan JAR.

#### Di Linux / macOS:
```bash
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/apotekdb
export SPRING_DATASOURCE_USERNAME=postgres
export SPRING_DATASOURCE_PASSWORD=isi_password_database_produksi_anda
export SPRING_JPA_HIBERNATE_DDL_AUTO=validate
export SPRING_FLYWAY_ENABLED=true
export SERVER_PORT=8080

java -jar target/grapi-0.0.1-SNAPSHOT.jar
```

#### Di Windows (PowerShell):
```powershell
$env:SPRING_DATASOURCE_URL="jdbc:postgresql://localhost:5432/apotekdb"
$env:SPRING_DATASOURCE_USERNAME="postgres"
$env:SPRING_DATASOURCE_PASSWORD="isi_password_database_produksi_anda"
$env:SPRING_JPA_HIBERNATE_DDL_AUTO="validate"
$env:SPRING_FLYWAY_ENABLED="true"
$env:SERVER_PORT="8080"

java -jar target/grapi-0.0.1-SNAPSHOT.jar
```

---

## 🐳 Metode B: Deployment Docker & Docker Compose (Sangat Direkomendasikan)

Kami telah menyediakan file `Dockerfile` dan `docker-compose.yml` di root proyek. Metode ini paling disukai karena mengisolasi aplikasi dan database secara otomatis dalam kontainer yang aman.

### 1. Lakukan Build Aplikasi Terlebih Dahulu
Pastikan Anda sudah menjalankan perintah build lokal (`mvnw clean package`) untuk menghasilkan file `.jar` di dalam direktori `target/`.

### 2. Konfigurasi Password Keamanan
Buka file `docker-compose.yml` dan sesuaikan parameter berikut untuk keamanan server Anda:
- `POSTGRES_PASSWORD` di bawah layanan `postgres-db`
- `SPRING_DATASOURCE_PASSWORD` di bawah layanan `grapi-app` (harus sama dengan password di atas)

### 3. Jalankan Menggunakan Docker Compose
Jalankan perintah berikut di root folder proyek:
```bash
docker-compose up --build -d
```

* Perintah `--build` memastikan Docker menyusun ulang image aplikasi berdasarkan JAR terbaru.
* Parameter `-d` (detached mode) akan menjalankan kontainer di latar belakang (background).

### 4. Periksa Status Kontainer
Untuk memastikan database dan server aplikasi berjalan dengan baik:
```bash
docker-compose ps
```
Untuk melihat log jalannya aplikasi secara real-time:
```bash
docker-compose logs -f grapi-app
```

---

## 🔄 Tahap 3: Manajemen Service Latar Belakang (Khusus Linux OS)

Pada server Linux produksi, menjalankan aplikasi langsung dari terminal tidak disarankan karena aplikasi akan mati ketika terminal ditutup. Anda sebaiknya mendaftarkan aplikasi sebagai layanan sistem menggunakan **systemd**.

### 1. Buat File Service Systemd
Buat file baru di `/etc/systemd/system/grapi.service` menggunakan editor teks (misalnya `nano`):
```bash
sudo nano /etc/systemd/system/grapi.service
```

### 2. Rekatkan Konfigurasi Berikut
Sesuaikan path `/var/www/grapi` dengan lokasi folder deployment Anda yang sebenarnya:

```ini
[Unit]
Description=Grapi Apotek Modern Application
After=syslog.target network.target postgresql.service

[Service]
User=root
WorkingDirectory=/var/www/grapi
ExecStart=/usr/bin/java -jar /var/www/grapi/target/grapi-0.0.1-SNAPSHOT.jar
SuccessExitStatus=143

# Konfigurasi Database & Port Produksi
Environment=SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/apotekdb
Environment=SPRING_DATASOURCE_USERNAME=postgres
Environment=SPRING_DATASOURCE_PASSWORD=password_produksi_aman
Environment=SPRING_JPA_HIBERNATE_DDL_AUTO=validate
Environment=SPRING_FLYWAY_ENABLED=true
Environment=SERVER_PORT=8080

Type=simple
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 3. Aktifkan dan Jalankan Service
Setelah menyimpan file, jalankan perintah berikut untuk memuat ulang systemd, mengaktifkan auto-start saat booting, dan menyalakan aplikasi:

```bash
# Memuat ulang konfigurasi systemd
sudo systemctl daemon-reload

# Mengaktifkan service agar otomatis berjalan saat OS booting
sudo systemctl enable grapi.service

# Menjalankan service sekarang
sudo systemctl start grapi.service

# Memeriksa status kesehatan service
sudo systemctl status grapi.service
```

---

## 🔒 Praktik Terbaik Keamanan & Optimasi Produksi (Best Practices)

1. **Gunakan Validasi Skema Database (Flyway):**
   Aplikasi telah menggunakan Flyway. Jangan sekali-kali mengatur `SPRING_JPA_HIBERNATE_DDL_AUTO` ke nilai `create` atau `update` di produksi. Pastikan nilainya tetap `validate` agar skema database hanya dimigrasi melalui script Flyway resmi di dalam folder `src/main/resources/db/migration` demi mencegah kehilangan data tak terduga.
2. **Reverse Proxy (Nginx):**
   Sangat direkomendasikan untuk meletakkan aplikasi di belakang reverse proxy seperti **Nginx**. Nginx dapat menangani SSL/TLS (HTTPS) secara efisien menggunakan Let's Encrypt serta melindungi port internal `8080` dari akses publik secara langsung.
3. **Backup Database Berkala:**
   Siapkan cron-job di server untuk melakukan pencadangan (backup) database PostgreSQL secara rutin menggunakan utility `pg_dump`:
   ```bash
   pg_dump -U postgres -d apotekdb -F c -b -v -f /backup/db_grapi_$(date +%F).backup
   ```
4. **JWT Secret Key Kustom:**
   Pastikan kunci rahasia JWT yang digunakan untuk otentikasi login diganti dengan string acak berukuran minimal 256-bit demi mencegah eksploitasi token keamanan.
