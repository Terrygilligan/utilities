# Generates app icons in public/.
# If scripts\tog-source.png exists, crops the dark icon region and scales it.
# Otherwise renders the interim sky-blue + white "TOG" placeholder.
# Re-run: powershell -NoProfile -File scripts\make-icons.ps1
Add-Type -AssemblyName System.Drawing

$OutDir = Join-Path $PSScriptRoot '..\public'
$Source = Join-Path $PSScriptRoot 'tog-source.png'

function New-RoundedRectPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
    $p = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $r * 2
    $p.AddArc($x, $y, $d, $d, 180, 90)
    $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $p.CloseFigure()
    return $p
}

function Save-Icon([System.Drawing.Bitmap]$art, [System.Drawing.Color]$bg, [int]$size, [string]$path, [float]$fill) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'
    $g.InterpolationMode = 'HighQualityBicubic'
    $g.Clear($bg)
    $box = [int]($size * $fill)
    $x = [int](($size - $box) / 2)
    if ($bg.A -eq 0) {
        $clip = New-RoundedRectPath $x $x $box $box ([float]($box * 0.18))
        $g.SetClip($clip)
        $clip.Dispose()
    }
    $g.DrawImage($art, $x, $x, $box, $box)
    $g.Dispose()
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "wrote $path"
}

if (Test-Path $Source) {
    $src = New-Object System.Drawing.Bitmap($Source)
    $minX = $src.Width; $maxX = 0; $minY = $src.Height; $maxY = 0
    for ($y = 0; $y -lt $src.Height; $y += 2) {
        for ($x = 0; $x -lt $src.Width; $x += 2) {
            $px = $src.GetPixel($x, $y)
            if ($px.R -lt 60 -and $px.G -lt 150) {
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }
    $inset = 4
    $rect = New-Object System.Drawing.Rectangle(
        ($minX + $inset), ($minY + $inset),
        ($maxX - $minX - 2 * $inset), ($maxY - $minY - 2 * $inset))
    Write-Output ("cropping " + $rect.Width + "x" + $rect.Height + " from source")
    $art = $src.Clone($rect, $src.PixelFormat)
    $navy = $art.GetPixel([int]($art.Width / 2), [int]($art.Height / 2))
    $transparent = [System.Drawing.Color]::Transparent

    Save-Icon $art $transparent 192 (Join-Path $OutDir 'icon-192.png') 1.0
    Save-Icon $art $transparent 512 (Join-Path $OutDir 'icon-512.png') 1.0
    Save-Icon $art $navy         512 (Join-Path $OutDir 'icon-512-maskable.png') 0.78
    Save-Icon $art $navy         180 (Join-Path $OutDir 'apple-touch-icon.png') 1.0
    Save-Icon $art $transparent 32  (Join-Path $OutDir 'favicon-32.png') 1.0
    $art.Dispose(); $src.Dispose()
} else {
    Write-Output 'tog-source.png not found - rendering placeholder'
    $Sky = [System.Drawing.Color]::FromArgb(56, 189, 248)
    function New-Placeholder([int]$size, [string]$path, [bool]$maskable) {
        $bmp = New-Object System.Drawing.Bitmap($size, $size)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.SmoothingMode = 'AntiAlias'
        $g.TextRenderingHint = 'AntiAlias'
        if ($maskable) { $g.Clear($Sky) } else {
            $g.Clear([System.Drawing.Color]::Transparent)
            $g.FillRectangle((New-Object System.Drawing.SolidBrush($Sky)), 0, 0, $size, $size)
        }
        $fontScale = if ($maskable) { 0.18 } else { 0.24 }
        $font = New-Object System.Drawing.Font('Arial', [single]($size * $fontScale), [System.Drawing.FontStyle]::Bold)
        $fmt = New-Object System.Drawing.StringFormat
        $fmt.Alignment = 'Center'; $fmt.LineAlignment = 'Center'
        $fmt.FormatFlags = [System.Drawing.StringFormatFlags]::NoWrap
        $rect = New-Object System.Drawing.RectangleF(0, 0, [single]$size, [single]$size)
        $g.DrawString('TOG', $font, [System.Drawing.Brushes]::White, $rect, $fmt)
        $font.Dispose(); $fmt.Dispose(); $g.Dispose()
        $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
        $bmp.Dispose()
        Write-Output "wrote $path"
    }
    New-Placeholder 192 (Join-Path $OutDir 'icon-192.png') $false
    New-Placeholder 512 (Join-Path $OutDir 'icon-512.png') $false
    New-Placeholder 512 (Join-Path $OutDir 'icon-512-maskable.png') $true
    New-Placeholder 180 (Join-Path $OutDir 'apple-touch-icon.png') $false
    New-Placeholder 32  (Join-Path $OutDir 'favicon-32.png') $false
}
