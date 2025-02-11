/**
 * Mongoose model User.
 *
 * @author Nelly Olofsson
 * @version 2.0.0
 */

import mongoose from 'mongoose'
import bcrypt from 'bcrypt'
import { BASE_SCHEMA } from './baseSchema.js'
import { HttpError } from '../lib/errors/HttpError.js'


// Create a schema.
const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    required: false,
    unique: true // Gör email unikt
  },
  firstName: {
    type: String,
    required: false
  },
  lastName: {
    type: String,
    required: false
  },
  email: {
    type: String,
    required: false,
    unique: true,
  },
  profilePhoto: {
    type: String,
    required: false
  },
  followers: {
    type: [
      {
        userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
        followerName: { type: String, required: true },
        followerLastName: { type: String, required: true },
        followerPic: { type: String, required: true }
      }
    ],
    required: false, // Ensures it's optional.
    default: [] // Ensures it defaults to an empty array if not provided.
  },
  following: {
    type: [
      {
        userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
        followingName: { type: String, required: true },
        followingLastName: { type: String, required: true },
        followingPic: { type: String, required: true }
      }
    ],
    required: false, // Ensures it's optional.
    default: [] // Ensures it defaults to an empty array if not provided.
  },
})

userSchema.virtual('id').get(function () {
  return this._id.toHexString()
})

/**
 * Authenticates a user.
 *
 * @param {string} username - The username.
 * @param {string} password - The password.
 * @param identifier
 * @returns {Promise<object>} Promise resolved with the user.
 */
userSchema.statics.authenticate = async function (identifier) {
  return await this.findOne({
    $or: [{ googleId: identifier }, { email: identifier }]
  })
}

userSchema.add(BASE_SCHEMA)
// Create a model using the schema.
export const UserModel = mongoose.model('User', userSchema)
