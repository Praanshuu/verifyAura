# PowerShell script to safely start the backend server
Write-Host "🚀 Starting VerifyAura Backend Server" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Cyan

# Check if port 3001 is in use
$port = 3001
$process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1

if ($process) {
    Write-Host "⚠️  Port $port is already in use" -ForegroundColor Yellow
    $pid = $process.OwningProcess
    Write-Host "   Found process PID: $pid" -ForegroundColor Yellow
    
    # Ask user if they want to kill the process
    $response = Read-Host "   Do you want to terminate this process? (Y/N)"
    if ($response -eq 'Y' -or $response -eq 'y') {
        Stop-Process -Id $pid -Force
        Write-Host "✅ Process terminated" -ForegroundColor Green
        Start-Sleep -Seconds 1
    } else {
        Write-Host "❌ Cannot start backend - port is in use" -ForegroundColor Red
        exit 1
    }
}

# Navigate to backend directory
Set-Location -Path "backend"

# Check if node_modules exists
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Build TypeScript
Write-Host "🔨 Building TypeScript..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ TypeScript build failed" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful" -ForegroundColor Green

# Start the server
Write-Host "🚀 Starting server on port $port..." -ForegroundColor Green
Write-Host "   URL: http://localhost:$port" -ForegroundColor Cyan
Write-Host "   Health: http://localhost:$port/health" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

npm run dev
