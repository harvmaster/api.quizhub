'use strict'

const config = require('../../config')

const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const Filter = require('../../resources/fileFilter')

/**
  * Upload Management routes
  * @memberof Routes
  */
class UploadRoute {
  constructor () {
    router.post('/', new multer({ dest: './uploads/' }).single('file'), this.uploadFile)
	router.get('/:url', this.getFile)
		
		return router
  }

  async uploadFile (req, res) {
		const files = req.file
		console.log(files)
		
		if (!files) {
			return res.send('No file found')
		}
		// return res.json({ url:  })

	}

  async getFile (req, res) {
    return res.sendFile(req.url)
  }
 
}

module.exports = new UploadRoute()
