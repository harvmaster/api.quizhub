'use strict'

const config = require('../../config')

const express = require('express')
const router = express.Router()

const Board = require('../../models/board')
const Question = require('../../models/question')

/**
  * Question management routes
  * @memberof Routes
  */
class QuestionsRoute {
  constructor () {
    router.put('/questions', this.editQuestion)
    router.get('/board', this.getBoard)
    router.post('/board', this.createBoard)
    router.put('/board', this.editBoard)
    router.get('/adminboard', this.getAdminBoard)
    router.all('/all', this.getAllQuestions)
    

    return router
  }

  // Returns all the questions when given a board id
  async getAllQuestions (req, res) {

  }

  // Used to edit a card with a value
  async editQuestion (req, res) {
    let question = await Question.findById(req.body.question.id)
    if (!question) {
      return res.status(204).json({ msg: 'That question id does not exist' })
    }
    question.content = req.body.question.content
    question.price = req.body.question.price
    question.answer = req.body.question.answer
    question.topic = req.body.question.topic

    question.save().then(q => {
      return res.status(200).json(q.format)
    })
  }

  async createBoard (req, res) {
    console.log('Creating board')
    let board = new Board()

    board.name = req.body.board.name
    board.increment = req.body.board.increment

    board = await board.save()
    
    const questionPromises = []
    // Create 25 empty questions for the board
    for (let i = 0; i < 25; i++) {
      const q = new Question()
      q.content = {
        type: 'text',
        data: ''
      }
      q.topic = `topic ${i%5 + 1}`
      q.value = board.increment*(i%5 + 1)
      q.boardId = board.id
      questionPromises.push(q.save()) 
    }
    Promise.all(questionPromises).then(questions => {
      return res.status(201).json({
        board: board,
        questions: questions
      })
    }).catch(err => {
      res.status(500).json({ msg: 'An error occured when creating the example questions' })
    })
  }

  async getBoard (req, res) {
    const board = await Board.findById(req.body.id)
    res.status(200).json(board.format())
  }

  async editBoard (req, res) {
    const board = await Board.findById(req.body.board.id)
    if (!board) {
      return res.status(204).json({msg: 'That board id could not be found'})
    }
    board.name = req.body.board.name
    board.increment = req.body.board.increment

    board.save().then(b => {
      res.status(200).json(b)
    })
  }

  async getQuestion (req, res) {

  }

  async getAdminBoard (req, res) {
    const board = await Board.findById(req.body.board.id)
    const questions = await Question.find({ boardId: board.id })

    res.status(200).json({ board, questions })
  }
}

module.exports = new QuestionsRoute()
