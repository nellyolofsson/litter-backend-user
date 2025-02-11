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

    // TO DO: Ska vi få ett JWT token eller ska vi använda oss av Passport eller båda två?
    const payload = jwt.verify(token, process.env.PUBLIC_KEY, { algorithms: ['RS256'] })

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

router.route('/google').get((req, res, next) => {
  console.log('Incoming request to /google');
  console.log('Query parameters:', req.query);
  console.log('Headers:', req.headers);
  next(); // Gå vidare till nästa middleware (passport.authenticate)
},
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
  }));


// Frontend calls this route with the code gotten from the Google callback
router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/' }),
  (req, res, next) => 
  
      container.get(USERTYPES.AuthController).loginWithGoogle(req, res, next)
    )


router.route('/login/success').get((req, res, next) => {

  container.get(USERTYPES.AuthController).loginSuccess(req, res, next)
})

