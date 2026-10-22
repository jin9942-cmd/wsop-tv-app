# Generates the app icon, Android adaptive foreground, splash image and favicon:
# dark background #0B0C0F + "WSOP TV" text wordmark (no official logo). Paths match app.json.
#   powershell -ExecutionPolicy Bypass -File scripts/make-brand-assets.ps1
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$out = Join-Path $root 'assets/images'
$bg = [System.Drawing.ColorTranslator]::FromHtml('#0B0C0F')
$white = [System.Drawing.ColorTranslator]::FromHtml('#F2F2F3')
$gold = [System.Drawing.ColorTranslator]::FromHtml('#C9A961')

function Pick-Font([float]$size) {
  foreach ($name in @('Arial Black', 'Segoe UI Black', 'Arial')) {
    $f = New-Object System.Drawing.Font($name, $size, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
    if ($f.Name -eq $name) { return $f }
  }
  return $f
}

# Draws "WSOP" over "TV" (stacked) centred in a box of width $boxW.
function Draw-Wordmark($g, [int]$w, [int]$h, [float]$boxW) {
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $fmt = [System.Drawing.StringFormat]::GenericTypographic
  # Fit "WSOP" to the box width.
  $size = 200.0
  $font = Pick-Font $size
  $m = $g.MeasureString('WSOP', $font, 10000, $fmt)
  $size = $size * $boxW / $m.Width
  $font = Pick-Font $size
  $tvFont = Pick-Font ($size * 0.62)
  $m1 = $g.MeasureString('WSOP', $font, 10000, $fmt)
  $m2 = $g.MeasureString('TV', $tvFont, 10000, $fmt)
  $gap = $size * 0.06
  $barH = [Math]::Max(2, $size * 0.045)
  $total = $m1.Height + $gap + $barH + $gap + $m2.Height
  $y = ($h - $total) / 2
  $g.DrawString('WSOP', $font, (New-Object System.Drawing.SolidBrush($white)), ($w - $m1.Width) / 2, $y, $fmt)
  $y += $m1.Height + $gap
  # Thin gold rule between the two words.
  $g.FillRectangle((New-Object System.Drawing.SolidBrush($gold)), ($w - $m1.Width * 0.5) / 2, $y, $m1.Width * 0.5, $barH)
  $y += $barH + $gap
  $g.DrawString('TV', $tvFont, (New-Object System.Drawing.SolidBrush($gold)), ($w - $m2.Width) / 2, $y, $fmt)
}

function Make([string]$file, [int]$w, [int]$h, [float]$boxW, [bool]$opaque) {
  $bmp = New-Object System.Drawing.Bitmap($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  if ($opaque) { $g.Clear($bg) } else { $g.Clear([System.Drawing.Color]::Transparent) }
  Draw-Wordmark $g $w $h $boxW
  $path = Join-Path $out $file
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
  Write-Output "wrote $path ($w x $h)"
}

# App icon (iOS-style full bleed square; Android uses the adaptive icon below).
Make 'icon.png' 1024 1024 640 $true
# Android adaptive foreground: keep the mark inside the 66% safe zone (background colour comes from app.json).
Make 'android-icon-foreground.png' 1024 1024 470 $false
# Splash image (shown at 160dp wide on #0B0C0F).
Make 'splash-icon.png' 1024 1024 900 $false
# Web favicon.
Make 'favicon.png' 196 196 150 $true
