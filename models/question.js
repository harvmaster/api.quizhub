const config = require('../config')

const mongoose = require('mongoose')
const Question = require('./question')

const schema = new mongoose.Schema({
  content: Object,
  price: Number,
  answer: Object,
  topic: String
}, {
  timestamps: true
})

schema.methods.parsePublic = function () {
  return {
    id: this._id,
    price: this.price,
    content: this.opened ? this.content : null,
    answer: this.answered ? this.answer : null,
    topic: this.topic
  }
}

schema.methods.toOpen = function () {
  this.opened = true
  return this
}

schema.methods.toAnswer = function () {
  this.answered = true
  return this
}

schema.methods.format = async function () {
  return {
    id: this._id,
    price: this.price,
    content: this.content,
    answer: this.answer,
    topic: this.topic
  }
}

schema.methods.getQuestions = async function (boardId) {
  const questions = await this.find({ boardId })
  const formatted = questions.map(q => q.format())
  return formatted  
}

module.exports = mongoose.model('Question', schema)
