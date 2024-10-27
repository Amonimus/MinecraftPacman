// Pac-Man Minecraft bots script
var math = require("mathjs")
var mineflayer = require("mineflayer");
var pathfinder = require('mineflayer-pathfinder').pathfinder
var Movements = require('mineflayer-pathfinder').Movements
var { GoalNear, GoalCompositeAll } = require('mineflayer-pathfinder').goals

var red = 16711680;
var blue = 65535;
var pink = 16761035;
var orange = 16760576;
var admin = "Am0nimus";
var bots = [
	"Pacman",
	"Blinky",
	"Pinky",
	"Inky",
	"Clyde"
]
var spawn = {x: -4, y: -60, z: 0}
var ghost_house = {x: 0, y: -53, z: -8}
var pacman_house = {x: 0, y: -53, z: 12}
var tl_corner = {x: -25, y: -53, z: -33}
var tr_corner = {x: 25, y: -53, z: -33}
var bl_corner = {x: -25, y: -53, z: 23}
var br_corner = {x: 25, y: -53, z: 23}

class MFBot {
	constructor(username) {
		this.username = username;
		this.config = {
			username: this.username,
			host: "localhost",
		};
		this.pathfinder_goals = [];
		this.is_pacman = false;
		this.at_spawn = false;
		this.game_started = false;
		this.walking = false;
		this.walk_start = null;
		this.walk_to = null;
		this.initBot();
	}
	
	// Configs
	
	async initBot() {
		// Bot initializer.
		this.bot = mineflayer.createBot(this.config);
		this.bot.loadPlugin(pathfinder);
		await this.initEventListeners();
		this.log("Initialized");
	}
	
	configPathfinder() {
		// Sets up mineflayer-pathfinder
		var defaultMove = new Movements(this.bot);
		defaultMove.allow1by1towers = false;
		defaultMove.canDig = false;
		defaultMove.allowFreeMotion = true;
		this.bot.pathfinder.thinkTimeout = 10000;
		this.bot.pathfinder.setMovements(defaultMove);
	}
	
	// Loops
	
	async initEventListeners() {
		// Setup Event Listeners.
		this.bot.once("spawn", () => {
			// On spawn event.
			this.chat("Hello, World!");
			this.game_started = false;
			this.configPathfinder();
			this.botStart();
		});
		this.bot.on('move', async () => {
			// As the bot is alive, it actually doesn't mean it's not moving.
			if (!this.bot.pathfinder.isMoving()) {
				if (!this.game_started) {
					// If the bot isn't in game mode and isn't moving, to stare at the Admin.
					this.lookAtPlayer(admin);
				}
			}
			//if (this.walking) {
			//	var time_passed = Date.now() - this.walk_start;
			//	if (time_passed > 10000) {
			//		this.chat("Walking too long!");
			//		this.bot.pathfinder.stop();
			//		this.walking = false;
			//		this.pathfinder_goals = [];
			//		this.suicide();
			//	}
			//}
			if (this.game_started) {
				await this.gameLoop();
			}
			if (this.walk_to) {
				// If walk position is set, to continue to move towards it. Note that it will continue even if it can't reach it.
				await this.bot.lookAt(this.walk_to.offset(0, this.bot.entity.height, 0));
				if (!this.walk_to) {
					// Sometimes this.walk_to is finally set to null after lookAt.
					return;
				}
				var dist = this.getPosition().distanceTo(this.walk_to);
				//this.chat("Distance: " + dist);
				if (dist <= 0.3) {
					this.bot.setControlState('forward', false);
					this.log("I'm at anchor.");
					this.walk_to = null;
				}
			}
		});
		this.bot.on('chat', async (username, message) => {
			// Triggered when there's any chat message
			// Prevents bots from reacting to each other
			if (username === this.bot.username) return;
			if (bots.includes(username)) return;
			await this.reactMessage(username, message, false);
		});
		this.bot.on('whisper', async (username, message, rawMessage) => { 
			// Triggered when a bot is addressed by /tell 
			// Prevents bots from reacting to each other
			if (username === this.bot.username) return;
			if (bots.includes(username)) return;
			await this.reactMessage(username, message, true);
		});
		this.bot.on('death', () => { 
			// If the bot has died
			this.log("Bot died.");
			this.botStart();
		});
		this.bot.on('goal_reached', (goals) => {
			// If pathfinder objective is reached
			this.log(JSON.stringify(goals));
			if (goals.goals){
				for (var i=0; i < goals.goals.length; i++) {
					var goal = goals.goals[i];
					this.log("Goal reached: " + this.formatCoord(goal));
					this.pathfinder_goals.pop(goal);
				}
			} else {
				var goal = goals;
				this.log("Goal reached: " + this.formatCoord(goal));
				this.pathfinder_goals.pop(goal);
			}
		});
	}
	
	async reactMessage(username, message, to_bot = false) {
		// Responds to chat message
		if (message === "hello") {
			// If player says hello, to also say hello
			if (to_bot) {
				this.bot.whisper(username, "Hello!");
			} else {
				this.bot.chat("Hello!");
			}
		} else if (message === "here") {
			// Request to go to the player. Can only be directed
			if (to_bot) {
				await this.walkToPlayer(username);
			}
		} else if (message === 'stop') {
			// Stops pathfinder goals
			this.bot.whisper(username, "Stopping.");
			this.bot.pathfinder.stop();
			this.pathfinder_goals = [];
		} else if (message === 'snap') {
			// DEBUG: Finds the closest white_glass block and steps on it
			await this.snapGird();
		} else if (message === 'look') {
			// DEBUG: Lists nearby block
			await this.checkAround();
		} else if (message === 'start') {
			// Starts game
			this.chat("Game Start!");
			this.game_started = true;
		} else if (message === 'end') {
			// Ends game
			this.chat("Game End!");
			this.game_started = false;
			this.botStart();
		} else {
			// Default
			if (to_bot) {
				this.bot.whisper(username, "I don't understand?");
			}
		}
	};
	
	async gameLoop() {
		// Main game logic
		if (!this.is_pacman) {
			await this.scatterCorner();
		}
		if (this.is_pacman){
			await this.watchInput();
		}
	}
	
	// Helpers
	
	log() {
		// Sets logger formatting, so it'd append bot name
		var msg = "";
		for (var i=0; i<arguments.length; i++) {
			msg += arguments[i] + " ";
		}
		console.log(this.username+":", msg);
	}
	
	formatCoord(coord) {
		// Formats objects with coordinates into (x,y,z) view
		return "(" + coord.x.toFixed(1) + ", " + coord.y.toFixed(1) + ", " + coord.z.toFixed(1) + ")";
	}
	
	getPosition() {
		// Get bot's position
		var pos = this.bot.entity.position;
		this.log("Currently at " + this.formatCoord(pos));
		return pos;
	}
	
	getPlayerEntity(username) {
		// Returns Entity object of the select player
		var entity = this.bot.players[username] ? this.bot.players[username].entity : null;
		return entity;
	}
		
	randomAround(position, range) {
		// Gives a position some random offset
		this.log("Location: " + this.formatCoord(position));
		var new_pos = Object.assign({}, position);
		new_pos.x += (Math.random() * range) - 0.5;
		new_pos.z += (Math.random() * range) - 0.5;
		this.log("New Location: " + this.formatCoord(new_pos));
		return new_pos;
	}
	
	// Bot actions, general
	
	chat(msg) {
		// Extends bot sending messages to chat
		this.log('\"' + msg + '\"');
		this.bot.chat(msg);
	}
	
	lookAtPlayer(username) {
		// Looks at the select player
		var player = this.getPlayerEntity(username);
		if (player) {
			this.bot.lookAt(player.position.offset(0, player.height, 0));
		}
	}
	
	suicide() {
		// Kill self
		this.chat("Can't get unstuck.");
		this.chat("/kill @s");
	}

	// Bot actions, pathfinding
	
	async walkToPlayer(username) {
		// Assign player's position as pathfinder goal
		this.log("Going to " + username);
		var target = this.getPlayerEntity(username);
		if (!target) {
			this.chat("I don't see you?");
			return
		}
		var p = target.position;
		await this.walkToPosition(p, 2);
	}
	
	async walkToPosition(p, dis) {
		// Set pathfinder goal
		var goal = new GoalNear(p.x, p.y, p.z, dis);
		var botPosition = this.getPosition();
		this.log("goto", this.formatCoord(p), "from", this.formatCoord(botPosition));
		this.chat("Going to " + this.formatCoord(p));
		this.walking = true;
		this.walk_start = Date.now();
		await this.addGoal(goal);
	}
	
	async addGoal(goal, forget = false) {
		// Set pathfinder
		if (forget) {
			this.pathfinder_goals = [goal];
		} else {
			this.pathfinder_goals.push(goal);
		}
		var goal_paths = [];
		for (var i=0; i < this.pathfinder_goals.length; i++) {
			goal_paths.push(this.formatCoord(this.pathfinder_goals[i]));
		}
		this.log("Goals: " + goal_paths);
		// var goalAll = new GoalCompositeAll(this.pathfinder_goals);
		// var goalAll = new GoalCompositeAll(this.pathfinder_goals);
		await this.bot.pathfinder.goto(goal)
		.then(() => {
			this.log("Path completed awaited");
			this.announceArrived();
		})
		.catch((err) => {
			this.pathfinder_goals = [];
			this.log("Pathfinding error", err.name, err);
			if (err.name === 'PathStopped') {
				this.log("Path was stopped before it could be completed!");
			} else if (err.name === 'GoalChanged') {
				
			} else if (err.name === 'NoPath') {
				this.chat("Can't get path to " + this.formatCoord(goal));
			} else if (err.name === 'Timeout') {
				this.chat("Can't find path to " + this.formatCoord(goal));
			} else {
				this.chat("Can't get path to " + this.formatCoord(goal));
			}
		});
	}	
	
	announceArrived() {
		// Tell that pathfinder has ended
		var botPosition = this.getPosition();
		this.chat("I've arrived. I'm at " + this.formatCoord(botPosition) + ".");
	}
		
	// Bot actions, game

	async botStart() {
		// Initial behavior at game start
		if (this.username === "Blinky") {
			this.color = red;
		} else if (this.username === "Inky") {
			this.color = blue;
		} else if (this.username === "Pinky") {
			this.color = pink;
		} else if (this.username === "Clyde") {
			this.color = orange;
		} else if (this.username === "Pacman") {
			this.is_pacman = true;
			this.clearObjective();
		}
		this.chat("Returning to spawn.");
		await this.walkToPosition(spawn, 2);
		//if (this.getPosition().distanceTo(spawn) > 10) {
		//	this.chat("Somehow I am not at Spawn.");
		//	return;
		//}
		if (!this.is_pacman) {
			this.chat("Clearing equipment.");
			await this.resetInventory();
			this.chat("Now fully equipped.");
			await this.walkToPosition(this.randomAround(ghost_house, 2), 2);
		} else {
			await this.walkToPosition(pacman_house, 1);
			this.createObjective();
		}
		this.chat("I'm ready.");
	}

	async resetInventory() {
		// Get yourself colored gear
		await this.bot.creative.clearInventory();
		if (!this.is_pacman) {
			await this.spawnEquipment('leather_helmet', 'head');
			await this.spawnEquipment('leather_chestplate', 'torso');
			await this.spawnEquipment('leather_leggings', 'legs');
			await this.spawnEquipment('leather_boots', 'feet');
		}
	}
	
	async spawnEquipment(item_name, slot) {
		// Gives self specific equipment. May need several attempts
		//this.chat(`/give @s minecraft:${item_name}{display:{color:${this.color}}}`);
		var timeout = 20;
		var item = null;
		await this.chat(`/give @s minecraft:${item_name}{display:{color:${this.color}}}`);
		await this.bot.waitForTicks(5);
		while (!item) {
			//this.log("Inventory: " + JSON.stringify(this.bot.inventory.items()));
			item = await this.bot.inventory.items().find(
				item => {
					//this.log(item.name);
					return item.name.includes(item_name);
				}
			);
			if (!item) {
				this.chat("Still don't have " + item_name);
			} else {
				break;
			}
			await this.bot.waitForTicks(5);
			timeout -= 1;
			if (timeout <= 0) {
				this.chat("Can't get " + item_name);
				break;
			}
		}
		if (item) {
			await this.chat("Equipped " + item.name);
			this.bot.equip(item, slot);
		}
	}

	clearObjective() {
		// Resets game's objective board
		this.chat("/scoreboard objectives setdisplay sidebar");
		this.chat("/scoreboard objectives remove pellets");
	}
	
	createObjective() {
		// Sets game's objective board
		this.chat("/scoreboard objectives add pellets dummy");
		this.chat("/scoreboard objectives setdisplay sidebar pellets");
		this.chat("/scoreboard players set Pacman pellets 244");
		this.chat("Objectives set.");
	}
	
	async scatterCorner() {
		// Move to corners
		if (this.username === "Blinky") {
			await this.walkToPosition(tr_corner, 1);
		} else if (this.username === "Inky") {
			await this.walkToPosition(br_corner, 1);
		} else if (this.username === "Pinky") {
			await this.walkToPosition(tl_corner, 1);
		} else if (this.username === "Clyde") {
			await this.walkToPosition(bl_corner, 1);
		}
		await this.walkToPosition(ghost_house, 2);
	}
	
	async snapGird() {
		// Walk to the closed white anchor.
		this.log("Snapping...");
		var blockType = this.bot.registry.blocksByName['white_stained_glass'];
		var block = this.bot.findBlock({matching: blockType.id, maxDistance: 3});
		if (block) {
			this.walk_to = block.position.offset(0.5, 1, 0.5);
			this.bot.setControlState('forward', true);
		} else {
			this.bot.chat("I can't snap.");
		}
	}
	
	async checkAround() {
		// Logs nearby blocks
		var block = this.bot.findBlock(
			{
				matching: (block) => {
					if (block.name != 'air') {
						this.log(JSON.stringify(block));
					}
				},
				useExtraInfo: true,
				maxDistance: 2
			}
		);
	}
	
	async watchInput() {
		var target = this.getPlayerEntity(admin);
		if (!target) {
			this.chat("I don't see you?");
			return;
		}
		var p = target.position;
		this.log(p);
		if (p.distanceTo({x: -0.5, y: 0, z: 0.5}) <= 0.5){
			this.chat("Left");
			this.log(p.distanceTo({x: -0.5, y: 0, z: 0.5}));
		} else if (p.distanceTo({x: 1.5, y: 0, z: 0.5}) <= 0.5){
			this.chat("Right");
			this.log(p.distanceTo({x: 1.5, y: 0, z: 0.5}));
		} else if (p.distanceTo({x: 0.5, y: 0, z: -0.5}) <= 0.5){
			this.chat("Up");
			this.log(p.distanceTo({x: 0.5, y: 0, z: -0.5}));
		} else if (p.distanceTo({x: 0.5, y: 0, z: 1.5}) <= 0.5){
			this.chat("Down");
			this.log(p.distanceTo({x: 0.5, y: 0, z: 1.5}));
		} else 
		this.log(this.formatCoord(p));
	}
}

// Main

for (var i=0; i < bots.length; i++) {
	new MFBot(bots[i]);
}