const math = require("mathjs")
const mineflayer = require("mineflayer");
const pathfinder = require('mineflayer-pathfinder').pathfinder
const Movements = require('mineflayer-pathfinder').Movements
const { GoalNear } = require('mineflayer-pathfinder').goals
const bot = mineflayer.createBot({
	username: "MineflayerBot",
	host: "localhost",
});

bot.loadPlugin(pathfinder);

const admin = "Am0nimus";

function lookAtPlayer(username){
	let player = GetPlayerEntity(username);

	if (player) {
		bot.lookAt(player.position.offset(0, player.height, 0));
	}
}

function GetSpeed(){
	const v = bot.entity.velocity;
	const free_fall = -0.0784000015258789;
	const s = math.sqrt(v.x * v.x + (v.y - free_fall) * (v.y - free_fall) + v.z * v.z);
	return s;
}

function IsMoving(){
	return GetSpeed() > 0.1;
}

function GetPlayerEntity(username) {
	const target = bot.players[username] ? bot.players[username].entity : null;
	return target;
}

function AnnounceArrived() {
	const botPosition = bot.entity.position;
	bot.chat("I've arrived. I'm at " + botPosition.toString());
}

function WalkToPosition(p) {
	const goal = new GoalNear(p.x, p.y, p.z, 1);
	console.log("goto", p.toString(), "from", bot.entity.position);
	bot.chat("Going to " + p.toString());
	bot.pathfinder.goto(goal).then(() => {
		AnnounceArrived();
	}).catch(err => {
		if (err.name === 'PathStopped') {
			console.log("Path was stopped before it could be completed!");
		} else {
			console.error("Pathfinding error", err);
		}
	});
}

function WalkToPlayer(username) {
	const target = GetPlayerEntity(admin);
	if (!target) {
		bot.chat("I don't see you?");
		return
	}
	const p = target.position;
	WalkToPosition(p);
}

async function DigHere(p, block_names) {
	let blocks_pos = bot.findBlocks({
		point: p,
		matching: (block) => {
			return block_names.includes(block.name);
		},
		maxDistance: 5,
		count: 25,
	});blocks_pos
	let blocks = [];
	for(const block_pos of blocks_pos) {
		blocks.push(bot.blockAt(block_pos));
	}
	await DigTask(blocks);
}

async function DigTask(blocks){
	console.log(blocks.length);
	for(const block of blocks) {
		if (bot.canDigBlock(block)){
			bot.chat("Digging block " + block.name + " at " + block.position.toString());
			await bot.dig(block);
		} else {
			bot.chat("Can't dig block " + block.name + " at " + block.position.toString());
		}
	}
	bot.chat("Done digging.");
}

bot.once("spawn", ()=>{
	bot.chat("Hello, World!");
	const defaultMove = new Movements(bot);
	bot.pathfinder.setMovements(defaultMove);
});

bot.on("move", ()=>{
	if (!IsMoving()) {
		lookAtPlayer(admin);
	}
});

bot.on('whisper', async (username, message, rawMessage) => { 
	if (username === bot.username) return;
	
	console.log(username + ":", message);
	
	if (message === "hello") {
		bot.whisper(username, "Hello!");
	} else if (message === "here") {
		WalkToPlayer(username);
	} else if (message === 'stop') {
		bot.whisper(username, "Stopping.");
		bot.pathfinder.stop();
    } else if (message === "dig") {
		await DigHere(bot.position, ["dirt", "stone"]);
	} else {
		bot.whisper(username, "I don't understand?");
	}
})