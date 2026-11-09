$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $projectRoot

if (-not [Environment]::Is64BitOperatingSystem -or $env:PROCESSOR_ARCHITECTURE -eq 'ARM64') {
    throw 'This release supports Windows x64. ARM64 has not been validated.'
}
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host 'Install Docker Desktop with the WSL 2 / Linux containers backend, then run this file again.'
    Write-Host 'https://docs.docker.com/desktop/setup/install/windows-install/'
    Start-Process 'https://docs.docker.com/desktop/setup/install/windows-install/'
    exit 1
}
& docker info --format '{{.OSType}}' 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Start Docker Desktop and wait until the Linux engine is ready, then run again.'
    exit 1
}
$dockerOS = & docker info --format '{{.OSType}}'
if ($dockerOS.Trim() -ne 'linux') { throw 'Switch Docker Desktop to Linux containers first.' }
& docker compose version | Out-Host
if ($LASTEXITCODE -ne 0) { throw 'Docker Compose v2 is required.' }

$lockPath = Join-Path $projectRoot '.install.lock'
try { New-Item -ItemType Directory -Path $lockPath -ErrorAction Stop | Out-Null }
catch { throw 'Another installer may be running. Close it first. See the tutorial for a stale .install.lock.' }
try {
    $envFile = Join-Path $projectRoot '.env'
    if (-not (Test-Path -LiteralPath $envFile)) {
        $lines = foreach ($key in @('ONEBOT_TOKEN','WEBUI_TOKEN','SETUP_TOKEN','CONSOLE_TOKEN')) {
            $bytes = New-Object byte[] 32
            $rng = [Security.Cryptography.RandomNumberGenerator]::Create()
            try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
            $value = ([BitConverter]::ToString($bytes)).Replace('-','').ToLowerInvariant()
            "$key=$value"
        }
        [IO.File]::WriteAllLines($envFile, $lines, (New-Object Text.UTF8Encoding $false))
        $sid = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value
        & icacls.exe $envFile '/inheritance:r' '/grant:r' "*${sid}:(F)" '*S-1-5-18:(F)' | Out-Null
        if ($LASTEXITCODE -ne 0) { throw 'Unable to restrict .env permissions. Fix its ACL before continuing.' }
    }
    $settings = @{}
    foreach ($line in [IO.File]::ReadAllLines($envFile)) {
        if ($line -match '^([A-Z_]+)=([a-f0-9]{64})$') { $settings[$matches[1]]=$matches[2] }
    }
    foreach ($key in @('ONEBOT_TOKEN','WEBUI_TOKEN','SETUP_TOKEN','CONSOLE_TOKEN')) {
        if (-not $settings.ContainsKey($key)) { throw 'Invalid .env. Restore it from your private backup. Do not regenerate tokens for existing data.' }
    }
    & docker compose config --quiet
    if ($LASTEXITCODE -ne 0) { throw 'Compose validation failed.' }
    Write-Host 'Downloading/building pinned dependencies. First installation can take several minutes.'
    & docker compose up -d --build
    if ($LASTEXITCODE -ne 0) { throw 'Build/start failed. Re-run after checking the network and Docker logs.' }
    Write-Host 'Waiting for the setup service (up to 15 minutes on first install)...'
    $ready = $false
    for ($attempt=0; $attempt -lt 180; $attempt++) {
        try {
            $response = Invoke-WebRequest 'http://127.0.0.1:18670/ping' -UseBasicParsing -TimeoutSec 3
            if ($response.StatusCode -eq 200) { $ready=$true; break }
        } catch {}
        Start-Sleep -Seconds 5
    }
    if (-not $ready) { throw 'Setup timed out. Run docker compose logs --tail 80 agent. Data is preserved.' }
    $setupUrl = 'http://127.0.0.1:18670/?token=' + $settings.SETUP_TOKEN
    Write-Host 'Open this private local link. Keep its token private.'
    Write-Host $setupUrl
    Start-Process $setupUrl
} finally {
    Remove-Item -LiteralPath $lockPath
}
