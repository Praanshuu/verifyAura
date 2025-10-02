# PowerShell script to safely start the frontend server
Write-Host "🚀 Starting VerifyAura Frontend Server" -ForegroundColor Green
Write-Host "====================================" -ForegroundColor Cyan

# Check if port 8080 is in use
$port = 8080
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
        Write-Host "❌ Cannot start frontend - port is in use" -ForegroundColor Red
        exit 1
    }
}

# Navigate to frontend directory
Set-Location -Path "frontend"

# Check if node_modules exists
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Start the server
Write-Host "🚀 Starting frontend on port $port..." -ForegroundColor Green
Write-Host "   URL: http://localhost:$port" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

npm run dev
