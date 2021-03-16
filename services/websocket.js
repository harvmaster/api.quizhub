'use strict'

const config = require('../config')

const SocketIO = require('socket.io')
const { Mongoose } = require('mongoose')
const { emit } = require('nodemon')

const Jeopardy = require('./JeopardySockets')

/*
 * The host will generate a join code for the game which will be saved to the subscriptions array
 * The host will be identified as being index 0 in the array
 * 
 * If the code the client has submitted does not exist, its assumed they are starting a new lobby
 * When a client disconnects, it will check if they are index 0 client; if true, the lobby will be destroyed
 * 
 * TODO:
 * work out how to attach username to client along with score
 *  - Create a cookie on the client that will lock the username to that player and maybe a uuid. Use this to determine if the player is rejoining or a new player
 * 
 * msg requirements: 
 *  - User uuid - This will not be given to any other players
 *  - lobby id
 *  - 
*/


/**
 * WebSocket Library for Notifying Clients of Payment Events
 * @memberof Services
 */
class WebSocket {
  constructor () {
    this.games = {
      0: {
        players: [],
        questions: {
          '0': null
        },
        buzzer: {
          unlocked: false,
          buzzed: [
            { uuid: '' }
          ]
        }
      }
    }
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

  async onJoin (client, msg) {
    // If the game doesnt exist, create it, set the user to the host
    if (!this.games[msg.lobbyId]) {
      this.createGame(client, msg)
      return client.emit('created', {
        questions: this.getQuestions(msg.lobbyId),
        buzzer: this.games[lobbyId].buzzer,
        board: {
          revealed: this.games[lobbyId].revealed,
          in: this.games[lobbyId].board.in
        }
      })
    }

    // Check if its the host rejoining
    if (msg.uuid === this.games[msg.lobbyId].host.uuid) {
      this.games[msg.lobbyId].host.client = client
      this.games[msg.lobbyId].host.connected = true
      return this.notify('host-join', {
        description: 'The host has rejoined the lobby'
      })
    }

    // Add the player to the lobby if they werent already
    const playerIndex = this.games[msg.lobbyId].players.findIndex(player => msg.uuid === player.uuid)
    if (!playerIndex) {
      this.games[msg.lobbyId].players.push({
        client: client,
        uuid: msg.uuid,
        username: msg.username,
        score: 0,
        avatar: msg.avatar,
        connected: true
      })
     } else {
      this.games[msg.lobbyId].players[playerIndex].client = client
      this.games[msg.lobbyId].players[playerIndex].connected = true
    }

    // Send the new player the board and questions
    client.emit('board', {
      questions: this.getQuestions(msg.lobbyId),
      buzzer: this.games[lobbyId].buzzer,
      board: {
        revealed: this.games[lobbyId].revealed,
        in: this.games[lobbyId].board.in
      }
    })

    // Notify other players
    return this.notify(msg.lobbyId, 'player-joined', {
      players: this.getPlayers(),
      description: `${msg.username} has joined the lobby`
    })
  }

  async onLeave (client, msg) {
    if (!this.games[msg.lobbyId]) {
      return client.emit('error', {
        code: 204,
        description: 'Game does not exist'
      })
    }

    if (msg.uuid === this.games[msg.lobbyId].host.uuid) {
      this.games[msg.lobbyId].host.connected = false
      this.notify(msg.lobbyId, 'host-leave', {
        description: 'The host has left the lobby. Lobby will be destroyed in 5 minutes if they do not reconnect'
      })
      setTimeout(function () {
        if (this.games[msg.lobbyId].host.connected) return
        delete this.games[msg.lobbyId]
        this.notify(msg.lobbyId, 'lobby-destroyed', {
          description: 'The host did not reconnect to the lobby'
        })
      }, 5 * 60 * 1000)
    } else {
      // For normal players
      const playerIndex = this.games[msg.lobbyId].players.findIndex(player => msg.uuid === player.uuid)
      if (!playerIndex) return
      this.games[msg.lobbyId].players[playerIndex].connected = false
      this.notify(msg.lobbyId, 'player-leave', {
        players: this.getPlayers(msg.lobbyId),
        description: `${this.getUsername(msg.uuid)} has left the game`
      })
    }
  }

  // Called when the host tries to reveal the question to the players
  async onRevealQuestion (client, msg) {
    const lobbyId = msg.lobbyId
    const questionId = msg.quesitonId
    if (msg.uuid !== this.games[lobbyId].host.uuid) {
      return client.emit('error', {
        code: 401,
        description: 'You are not the host. Card can not be revealed'
      })
    }
    this.games[lobbyId].board.in = questionId
    const question = this.getQuestion(questionId)
    this.notify(lobbyId, 'reveal', {
      type: 'question',
      question: {
        content: question.content,
        id: quesiton.id,
        price: question.price
      },
      in: questionId
    })
  }

  // Called when the host tries to reveal the answer to the players
  async onRevealAnswer (client, msg) {
    const lobbyId = msg.lobbyId
    const questionId = msg.quesitonId
    if (msg.uuid !== this.games[lobbyId].host.uuid) {
      return client.emit('error', {
        code: 401,
        description: 'You are not the host. Card can not be revealed'
      })
    }
    this.games[lobbyId].board.in = ''
    this.games[lobbyId].board.revealed.push(questionId)
    this.notify(lobbyId, 'reveal', {
      type: 'answer',
      question: {
        content: question.content,
        id: quesiton.id,
        price: question.price,
        answer: question.answer
      },
      in: '',
      revealed: this.games[lobbyId].board.revealed
    })
  }

  // Called when a player attempts to buzz in
  async onBuzz (client, msg) {
    const lobbyId = msg.lobbyId
    if (!this.games[lobbyId].buzzer.unlocked) {
      return client.emit('error', {
        code: 401,
        description: 'The buzzer has not been unlocked yet'
      })
    }
    this.games[lobbyId].buzzer.buzzed.push(this.getUsername(msg.uuid))
    this.notify(lobbyId, 'buzzed', {
      player: this.getUsername(lobbyId, msg.uuid),
      buzzer: this.games[lobbyId].buzzer
    })
  }

  // Called when the host unlocks the players' ability to buzz in
  async onBuzzerUnlock (client, msg) {
    const lobbyId = msg.lobbyId
    if (msg.uuid !== this.games[lobbyId].host.uuid) {
      return client.emit('error', {
        code: 401,
        description: 'You are not the host. Buzzer can not be unlocked'
      })
    }
    this.games[lobbyId].buzzer.unlocked = true
    this.notify(lobbyId, 'buzzer-unlocked', {
      buzzer: this.games[lobbyId].buzzer,
      description: 'The buzzer has been unlocked'
    })
  }

  async onBuzzerLock (client, msg) {
    const lobbyId = msg.lobbyId
    if (msg.uuid !== this.games[lobbyId].host.uuid) {
      return client.emit('error', {
        code: 401,
        description: 'You are not the host. Buzzer can not be locked'
      })
    }
    this.games[lobbyId].buzzer.unlocked = false
    this.notify(lobbyId, 'buzzer-locked', {
      buzzer: this.games[lobbyId].buzzer,
      description: 'The buzzer has been locked'
    })
  }

  async onBuzzerReset (client, msg) {
    const lobbyId = msg.lobbyId
    if (msg.uuid !== this.games[lobbyId].host.uuid) {
      return client.emit('error', {
        code: 401,
        description: 'You are not the host. Buzzer can not be reset'
      })
    }
    // Either remove a single user or all users from buzzed
    if (msg.target > 0) {
      this.games[lobbyId].buzzer.buzzed = this.games[lobbyId].buzzer.buzzed.filter(username => username !== msg.target)
    } else {
      this.games[lobbyId].buzzer.buzzed = []
    }
    this.notify(lobbyId, 'buzzer-reset', {
      buzzer: this.games[lobbyId].buzzer,
      description: msg.target > 0 ? `${msg.target}'s buzzer was reset` : `All buzzers were reset`
    })
  }

  async onCorrect (client, msg) {
    const lobbyId = msg.lobbyId
    if (msg.uuid !== this.games[lobbyId].host.uuid) {
      return client.emit('error', {
        code: 401,
        description: 'You are not the host. Can not send correct ping'
      })
    }
    this.notify(lobbyId, 'correct', {
      description: 'The answer was correct'
    })
  }

  async onIncorrect (client, msg) {
    const lobbyId = msg.lobbyId
    if (msg.uuid !== this.games[lobbyId].host.uuid) {
      return client.emit('error', {
        code: 401,
        description: 'You are not the host. Can not send incorrect ping'
      })
    }
    this.notify(lobbyId, 'incorrect', {
      description: 'The answer was incorrect'
    })
  }

  async onScoreChange(client, msg) {
    const lobbyId = msg.lobbyId
    if (msg.uuid !== this.games[lobbyId].host.uuid) {
      return client.emit('error', {
        code: 401,
        description: 'You are not the host. Can not update scores'
      })
    }
    const playerIndex = this.games[lobbyId].players.findIndex(player => {
      if (player.username === msg.target) return 
    })
    this.games[lobbyId].players[playerIndex].score = msg.score
    this.notify(lobbyId, 'score-change', {
      players: this.getPlayers(lobbyId),
      description: 'A players score was updated'
    })
  }

  async onAvatarChange (client, msg) {
    const lobbyId = msg.lobbyId
    const playerIndex = this.games[lobbyId].players.findindex(player => player.uuid === msg.uuid)
    this.games[lobbyId].players[playerIndex].avatar = msg.avatar
    this.notify(lobbyId, 'avatar-change', {
      players: this.getPlayers(lobbyId),
      description: `${this.getUsername(msg.uuid)} updated their avatar`
    })
  }

  async onNameChange (client, msg) {
    const lobbyId = msg.lobbyId
    const playerIndex = this.games[lobbyId].players.findindex(player => player.uuid === msg.uuid)
    this.games[lobbyId].players[playerIndex].username = msg.username
    this.notify(lobbyId, 'name-change', {
      players: this.getPlayers(lobbyId),
      description: `${this.getUsername(msg.uuid)} updated their name`
    })
  }

  /*
   *  Types of updates
   *  - Scene Change
   *  - Question Revealed
   *  - Buzzer
   *  - Buzzer Unlock
   *  - Score Update
   *  - player join
   *  - player leave
   *  - avatar Change
   *  - name change
   * 
  */
  async onUpdate (client, msg) {

  }

  async sendUpdate (client, msg) {

  }

  /*
   *  everytime a question is revealed, just store the id in the array
   *  send the question information with each reveal, just do not save it here
   * 
  */
  async createGame (client, msg) {
    this.games[msg.lobbyId] = {
      players: [],
      board: {
        id: msg.boardId,
        revealed: [], 
        in: ''
      },
      host: {
        client: client,
        connected: true,
        uuid: msg.uuid
      }
    }
  }

  async getQuestions (client, msg) {
    let questions = await Question.find({ boardId: msg.boardId })

    const sorted = {}
    questions.forEach(question => {
      if (!sorted[question.topic]) sorted[question.topic] = []
      sorted[question.topic].push({
        id: question.id,
        price: question.price,
      })
      sorted[question.topic].sort(a, b => {
        return a.price - b.price
      })
    })
    return sorted
  }

  async getPlayers (lobbyId) {
    const players = []
    for (const player of this.games[lobbyId].player) {
      players.push({
        username: player.username,
        score: player.score,
        avatar: player.avatar
      })
    }
    return players
  }

  async getState (lobbyId) {
    return state = {
      players: this.getPlayers(lobbyId),
      board: this.games[lobbyId].board.questions
    }
  }

  async getQuestion (quesitonId) {
    let question = await Question.findById(question)
    return question.format()
  }

  async getUsername (lobbyId, uuid) {
    return this.games[lobbyId].players.find(player => {
      if (player.uuid === uuid) return player.username
    })
  }

  async getUUID (lobbyId, username) {
    return this.games[lobbyId].players.find(player => {
      if (player.username === username) return player.uuid
    })
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
    client.on('subscribe', (msg) => this._onSubscribe(client, msg))
    client.on('unsubscribe', (msg) => this._onUnsubscribe(client, msg))
    client.on('stateChange', (msg) => this._onStateChange(client, msg))
  }

}

const webSocket = new WebSocket()

module.exports = webSocket
