import { logger } from '../config/winston.js'
import { convertToHttpError } from '../lib/util.js'
import { AuthService } from '../services/AuthService.js'
import { sendToRabbitMQ } from '../config/rabbitmq.js'
// import { handleFollow } from '../config/websocket.js'
import nodemailer from 'nodemailer'

/**
 *
 */
export class TestController {
  #authService

  /**
   *
   * @param {AuthService} authservice
   */
  constructor (authservice) {
    logger.silly('TestController constructor')
    this.#authService = authservice
  }

  /**
   *
   * @param req
   * @param res
   * @param next
   */
  async testloginWithGoogle (req, res, next) {
    try {
      console.log('loginwithgoogle', req.user)
      if (req.user) {
        // Save session?r
        
        //console.log('Session: ', req.session)
        // Pass session cookie to the client
        res.redirect('https://cscloud8-229.lnu.se')
      } else {
        res.status(401).send('Authentication failed')
      }
    } catch (error) {
      next(convertToHttpError(error))
    }
  }

  /**
   *
   * @param req
   * @param res
   * @param next
   */
  async testloginSuccess (req, res, next) {
    try {
      console.log('loginSuccess', req.session.user)
      console.log('loginSuccess', req.session)
      if (req.session.user) {
        const token = await this.#authService.generateToken(req.session.user)
        res.json({ user: req.session.user, jwttoken: token })
      } else {
        res.status(401).json({ message: 'Unauthorized' })
      }
    } catch (error) {
      next(convertToHttpError(error))
    }
  }
}
