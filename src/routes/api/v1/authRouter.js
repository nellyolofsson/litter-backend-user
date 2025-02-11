import express from 'express'
import { container, USERTYPES } from '../../../config/inversify.config.js'
import jwt from 'jsonwebtoken'
import { HttpError } from '../../../lib/errors/HttpError.js'
import passport from 'passport'

export const router = express.Router()

/**
 * Authenticate a JWT token.
 *
 * @returns {Function} A middleware function.
 */
const authenticateJWT = () => (req, res, next) => {
  try {
    const [authenticationScheme, token] = req.headers.authorization?.split(' ')
    if (authenticationScheme !== 'Bearer') {
      throw new HttpError('Invalid authentication scheme.')
    }

    const payload = jwt.verify(token, process.env.PUBLIC_KEY, { algorithms: ['RS256'] })

    // How do we match the payload? 
    // This is what we used for the payload in the repositories
    /*
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName
    */

    req.user = {
      id: payload.id,
      firstName: payload.firstName,
      lastName: payload.lastName
    }
    next()
  } catch (err) {
    throw new HttpError({
      cause: err,
      message: 'Unauthorized',
      status: 403
    })
  }
}

router.param('id', (req, res, next, id) =>
  container.get(USERTYPES.AuthController).loadUserDocument(req, res, next, id))

router.route('/google').get((req, res, next) => {
  next(); // Gå vidare till nästa middleware (passport.authenticate)
},
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
  }));

/*router.route('/google', (req, res, next) => container.get(USERTYPES.AuthController).testLogin(req, res, next))
router.route('/google/callback', (req, res, next) => container.get(USERTYPES.AuthController).testLoginCallback(req, res, next))*/

// Frontend calls this route with the code gotten from the Google callback
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }),
  (req, res, next) => 
      container.get(USERTYPES.AuthController).loginWithGoogle(req, res, next)
  )


// Frontend calls this route to check if the user is logged in
// By using the req.isAuthenticated() function, we can check if the user is authenticated gotten from the passport.authenticate('session') middleware
router.route('/login/success').get((req, res, next) => {
  if (req.isAuthenticated()) {
    container.get(USERTYPES.AuthController).loginSuccess(req, res, next)
  } else {
    console.log('User is not authenticated.')
    res.status(401).json({ message: 'User is not authenticated.' })
  }
})


router.route('/login').post((req, res, next) => container.get(USERTYPES.AuthController).loginWithEmailandPassword(req, res, next))
router.route('/register').post((req, res, next) => container.get(USERTYPES.AuthController).registerUser(req, res, next))

// Frontend calls this route to check if the user is logged in
router.route('/logout').get((req, res, next) => container.get(USERTYPES.AuthController).logout(req, res, next))
// Frontend calls this route to get all users
router.route('/users').get(authenticateJWT(), (req, res, next) => container.get(USERTYPES.AuthController).getAllUsers(req, res, next))

// Frontend calls this route to check if the user has a follower
router.route('/profile/:id/follow').patch(authenticateJWT(), (req, res, next) => container.get(USERTYPES.AuthController).checkFollowers(req, res, next))
// Frontend calls this route to get the user's profile
router.route('/profile/:id').get(authenticateJWT(), (req, res, next) => container.get(USERTYPES.AuthController).getOneUser(req, res, next))
