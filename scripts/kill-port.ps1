param([int]$Port = 5173)
$conns = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
foreach ($conn in $conns) {
  Write-Host "Port $Port owned by PID: $($conn.OwningProcess)"
  $proc = Get-Process -Id $conn.OwningProcess -ErrorAction SilentlyContinue
  if ($proc) {
    Write-Host "Killing process: $($proc.ProcessName) - $($proc.Path)"
    Stop-Process -Id $conn.OwningProcess -Force
  }
}
$remaining = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if (-not $remaining) {
  Write-Host "Port $Port is now free."
} else {
  Write-Host "Port $Port still in use."
}
