# ==============================================================================
# Script Backup Database PostgreSQL - Grapi Apotek (Windows)
# ==============================================================================
# Script ini secara otomatis mendeteksi apakah database berjalan di dalam
# Docker container (grapi-postgres) atau secara native di Windows, lalu membuat
# backup terkompresi dan melakukan rotasi pembersihan file backup lama (>14 hari).
# ==============================================================================

# Konfigurasi
$BackupDir = ".\backups"
$DbName = "apotekdb"
$DbUser = "postgres"
$ContainerName = "grapi-postgres"
$RetentionDays = 14

# Membuat direktori backup jika belum ada
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "db_grapi_$Timestamp.backup"
$BackupFileAbs = [System.IO.Path]::GetFullPath($BackupFile)

Write-Host "=== Memulai Backup Database: $(Get-Date) ===" -ForegroundColor Green

# Cek apakah docker container berjalan
$dockerCheck = Get-Command docker -ErrorAction SilentlyContinue
$containerRunning = $false

if ($dockerCheck) {
    $containerId = docker ps -q -f "name=$ContainerName"
    if ($containerId) {
        $containerRunning = $true
    }
}

if ($containerRunning) {
    Write-Host "[DOCKER] Mendeteksi database berjalan di dalam container Docker: $ContainerName" -ForegroundColor Cyan
    Write-Host "[DOCKER] Menjalankan pg_dump di dalam container..." -ForegroundColor Cyan
    
    # Gunakan cmd /c agar redirection '>' menulis byte murni tanpa dirusak encoding PowerShell
    cmd /c "docker exec -i $ContainerName pg_dump -U $DbUser -d $DbName -F c -b > `"$BackupFileAbs`""
} else {
    Write-Host "[NATIVE] Database tidak terdeteksi di Docker. Menggunakan pg_dump native..." -ForegroundColor Yellow
    
    $pgDumpCheck = Get-Command pg_dump -ErrorAction SilentlyContinue
    if ($pgDumpCheck) {
        # Jika PGPASSWORD tidak diset, pg_dump mungkin meminta password secara interaktif.
        # Disarankan mengatur [System.Environment]::SetEnvironmentVariable("PGPASSWORD", "password_anda") sebelum menjalankan script ini.
        cmd /c "pg_dump -U $DbUser -d $DbName -F c -b > `"$BackupFileAbs`""
    } else {
        Write-Error "[ERROR] pg_dump tidak terinstal secara native di Windows dan container Docker tidak berjalan!"
        exit 1
    }
}

# Cek apakah file backup berhasil dibuat dan ukurannya > 0
if (Test-Path $BackupFile) {
    $fileInfo = Get-Item $BackupFile
    if ($fileInfo.Length -gt 0) {
        $sizeMB = [Math]::Round($fileInfo.Length / 1MB, 2)
        Write-Host "[SUKSES] Backup database berhasil dibuat: $BackupFile" -ForegroundColor Green
        Write-Host "[SUKSES] Ukuran file: $sizeMB MB" -ForegroundColor Green
    } else {
        Write-Error "[ERROR] Backup database gagal dibuat atau file kosong!"
        Remove-Item $BackupFile -Force
        exit 1
    }
} else {
    Write-Error "[ERROR] Backup database gagal dibuat!"
    exit 1
}

# Pembersihan backup lama (Retensi 14 hari)
Write-Host "=== Memulai Rotasi File Backup lama (> $RetentionDays hari) ===" -ForegroundColor Green
$limitDate = (Get-Date).AddDays(-$RetentionDays)

Get-ChildItem -Path $BackupDir -Filter "db_grapi_*.backup" | Where-Object {
    $_.LastWriteTime -lt $limitDate
} | ForEach-Object {
    Write-Host "Menghapus backup lama: $($_.Name)" -ForegroundColor Yellow
    Remove-Item $_.FullName -Force
}

Write-Host "=== Proses Backup Selesai: $(Get-Date) ===" -ForegroundColor Green
