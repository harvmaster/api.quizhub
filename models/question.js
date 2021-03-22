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

schema.methods.format = async function () {
  return {
    id: this._id,
    price: this.price,
    content: this.content,
    answer: this.answer,
    topic: this.topic
  }
}

schema.methods.toBasicFormat = async function () {
  return {
    id: this._id,
    price: this.price,
    topic: this.topic
  }
}

schema.methods.toOpenedFormat = async function () {
  return {
    id: this._id,
    price: this.price,
    content: this.content,
    topic: this.topic
  }
}

schema.methods.toAnsweredFormat = async function () {
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
