# PowerShell script to test startup behavior
# This script simulates Windows startup behavior by launching the app with --startup flag

Write-Host "Testing Axon startup behavior..." -ForegroundColor Green

# Build the application first
Write-Host "Building application..." -ForegroundColor Yellow
cargo build --manifest-path src-tauri/Cargo.toml

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "Build successful!" -ForegroundColor Green

# Get the executable path
$exePath = "src-tauri\target\debug\axon.exe"

if (-not (Test-Path $exePath)) {
    Write-Host "Executable not found at $exePath" -ForegroundColor Red
    exit 1
}

Write-Host "Found executable at: $exePath" -ForegroundColor Green

# Test 1: Normal startup (should show window)
Write-Host "`nTest 1: Normal startup (should show window)" -ForegroundColor Cyan
Write-Host "Starting application normally..."
Start-Process -FilePath $exePath -NoNewWindow -Wait

# Test 2: Startup with --startup flag (behavior depends on minimize-to-tray setting)
Write-Host "`nTest 2: Startup with --startup flag" -ForegroundColor Cyan
Write-Host "Starting application with --startup flag..."
Write-Host "Note: Window behavior depends on your minimize-to-tray setting:"
Write-Host "  - If minimize-to-tray is enabled: App starts hidden in tray"
Write-Host "  - If minimize-to-tray is disabled: App shows window normally"

# Start with startup flag
Start-Process -FilePath $exePath -ArgumentList "--startup" -NoNewWindow

Write-Host "`nStartup behavior test completed!" -ForegroundColor Green
Write-Host "Check the application behavior to verify it matches your settings." -ForegroundColor Yellow