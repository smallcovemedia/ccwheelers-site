<#
.SYNOPSIS
  One-time local job: creates CC Wheelers Sunset Collection products on Printful.

.DESCRIPTION
  Reads the Printful API key from $env:PRINTFUL_API_KEY -- set that yourself in
  this terminal session before running. This script never prompts for the key,
  logs it, writes it to a file, or sends it anywhere but Printful's API.

  Creates one sync product per Sunset Collection design on the Crop Hoodie
  catalog product (Printful catalog id 317, "Women's Cropped Hoodie |
  Bella + Canvas 7502"), across every color/size Printful offers for it.
  Front print is the shared collection badge; back print is the design's
  own artwork. Pricing matches the existing Oceano Love Crop Hoodie ($59,
  $61.50 for 2XL).

.PARAMETER Design
  Which design to create: 01-06, or "all" to run every one in sequence.
  No default -- you choose explicitly each time so nothing fires by accident.

.EXAMPLE
  $env:PRINTFUL_API_KEY = "paste-it-here-only-in-this-terminal"
  .\scripts\create-sunset-products.ps1 -Design 01
#>
param(
  [Parameter(Mandatory=$true)]
  [ValidateSet("01","02","03","04","05","06","all")]
  [string]$Design
)

if (-not $env:PRINTFUL_API_KEY) {
  Write-Error "Set `$env:PRINTFUL_API_KEY in this terminal first (this script will not prompt for it or store it anywhere)."
  exit 1
}
$Key = $env:PRINTFUL_API_KEY

$FrontBadge = "https://ccwheelers.com/images/merch-sunset-collection-badge.png"

$Designs = [ordered]@{
  "01" = @{ Name = "Hidden Treasure";   File = "merch-sunset-01-hidden-treasure.png" }
  "02" = @{ Name = "Sunset Together";   File = "merch-sunset-02-sunset-together.png" }
  "03" = @{ Name = "Just Us";           File = "merch-sunset-03-just-us.png" }
  "04" = @{ Name = "Our Escape";        File = "merch-sunset-04-our-escape.png" }
  "05" = @{ Name = "Better Together";   File = "merch-sunset-05-better-together.png" }
  "06" = @{ Name = "Love Runs on Sand"; File = "merch-sunset-06-love-runs-on-sand.png" }
}

# Crop Hoodie (Printful catalog product 317). variant_id -> color/size,
# confirmed via GET /products/317. Peach only has an XL in the catalog.
$Variants = @(
  @{ Id = 9633; Color = "Black";          Size = "S" },
  @{ Id = 9634; Color = "Black";          Size = "M" },
  @{ Id = 9635; Color = "Black";          Size = "L" },
  @{ Id = 9636; Color = "Black";          Size = "XL" },
  @{ Id = 9637; Color = "Black";          Size = "2XL" },
  @{ Id = 9643; Color = "Military Green"; Size = "S" },
  @{ Id = 9644; Color = "Military Green"; Size = "M" },
  @{ Id = 9645; Color = "Military Green"; Size = "L" },
  @{ Id = 9646; Color = "Military Green"; Size = "XL" },
  @{ Id = 9647; Color = "Military Green"; Size = "2XL" },
  @{ Id = 9641; Color = "Peach";          Size = "XL" },
  @{ Id = 9648; Color = "Storm";          Size = "S" },
  @{ Id = 9649; Color = "Storm";          Size = "M" },
  @{ Id = 9650; Color = "Storm";          Size = "L" },
  @{ Id = 9651; Color = "Storm";          Size = "XL" },
  @{ Id = 9652; Color = "Storm";          Size = "2XL" }
)

function New-SunsetProduct {
  param([string]$DesignKey)

  $d = $Designs[$DesignKey]
  $backUrl = "https://ccwheelers.com/images/$($d.File)"
  $productName = "CC Wheelers Sunset Collection -- $($d.Name)"

  Write-Host "Creating '$productName'..." -ForegroundColor Cyan

  $syncVariants = $Variants | ForEach-Object {
    $price = if ($_.Size -eq "2XL") { "61.50" } else { "59.00" }
    @{
      variant_id   = $_.Id
      retail_price = $price
      files        = @(
        @{ type = "default"; url = $FrontBadge },
        @{ type = "back";    url = $backUrl }
      )
    }
  }

  $body = @{
    sync_product  = @{ name = $productName }
    sync_variants = $syncVariants
  } | ConvertTo-Json -Depth 6

  try {
    $res = Invoke-RestMethod -Uri "https://api.printful.com/store/products" `
      -Method Post `
      -Headers @{ Authorization = "Bearer $Key"; "Content-Type" = "application/json" } `
      -Body $body

    $created = $res.result
    $variantCount = ($res.result.sync_variants | Measure-Object).Count
    Write-Host "  Created product id $($created.id): '$($created.name)' with $variantCount variants" -ForegroundColor Green
  } catch {
    $errBody = $_.ErrorDetails.Message
    Write-Host "  FAILED: $errBody" -ForegroundColor Red
  }
}

if ($Design -eq "all") {
  foreach ($k in $Designs.Keys) {
    New-SunsetProduct -DesignKey $k
  }
} else {
  New-SunsetProduct -DesignKey $Design
}
