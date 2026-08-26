param(
    [string]$Voice = "Microsoft Zira Desktop"
)

$ErrorActionPreference = "Stop"
$repoRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$packageRoot = [IO.Path]::GetFullPath(
    (Join-Path $repoRoot "spike\persistent_onboarding")
)
$manifestPath = Join-Path $packageRoot "instructions.v1.json"
$manifest = Get-Content -Raw -LiteralPath $manifestPath | ConvertFrom-Json

$speaker = New-Object -ComObject SAPI.SpVoice
try {
    $installedVoices = $speaker.GetVoices()
    for ($index = 0; $index -lt $installedVoices.Count; $index += 1) {
        $candidate = $installedVoices.Item($index)
        if ($candidate.GetDescription().StartsWith($Voice)) {
            $speaker.Voice = $candidate
            break
        }
    }
    $speaker.Rate = 0
    foreach ($instruction in $manifest.instructions) {
        $target = [IO.Path]::GetFullPath(
            (Join-Path $packageRoot $instruction.audio_file)
        )
        if (-not $target.StartsWith(
            $packageRoot + [IO.Path]::DirectorySeparatorChar,
            [StringComparison]::OrdinalIgnoreCase
        )) {
            throw "Refusing to write audio outside the spike package."
        }
        $targetDirectory = Split-Path -Parent $target
        New-Item -ItemType Directory -Force -Path $targetDirectory | Out-Null
        $stream = New-Object -ComObject SAPI.SpFileStream
        try {
            # 3 is SSFMCreateForWrite. SAPI writes a standard RIFF/WAV file.
            $stream.Open($target, 3, $false)
            $speaker.AudioOutputStream = $stream
            $speaker.Speak($instruction.speech) | Out-Null
        }
        finally {
            $stream.Close()
            [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($stream)
        }
        Write-Output "Generated $target"
    }
}
finally {
    [void][Runtime.InteropServices.Marshal]::FinalReleaseComObject($speaker)
}
