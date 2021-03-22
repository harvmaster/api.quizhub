'use strict'

const Questions = require('../models/question')

class Lobby {
  constructor (board) {
    this.board = board
    this.questions = this.toObject(Questions.find({ board: board }))
    this.clients = {}
    
    this.buzzer = {
      buzzed: [],
      unlocked: false
    }

    this.state = {
      question: {}
    }

    // Report errors if variable wasnt provided
    if (!this.board) throw 'BoardID not provided'
  }

  // Adds the player to the lobby
  addPlayer (player) {
    this.clients[player.getUUID()] = player
  }

  removePlayer (player) {
    delete this.clients[player.getUUID()]
  }

  getFullState () {
    return {
      buzzer: this.buzzer,
      players: this.getPlayers(),
      question: this.formatQuestions()
    }
  }

  getQuestions () {
    return this,toObject(this.questions.map(question => question.toBasicFormat()))
  }

  getOpenedQuestions () {
    return this.toObject(this.questions.filter(question => question.opened).map(question => question.toOpenedFormat()))
  }

  getRevealedQuestions () {
    return this.toObject(this.questions.filter(question => question.revealed).map(question => question.toRevealedFormat()))
  }

  formatQuestions() {
    return Object.assign({}, this.getQuestions(), this.getOpenedQuestions(), this.getRevealedQuestions())
  }



  open (question) {
    this.questions[question].opened = true
    this.state.question = this.questions[question].toOpenedFormat()
    
    this.notify('question-opened', {
      state: this.state
    })
  }

  reveal (question) {
    this.questions[question].revealed = true
    this.state.question = this.questions[question].toRevealedFormat()

    this.notify('question-revealed', {
      state: this.state
    })
  }

  // Formats all players into safe format for users
  getPlayers () {
    return this.clients.map(player => player.toPlayer())
  }

  /*
   *  Buzzer
   *
   * 
   */
  setBuzzer (state) {
    this.buzzer.unlocked
  }

  buzzPlayer (player) {
    this.buzzer.push(player.username)
  }

  clearBuzzer () {
    this.buzzer = []
  }


  // Literally only used to convert questions to an object so i dont have to sort through it to change values of questions
  toObject (array) {
    const obj = {}
    for (const v of array) {
      obj[v.id] = v
    }
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
      var payload = Object.assign({ event: event }, msg)

      for (const player of this.clients) {
        player.client.emit(event, payload)
      }
    } catch (err) {
      console.log(err)
    }
  }
  
}