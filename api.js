const express = require("express")
const path = require("path")
const fs = require("fs")
const handlers = require("./handlers")
const configuration = require("./config.json")
const i2 = require("i2.js")
const app = new express()

app.get("/playlist/run/:flavor/:duration/:pid/:tag", async (req, res) => {
    const {flavor, duration, pid, tag} = req.params
    await i2.playlistManager.loadPres(`domestic/${flavor}`, duration, pid, (tag || null))
    setTimeout(async () => {
        await i2.playlistManager.runPres(pid)
        res.send("Ran playlist!")
    }, 10 * 1000);
})

app.get("/playlist/cancel/:pid", async (req, res) => {
    await i2.playlistManager.cancelPres(req.params.pid)
    res.send("Cancelled presentation!")
})

app.get("/i2/kill/:process", async (req, res) => {
    await i2.sys.restartProcess(req.params.process)
    res.send("Killed process!")
})

app.get("/i2/restart", async (req, res) => {
    await i2.sys.restartI2Service()
    res.send("Restarted i2 service!")
})

app.get("/machinecfg", (req, res) => {
    res.type("text/xml").sendFile(path.join("C:/Program Files/TWC/i2", "Managed", "Config", "MachineProductCfg.xml"))
})

app.get("/playlist/force", (req, res) => {
    handlers.heartbeat(true)
    res.send("Forcing a heartbeat!")
})

app.get("/playlist/config", (req, res) => {
    res.json(JSON.parse(fs.readFileSync(path.join(__dirname, "config.json"), "utf-8")))
})

// im gonna be so fr i just stole this from the old heartbeat source
app.get('/heartbeat/post/:setting/:value', (req, res) => {
    const validSettings = ["flavor","duration","heartbeatEnabled","heartbeatOn","flavorLdl","background","flavorSidebar","sidebarEnabled","heartbeatEvery"]
    const numbers = ["0","1","2","3","4","5","6","7","8","9"]
    if(validSettings.includes(req.params.setting)) {
        let newValue = req.params.value
        if(newValue == "true") {
            newValue = Boolean(true)
        }
        if(newValue == "false") {
            newValue = Boolean(false)
        }
        if(numbers.includes(String(newValue).slice(0,1))) {
            newValue = Number(newValue)
        }
        const heartbeatInfo = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json")))
        if(req.params.setting == "flavor") {heartbeatInfo.heartbeat.lf.flavor = newValue}
        if(req.params.setting == "duration") {heartbeatInfo.heartbeat.lf.duration = newValue}
        if(req.params.setting == "heartbeatEnabled") {heartbeatInfo.heartbeat.enabled = newValue}
        if(req.params.setting == "flavorLdl") {heartbeatInfo.heartbeat.ldlFlavor = newValue}
        if(req.params.setting == "background") {heartbeatInfo.heartbeat.lf.background = newValue}
        if(req.params.setting == "flavorSidebar") {heartbeatInfo.heartbeat.sidebar.flavor = newValue}
        if(req.params.setting == "sidebarEnabled") {heartbeatInfo.heartbeat.sidebar.enabled = newValue}
        if(req.params.setting == "heartbeatOn") {heartbeatInfo.heartbeat.runOn.startOn = newValue}
        if(req.params.setting == "heartbeatEvery") {heartbeatInfo.heartbeat.runOn.every = newValue}
        fs.writeFileSync(path.join(__dirname, "config.json"), JSON.stringify(heartbeatInfo, null, 2))
        res.send(`Successfully set ${req.params.setting} to ${newValue} in heartbeat settings. Please wait for the next cycle for the adjustment to take place.`)
    } else {
        res.status(404).send(`Invalid setting.`)
        functions.debug("User attempted to input incorrect heartbeat setting")
    }
})


handlers.log(`Heartbeat API running on http://127.0.0.1:${configuration.port}/api`)

module.exports = app
