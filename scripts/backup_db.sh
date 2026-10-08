#!/bin/bash

# ==============================================================================
# Script Backup Database PostgreSQL - Grapi Apotek
# ==============================================================================
# Script ini secara otomatis mendeteksi apakah database berjalan di dalam
# Docker container (grapi-postgres) atau secara native di VPS, lalu membuat
# backup terkompresi dan melakukan rotasi pembersihan file backup lama (>14 hari).
# ==============================================================================

# Konfigurasi
BACKUP_DIR="./backups"
DB_NAME="apotekdb"
DB_USER="postgres"
CONTAINER_NAME="grapi-postgres"
RETENTION_DAYS=14

# Membuat direktori backup jika belum ada
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/db_grapi_$TIMESTAMP.backup"

echo "=== Memulai Backup Database: $(date) ==="

# Cek apakah docker container berjalan
if [ -x "$(command -v docker)" ] && [ "$(docker ps -q -f name=$CONTAINER_NAME)" ]; then
    echo "[DOCKER] Mendeteksi database berjalan di dalam container Docker: $CONTAINER_NAME"
    echo "[DOCKER] Menjalankan pg_dump di dalam container..."
    
    # Gunakan docker exec untuk mengambil pg_dump
    docker exec -i "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" -F c -b > "$BACKUP_FILE"
    
else
    echo "[NATIVE] Database tidak terdeteksi di Docker. Menggunakan pg_dump native..."
    
    # Cek apakah pg_dump terinstal secara native
    if [ -x "$(command -v pg_dump)" ]; then
        # Jika PGPASSWORD tidak diset, pg_dump mungkin akan meminta password interaktif
        # Disarankan menset PGPASSWORD di environment shell sebelum menjalankan script ini
        pg_dump -U "$DB_USER" -d "$DB_NAME" -F c -b -f "$BACKUP_FILE"
    else
        echo "[ERROR] pg_dump tidak terinstal secara native di sistem dan container Docker tidak berjalan!"
        exit 1
    fi
fi

# Cek apakah file backup berhasil dibuat dan ukurannya > 0
if [ -s "$BACKUP_FILE" ]; then
    echo "[SUKSES] Backup database berhasil dibuat: $BACKUP_FILE"
    echo "[SUKSES] Ukuran file: $(du -sh "$BACKUP_FILE" | cut -f1)"
else
    echo "[ERROR] Backup database gagal dibuat atau file kosong!"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# Pembersihan backup lama (Retensi 14 hari)
echo "=== Memulai Rotasi File Backup lama (> $RETENTION_DAYS hari) ==="
find "$BACKUP_DIR" -name "db_grapi_*.backup" -type f -mtime +$RETENTION_DAYS -print -delete

echo "=== Proses Backup Selesai: $(date) ==="
