# VSHAD RoboSocial - Auto-Tunnel Startup
Write-Host "🔄 VSHAD RoboSocial - Auto-Tunnel Startup" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════"

# Kill existing ngrok processes
Write-Host "🧹 Killing existing ngrok processes..." -ForegroundColor Yellow
taskkill /f /im ngrok.exe 2>$null | Out-Null

# Start ngrok in background
Write-Host "🚀 Starting ngrok tunnel..." -ForegroundColor Green
Start-Process -FilePath "ngrok" -ArgumentList "http", "3000" -WindowStyle Hidden

# Wait for tunnel to establish
Write-Host "⏳ Waiting for tunnel to establish..." -ForegroundColor Yellow
Start-Sleep -Seconds 8

# Get tunnel URL
Write-Host "📡 Getting tunnel URL..." -ForegroundColor Yellow
$tunnelUrl = ""
$attempts = 0

while ($tunnelUrl -eq "" -and $attempts -lt 5) {
    $attempts++
    Write-Host "   Attempt $attempts/5..." -ForegroundColor Gray
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -Method Get -ErrorAction Stop
        $httpsUrl = $response.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1
        if ($httpsUrl) {
            $tunnelUrl = $httpsUrl.public_url
        }
    }
    catch {
        Start-Sleep -Seconds 3
    }
}

if ($tunnelUrl -eq "") {
    Write-Host "❌ Failed to get tunnel URL" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Tunnel active: $tunnelUrl" -ForegroundColor Green

# Update .env.local
Write-Host "📝 Updating environment variables..." -ForegroundColor Yellow
$envPath = "apps\web\.env.local"

if (Test-Path $envPath) {
    $envContent = Get-Content $envPath -Raw
    
    # Simple string replacement
    if ($envContent -match "NEXT_PUBLIC_APP_URL") {
        $pattern = 'NEXT_PUBLIC_APP_URL="[^"]*"'
        $replacement = "NEXT_PUBLIC_APP_URL=`"$tunnelUrl`""
        $envContent = $envContent -replace $pattern, $replacement
    }
    else {
        $envContent += "`nNEXT_PUBLIC_APP_URL=`"$tunnelUrl`"`n"
    }
    
    Set-Content $envPath $envContent -Encoding UTF8
    Write-Host "✅ Updated environment file" -ForegroundColor Green
}
else {
    Write-Host "❌ .env.local not found" -ForegroundColor Red
    exit 1
}

# Display info
Write-Host "⚡ Starting Next.js development server..." -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════"
Write-Host ""
Write-Host "🌐 App URL: $tunnelUrl" -ForegroundColor Magenta
Write-Host "🔧 Local: http://localhost:3000" -ForegroundColor Gray
Write-Host "📊 ngrok: http://localhost:4040" -ForegroundColor Gray
Write-Host ""

# Change to web directory and start Next.js
Set-Location "apps\web"
pnpm dev