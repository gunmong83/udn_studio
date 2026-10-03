@echo off
netsh advfirewall firewall add rule name="UDN_Studio_3100" dir=in action=allow protocol=TCP localport=3100
echo Port 3100 allowed.
pause
