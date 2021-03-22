class Jeopardy {
  constructor () {
    this.lobbies = {
      randomId: {
        clients: {}, // uuid = key
        board: {
          id: '', // Id of the board
          questions: [] // Array of completed question IDs
        },
        buzzer: {
          buzzed: [],  // Array of UUIDs of the players that have buzzed in. array maintains order
          unlocked: false // Define the state of the buzzer
        },
        state: {
          question: {} // If question isnt empty, assume currently in a question and send to players on join. Requires updating every question
        }
      }
    }
  }

  /*
    *  onJoin - handles 'join-game' event
    *  Checks if the lobby already exists
    *  Checks if the user is the host or previously connected
    *  Creates the user in the saved object
    *  Notifies other players of new player
  */
  async onJoin(client, msg) {
    console.log(msg)
    const lobby = msg.lobbyId
    const uuid = msg.uuid
    
    // Make sure the game exists
    if (!this.exists(lobby)) {
      return client.emit('error', {
        description: 'That lobby does not exist'
      })
    }

    // Check if the player is the host
    if (this.isHost(lobby, uuid)) {
      // Assume host is either joining for first time or rejoining
      this.setClient(lobby, uuid, client)
      this.setConnected(lobby, uuid, true)
      client.emit('connected', this.game.getState(lobby))
      return this.notify('host-join', {
        description: `The host (${this.clients.getUsername(lobby, uuid)}) has joined the lobby`
      })
    }

    // Check if the player was previously connected
    if (this.isClient(lobby, uuid)) {
      this.setClient(lobby, uuid, client)
      this.setConnected(lobby, uuid, true)
      this.updateClientInfo(lobby, uuid, { avatar: msg.avatar, username: msg.username })
      const player = {}
      player[this.getUsername(lobby, uuid)] = {
        username: this.getUsername(lobby, uuid),
        score: this.lobbies[lobby].clients[uuid].score,
        avatar: this.lobbies[lobby].clients[uuid].avatar,
        connected: this.lobbies[lobby].clients[uuid].connected,
      }
      this.notify('player-join', {
        description: `${this.getUsername(lobby, uuid)} has reconnected`,
        player: player
      })
      return client.emit('connected', this.game.getState(lobby))
    }

    // Handle connection of the new player
    this.add(lobby, client, msg)
    client.emit('connected', this.game.getState(lobby))
    this.notify('player-join', {
      description: `${getUsername(lobby, uuid)} has joined the lobby`,
      player: this.getUsername(lobby, uuid)
    })
  }

  async onLeave(client, msg) {
    const lobby = msg.lobbyId
    const uuid = msg.uuid

    // Make sure game exists
    if (!this.exists(lobby)) {
      return client.emit('error', {
        descrition: 'That lobby does not exist'
      })
    }

    // Check if the player is the host
    if (this.isHost(lobby, uuid)) {
      this.setConnected(lobby, uuid, false)
      client.emit('disconnected')
      this.notify('host-leave', {
        description: `The host (${this.clients.getUsername(lobby, uuid)}) has disconnected`
      })
      // Start game destroy countdown
      return this.game.destroy(lobby, uuid, 600)
    }

    // Disconnect the user and notify players
    this.setConnected(lobby, uuid, false)
    this.emit('disconnected', {
      description: 'You have been disconnected from the lobby'
    })
    this.notify('player-leave', {
      description: `${this.clients.getUsername(lobby, uuid)} has left the lobby`,
      player: this.clients.getUsername(lobby, uuid)
    })
  }

  async onCreate(client, msg) {
    const lobby = msg.lobbyId
    const uuid = msg.uuid

    // Check if game already exists
    if (this.exists(lobby)) {
      return client.emit('error', {
        description: 'That lobby already exists'
      })
    }

    // Create game and return success to the client
    this.createGame(client, msg)
    return client.emit('created', {
      description: 'Game successfully created'
    })
  }

  async onQuestionReveal(client, msg) {
    const lobby = msg.lobbyId
    const uuid = msg.uuid
    const question = msg.questionId

    // Ensure game exists
    if (!this.exists(lobby)) {
      return client.emit('error', {
        description: 'That lobby does not exist'
      })
    }

    // Ensure they are the host
    if (!this.isHost(lobby, uuid)) {
      return client.emit('error', {
        description: 'Only the host can reveal a question'
      })
    }

    // Add the question id to the revealed questions
    // send the question content to the clients
    const q = await this.getQuestion(question)
    this.setState(lobby, {
      question: q
    })
    this.lobbies[lobby].board.questions.push(question)
    this.notify('reveal-question', {
      description: `Question Revealed`,
      question: q
    })

  }

  async onAnswerReveal(client, msg) {
    const lobby = msg.lobbyId
    const uuid = msg.uuid
    const question = msg.questionId

    // Ensure game exists
    if (!this.exists(lobby)) {
      return client.emit('error', {
        description: 'That lobby does not exist'
      })
    }

    // Ensure they are the host
    if (!this.isHost(lobby, uuid)) {
      return client.emit('error', {
        description: 'Only the host can reveal an answer'
      })
    }

    // Add the question id to the revealed questions
    // send the question content to the clients
    const q = await this.cards.getAnswer(question)
    this.setState(lobby, {
      question: q
    })
    this.lobbies[lobby].board.questions.push(question)
    this.notify('reveal-question', {
      description: `Answer Revealed`,
      question: q
    })

  }

  // Templating function to create a new game
  createGame(client, msg) {
    this.lobbies[msg.lobbyId] = {
      clients: {},
      board: {
        id: msg.boardId,
        questions: []
      },
      buzzer: {
        buzzed: [],
        unlocked: false
      },
      state: {
        question: {}
      }
    }
    this.lobbies[msg.lobbyId].clients[msg.uuid] = {
      avatar: msg.avatar,
      client: client,
      connected: false,
      isHost: true,
      username: msg.username
    }
  }

  /*
   *  Client Functions
   *
   * 
  */
  add (lobby, client, info) {
    this.lobbies[lobby].clients[info.uuid] = {
      avatar: info.avatar,
      client: client,
      connected: true,
      isHost: false,
      score: 0,
      username: info.username
    }
  }
  getUsername (lobby, uuid) {
    return this.lobbies[lobby].clients[uuid].username
  }
  getUUID (lobby, username) {
    for (const uuid of Object.keys(this.lobbies[lobby].clients)) {
      if (this.lobbies[lobby].clients[uuid].username === username) return uuid
    }
    return null
  }
  isClient (lobby, uuid) {
    return this.lobbies[lobby].clients[uuid] ? true : false
  }
  isHost (lobby, uuid) {
    return this.lobbies[lobby].clients[uuid].isHost
  }
  setClient (lobby, uuid, client) {
    this.lobbies[lobby].clients[uuid].client = client
  }
  setConnected (lobby, uuid, state) {
    this.lobbies[lobby].clients[uuid].connected = state
  }
  updateClientInfo (lobby, uuid, info) {
    if (!info.avatar !== '') this.lobbies[lobby].clients[uuid].avatar = info.avatar
    if (!info.username !== '') this.lobbies[lobby].clients[uuid].username = info.username
  }

  /*
   *  Game Functions
   *
   * 
  */
  async destroy (lobby, hostId, time) {
    return setTimeout(() => {
      if (this.lobbies[lobby].clients[hostId].connected) {
        this.notify('game-destroyed', {
          description: `The host (${this.clients.getUsername(lobby, hostId)}) failed to rejoin. The game was destroyed`
        })
        delete this.lobbies[lobby]
      }
    }, time * 1000)
  }
  exists (lobby) {
    return this.lobbies[lobby] ? true : false
  }
  getState (lobby) {
    let host, players
    for (const client of this.lobbies[lobby].clients) {
      if (client.isHost) host = {
        avatar: client.avatar,
        connected: client.connected,
        username: client.username
      }
      else players.push({
        avatar: client.avatar,
        connected: client.connected,
        score: client.score,
        username: client.username
      })
    }
    return {
      board: this.lobbies[lobby].board,
      buzzer: this.lobbies[lobby].buzzer,
      host: host,
      players: players,
      state: this.lobbies[lobby].state
    }
  }
  setState (lobby, state) {
    this.lobbies[lobby].state = state
  }

  /*
   *  Card Functions
   *
   * 
  */
  async getAnswer (questionId) {
    const q = await Question.findById(questionId)
    return q.format()
  }
  async getQuestion (questionId) {
    let q = await Question.findById(questionId)
    q = q.format()
    return {
      content: q.content,
      id: q.id,
      price: q.price,
      topic: q.topic
    }
  }
}

const jeopardy = new Jeopardy()

module.exports = jeopardy