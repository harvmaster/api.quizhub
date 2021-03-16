'use strict'

const express = require('express')
const router = express.Router()

/**
 * CashPayServer routes
 * @namespace Routes
 */

/**
 * Root Route
 * @memberof Routes
 *
 */
class RootRoute {
  constructor () {
    router.use('/', require('./questions'))
    router.use('/file', require('./file'))

    return router
  }
}

module.exports = new RootRoute()
