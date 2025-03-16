const i2 = require('i2.js')
const fs = require("fs")
const path = require("path")
const configuration = require('./config.json')
const package = require('./package.json')

const debug = log

async function runLdl() {
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json")))
    await i2.playlistManager.loadPres(`domestic/${config.heartbeat.ldlFlavor}`, 27000, "ldl3")
    setTimeout(async () => {
        await i2.playlistManager.runPres("ldl3")
    }, 10000);
}

async function heartbeat(force) {
    const config = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json")))
    if((config.heartbeat.enabled == true) || (force == true)) {
        let background = ((config.heartbeat.lf.background == null) ? null : `domesticAds/TAG${config.heartbeat.lf.background}`)
	if(background == "domesticAds/TAG9") {
		const backgrounds = require(`./resources/${config.star}/backgrounds.json`)
		background = `domesticAds/TAG${(backgrounds[Math.round(Math.random() * backgrounds.length)].ID || backgrounds[0].ID)}`		
	}
        const delay = config.heartbeat.lf.delay
        const cancelFlavors = [{"id":"ldl3"},{"id":"sidebar2"}]
        const startFlavors = [{"id":"ldl3","flavor":`domestic/${config.heartbeat.ldlFlavor}`,"duration":27000}]
        if(config.heartbeat.sidebar.enabled == true) {
            startFlavors.push({"id":"sidebar2","flavor":`domestic/${config.heartbeat.sidebar.flavor}`,"duration":27000})
        }
        log(`Ran flavor domestic/${config.heartbeat.lf.flavor} for ${config.heartbeat.lf.duration} frames with background ${config.heartbeat.lf.background}.`)
        await i2.playlistManager.handlePlaylist(`domestic/${config.heartbeat.lf.flavor}`, config.heartbeat.lf.duration, "4", background, delay, cancelFlavors, startFlavors)
        log("Playlist handled successfully.")
        return true;
    } else {
        log("Didn't run playlist at heartbeat time due to disabled.")
        return false;
    }
}
let nextRunTime = null;
let heartbeatInterval;
function calculateNextRunTime(startOn, every) {
    const currentTime = new Date();
    const currentMinute = currentTime.getMinutes();
    let nextMinute;
  
    if (currentMinute < startOn) {
        nextMinute = startOn;
    } else {
        const minutesSinceStartOn = (currentMinute - startOn + 60) % every;
        nextMinute = currentMinute + every - minutesSinceStartOn;
  
        if (nextMinute >= 60) {
            nextMinute -= 60;
        }
    }
  
    const nextRunDate = new Date(currentTime);
    nextRunDate.setMinutes(nextMinute);
    nextRunDate.setSeconds(0);
  
    if (nextRunDate <= currentTime) {
        nextRunDate.setHours(nextRunDate.getHours() + 1);
    }
    console.log(nextRunDate)
    return nextRunDate;
}
  
function scheduleHeartbeat() {
    let heartbeatData = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"))).heartbeat;
    const { enabled, runOn } = heartbeatData;
    
    if (!enabled) {
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
        }
        return;
    }
  
    const currentTime = new Date();
  
    if (nextRunTime === null) {
        nextRunTime = calculateNextRunTime(runOn.startOn, runOn.every);
    }
  
    if (currentTime >= nextRunTime) {
        heartbeatData = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json")));
        heartbeat(false);
        console.log("heart beating @ ", new Date().toLocaleString());
        nextRunTime = new Date(nextRunTime.getTime() + (runOn.every * 60 * 1000));
    }
  
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
    }
  
    const timeUntilNextCheck = nextRunTime - currentTime;
    heartbeatInterval = setTimeout(() => scheduleHeartbeat(), timeUntilNextCheck);
}

let forceDebug = false

function centerText(text, width = 50) {
    const spaces = Math.max(0, Math.floor((width - text.length) / 2));
    return ' '.repeat(spaces) + text + ' '.repeat(spaces);
}
const logs = []
function log(message, forceDebugEnable, onBoot) {
    const configuration = require("./config.json")
    if(forceDebugEnable == true) { forceDebugMode() };
    if(onBoot == true) {
        const width = 50;
        console.clear()
        console.log(centerText('##########################################', width));
        console.log(centerText(`i2 Heartbeat v${package.version}`, width));
        console.log(centerText(`Today is ${new Date().toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}`, width));
        console.log(centerText(`The time is ${new Date().toLocaleString('en-US', {
            hour12: true,
            hour: 'numeric',
            minute: 'numeric'
        })}`, width));
        const port = configuration.port || 9092;
        console.log(centerText(`View at: http://localhost:${port}`, width));
        console.log(centerText(`##########################################`, width));
        console.log(centerText(`Made by Dalk`, width));
        console.log(centerText(`Built for IntelliStar 2 (Model: ${configuration.star})`, width));
        console.log(centerText(`##########################################`, width));
        const debugtxt = path.join(__dirname, "..", "debug.txt")
        if(!fs.existsSync(debugtxt)) {
            fs.writeFileSync(debugtxt, ("utf-8", "First write to Debug logs"))
        } else {
            const current = fs.readFileSync(debugtxt, "utf-8")
            const toWrite = `${current}\n-- STARTED DEBUGGING AT ${new Date().toLocaleString()} --`
            fs.writeFileSync(debugtxt, ("utf-8", toWrite))
        }
    }
    if(configuration.debugger || forceDebug) {
        console.log(`i2 Heartbeat (v${package.version}) Debugger | ${new Date().toLocaleString()} | ${message}`)

        const debugtxt = path.join(__dirname, "..", "debug.txt")
        if(!fs.existsSync(debugtxt)) {
            fs.writeFileSync(debugtxt, ("utf-8", "First write to Debug logs"))
        } else {
            const current = fs.readFileSync(debugtxt, "utf-8")
            const toWrite = `${current}\ni2 Heartbeat (v${package.version}) Debugger | ${new Date().toLocaleString()} | ${message}`
            fs.writeFileSync(debugtxt, ("utf-8", toWrite))
        }
        return true
    } else {
        return false
    }
}

function forceDebugMode() {
    forceDebug = true
}

module.exports = {runLdl, scheduleHeartbeat, heartbeat, log}
