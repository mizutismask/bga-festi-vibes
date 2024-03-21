#todo : replace newName value
$newName = "festivibes"

$templateName = "yourgamenamesk"
#renames files
Get-ChildItem -Path . *$templateName* -Recurse | Rename-Item -NewName { $_.Name -replace $templateName, $newName }
#replaces game name
Get-ChildItem $Directory -File -Recurse -exclude *.png,*.jpg,*.ps1 | ForEach-Object { (Get-Content $_.FullName) | ForEach-Object  { $_ -creplace [regex]::Escape($templateName), $newName  } | Set-Content $_.FullName }

#todo : replace here case sensitively
Get-ChildItem $Directory -File -Recurse -exclude *.png,*.jpg,*.ps1 | ForEach-Object { (Get-Content $_.FullName) | ForEach-Object  { $_ -creplace [regex]::Escape('YourGameNamesk'), 'Festivibes'  } | Set-Content $_.FullName }
