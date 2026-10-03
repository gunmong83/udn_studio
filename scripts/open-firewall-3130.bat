@echo off
netsh advfirewall firewall add rule name="UDN_Studio_3130" dir=in action=allow protocol=TCP localport=3130
echo Port 3130 allowed.
pause
