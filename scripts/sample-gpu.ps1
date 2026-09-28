param([int]$ProcessId, [int]$Samples = 8)
$ErrorActionPreference = 'Stop'
# Read-only WDDM counters for the isolated test browser's GPU process.
$taskRows = @(Get-Counter -Counter '\GPU Engine(*)\Utilization Percentage' -SampleInterval 1 -MaxSamples $Samples -ErrorAction SilentlyContinue | ForEach-Object {
    # Unrelated processes can disappear during a wildcard sample. Keep valid
    # counters belonging to the stable test process, without treating them as 0.
    $taskEngines = @($_.CounterSamples | Where-Object { $_.Status -eq 0 -and $_.InstanceName -like "pid_${ProcessId}_*engtype_3d" })
    if ($taskEngines.Count -eq 0) { return }
    $taskHighest = ($taskEngines | Measure-Object -Property CookedValue -Maximum).Maximum
    [pscustomobject]@{
        timestamp = $_.Timestamp.ToUniversalTime().ToString('o')
        process3d = [math]::Round([double]$taskHighest, 2)
        engines = @($taskEngines | ForEach-Object { [pscustomobject]@{ name = $_.InstanceName; percent = [math]::Round($_.CookedValue, 2) } })
    }
})
if ($taskRows.Count -lt 4) { throw 'Insufficient valid GPU samples for the test browser.' }
ConvertTo-Json -InputObject $taskRows -Depth 4 -Compress
