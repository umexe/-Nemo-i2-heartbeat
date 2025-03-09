const i2 = require("i2.js")
const express = require("express")
const handlers = require('./handlers')
const path = require("path")
const configuration = require("./config.json")
const app = new express()

// Start the loop- run the LDL for the first time and schedule heartbeat.
handlers.runLdl()
handlers.scheduleHeartbeat()

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "web", "index.html"))
})

app.get("/font.ttf", (req, res) => {
    res.sendFile(path.join(__dirname, "web", "font.ttf"))
})

const resourcesPath = path.join(__dirname, 'resources', configuration.star);
app.use('/resources', express.static(resourcesPath));

handlers.log("i2 Heartbeat started", false, true)
handlers.log(`Heartbeat web panel running on http://127.0.0.1:${configuration.port}`)
handlers.log("Thanks for using i2 Heartbeat!")
app.use("/api", require("./api.js"))

app.listen(configuration.port)