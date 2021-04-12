'use strict'

const Questions = require('../models/question')

const generateID = require('./generators')

class Jeopardy {
  constructor (board) {
    this.board = board
    this.questions = []
    this.players = {}
    
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

  async init (callback) {
    Questions.find({ boardId: this.board }).then(questions => {
      this.questions = questions
      callback()
    })
  }

  getId () {
    return this.id
  }

  /*
   *
   *  Player functions
   * 
   */
  addPlayer (player) {
    this.clients[player.getUUID()] = player

    return this
  }

  removePlayer (player) {
    delete this.clients[player.getUUID()]

    return this
  }

  disconnectPlayer (player) {
    player.setConnected(false)

    return this
  }

  getPlayers () {
    return this.clients.map(player => player.toPlayer())
  }

  /*
   *  
   *  Format questions to send to players
   * 
   */
  getQuestions () {
    return this.toObject(this.questions.map(question => question.toBasicFormat()))
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
    
    return this.state
  }

  reveal (question) {
    this.questions[question].revealed = true
    this.state.question = this.questions[question].toRevealedFormat()

    return this.state
  }

  /*
   *
   * Buzzer
   * 
   */
  setBuzzer (state) {
    this.buzzer.unlocked = state

    return this
  }

  buzzPlayer (player) {
    this.buzzer.push(player.username)

    return this
  }

  clearBuzzer () {
    this.buzzer = []

    return this
  }

  getBuzzedPlayers () {
    return this.buzzed
  }

  // Return the full state of the game for the players
  getFullState () {
    return {
      buzzer: this.buzzer,
      players: this.getPlayers(),
      questions: this.formatQuestions(),
      state: this.state
    }
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

module.exports = Jeopardy