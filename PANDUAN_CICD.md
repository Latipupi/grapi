# 🚀 Panduan Konfigurasi & Menjalankan CI/CD Grapi

Panduan ini berisi langkah-langkah detail untuk mengaktifkan pipeline CI/CD yang baru saja kita buat. Ikuti petunjuk di bawah ini agar integrasi otomatis dari GitHub ke VPS Anda berjalan dengan sukses.

---

## 📌 Langkah 1: Persiapan di Sisi GitHub (GitHub Secrets)

Agar GitHub Actions memiliki izin untuk mengakses VPS dan mengunggah/mengunduh kontainer dari GitHub Container Registry (GHCR), Anda perlu menyiapkan beberapa parameter rahasia (**Secrets**):

### A. Membuat Personal Access Token (PAT) untuk GHCR
Karena image Docker Anda disimpan di GHCR (milik GitHub), VPS Anda memerlukan token khusus untuk mengunduh (*pull*) image tersebut jika repositori bersifat private.
1. Masuk ke GitHub, klik foto profil Anda di kanan atas -> **Settings**.
2. Gulir ke bawah di menu kiri, klik **Developer settings** -> **Personal access tokens** -> **Tokens (classic)**.
3. Klik **Generate new token** -> **Generate new token (classic)**.
4. Beri nama (Note): `Grapi VPS Pull Token`.
5. Centang scope berikut:
   * `read:packages` (sangat penting agar VPS bisa membaca/mengunduh image).
6. Klik **Generate token** di bagian paling bawah.
7. **PENTING:** Salin token yang muncul (`ghp_xxxxxxxxxxxx`) ke notepad. Anda tidak akan bisa melihatnya lagi setelah halaman ditutup.

### B. Menambahkan Secrets ke Repositori
1. Buka halaman utama repositori GitHub proyek **grapi** Anda.
2. Klik tab **Settings** -> menu kiri **Secrets and variables** -> klik **Actions**.
3. Klik tombol **New repository secret** untuk setiap entri berikut:

| Nama Secret | Nilai / Cara Mengisi |
| :--- | :--- |
| `VPS_HOST` | Masukkan alamat IP public VPS Anda (contoh: `123.45.67.89`). |
| `VPS_USERNAME` | Username SSH untuk masuk ke VPS (contoh: `root` atau `ubuntu`). |
| `VPS_KEY` | Salin seluruh isi berkas Private SSH Key Anda (biasanya ada di berkas `~/.ssh/id_rsa` atau file `.pem` / `.ppk` yang diunduh dari provider VPS). Pastikan disalin dari baris `-----BEGIN ...` hingga `-----END ...`. |
| `VPS_PORT` | Port SSH VPS Anda (masukkan `22` jika default). |
| `VPS_PROJECT_PATH` | Path direktori kerja proyek Anda di server VPS (contoh: `/var/www/grapi`). |
| `GHCR_PAT` | Tempelkan kode Personal Access Token (PAT) `ghp_xxxxxxxxxxxx` yang sudah Anda buat pada **Langkah A** di atas. |

---

## 📌 Langkah 2: Persiapan di Sisi Server VPS

Hubungkan ke VPS Anda menggunakan SSH (misalnya via PuTTY atau Terminal), lalu pastikan struktur berikut sudah siap:

1. **Buat Direktori Proyek di VPS**
   Buat folder yang sesuai dengan nilai `VPS_PROJECT_PATH` di atas:
   ```bash
   sudo mkdir -p /var/www/grapi
   sudo chown -R $USER:$USER /var/www/grapi
   ```
2. **Salin File `docker-compose.yml` ke VPS**
   Pastikan file `docker-compose.yml` terbaru (yang menggunakan `image: ghcr.io/latipupi/grapi:latest`) sudah berada di dalam folder `/var/www/grapi/` di VPS Anda.
   *(Anda bisa menyalin isinya secara manual menggunakan editor teks seperti `nano /var/www/grapi/docker-compose.yml` lalu rekatkan konfigurasinya).*

---

## 📌 Langkah 3: Mengirim Kode & Menjalankan Pipeline CI/CD

Sekarang, Anda siap mendorong perubahan ini ke GitHub untuk memicu jalannya pipeline otomatis!

Jalankan perintah berikut di terminal komputer lokal Anda (`d:\sela\test\grapi`):

```bash
# 1. Tambahkan perubahan ke Git
git add .

# 2. Commit perubahan
git commit -m "ci: configure github actions workflow and update docker-compose"

# 3. Push ke branch main di GitHub
git push origin main
```

### Memantau Proses CI/CD:
1. Buka repositori GitHub Anda di web browser.
2. Klik tab **Actions**.
3. Anda akan melihat workflow bernama **"Java CI/CD with Maven, GHCR, and VPS Docker Compose"** sedang berjalan (berwarna kuning/oranye).
4. Klik pada nama workflow tersebut untuk melihat detail dari masing-masing job:
   * **`build`:** Kompilasi Java & React frontend.
   * **`docker`:** Build image dan push ke GHCR.
   * **`deploy`:** SSH ke VPS Anda, mengunduh image baru, dan merestart kontainer secara otomatis!
5. Jika semua lingkaran berubah menjadi **Hijau**, selamat! CI/CD Anda telah berhasil berjalan secara end-to-end.
