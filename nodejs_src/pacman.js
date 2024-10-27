const math = require("mathjs")
const mineflayer = require("mineflayer");
const pathfinder = require('mineflayer-pathfinder').pathfinder
const Movements = require('mineflayer-pathfinder').Movements
const { GoalNear, GoalCompositeAll } = require('mineflayer-pathfinder').goals

const red = 16711680;
const blue = 65535;
const pink = 16761035;
const orange = 16760576;
const admin = "Am0nimus";
const bots = [
	"Pacman",
	"Blinky",
	"Pinky",
	"Inky",
	"Clyde"
]
const spawn = {x: 0, y: -60, z: 0}
const ghost_house = {x: -7, y: -52, z: 2}
const pacman_house = {x: 11, y: -52, z: 2}
const tl_corner = {x: -34, y: -52, z: 27}
const tr_corner = {x: -34, y: -52, z: -23}
const bl_corner = {x: 22, y: -52, z: 27}
const br_corner = {x: 22, y: -52, z: -23}

class MFBot {
	constructor(username) {
		this.username = username;
		this.config = {
			username: this.username,
			host: "localhost",
		};
		this.goals = [];
		this.walking = false;
		this.walk_start = Date.now();
		this.initBot();
		this.log("Initialized")
	}
	
	async initBot(){
		this.bot = mineflayer.createBot(this.config);
		this.bot.loadPlugin(pathfinder);
		await this.initEvents();
	}
	
	async initEvents(){
		this.bot.once("spawn", ()=>{
			//this.bot.spawnPoint = spawn;
			this.chat("Hello, World!");
			const defaultMove = new Movements(this.bot);
			defaultMove.allow1by1towers = false;
			defaultMove.canDig = false;
			//defaultMove.interactableBlocks = [];
			defaultMove.allowFreeMotion = true;
			this.bot.pathfinder.setMovements(defaultMove);
			this.botStart();
		});
		this.bot.on('move', async ()=>{
			if (!this.bot.pathfinder.isMoving()) {
				this.lookAtPlayer(admin);
			}
			//if (this.walking){
			//	var time_passed = Date.now() - this.walk_start;
			//	if (time_passed > 10000){
			//		this.chat("Walking too long!");
			//		this.bot.pathfinder.stop();
			//		this.walking = false;
			//		this.goals = [];
			//		this.suicide();
			////		this.bot.position.x = ghost_house.x;
			////		this.bot.position.y = ghost_house.y;
			////		this.bot.position.z = ghost_house.z;
			////		await this.walkToPosition(this.randomAround(this.getPosition()), 1);
			//	}
			//}
		});
		this.bot.on('chat', async (username, message) => {
			if (username === this.bot.username) return;
			if (bots.includes(username)) return;
			await this.reactMessage(username, message, false);
		});
		this.bot.on('whisper', async (username, message, rawMessage) => { 
			if (username === this.bot.username) return;
			if (bots.includes(username)) return;
			await this.reactMessage(username, message, true);
		});
		this.bot.on('death', () => { 
			this.log("Bot died.");
			this.bot.respawn();
			this.botStart();
		});
		this.bot.on('goal_updated', (st) => {
			//this.log("Goal updated");
			
		});
		this.bot.on('path_reset', (st) => {
			//this.log("Path reset");
			
		});
		this.bot.on('path_stop', (st) => {
			//this.log("Path reset");
			
		});
		this.bot.on('path_update', (st) => {
			//this.log("Path updated");
			
		});
		this.bot.on('goal_reached', (goals) => {
			for (var i=0; i<goals.goals.length; i++){
				var goal = goals.goals[i];
				this.log("Goal reached: " + this.formatCoord(goal));
				this.goals.pop(goal);
			}
			
		});
		this.bot.on('error', () => { 
			console.log("Fatal error");
		});
	}
	
	log(){
		var msg = "";
		for (var i=0; i<arguments.length; i++){
			msg += arguments[i] + " ";
		}
		console.log(this.username+":", msg);
	}
	
	chat(msg){
		this.log('\"' + msg + '\"');
		this.bot.chat(msg);
	}
	
	formatCoord(coord){
		return "(" + coord.x.toFixed(1) + ", " + coord.y.toFixed(1) + ", " + coord.z.toFixed(1) + ")";
	}
	
	getPosition(){
		this.log("Currently at " + this.bot.entity.position);
		return this.bot.entity.position;
	}
	
	getPlayerEntity(username) {
		const target = this.bot.players[username] ? this.bot.players[username].entity : null;
		return target;
	}

	lookAtPlayer(username){
		let player = this.getPlayerEntity(username);

		if (player) {
			this.bot.lookAt(player.position.offset(0, player.height, 0));
		}
	}
	
	randomAround(position){
		position.x = Math.random() / 2;
		position.z = Math.random() / 2;
		return position;
	}

	async reactMessage(username, message, to_bot = false){
		if (message === "hello") {
			if(to_bot){
				this.bot.whisper(username, "Hello!");
			} else {
				this.bot.chat("Hello!");
			}
		} else if (message === "here") {
			if(to_bot){
				await this.walkToPlayer(username);
			}
		} else if (message === 'stop') {
			this.bot.whisper(username, "Stopping.");
			this.bot.pathfinder.stop();
			this.goals = [];
		} else {
			if(to_bot){
				this.bot.whisper(username, "I don't understand?");
			}
		}
	};
	
	async botStart(){
		if (this.username === "Blinky") {
			this.color = red;
			this.pacman = false;
		} else if (this.username === "Inky") {
			this.color = blue;
			this.pacman = false;
		} else if (this.username === "Pinky") {
			this.color = pink;
			this.pacman = false;
		} else if (this.username === "Clyde") {
			this.color = orange;
			this.pacman = false;
		} else if (this.username === "Pacman") {
			this.pacman = true;
		}
		this.chat("Returning to spawn.");
		await this.walkToPosition(spawn, 3);
		this.resetInventory();
		if (!this.pacman) {
			this.chat("Now fully equipped.");
			await this.walkToPosition(ghost_house, 2);
		} else {
			await this.walkToPosition(pacman_house, 1);
			this.createObjective();
		}
		this.chat("I'm ready.");
		await this.gameLoop();
	}
	
	async walkToPlayer(username) {
		this.log("Going to " + username);
		const target = this.getPlayerEntity(username);
		if (!target) {
			this.chat("I don't see you?");
			return
		}
		const p = target.position;
		await this.walkToPosition(p, 2);
	}
	
	async walkToPosition(p, dis) {
		const goal = new GoalNear(p.x, p.y, p.z, dis);
		const botPosition = this.getPosition();
		this.log("goto", this.formatCoord(p), "from", this.formatCoord(botPosition));
		this.chat("Going to " + this.formatCoord(p));
		this.walking = true;
		this.walk_start = Date.now();
		await this.addGoal(goal);
	}
	
	async addGoal(goal, wait = true, forget = false){
		if (forget){
			this.goals = [goal];
		} else {
			this.goals.push(goal);
		}
		this.log("Goals: " + this.goals);
		const goalAll = new GoalCompositeAll(this.goals);
		try {
			if (wait){
				await this.bot.pathfinder.goto(goalAll).then(() => {
					this.announceArrived();
				});
			} else {
				this.bot.pathfinder.goto(goalAll).then(() => {
					this.announceArrived();
				});
			}
		} catch (err) {
			this.goals.pop(goal);
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
		};
	}
	
	announceArrived() {
		const botPosition = this.getPosition();
		this.chat("I've arrived. I'm at " + this.formatCoord(botPosition) + ".");
	}
	
	suicide(){
		this.chat("Can't get unstuck.");
		this.chat("/kill @s");
	}
	
	async spawnEquipment(item_name, slot){
		this.chat(`/give @s minecraft:${item_name}{display:{color:${this.color}}}`);
		var timeout = 30;
		var item = null;
		while(item == null){
			item = this.bot.inventory.items().find(
				item => item.name.includes(item_name)
			);
			await this.bot.waitForTicks(5);
			timeout -= 1;
			if(timeout <= 0){
				this.chat("Can't get " + item_name);
				break;
			}
		}
		if (item){
			this.bot.equip(item.type,slot);
		}
	}

	async resetInventory(){
		this.bot.creative.clearInventory();
		this.log("is Pacman? " + this.pacman.toString());
		if (!this.pacman) {
			await this.spawnEquipment('leather_helmet', 'head');
			await this.spawnEquipment('leather_chestplate', 'torso');
			await this.spawnEquipment('leather_leggings', 'legs');
			await this.spawnEquipment('leather_boots', 'feet');
		}
	}
	
	createObjective(){
		this.chat("/scoreboard objectives setdisplay sidebar");
		this.chat("/scoreboard objectives remove pellets");
		this.chat("/scoreboard objectives add pellets dummy");
		this.chat("/scoreboard objectives setdisplay sidebar pellets");
		this.chat("/scoreboard players set Pacman pellets 244");
		this.chat("Objectives set.");
	}
	
	async gameLoop(){
		if (!this.pacman) {
			await this.scatterCorner();
		}
	}
	
	async scatterCorner(){
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
}

for (var i=0; i<bots.length; i++){
	new MFBot(bots[i]);
}