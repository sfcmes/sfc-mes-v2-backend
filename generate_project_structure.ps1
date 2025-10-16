# Function to convert directory structure to JSON
function Get-DirectoryStructure {
    param (
        [string]$Path,
        [string[]]$Exclude = @("node_modules", ".git", "dist", "build")
    )

    $items = Get-ChildItem -Path $Path -Exclude $Exclude

    $structure = @()

    foreach ($item in $items) {
        $itemInfo = @{
            Name = $item.Name
            FullName = $item.FullName
            Type = if ($item.PSIsContainer) { "Directory" } else { "File" }
        }

        if ($item.PSIsContainer -and $item.Name -notin $Exclude) {
            $itemInfo.Children = @(Get-DirectoryStructure -Path $item.FullName -Exclude $Exclude)
        }

        $structure += $itemInfo
    }

    return $structure
}

# Set the root directory to the current directory
$rootPath = Get-Location

# Directories to exclude
$excludeDirs = @("node_modules", ".git", "dist", "build")

# Get the directory structure
$directoryStructure = @(Get-DirectoryStructure -Path $rootPath -Exclude $excludeDirs)

# Convert to JSON
$json = $directoryStructure | ConvertTo-Json -Depth 10

# Output JSON to a file
$json | Out-File -FilePath "project_structure.json" -Encoding UTF8

Write-Host "Project structure has been saved to project_structure.json"