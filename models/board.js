const config = require('../config')

const mongoose = require('mongoose')
const Question = require('./question')

const schema = new mongoose.Schema({
  name: String,
  increment: Number
}, {
  timestamps: true
})

schema.methods.format = async function () {
  return {
    id: this._id,
    name: this.name,
    increment: this.increment,
    questions: await Question.getQuestions(this._id)
  }
}


module.exports = mongoose.model('Board', schema)
