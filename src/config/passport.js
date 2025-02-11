import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { container, USERTYPES } from './inversify.config.js'


// Konfigurera Passport
/**
 *
 */

export const configurePassport = () => {
  // Hämta AuthService från IoC-container
  const authService = container.get(USERTYPES.AuthService)
  //const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3003/auth/google/callback';

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.NODE_ENV === 'production' ? 'https://cscloud8-229.lnu.se/api/v1/auth/google/callback' : 'http://localhost:3003/auth/google/callback',
      },
      async (token, tokenSecret, profile, done) => {
        try {
          let user = await authService.findUserById(profile.id)
          if (!user) {
            console.log('User not found. Creating new user...')
            user = await authService.findOrCreateUser({
              googleId: profile.id,
              firstName: profile.name.givenName,
              lastName: profile.name.familyName,
              email: profile.emails[0].value,
              profilePhoto: profile.photos[0].value
            })
          }

          return done(null, user)
        } catch (error) {
          console.error('Error during Google OAuth:', error)
          return done(error, null)
        }
      }
    )
  )

  passport.serializeUser((user, done) => {
    try {
      done(null, user.id) // eller user.id
    } catch (error) {
      console.error('Error during serialization:', error)
      done(error, null)
    }
  })

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await authService.findOne(id)
      done(null, user)
    } catch (error) {
      console.error('Error during deserialization:', error)
      done(error, null)
    }
  })
}
