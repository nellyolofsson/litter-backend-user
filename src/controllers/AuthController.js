import { logger } from '../config/winston.js'
import { convertToHttpError } from '../lib/util.js'
import { AuthService } from '../services/AuthService.js'
import { sendToRabbitMQ } from '../config/rabbitmq.js'
// import { handleFollow } from '../config/websocket.js'
import nodemailer from 'nodemailer'

import { OAuth2Client } from 'google-auth-library'
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_OAUTH_URL,
  process.env.GOOGLE_ACCESS_TOKEN_URL,
  process.env.GOOGLE_TOKEN_INFO_URL,
  process.env.NODE_ENV === 'production' ? 'https://cscloud8-229.lnu.se/auth/google/callback' : 'http://localhost:3003/auth/google/callback',
)
/**
 *
 */
export class AuthController {
  #authService

  /**
   *
   * @param {AuthService} authservice
   */
  constructor(authservice) {
    logger.silly('AuthController constructor')
    this.#authService = authservice
  }

  async loadUserDocument(req, res, next, id) {
    try {
      req.doc = await this.#authService.findOne(id)
      next()
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
  async loginWithGoogle(req, res, next) {
    try {
      if (req.user) {
        // Pass session cookie to the client
        // Generate a JWT token and set it to the req.user object or req.session.user?
        // const token = await this.#authService.generateToken(req.user)
        // console.log('Token: ', token)
        // Add token to the req.user object
        // req.user.jwtToken = token
        // console.log('User with token: ', req.user)
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
  async loginSuccess(req, res, next) {
    try {
      const user = req.user
      const token = await this.#authService.generateToken(user)
      return res.json({ user: req.user, jwttoken: token })
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
  async getOneUser(req, res, next) {
    try {
      const { id } = req.params
      const user = await this.#authService.findOne(id)
      res.status(200).json(user)
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
  async checkFollowers(req, res, next) {
    try {
      const { id } = req.params;
      const { user } = req.body;
      const findUser = await this.#authService.findOne(id);
      const findFollowingUser = await this.#authService.findOne(user.id);
      if (!findUser || !findFollowingUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      const isFollowing = findUser.followers.some(follower => follower.userID.toString() === user.id.toString());
      if (isFollowing) {
        // Delete the follower from the followers array
        findUser.followers = findUser.followers.filter(follower => follower.userID.toString() !== user.id.toString());
        // Delete the following from the following array
        findFollowingUser.following = findFollowingUser.following.filter(following => following.userID.toString() !== findUser.id.toString());
      } else {
        findUser.followers = [
          ...findUser.followers,
          {
            userID: user.id,
            followerName: user.firstName,
            followerLastName: user.lastName,
            followerPic: user.profilePhoto
          }
        ];
        findFollowingUser.following = [
          ...findFollowingUser.following,
          {
            userID: findUser.id,
            followingName: findUser.firstName,
            followingLastName: findUser.lastName,
            followingPic: findUser.profilePhoto
          }
        ];
        sendToRabbitMQ({
          event: 'FOLLOW',
          userId: findUser.id,
          user
        });
        this.sendEmail(user, findUser);

      }
      const updatedUser = await this.#authService.updateOrReplaceUser(findUser);
      const updatedUser2 = await this.#authService.updateOrReplaceUser(findFollowingUser);
      res.status(200).json({ updatedUser });
    } catch (error) {
      next(convertToHttpError(error));
    }
  }


  /**
   *
   * @param followerUser
   * @param followingUser
   */
  async sendEmail(followerUser, followingUser) {
    // Konfigurera e-posttransport
    const transporter = nodemailer.createTransport({
      service: 'Gmail', // Du kan använda en annan tjänst
      auth: {
        user: 'litterplatform@gmail.com', // Din e-postadress
        pass: 'ecmg rsqe avee artc' // Ditt lösenord eller app-specifikt lösenord
      }
    })

    // Skapa e-postmeddelandet
    const mailOptions = {
      from: 'litterplatform@gmail.com', // Avsändaradress
      to: followingUser.email, // Användarens e-postadress
      subject: 'New Follower Notification',
      text: `${followerUser.firstName} has started following you!`
    }

    // Skicka e-postmeddelandet
    return transporter.sendMail(mailOptions)
  }

  /**
   *
   * @param req
   * @param res
   * @param next
   */
  async logout(req, res, next) {
    try {
      req.logout((err) => {
        if (err) {
          console.error('Error logging out:', err)
          return res.status(500).json({ message: 'Logout failed.' })
        }
        req.session.destroy(() => {
          res.clearCookie('connect.sid') // Clear the session cookie
          // Redirect to Google's logout URL
          // const googleLogoutURL = 'https://accounts.google.com/Logout';
          res.redirect('https://cscloud8-229.lnu.se')
        })
      })
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
  async getAllUsers(req, res, next) {
    try {
      if (!req.user.id) {
        return res.status(401).json({ message: 'Unauthorized' })
      }
      const users = await this.#authService.findAllUsers()
      res.status(200).json(users)
    } catch (error) {
      next(convertToHttpError(error))
    }
  }

  async loginWithEmailandPassword(req, res, next) {
    try {
      const { email, password } = req.body

      // Find user and authenticate
      const user = await this.#authService.findUserByEmailAndPassword(email, password)
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' })
      }



      // Generate JWT token (you need to implement this part)
      const token = await this.#authService.generateToken(user)


      // Return user data and token
      return res.json({ user, token })
    } catch (error) {
      // Convert the error to HTTP response error
      console.error(error)
      next(convertToHttpError(error))  // Ensure this is defined to handle different types of errors
    }
  }

  async registerUser(req, res, next) {
    try {
      //const { email, password, ...otherUserData } = req.body
      const currentUser = req.body

      const user = await this.#authService.insert(currentUser)

      // Check if user already exists
      //console.log('User: ', req.body)
      //let user = await this.#authService.findOrCreateUserByCheckingEmail({ email, password, ...otherUserData })

  

      // Send response with created user
      res.status(201).json(user)
    } catch (error) {
      next(convertToHttpError(error))
    }
  }

}
