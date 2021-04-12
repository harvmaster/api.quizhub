'use strict'

const config = require('../config')

const SocketIO = require('socket.io')

const Lobby = require('../resources/JeopardyLobby')
const Player = require('../resources/JeopardyPlayer')

import debug from '../resources/debug.js'

/**
 * WebSocket Library for Jeopardy
 * @memberof Services
 */
class WebSocket {
  constructor () {
    this.lobbies = []
    this.socket
  }

  /**
   * Setup the Websocket server
   */
  async startServer (server) {
    // Setup Websockets
    this.socket = SocketIO(server, {
      cors: {
        origin: "*",
        methods: ['GET', 'POST']
      }
    })

    this.socket.on('connection', (client) => this._onConnection(client))
  }

  onCreate (client, msg) {
    if (this.lobbies[msg.lobbyId] != null) {
      client.emit('error', { msg: 'That lobby ID already exists'})
      return
    }

    const lobby = new Lobby(msg.lobbyId)
    lobby.init().then(() => {

      // Create and add player to the lobby
      const { uuid , username, avatar } = msg
      const player = new Player(client, { uuid, username, avatar }, true)

      lobby.addPlayer(player)
      this.lobbies[lobby.getId()] = lobby
      client.join(lobby.getId())

      this.socket.to(lobby.getId()).emit('created', { msg: { id: lobby.getId() } })
    })
  }

  onJoin (client, msg) {
    if (!this.lobbies[msg.lobbyId]) {
      client.emit('error', { msg: 'That lobby ID does not exist' })
      return
    }

    const { uuid , username, avatar } = msg
    const player = new Player(client, { uuid, username, avatar }, false)

    const lobby = this.lobbies[msg.lobbyId]
    lobby.addPlayer(player)

    client.join(lobby.getId())

    client.emit('joined', lobby.getFullState())
    client.to(lobby.getId()).emit('player-join', { msg: lobby.update() })
  }

  onDisconnect (client, msg) {
    const room = [...client.rooms][1]
    if (!room) {
      client.emit('error', { msg: 'Not currently connected to any rooms' })
      return
    }
    
    console.log(client.uuid)

    const lobby = this.lobbies[room]
    const player = lobby.getPlayer(client)

    client.emit('leaving', { msg: `leaving lobby ${lobby.getId()}` })
    lobby.disconnectPlayer(player)

    this.socket.to(lobby.getId()).emit('player-leave', { msg: lobby.update() })
    if (lobby.getConnectedPlayers.length == 0) {
      delete this.lobbies[lobby.getId()]
    }
  }

  /**
   * Triggered when a Websocket client connects
   * @param ws The Websocket of the client
   * @private
   */
  async _onConnection (client) {
    // Setup event listeners
    client.on('create', (msg) => this.onCreate(client, msg))
    client.on('join', (msg) => this.onJoin(client, msg))
    client.on('leave', (msg) => this.onDisconnect(client, msg))
  }

}

const webSocket = new WebSocket()

module.exports = webSocket
