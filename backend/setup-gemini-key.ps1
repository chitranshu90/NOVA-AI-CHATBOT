$ErrorActionPreference = "Stop"

$secureKey = Read-Host "Google AI Studio ki nayi API key paste karo" -AsSecureString
$apiKey = [System.Net.NetworkCredential]::new("", $secureKey).Password.Trim()

if ($apiKey.Length -lt 20) {
    $secureKey.Dispose()
    Remove-Variable apiKey, secureKey
    throw "Key adhuri lag rahi hai. Puri API key paste karo; 20 se chhoti key save nahi ki gayi."
}

$envPath = Join-Path $PSScriptRoot ".env"
$existingLines = @()

if (Test-Path $envPath) {
    $existingLines = Get-Content $envPath
}

$preservedLines = @(
    $existingLines | Where-Object {
        $_ -notmatch '^\s*(GEMINI_API_KEY|GEMINI_MODEL|MISTRAL_API_KEY|MISTRAL_MODEL|FRONTEND_ORIGINS)\s*='
    }
)

$lines = @($preservedLines) + @(
    "GEMINI_API_KEY=$apiKey"
    "GEMINI_MODEL=gemini-3.8-flash"
    "FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:5174,http://127.0.0.1:5174,http://localhost:5175,http://127.0.0.1:5175"
)
$content = [string]::Join([Environment]::NewLine, $lines) + [Environment]::NewLine
$encoding = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($envPath, $content, $encoding)

$secureKey.Dispose()
Remove-Variable apiKey, secureKey
Write-Output "backend/.env taiyar hai. API key display nahi ki gayi."
