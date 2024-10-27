@echo off
cd %appData%/.minecraft/server/spigot/
java -Xmx1024M -Xms1024M -jar spigot-1.20.4.jar nogui --world-container worlds
pause