/**
 * @file This file contains the MongooseRepositoryBase class.
 * @module MongooseRepositoryBase
 * @author Nelly Olofsson
 */

// User-land modules.
import mongoose from 'mongoose'

// Application modules.
import { RepositoryError } from '../lib/errors/RepositoryError.js'

/**
 * Encapsulates a task repository.
 */
export class MongooseRepositoryBase {
  /**
   * The Mongoose model.
   *
   * @type {mongoose.Model}
   */
  model

  /**
   * Initializes a new instance.
   *
   * @param {mongoose.Model} model - A Mongoose model.
   */
  constructor (model) {
    this.model = model
  }

  /**
   * Gets documents.
   *
   * @param {object} filter - Filter to apply to the query.
   * @param {object|string|string[]} [projection] - Fields to return.
   * @param {object} [options] - See Query.prototype.setOptions().
   * @example
   * // Passing options
   * await myModelRepository.get({ name: /john/i }, null, { skip: 10 }).exec()
   * @returns {Promise<object>} Promise resolved with the found documents and pagination data.
   */
  async get (filter, projection = null, options = null) {
    try {
      const documents = await this.model
        .find(filter, projection, options)
        .exec()

      const perPage = options?.limit || 20
      const count = await this.model.countDocuments()

      return {
        data: documents,
        pagination: {
          totalCount: count,
          page: (options?.skip || 0) / perPage + 1,
          perPage,
          totalPages: Math.ceil(count / perPage)
        }
      }
    } catch (error) {
      throw new RepositoryError({ message: 'Failed to get documents.', cause: error })
    }
  }

  /**
   * Gets a single document by its id.
   *
   * @param {object|number|string} id - Value of the document id to get.
   * @param {object|string|string[]} [projection] - Fields to return.
   * @param {object} [options] - See Query.prototype.setOptions().
   * @returns {Promise<mongoose.Model>} Promise resolved with the found document.
   */
  async getById (id, projection, options) {
    try {
      const doc = await this.model
        .findById(id, projection, options)
        .exec()

      if (!doc) {
        throw new mongoose.Error.DocumentNotFoundError()
      }

      return doc
    } catch (error) {
      throw new RepositoryError({ message: 'Failed to get document.', cause: error })
    }
  }

  /**
   * Gets a single document by the conditions.
   *
   * @param {object} conditions - Value of the document conditions to get.
   * @param {object|string|string[]} [projection] - Fields to return.
   * @param {object} [options] - See Query.prototype.setOptions().
   * @returns {Promise<mongoose.Model>} Promise resolved with the found document.
   */
  async getOne (conditions, projection, options) {
    try {
      const doc = await this.model
        .findOne(conditions, projection, options)
        .exec()

      if (!doc) {
        throw new mongoose.Error.DocumentNotFoundError()
      }

      return doc
    } catch (error) {
      throw new RepositoryError({ message: 'Failed to get document.', cause: error })
    }
  }

  /**
   * Inserts a document into the database.
   *
   * @param {object} insertData -  The data to create a new document out of.
   * @returns {Promise<mongoose.Model>} Promise resolved with the new document.
   */
  async insert (insertData) {
    try {
      console.log('Insert data: ', insertData)
      return await this.model.create(insertData)
    } catch (error) {
      throw new RepositoryError({ message: 'Failed to insert document.', cause: error })
    }
  }

  /**
   * Deletes a document.
   *
   * @param {mongoose.Document} doc - The documents to delete.
   * @returns {Promise<mongoose.Model>} Promise resolved with the removed document.
   */
  async delete (doc) {
    try {
      return await doc.deleteOne().exec()
    } catch (error) {
      throw new RepositoryError({ message: 'Failed to delete document.', cause: error })
    }
  }

  /**
   * Saves a document.
   *
   * @param {mongoose.Document} doc - The documents to save.
   * @throws {RepositoryError} Will throw an error if the document failed to save.
   * @returns {Promise<mongoose.Model>} Promise resolved with the saved document.
   */
  async save (doc) {
    try {
      console.log('Doc2: ', doc)
      console.log('Doc3: ', doc.toObject())
      const savedDoc = await doc.save()
      return savedDoc
    } catch (error) {
      throw new RepositoryError({ message: 'Failed to save document.', cause: error })
    }
  }

  async update (doc) {
    try {
      console.log('Doc from update: ', doc);
      console.log('Doc2: ', doc.toObject());
      const updatedDoc = await doc.save();
      console.log('Updated doc: ', updatedDoc);
      return updatedDoc;
    } catch (error) {
      throw new RepositoryError({ message: 'Failed to update document.', cause: error });
    }
  }
}
