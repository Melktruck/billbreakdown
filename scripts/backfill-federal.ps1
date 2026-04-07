# =============================================================
# Federal Bill Backfill Script (PowerShell)
# Automatically pages through ALL 119th Congress bills
# Usage: .\scripts\backfill-federal.ps1
# =============================================================

$BaseUrl = "https://billbreakdown.vercel.app/api/cron/federal-backfill"
$Secret = "bb_cron_secure_2024"
$Limit = 250
$Batch = 15
$Offset = 0
$TotalCreated = 0
$TotalSkipped = 0
$TotalErrors = 0
$Run = 1

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  BillBreakdown Federal Backfill" -ForegroundColor Cyan
Write-Host "  Starting from offset: $Offset"
Write-Host "  Batch size: $Batch per call"
Write-Host "  Page size: $Limit"
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

while ($true) {
    $Url = "${BaseUrl}?secret=${Secret}&offset=${Offset}&limit=${Limit}&batch=${Batch}"
    Write-Host "[Run $Run] Fetching offset=$Offset ..." -ForegroundColor Yellow

    try {
        $Response = Invoke-RestMethod -Uri $Url -TimeoutSec 120 -ErrorAction Stop
    }
    catch {
        Write-Host "  ERROR: Request failed - $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "  Retrying in 10s..."
        Start-Sleep -Seconds 10
        continue
    }

    $Created = $Response.created
    $Skipped = $Response.skipped
    $Errors = $Response.errors
    $Done = $Response.done
    $NextOffset = $Response.nextOffset
    $Elapsed = $Response.elapsedMs
    $BillsInPage = $Response.billsInPage
    $TotalAvail = $Response.totalAvailable

    if ($null -eq $Created) {
        Write-Host "  ERROR: Could not parse response." -ForegroundColor Red
        Write-Host "  $($Response | ConvertTo-Json -Depth 2 | Out-String | Select-Object -First 500)"
        Write-Host "  Retrying in 10s..."
        Start-Sleep -Seconds 10
        continue
    }

    $TotalCreated += $Created
    $TotalSkipped += $Skipped
    $TotalErrors += $Errors

    Write-Host "  Created: $Created | Skipped: $Skipped | Errors: $Errors | Time: ${Elapsed}ms" -ForegroundColor Green
    Write-Host "  Bills in page: $BillsInPage | Total available: $TotalAvail"
    Write-Host "  Running totals - Created: $TotalCreated | Skipped: $TotalSkipped | Errors: $TotalErrors" -ForegroundColor Cyan

    # Check if we're done
    if ($Done -eq $true -or $null -eq $NextOffset) {
        Write-Host ""
        Write-Host "=========================================" -ForegroundColor Green
        Write-Host "  BACKFILL COMPLETE!" -ForegroundColor Green
        Write-Host "  Total created: $TotalCreated" -ForegroundColor Green
        Write-Host "  Total skipped: $TotalSkipped"
        Write-Host "  Total errors:  $TotalErrors"
        Write-Host "=========================================" -ForegroundColor Green
        break
    }

    # If everything was skipped, jump to next page
    if ($Created -eq 0 -and $Errors -eq 0) {
        Write-Host "  All bills already in DB, jumping to next page..."
        $Offset = $NextOffset
    }
    else {
        # Check if we exhausted the page
        $Processed = $Created + $Skipped + $Errors
        if ($Processed -lt $BillsInPage) {
            Write-Host "  More bills in this page, re-running same offset..."
        }
        else {
            $Offset = $NextOffset
        }
    }

    $Run++

    Write-Host "  Waiting 3s before next call..." -ForegroundColor DarkGray
    Start-Sleep -Seconds 3
    Write-Host ""
}
