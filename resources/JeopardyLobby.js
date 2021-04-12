'use strict'

const Questions = require('../models/question')

const generateID = require('./generators')
import { compare } from './utils.js' 

class Lobby {
  constructor (lobbyId) {
    this.id = lobbyId
    // this.board = board
    this.questions = []
    this.clients = {}
    
    this.buzzer = {
      buzzed: [],
      unlocked: false
    }

    this.state = {
      question: {}
    }

    this.lastState = this.getFullState()

    // Report errors if variable wasnt provided
    // if (!this.board) throw 'BoardID not provided'
  }

  init (callback) {
    return new Promise ((resolve, reject) => {
      Questions.find({ boardId: this.board }).then(questions => {
        this.questions = questions
        resolve(this)
      })
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
    player.getClient().disconnect()
    delete this.clients[player.getUUID()]

    return this
  }

  disconnectPlayer (player) {
    player.setConnected(false)

    return this
  }

  getPlayer (client) {
    return this.clients[client.uuid]
  }

  getPlayers () {
    return Object.keys(this.clients).map(key => {
      return this.clients[key].parsePublic()
    }).sort((a, b) => {
      if (a.username < b.username) return -1
      if (a.username > b.username) return 1
      return 0
    })
    // const players = {}

    // Object.keys(this.clients).sort((a, b) => a.username - b.username ).forEach(key => {
    //   players[this.clients[key].username] = this.clients[key].parsePublic()
    // })
    // return players
  }

  getConnectedPlayers () {
    return Object.keys(this.clients).map(key => {
      return this.clients[key].parsePublic()
    }).sort((a, b) => {
      if (a.username < b.username) return -1
      if (a.username > b.username) return 1
      return 0
    }).filter((player) => {
      return player.isConnected()
    })
  }

  /*
   *  
   *  Format questions to send to players
   * 
   */
  getQuestions () {
    return this.toObject(this.questions.map(question => question.parsePublic()))
  }

  // getOpenedQuestions () {
  //   return this.toObject(this.questions.filter(question => question.opened).map(question => question.toOpenedFormat()))
  // }

  // getRevealedQuestions () {
  //   return this.toObject(this.questions.filter(question => question.revealed).map(question => question.toRevealedFormat()))
  // }

  // formatQuestions() {
  //   return Object.assign({}, this.getQuestions(), this.getOpenedQuestions(), this.getRevealedQuestions())
  // }

  open (question) {
    this.questions[question].open()
    this.state.question = this.questions[question].parsePublic()
    
    return this.state
  }

  reveal (question) {
    this.questions[question].answer()
    this.state.question = this.questions[question].parsePublic()

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
      questions: this.getQuestions(),
      state: this.state
    }
  }

  update () {
    const state = this.getFullState()
    const difference = compare (this.lastState, state)
    // console.log(difference)
    this.lastState = state
    return difference
  }


  // Literally only used to convert questions to an object so i dont have to sort through it to change values of questions
  toObject (array) {
    const obj = {}
    for (const v of array) {
      if (!v.id) obj[v.username] = v
      obj[v.id] = v
    }
    return obj
  }
  
}

module.exports = Lobby