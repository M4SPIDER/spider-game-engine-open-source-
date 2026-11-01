try {
  $type = [Windows.Media.SpeechRecognition.SpeechRecognizer, Windows.Media.SpeechRecognition, ContentType = WindowsRuntime]
  $rec = [Windows.Media.SpeechRecognition.SpeechRecognizer]::new()
  $asyncOp = $rec.CompileConstraintsAsync()
  
  $timeout = 0
  while ($asyncOp.Status -eq [Windows.Foundation.AsyncStatus]::Started -and $timeout -lt 50) {
    Start-Sleep -Milliseconds 100
    $timeout++
  }
  
  $res = $asyncOp.GetResults()
  Write-Host "Constraint compilation status: $($res.Status)"
  Write-Host "Session ready: $([bool]$rec.ContinuousRecognitionSession)"
} catch {
  Write-Host "ERR: $_"
}
