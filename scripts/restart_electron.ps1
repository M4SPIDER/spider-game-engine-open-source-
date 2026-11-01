Stop-Process -Name electron -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
Start-Process "powershell.exe" -ArgumentList "-NoProfile -ExecutionPolicy Bypass -Command `"npm run electron`"" -WorkingDirectory "c:\Users\vvvr8\Downloads\game engine" -WindowStyle Hidden
Start-Sleep -Seconds 3
