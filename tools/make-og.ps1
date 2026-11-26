# 링크 미리보기 이미지(1200x630) 생성: og.png(한국어), og-en.png(영어)
# 실행: powershell -File tools/make-og.ps1
Add-Type -AssemblyName System.Drawing
$root = Split-Path -Parent $PSScriptRoot

function Color-Of($hex) { [System.Drawing.ColorTranslator]::FromHtml($hex) }
function Rounded-Path($x, $y, $w, $h, $r) {
  $p = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $p.AddArc($x, $y, $d, $d, 180, 90); $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90); $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $p.CloseFigure(); $p
}

function New-Card($file, $fontName, $text) {
  $bmp = New-Object System.Drawing.Bitmap 1200, 630
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'; $g.TextRenderingHint = 'AntiAliasGridFit'
  $rect = New-Object System.Drawing.Rectangle 0, 0, 1200, 630
  $bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, (Color-Of '#fff4ef'), (Color-Of '#eef6ff'), 90.0
  $g.FillRectangle($bg, $rect)
  $ink = New-Object System.Drawing.SolidBrush (Color-Of '#1b2333')
  $accent = New-Object System.Drawing.SolidBrush (Color-Of '#ff6b4a')
  $muted = New-Object System.Drawing.SolidBrush (Color-Of '#5f6b80')
  $white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
  $fmt = [System.Drawing.StringFormat]::GenericTypographic
  $font = { param($size, $style = 'Bold') New-Object System.Drawing.Font $fontName, $size, ([System.Drawing.FontStyle]$style), ([System.Drawing.GraphicsUnit]::Pixel) }

  $g.FillPath($accent, (Rounded-Path 80 90 72 72 18))
  $tri = [System.Drawing.PointF[]]@((New-Object System.Drawing.PointF 108, 110), (New-Object System.Drawing.PointF 133, 126), (New-Object System.Drawing.PointF 108, 142))
  $g.FillPolygon($white, $tri)
  $g.DrawString($text.name, (& $font 40), $ink, 178, 102, $fmt)
  $g.DrawString($text.line1, (& $font $text.size), $ink, 86, 240, $fmt)
  $g.DrawString($text.line2, (& $font $text.size), $accent, 86, 330, $fmt)
  $g.DrawString($text.sub, (& $font 30 'Regular'), $muted, 88, 452, $fmt)
  $x = 80
  $chip = & $font 30 'Regular'
  foreach ($c in $text.chips) {
    $w = [int]($g.MeasureString($c, $chip, 1200, $fmt).Width) + 50
    $g.FillPath($white, (Rounded-Path $x 520 $w 54 27))
    $g.DrawString($c, $chip, $ink, ($x + 25), 530, $fmt)
    $x += $w + 12
  }
  $bmp.Save((Join-Path $root $file), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
  "saved $file"
}

New-Card 'og.png' 'Malgun Gothic' @{
  name = '떠날지도'; size = 66
  line1 = '어디로 떠나고 싶으세요?'; line2 = '명소를 영상으로 먼저 여행하세요'
  sub = '명소 숏폼 · 환율 · 날씨 · 항공편 · 호텔을 한 번에'
  chips = @('일본', '베트남', '태국', '프랑스', '스위스', '미국')
}
New-Card 'og-en.png' 'Segoe UI' @{
  name = 'Maybe Go'; size = 68
  line1 = 'Where do you want to go?'; line2 = 'See it on video before you travel'
  sub = 'Short videos · Exchange rates · Weather · Flights · Hotels'
  chips = @('Japan', 'Vietnam', 'Thailand', 'France', 'Switzerland', 'USA')
}
