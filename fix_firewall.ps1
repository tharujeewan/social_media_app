# ── Run as Administrator ──────────────────────────────────────────────────────
# This fixes the "connection timeout" when the phone tries to reach the backend.

Write-Host "`n[1/3] Removing Node.js BLOCK rules..." -ForegroundColor Yellow
Get-NetFirewallRule | Where-Object {
    $_.DisplayName -like "*Node.js*" -and $_.Action -eq "Block" -and $_.Direction -eq "Inbound"
} | ForEach-Object {
    Write-Host "  Removing: $($_.DisplayName) [Profile: $($_.Profile)]"
    $_ | Remove-NetFirewallRule
}

Write-Host "`n[2/3] Adding ALLOW rule for TCP port 3000 (all profiles)..." -ForegroundColor Yellow
# Remove any old allow rule first to avoid duplicates
Get-NetFirewallRule -DisplayName "Connectify Backend - Port 3000" -ErrorAction SilentlyContinue | Remove-NetFirewallRule
New-NetFirewallRule `
    -DisplayName "Connectify Backend - Port 3000" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort 3000 `
    -Action Allow `
    -Profile Any | Out-Null
Write-Host "  Done." -ForegroundColor Green

Write-Host "`n[3/3] Changing Wi-Fi network profile from Public to Private..." -ForegroundColor Yellow
# Public profile applies the strictest firewall rules — change to Private
Set-NetConnectionProfile -InterfaceAlias "Wi-Fi" -NetworkCategory Private
Write-Host "  Done." -ForegroundColor Green

# ── Verify ────────────────────────────────────────────────────────────────────
Write-Host "`n=== Current firewall rules ===" -ForegroundColor Cyan
Get-NetFirewallRule | Where-Object {
    $_.DisplayName -like "*Node*" -or $_.DisplayName -like "*3000*" -or $_.DisplayName -like "*Connectify*"
} | Select-Object DisplayName, Enabled, Direction, Action, @{N='Profile';E={$_.Profile}} | Format-Table -AutoSize

Write-Host "=== Wi-Fi network profile ===" -ForegroundColor Cyan
Get-NetConnectionProfile -InterfaceAlias "Wi-Fi" | Select-Object Name, NetworkCategory | Format-Table -AutoSize

Write-Host "All done! Test from your phone browser: http://192.168.1.64:3000/api/health" -ForegroundColor Green
