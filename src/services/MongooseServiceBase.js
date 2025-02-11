/**
 * @file This file contains the MongooseServiceBase class.
 * @module MongooseServiceBase
 * @author Mats Loock
 */

// User-land modules.
import mongoose from 'mongoose'

// Application modules.
import { Enum } from '../lib/Enum.js'
import {
  ApplicationError,
  ConcurrencyError,
  ExcessDataError,
  InsufficientDataError,
  NotFoundError,
  ValidationError
} from '../lib/errors/index.js'
import { hasErrorOfType } from '../lib/util.js'
import { MongooseRepositoryBase } from '../repositories/MongooseRepositoryBase.js'
/**
 * Defines document actions.
 *
 * @readonly
 * @enum {string}
 * @property {string} Create - The document will be created.
 * @property {string} Replace - The document will be replaced.
 * @property {string} Update - The document will be updated.
 * @type {object}
 */
const DocumentAction = Enum({
  Create: 'Create',
  Replace: 'Replace',
  Update: 'Update',
  Delete: 'Delete'
})

/**
 * Encapsulates a task service.
 */
export class MongooseServiceBase {
  /**
   * A map of document actions to functions that ensure that the provided data
   * object contains exactly the required properties.
   *
   * @type {Map<string, Function>}
   * @type {{[key in DocumentAction]: (object) => boolean}}
   */
  #actionToEnsureExpectedProperties

  /**
   * The repository.
   *
   * @type {MongooseRepositoryBase}
   */
  #repository

  /**
   * Initializes a new instance.
   *
   * @param {MongooseRepositoryBase} repository - A repository instantiated from a class with the same capabilities as MongooseRepositoryBase.
   */
  constructor (repository) {
    this.#repository = repository

    this.#actionToEnsureExpectedProperties = {
      [DocumentAction.Create]: this.#repository.model.hasPropertiesToCreateDocument.bind(this.#repository.model),
      [DocumentAction.Replace]: this.#repository.model.hasPropertiesToReplaceDocument.bind(this.#repository.model),
      [DocumentAction.Update]: this.#repository.model.hasPropertiesToUpdateDocument.bind(this.#repository.model),
      [DocumentAction.Delete]: this.#repository.model.hasPropertiesToDeleteDocument.bind(this.#repository.model)
    }
  }

  /**
   * Gets the repository.
   *
   * @returns {MongooseRepositoryBase} The repository.
   */
  getRepository () {
    return this.#repository
  }

  /**
   * Gets a function that handles an error.
   *
   * @param {Error} error - The error to handle.
   * @param {string} message - The message to use if the error is not handled.
   * @returns {Function} A function that handles an error.
   */
  getHandleError (error, message) {
    return this.#handleError(error, message)
  }

  /**
   * Gets all documents.
   *
   * @param {object} params - The query parameters.
   * @param {number} [params.page=1] - The page number.
   * @param {number} [params.perPage=20] - The number of documents per page.
   * @returns {Promise<object>} Promise resolved with all documents.
   */
  async get ({ page = 1, perPage = 20 } = {}) {
    try {
      page = Math.max(page, 1)

      perPage = Math.max(perPage, 1)
      perPage = Math.min(perPage, 100)

      return await this.#repository.get(
        null,
        null,
        {
          limit: perPage,
          skip: (page - 1) * perPage
        }
      )
    } catch (error) {
      this.#handleError(error, 'Failed to get documents.')
    }
  }

  /**
   * Gets a document by ID.
   *
   * @param {string} id - The value of the id for the document to get.
   * @returns {Promise<object>} Promise resolved with the found document as a plain JavaScript object.
   */
  async getById (id) {
    try {
      return await this.#repository.getById(id)
    } catch (error) {
      // If there is a CastError, the provided id is not a valid ObjectId,
      // and we can throw a NotFoundError instead of handling the error in
      // the #handleError method.
      if (hasErrorOfType(error, mongoose.Error.CastError)) {
        throw new NotFoundError({ cause: error })
      } else {
        this.#handleError(error, 'Failed to get document.')
      }
    }
  }

  /**
   * Inserts a new document.
   *
   * @param {object} data - ...
   * @returns {Promise<object>} Promise resolved with the created document as a plain JavaScript object.
   */
  async insert (data) {
    // Ensure that data contains the required properties.
    this.#ensureExpectedProperties(data, DocumentAction.Create)

    try {
      // Create a new document.
      return await this.#repository.insert(data)
    } catch (error) {
      this.#handleError(error, 'Failed to insert document.')
    }
  }

  /**
   * Updates or replaces a recipe document.
   *
   * @param {mongoose.Document} doc - The document to update or replace.
   * @param {object} updateData - The new data to update or replace the existing document with.
   * @param {boolean} replace - If true, the document will be replaced; otherwise, it will be partially updated.
   * @returns {Promise<object>} Promise resolved with the updated or replaced document.
   */
  async updateOrReplace (doc, updateData, replace) {
    try {
      console.log('Update data: ', updateData)
      console.log('Replace: ', replace)
      console.log('Doc: ', doc)
      // Ensure that updateData contains exactly the required properties.
      if (replace) {
      // If replace is true, replace the entire document with the new data.
        Object.assign(doc, updateData)
      } else {
      // If replace is false, update the document partially with the new data.
        Object.keys(updateData).forEach(key => {
          doc[key] = updateData[key]
        })
      }
      // Save the updated or replaced document.
      return await this.#repository.save(doc)
    } catch (error) {
      this.#handleError(error, 'Failed to update or replace document.')
    }
  }

  /**
   * Deletes a document.
   *
   * @param {mongoose.Document} doc - The documents to delete.
   * @returns {Promise<object>} Promise resolved with the removed document.
   */
  async delete (doc) {
    // Ensure that deleteData contains exactly the required property.

    try {
      // Delete the document.
      return this.#repository.delete(doc)
    } catch (error) {
      this.#handleError(error, 'Failed to delete document.')
    }
  }

  /**
   * Handles an error.
   *
   * @param {Error} error - The error to handle.
   * @param {string} message - The message to use if the error is not handled.
   */
  #handleError (error, message) {
    if (hasErrorOfType(error, mongoose.Error.ValidationError) ||
      hasErrorOfType(error, mongoose.Error.CastError)) {
      throw new ValidationError({ cause: error })
    } else if (hasErrorOfType(error, mongoose.Error.VersionError)) {
      throw new ConcurrencyError({ cause: error })
    } else if (hasErrorOfType(error, mongoose.Error.DocumentNotFoundError)) {
      throw new NotFoundError({ cause: error })
    } else if (error instanceof ApplicationError) {
      throw error
    } else {
      // Handle other errors.
      throw new ApplicationError({ message, cause: error })
    }
  }

  /**
   * Ensures that the provided data object contains exactly the required properties, no more and no less.
   * Throws an error if the data object is missing a required property or contains an excess property.
   *
   * @param {object} data - The data object to validate.
   * @param {DocumentAction} action - The document action to validate the data object for.
   * @throws {InsufficientDataError} If a required property is missing from the data object.
   * @throws {ExcessDataError} If the data object contains a property not included in the list of required properties.
   */
  // #ensureExpectedProperties (data, requireAllPropertyNames = true, includeVersion = true) {
  #ensureExpectedProperties (data, action) {
    // Ensure that the action is valid.
    const validate = this.#actionToEnsureExpectedProperties[action]
    if (!validate) {
      throw new Error(`Invalid action: ${action}`)
    }
    // Ensure that the data object contains exactly the required properties.
    if (!validate(data)) {
      console.log('Data from handelexepted protpertise: ', data)
      throw new InsufficientDataError({ data: { ...data } })
    }
    // Ensure that the data object does not contain any excess properties.
    if (action !== DocumentAction.Delete && this.#repository.model.hasExcessProperties(data)) {
      throw new ExcessDataError({ data: { ...data } })
    } else if (action === DocumentAction.Delete) {
      // If the action is delete, ensure that the data object contains exactly one property.
      const requiredPropertyCount = this.#repository.model.checkConcurrency() ? 1 : 0
      if (Object.keys(data).length > requiredPropertyCount) {
        throw new ExcessDataError({ data: { ...data } })
      }
    }
  }
}
