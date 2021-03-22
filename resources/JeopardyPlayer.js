'use strict'

class Player {
  constructor (client, player, host) {
    this.client = client
    this.uuid = player.uuid
    this.username = player.username
    this.avatar = player.avatar ?? '' // Put the default url for avatar here
    this.host = host ?? false
    this.connected = true
    this.score = 0
    
    // Report errors if variable wasnt provided
    if (!this.client) throw 'Client not provided'
    if (!this.uuid) throw 'UUID not provided'
    if (!this.username) throw 'Username not provided'
  }

  // Are they the host of the current lobby
  isHost () {
    return this.host
  }

  // Is their socket currently connected and are they connected to the lobby
  setConnected (status) {
    this.connected = status
  }

  isConnected () {
    return this.connected
  }

  // Score getter & setter
  setScore (score) {
    this.score = score
  }

  getScore () {
    return this.score
  }

  // Username getter & setter
  setUsername (username) {
    this.username = username
  }

  getUsername () {
    return this.username
  }

  getUUID () {
    return this.uuid
  }


  // Returns the the player object that can be returned to players
  toPlayer () {
    return {
      avatar: this.avatar,
      connected: this.isConnected(),
      host: this.isHost(),
      score: this.getScore(),
      username: this.getUsername()
    }
  }
  
}