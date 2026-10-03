@echo off
netsh advfirewall firewall add rule name="UDN_Studio_3130" dir=in action=allow protocol=TCP localport=3130
netsh advfirewall firewall add rule name="UDN_Studio_3100" dir=in action=allow protocol=TCP localport=3100
echo.
echo ========================================================
echo  SUCCESS: Port 3130 and 3100 allowed in Windows Firewall!
echo  You can now access from other devices:
echo  http://192.168.219.135:3130
echo ========================================================
echo.
pause
