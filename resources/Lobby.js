'use strict'

const generateID = require('./generators')

class Lobby {
  constructor (board, lobbyId) {
    this.id = lobbyId
    this.clients = {}
    this.game = '' // new Game()

    // Report errors if variable wasnt provided
  }

  async init (callback) {
    
  }

  getId () {
    return this.id
  }

  setGame (game) {
    this.game = game
  }

  addClient (client) {
    this.clients[client.uuid].socket = client
    this.clients[client.uuid].host = false
  }

  disconnectClient (client) {
    client.disconnect()
    delete this.clients[client.uuid]
  }

  isConnected (uuid) {
    return this.clients[uuid].socket.connected
  }

  setHost (client) {
    this.clients.find(c => c.host).host = false
    this.clients[client.uuid].host = true
  }

  


  // Literally only used to convert questions to an object so i dont have to sort through it to change values of questions
  toObject (array) {
    const obj = {}
    for (const v of array) {
      obj[v.id] = v
    }
    return obj
  }
  
}

module.exports = Lobby