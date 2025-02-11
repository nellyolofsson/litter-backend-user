// Application modules.
import { MongooseServiceBase } from './MongooseServiceBase.js'
/**
 *
 */
export class AuthService extends MongooseServiceBase {
  /**
   * Generates a token.
   *
   * @param {object} user - The user to generate a token for.
   * @returns {Promise<string>} Promise resolved with the generated token.
   */
  async generateToken (user) {
    try {
      const repositories = this.getRepository()
      const token = await repositories.generateToken(user)
      return token
    } catch (error) {
      this.getHandleError(error, 'Failed to generate token.')
    }
  }

  /**
   *
   * @param userDetails
   */
  async findOrCreateUser (userDetails) {
    try {
      const repositories = this.getRepository()

      let user = await repositories.findById({ googleId: userDetails.googleId })


      if (!user) {
        user = await repositories.insert(userDetails)               
      }
      return await user
    } catch (error) {
      this.getHandleError(error, 'Failed to find or create user.')
    }
  }

  async findOrCreateUserByCheckingEmail(user) {
    try {
      const repositories = this.getRepository()
  
      // Check if user already exists by email
      let foundUser = await repositories.findByEmail(user.email)
      
      if (!foundUser) {

        foundUser = await repositories.insert(user)
      }
  
      return foundUser
    } catch (error) {
      this.getHandleError(error, 'Failed to find or create user.')
    }
  }
  

  async findUserByEmailAndPassword (email, password) {
    try {
      const repositories = this.getRepository()
  
      // Authenticate user with email and password
      return await repositories.authenticate(email, password)
    } catch (error) {
      console.error(error)
      this.getHandleError(error, 'Failed to find user by email and password.')
    }
  }


  /**
   *
   * @param id
   */
  async findOne (id) {
    try {
      const repositories = this.getRepository()
      return await repositories.findOne(id)
    } catch (error) {
      this.getHandleError(error, 'Failed to find user.')
    }
  }

  /**
   *
   * @param googleid
   */
  async findUserById (googleid) {
    try {
      const repositories = this.getRepository()
      return await repositories.findByGoogleId(googleid)
    } catch (error) {
      this.getHandleError(error, 'Failed to find user by id.')
    }
  }

  /**
   *
   * @param user
   */
  async updateOrReplaceUser (user) {
    try {
      const repositories = this.getRepository()
      return await repositories.update(user)
    } catch (error) {
      this.getHandleError(error, 'Failed to update or replace user.')
    }
  }

  /**
   *
   */
  async findAllUsers () {
    try {
      const repositories = this.getRepository()
      return await repositories.findAll()
    } catch (error) {
      this.getHandleError(error, 'Failed to find all users.')
    }
  }
}
