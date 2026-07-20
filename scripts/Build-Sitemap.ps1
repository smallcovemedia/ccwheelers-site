<#
Build-Sitemap.ps1

Rebuilds sitemap.xml with <image:image> entries for every content image on
every page, so Google Images can index them. Run it from the repo root after
adding or renaming images:

    powershell -ExecutionPolicy Bypass -File scripts\Build-Sitemap.ps1

Existing <loc>, <lastmod> and <priority> values are preserved. Pages not
already in the sitemap are left out, so this never publishes something by
accident; add the <url> entry by hand first, then re-run.

Site chrome (logo, favicons, icons) is skipped. An image needs alt text to be
included, because the alt becomes its caption and an image with no caption is
not worth indexing.
#>

param(
  [string]$Root = (Split-Path $PSScriptRoot -Parent),
  [string]$BaseUrl = "https://ccwheelers.com",
  [switch]$WhatIf
)

$ErrorActionPreference = 'Stop'
$sitemapPath = Join-Path $Root 'sitemap.xml'
if(-not (Test-Path $sitemapPath)){ throw "sitemap.xml not found at $sitemapPath" }

# Chrome and decorative assets that should never appear in image search.
$skip = @('ccw-logo','favicon','apple-touch-icon','og-image')

function Add-Image([System.Collections.ArrayList]$list,[string]$src,[string]$alt){
  if(-not $src){ return }
  if($src -notmatch '^images/'){ return }
  if([string]::IsNullOrWhiteSpace($alt)){ return }   # decorative or unlabelled
  $leaf = [System.IO.Path]::GetFileNameWithoutExtension($src)
  if($script:skip | Where-Object { $leaf -like "*$_*" }){ return }
  if(-not (Test-Path (Join-Path $script:Root $src))){
    Write-Warning "missing file, skipped: $src"
    return
  }
  [void]$list.Add([pscustomobject]@{ Src = $src; Alt = $alt })
}

function Get-PageImages([string]$htmlPath){
  $html = Get-Content $htmlPath -Raw
  $out = New-Object System.Collections.ArrayList

  # 1. plain <img> tags
  foreach($m in [regex]::Matches($html,'<img\b[^>]*>')){
    $tag = $m.Value
    Add-Image $out ([regex]::Match($tag,'src\s*=\s*"([^"]+)"').Groups[1].Value) `
                   ([regex]::Match($tag,'alt\s*=\s*"([^"]*)"').Groups[1].Value)
  }

  # 2. images declared in page JavaScript, e.g. a picker or carousel that
  #    injects its own <img>. Without this they are invisible to image search.
  #    Matches  src: 'images/...'  or  art: 'images/...'  followed by an
  #    alt: '...' within the same object literal.
  foreach($m in [regex]::Matches($html,"(?:src|art)\s*:\s*'(images/[^']+)'\s*,\s*(?:[a-zA-Z]+\s*:\s*'[^']*'\s*,\s*)*?alt\s*:\s*'([^']*)'")){
    Add-Image $out $m.Groups[1].Value $m.Groups[2].Value
  }
  #    and the reverse order, alt first then src
  foreach($m in [regex]::Matches($html,"alt\s*:\s*'([^']*)'\s*,\s*(?:[a-zA-Z]+\s*:\s*'[^']*'\s*,\s*)*?(?:src|art)\s*:\s*'(images/[^']+)'")){
    Add-Image $out $m.Groups[2].Value $m.Groups[1].Value
  }

  # de-duplicate: the same image can appear twice (carousel clones, JS + markup)
  return $out | Sort-Object Src -Unique
}

function Esc([string]$s){
  return ($s -replace '&','&amp;' -replace '<','&lt;' -replace '>','&gt;' -replace '"','&quot;')
}

# Title for an image: first clause of the alt text, which reads better as a
# title than the whole sentence.
function Get-Title([string]$alt){
  $t = ($alt -split ',')[0].Trim()
  if($t.Length -gt 90){ $t = $t.Substring(0,87).Trim() + '...' }
  return $t
}

[xml]$xml = Get-Content $sitemapPath -Raw
$ns = 'http://www.sitemaps.org/schemas/sitemap/0.9'
$imgNs = 'http://www.google.com/schemas/sitemap-image/1.1'

$lines = @()
$lines += '<?xml version="1.0" encoding="UTF-8"?>'
$lines += '<urlset xmlns="' + $ns + '"'
$lines += '        xmlns:image="' + $imgNs + '">'

$totalImgs = 0
$pagesWith = 0

foreach($url in $xml.urlset.url){
  $loc = $url.loc
  $lastmod = $url.lastmod
  $priority = $url.priority

  # map the URL back to a local file
  $rel = $loc.Substring($BaseUrl.Length).TrimStart('/')
  if([string]::IsNullOrWhiteSpace($rel)){ $rel = 'index.html' }
  $file = Join-Path $Root $rel

  $imgs = @()
  if(Test-Path $file){ $imgs = @(Get-PageImages $file) }

  $lines += '  <url>'
  $lines += '    <loc>' + (Esc $loc) + '</loc>'
  if($lastmod){  $lines += '    <lastmod>' + $lastmod + '</lastmod>' }
  if($priority){ $lines += '    <priority>' + $priority + '</priority>' }
  foreach($i in $imgs){
    $lines += '    <image:image>'
    $lines += '      <image:loc>' + (Esc ($BaseUrl + '/' + $i.Src)) + '</image:loc>'
    $lines += '      <image:title>' + (Esc (Get-Title $i.Alt)) + '</image:title>'
    $lines += '      <image:caption>' + (Esc $i.Alt) + '</image:caption>'
    $lines += '    </image:image>'
    $totalImgs++
  }
  if($imgs.Count -gt 0){ $pagesWith++ }
  $lines += '  </url>'

  Write-Host ("{0,-34} {1,3} images" -f $rel,$imgs.Count)
}

$lines += '</urlset>'
$xmlOut = ($lines -join "`n") + "`n"

if($WhatIf){
  Write-Host "`n-- WhatIf: not written --"
} else {
  Set-Content -Path $sitemapPath -Value $xmlOut -Encoding utf8 -NoNewline
  Write-Host "`nwrote sitemap.xml"
}
Write-Host ("{0} images across {1} pages" -f $totalImgs,$pagesWith)
