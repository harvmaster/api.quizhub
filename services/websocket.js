'use strict'

const config = require('../config')

const SocketIO = require('socket.io')
const { Mongoose } = require('mongoose')
const { emit } = require('nodemon')

const Lobby = require('../resources/JeopardyLobby')
const Player = require('../resources/JeopardyPlayer')

/**
 * WebSocket Library for Jeopardy
 * @memberof Services
 */
class WebSocket {
  constructor () {
    
  }

  /**
   * Setup the Websocket server
   */
  async startServer (server) {
    // Setup Websockets
    const socket = SocketIO(server, {
      cors: {
        origin: "*",
        methods: ['GET', 'POST']
      }
    })

    socket.on('connection', (client) => this._onConnection(client))
  }

  /**
   * Notify any Websocket connections that are subscribed to
   * the given id that an event has occurred.
   * @param lobbyId The ID of the game
   * @param event The event that was triggered
   * @param msg The Invoice data
   */
  async notify (lobbyId, event, msg) {
    try {
      if (this.games[lobbyId].players) {
        // Compile payload
        var payload = Object.assign({ event: event }, msg)

        for (const player of this.games[lobbyId].players) {
          player.client.emit(event, payload)
        }
      }
    } catch (err) {
      console.log(err)
    }
  }

  onJoin () {
    
  }


  /**
   * Triggered when a Websocket client connects
   * @param ws The Websocket of the client
   * @private
   */
  async _onConnection (client) {
    console.log('Connection')
    // Setup event listeners
    client.on('create', (msg) => Jeopardy.onCreate(client, msg))
    client.on('join', (msg) => Jeopardy.onJoin(client, msg))
  }

}

const webSocket = new WebSocket()

module.exports = webSocket
