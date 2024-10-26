const math = require("mathjs")
const mineflayer = require("mineflayer");
const pathfinder = require('mineflayer-pathfinder').pathfinder
const Movements = require('mineflayer-pathfinder').Movements
const { GoalNear } = require('mineflayer-pathfinder').goals

const red = 16711680;
const blue = 65535;
const pink = 16761035;
const orange = 16760576;
const admin = "Am0nimus";
const spawn = {x: 0, y: -60, z: 0}

class MFBot {
	constructor(username) {
		this.username = username;
		this.config = {
			username: this.username,
			host: "localhost",
		};
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
		
		this.initBot();
	}
	
	async initBot(){
		this.bot = mineflayer.createBot(this.config);
		this.bot.loadPlugin(pathfinder);
		await this.initEvents();
	}
	
	async initEvents(){
		this.bot.once("spawn", ()=>{
			this.bot.chat("Hello, World!");
			const defaultMove = new Movements(this.bot);
			this.bot.pathfinder.setMovements(defaultMove);
			this.walkToPosition(spawn, 4);
			this.resetInventory();
		});
		this.bot.on("move", ()=>{
			if (!this.isMoving()) {
				this.lookAtPlayer(admin);
			}
		});
		this.bot.on('chat', (username, message) => {
			if (username === this.bot.username) return;
			
			if (message === "hello") {
				this.bot.whisper(username, "Hello!");
			} else if (message === "here") {
				this.walkToPlayer(username);
			} else if (message === 'stop') {
				this.bot.whisper(username, "Stopping.");
				this.bot.pathfinder.stop();
			} else {

			}
		});
		this.bot.on('whisper', async (username, message, rawMessage) => { 
			if (username === this.bot.username) return;
			
			if (message === "hello") {
				this.bot.whisper(username, "Hello!");
			} else if (message === "here") {
				this.walkToPlayer(username);
			} else if (message === 'stop') {
				this.bot.whisper(username, "Stopping.");
				this.bot.pathfinder.stop();
			} else {
				this.bot.whisper(username, "I don't understand?");
			}
		});
	}
	
	getSpeed(){
		const v = this.bot.entity.velocity;
		const free_fall = -0.0784000015258789;
		const s = math.sqrt(v.x * v.x + (v.y - free_fall) * (v.y - free_fall) + v.z * v.z);
		return s;
	}
	
	isMoving(){
		return this.getSpeed() > 0.1;
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
	
	walkToPlayer(username) {
		const target = this.getPlayerEntity(username);
		if (!target) {
			this.bot.chat("I don't see you?");
			return
		}
		const p = target.position;
		this.walkToPosition(p, 2);
	}
	
	walkToPosition(p, dis) {
		const goal = new GoalNear(p.x, p.y, p.z, dis);
		console.log("goto", p.toString(), "from", this.bot.entity.position);
		this.bot.chat("Going to " + p.toString());
		this.bot.pathfinder.goto(goal).then(() => {
			this.announceArrived();
		}).catch(err => {
			if (err.name === 'PathStopped') {
				console.log("Path was stopped before it could be completed!");
			} else {
				console.error("Pathfinding error", err);
			}
		});
	}
	
	announceArrived() {
		const botPosition = this.bot.entity.position;
		this.bot.chat("I've arrived. I'm at " + botPosition.toString());
	}

	async resetInventory(){
		this.bot.creative.clearInventory();
		this.bot.chat(this.pacman.toString());
		if (!this.pacman) {
			var item_name = 'leather_helmet';
			this.bot.chat(`/give @s minecraft:${item_name}{display:{color:${this.color}}}`);
			await this.bot.waitForTicks(30);
			var item = this.bot.inventory.items().find(item => item.name.includes(item_name))
			this.bot.equip(item.type,"head");
			
			item_name = 'leather_chestplate';
			this.bot.chat(`/give @s minecraft:${item_name}{display:{color:${this.color}}}`);
			await this.bot.waitForTicks(30);
			item = this.bot.inventory.items().find(item => item.name.includes(item_name))
			this.bot.equip(item.type,"torso");
			
			item_name = 'leather_leggings';
			this.bot.chat(`/give @s minecraft:${item_name}{display:{color:${this.color}}}`);
			await this.bot.waitForTicks(30);
			item = this.bot.inventory.items().find(item => item.name.includes(item_name))
			this.bot.equip(item.type,"legs");
			
			item_name = 'leather_boots';
			this.bot.chat(`/give @s minecraft:${item_name}{display:{color:${this.color}}}`);
			await this.bot.waitForTicks(30);
			item = this.bot.inventory.items().find(item => item.name.includes(item_name))
			this.bot.equip(item.type,"feet");
		}
	}
}

new MFBot("Pacman");
new MFBot("Blinky");
new MFBot("Pinky");
new MFBot("Inky");
new MFBot("Clyde");