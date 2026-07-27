<#
.SYNOPSIS
  One-time local job: creates Ruff Riders bandanas + sticker products for
  both the Sunset Collection and Ruff Riders lines on Printful.

.DESCRIPTION
  Reads the Printful API key from $env:PRINTFUL_API_KEY -- set that yourself in
  this terminal session before running. This script never prompts for the key,
  logs it, writes it to a file, or sends it anywhere but Printful's API.

  Three batches:
  - bandana: 4 Ruff Riders designs on the Pet Bandana Collar (catalog 902),
    S/M/L/XL, single print (bandanas are one-sided).
  - stickers-sunset: 6 Sunset Collection designs as Kiss-Cut Vinyl Decals
    (catalog 974), all 4 sizes, tiered pricing anchored at $5 for 3x4.
  - stickers-ruff: same as above, for the 4 Ruff Riders designs.

.PARAMETER Batch
  Which batch to run: bandana, stickers-sunset, stickers-ruff, or all.

.EXAMPLE
  $env:PRINTFUL_API_KEY = "paste-it-here-only-in-this-terminal"
  .\scripts\create-batch2-products.ps1 -Batch bandana
#>
param(
  [Parameter(Mandatory=$true)]
  [ValidateSet("bandana","stickers-sunset","stickers-ruff","all")]
  [string]$Batch
)

if (-not $env:PRINTFUL_API_KEY) {
  Write-Error "Set `$env:PRINTFUL_API_KEY in this terminal first (this script will not prompt for it or store it anywhere)."
  exit 1
}
$Key = $env:PRINTFUL_API_KEY
$Headers = @{ Authorization = "Bearer $Key"; "Content-Type" = "application/json" }

function New-Product($name, $syncVariants) {
  Write-Host "Creating '$name'..." -ForegroundColor Cyan
  $body = @{ sync_product = @{ name = $name }; sync_variants = $syncVariants } | ConvertTo-Json -Depth 6
  try {
    $res = Invoke-RestMethod -Uri "https://api.printful.com/store/products" -Method Post -Headers $Headers -Body $body
    $variantCount = ($res.result.sync_variants | Measure-Object).Count
    Write-Host "  Created product id $($res.result.id): '$($res.result.name)' with $variantCount variants" -ForegroundColor Green
  } catch {
    $detail = $_.ErrorDetails.Message
    if (-not $detail) { $detail = $_.Exception.Message }
    $status = $null
    if ($_.Exception.Response) { $status = [int]$_.Exception.Response.StatusCode }
    Write-Host "  FAILED (status $status): $detail" -ForegroundColor Red
  }
}

# ---- Ruff Riders bandanas (catalog 902, Black only, single print) ----
$BandanaDesigns = [ordered]@{
  "Beach Bum"   = "ruff-beach-bum.png"
  "Camp Pup"    = "ruff-camp-pup.png"
  "Sand Patrol" = "ruff-sand-patrol.png"
  "Trail Boss"  = "ruff-trail-boss.png"
}
$BandanaVariants = @(
  @{ Id = 23142; Size = "S";  Price = "20.51" },
  @{ Id = 23141; Size = "M";  Price = "20.51" },
  @{ Id = 23140; Size = "L";  Price = "22.31" },
  @{ Id = 23143; Size = "XL"; Price = "22.31" }
)

function New-BandanaProducts {
  foreach ($name in $BandanaDesigns.Keys) {
    $fileUrl = "https://ccwheelers.com/images/print/$($BandanaDesigns[$name])"
    $syncVariants = $BandanaVariants | ForEach-Object {
      @{ variant_id = $_.Id; retail_price = $_.Price; files = @(@{ type = "default"; url = $fileUrl }) }
    }
    New-Product -name "Ruff Riders -- $name" -syncVariants $syncVariants
    Start-Sleep -Seconds 2
  }
}

# ---- Stickers (catalog 974, Kiss-Cut Vinyl Decals, 4 sizes) ----
# Tiered pricing anchored at $5 for 3x4, same ratios as the site's existing
# $2 baseline (1x / 1.5x / 3x / 5x).
$StickerVariants = @(
  @{ Id = 24971; Size = '3x4';  Price = "5.00" },
  @{ Id = 24972; Size = '4x6';  Price = "7.50" },
  @{ Id = 24973; Size = '6x8';  Price = "15.00" },
  @{ Id = 24974; Size = '8x10'; Price = "25.00" }
)

$SunsetStickerDesigns = [ordered]@{
  "Hidden Treasure"   = "sunset-01-hidden-treasure.png"
  "Sunset Together"   = "sunset-02-sunset-together.png"
  "Just Us"           = "sunset-03-just-us.png"
  "Our Escape"        = "sunset-04-our-escape.png"
  "Better Together"   = "sunset-05-better-together.png"
  "Love Runs on Sand" = "sunset-06-love-runs-on-sand.png"
}
$RuffStickerDesigns = [ordered]@{
  "Beach Bum"   = "ruff-beach-bum.png"
  "Camp Pup"    = "ruff-camp-pup.png"
  "Sand Patrol" = "ruff-sand-patrol.png"
  "Trail Boss"  = "ruff-trail-boss.png"
}

function New-StickerProducts($namePrefix, $designs) {
  foreach ($name in $designs.Keys) {
    $fileUrl = "https://ccwheelers.com/images/print/$($designs[$name])"
    $syncVariants = $StickerVariants | ForEach-Object {
      @{ variant_id = $_.Id; retail_price = $_.Price; files = @(@{ type = "default"; url = $fileUrl }) }
    }
    New-Product -name "$namePrefix -- $name Vinyl Decals" -syncVariants $syncVariants
    Start-Sleep -Seconds 2
  }
}

switch ($Batch) {
  "bandana"         { New-BandanaProducts }
  "stickers-sunset" { New-StickerProducts -namePrefix "CC Wheelers Sunset Collection" -designs $SunsetStickerDesigns }
  "stickers-ruff"   { New-StickerProducts -namePrefix "Ruff Riders" -designs $RuffStickerDesigns }
  "all" {
    New-BandanaProducts
    New-StickerProducts -namePrefix "CC Wheelers Sunset Collection" -designs $SunsetStickerDesigns
    New-StickerProducts -namePrefix "Ruff Riders" -designs $RuffStickerDesigns
  }
}
