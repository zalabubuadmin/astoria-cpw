; Astoria CPW — Custom NSIS installer additions
; This file is included by electron-builder automatically

; Custom finish page behavior — launch app after install
!macro customInstall
  ; Set registry key for auto-start (optional — remove if not wanted)
  ; WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "AstoriaCPW" "$INSTDIR\AstoriaCPW.exe"
!macroend

!macro customUnInstall
  ; Clean up registry on uninstall
  ; DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "AstoriaCPW"
!macroend
