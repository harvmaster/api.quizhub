'use strict'

const config = require('./config')

// Application Packages
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')

// Local Application
const routes = require('./routes')

// Services
const mongoose = require('./services/mongoose')
const webSocket = require('./services/websocket')

class App {
  async start () {
    //
    // Setup MongoDB
    //
    try {
      console.log('Connecting to MongoDB')
      console.log(config.mongoDB)
      await mongoose.connect()
      console.log('Connected to MongoDB')
    } catch (err) {
      console.error(err.message)
    }
    
    //
    // Setup ExpressJS middleware, routes, etc
    //
    var app = express()
    app.enable('trust proxy')
    app.use(cors())
    app.use(bodyParser.urlencoded({ extended: true }))
    app.use(bodyParser.json())
    // app.use(bodyParser.raw({ type: '*/*' }))
    app.use(routes)

    //
    // Set port and start ExpressJS Server
    //
    var server = app.listen(config.port, function () {
      console.log('Starting ExpressJS server')
      console.log(`ExpressJS listening at http://${server.address().address}:${server.address().port}`)
    })

    //
    // Start the WebSocket Server
    //
    try {
      console.log('Starting Websocket server')
      webSocket.startServer(server)
      console.log('Websocket Server started')
    } catch (err) {
      console.error(err)
    }
  }
}

new App().start()
