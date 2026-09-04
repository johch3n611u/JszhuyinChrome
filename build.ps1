$base = Split-Path -Parent $MyInvocation.MyCommand.Path
$vscode = "$base\vscode"
$shared = "$base\shared"
$pkg = "$base\_pkg"
$out = "$base\jszhuyin-vscode-0.1.0.vsix"

Remove-Item -Recurse -Force $pkg -ErrorAction SilentlyContinue
Remove-Item -Force $out -ErrorAction SilentlyContinue

Copy-Item "$vscode\extension.js" "$pkg\"
Copy-Item "$vscode\package.json" "$pkg\"
Copy-Item "$vscode\README.md" "$pkg\"
Copy-Item -Recurse "$vscode\src" "$pkg\src"
Copy-Item -Recurse "$shared\lib" "$pkg\lib"
Copy-Item -Recurse "$shared\data" "$pkg\data"
Copy-Item -Recurse "$vscode\.vscode" "$pkg\.vscode"

Compress-Archive -Path "$pkg\*" -DestinationPath $out -Force
Remove-Item -Recurse -Force $pkg

if (Test-Path $out) {
    Write-Host "OK"
    Get-Item $out | Select-Object Name, Length
} else {
    Write-Host "FAILED"
}
