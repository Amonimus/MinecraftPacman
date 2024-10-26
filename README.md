# About
This is an experiment to try writing a Pac-Man code using mineflayer-pathfinder scripting tools.

# Credits
Amonimus

# Requirements and Installation
0. This is for Windows.
1. Have a Minecraft Launcher installed. You may need an official one from Microsoft.
2. Install Minecraft Java Edition 1.20.4 client from the Launcher.
3. Install a Spigot/Bukkit Minecraft Server specifically for 1.20.4. (https://www.spigotmc.org/wiki/buildtools/)
4. Install AntiDisconnectSpam and put it in Spigot's plugins folder. https://www.spigotmc.org/resources/antidisconnectspam-remove-disable-fix-and-change-disconnect-spam.33344/. Without it, bots will be kicked out when they try to post chat messages.
5. In Spigot's server.properties set:
* allow-nether=false
* difficulty=peaceful
* max-players=6
* level-name=pacman_bot
* motd=A Minecraft Server
6. Adjust startserver.bat so it points at the correct server executable in the Spigot folder. It's just a shortcut.
7. Run startserver.bat. It will run a Minecraft Server instance and should stop at something like "[Server thread/INFO]: Done (21.069s)! For help, type "help"". Try opening Minecraft and adding "localhost" to the Servers list. It should be online and connectable. There is a GUI version, but it's CPU heavy and is going to dump the same logs anyway. You'll need to have run.bat running in the background window.
8. Download pacman_bot world map and replace it in the Spigot folder. You can check it out.
9. Install npm and Node.JS. You can get them from https://nodejs.org/en/download/prebuilt-installer. Verify that they can be launched from cmd with node -v and npm -v.
10. Download and unpack nodejs_src somewhere. It will be connecting to the localhost Minecraft Server, so the location is irrelevant.
11. Run command node pacman.js. It should spawn 5 players on the Minecraft Server and give them some initial parameters. It should also stay in a separate background window.
12. Make every bot OPs in-game so they can use commands.

# Playing Pac-Man
* ???