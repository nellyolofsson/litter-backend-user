// Application modules.
import { MongooseRepositoryBase } from './MongooseRepositoryBase.js'
// User-land modules.
import mongoose from 'mongoose'
// Application modules.
import { RepositoryError } from '../lib/errors/RepositoryError.js'
import jwt from 'jsonwebtoken'

/**
 *
 */
export class AuthRepository extends MongooseRepositoryBase {
  /**
   *
   * @param user
   */
  async create (user) {
    try {
      if (!user || !user.username) {
        throw new mongoose.Error.ValidationError('Username is required.')
      }

      const existingUser = await this.model.findOne({ username: user.username })
      if (existingUser) {
        throw new RepositoryError({ message: 'User already exists.' })
      }

      return await this.model.create({ username: user.username })
    } catch (error) {
      throw new RepositoryError({ message: 'Failed to create user.', cause: error })
    }
  }

  /**
   * Logs in a user.
   *
   * @param {string} username - The username.
   * @returns {Promise<object>} Promise resolved with the user.
   */
  async loginWithGoogle (username) {
    try {
      console.log('Username: ', username.googleId)
      if (!username) {
        throw new mongoose.Error.ValidationError('Google ID and username are required.')
      }

      // Kontrollera om användaren med det angivna Google ID:t finns
      // let user = await this.model.authenticate(username)

      if (!username) {
        throw new RepositoryError({ message: 'No user found with this username.' })
      }

      if (!username.googleId) {
        username.googleId = googleId
        username = await username.insert()
      }

      // Returnera användaren
      return username
    } catch (error) {
      throw new RepositoryError({ message: 'Failed to log in user with Google OAuth.', cause: error })
    }
  }

  /**
   *
   * @param user
   */
  async generateToken (user) {
    try {
      console.log('User from generateToken authreps: ', user)
      if (!user) {
        throw new mongoose.Error.ValidationError('User is required.')
      }

      const payload = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName
      }

      // Skapa en token
      const accessLife = parseInt(process.env.JWT_ACCESS_LIFE)
      console.log("test", payload)

      const privateKey = process.env.PRIVATE_KEY

      console.log('Private key: ', privateKey)

      const token = jwt.sign(payload, privateKey, {
        algorithm: 'RS256',
        expiresIn: accessLife
      });
      
      console.log('Token from repositories: ', token)

      return token

    } catch (error) {
      throw new RepositoryError({ message: 'Failed to generate token.', cause: error })
    }
  }

  /**
   *
   * @param googleId
   */
  async findByGoogleId (googleId) {
    try {
      if (!googleId) {
        throw new mongoose.Error.ValidationError('Google ID is required.')
      }
      return await this.model.findOne({ googleId })
    } catch (error) {
      throw new RepositoryError({ message: 'Failed to find user by Google ID.', cause: error })
    }
  }

  /**
   *
   * @param profile
   */
  async findById (profile) {
    try {
      if (!profile || !profile.googleId) {
        throw new mongoose.Error.ValidationError('Profile ID is required.')
      }
      console.log('Profile ID från authrespository: ', profile)
      return await this.model.findOne(profile)
    } catch (error) {
      throw new RepositoryError({ message: 'Failed to find user by ID.', cause: error })
    }
  }

  async findByEmail (email) {
    try {
      if (!email) {
        throw new mongoose.Error.ValidationError('Email is required.')
      }
      return await this.model.findOne({ email })
    } catch (error) {
      throw new RepositoryError({ message: 'No user found with this email.', cause: error })
    }
  }

  async authenticate (email, password) {
    try {
      console.log('Email in repository: ', email)
      console.log('Password in repository: ', password)
  
      // Validate inputs
      if (!email || !password) {
        throw new mongoose.Error.ValidationError('Email and password are required.')
      }
  
      // Authenticate the user by email and password
      return await this.model.authenticateEmailPassword(email, password)
    } catch (error) {
      console.error(error)
      throw new RepositoryError({ message: 'Failed to authenticate user.', cause: error })
    }
  }
  

  /**
   *
   * @param userData
   */
  /*async insert (userData) {
    console.log('User data: ', userData)
    try {
      if (!userData) {
        throw new mongoose.Error.ValidationError('User data is required.')
      }
      const user = new this.model(userData)
      console.log('User after modelling it: ', user)
      return await user.save()
    } catch (error) {
      throw new RepositoryError({ message: 'Failed to insert user.', cause: error })
    }
  }*/

  /**
   *
   * @param id
   */
  async findOne (id) {
    try {
      console.log("from authrepostitory", id)
      if (!id) {
        throw new mongoose.Error.ValidationError('ID is required.')
      }
      return await this.model.findById(id)
    } catch (error) {
      throw new RepositoryError({ message: 'Failed to find user.', cause: error })
    }
  }

  /**
   *
   */
  async findAll () {
    try {
      return await this.model.find()
    } catch (error) {
      throw new RepositoryError({ message: 'Failed to find users.', cause: error })
    }
  }
}
