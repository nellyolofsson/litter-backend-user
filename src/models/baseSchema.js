/**
 * @file Defines the base schema.
 * @module baseSchema
 * @author Nelly Olofsson
 */

// User-land modules.
import mongoose from 'mongoose'

// Application modules.
import { logger } from '../config/winston.js'

// Options to use converting the document to a plain object and JSON.
const convertOptions = {
  getters: true, // Include getters and virtual properties.
  versionKey: true, // Include the __v property.
  /**
   * Transforms the document, removing the _id property.
   *
   * @param {object} doc - The mongoose document which is being converted.
   * @param {object} ret - The plain object representation which has been converted.
   * @returns {object} The transformed object.
   * @see https://mongoosejs.com/docs/api.html#document_Document-toObject
   */
  transform: (doc, ret) => {
    // logger.silly('Transforming document', { doc: doc.toObject({ transform: null }) })
    delete ret._id // Exclude the _id property.
    logger.silly('Transformed document', { ret })
    return ret
  }
}

// Create a schema.
const baseSchema = new mongoose.Schema({}, {
  // Add and maintain createdAt and updatedAt fields.
  timestamps: true,
  // Set the options to use when converting the document to a POJO (or DTO) or JSON.
  // POJO = Plain Old JavaScript Object
  // DTO = Data Transfer Object
  toObject: convertOptions,
  toJSON: convertOptions,
  // Enable optimistic concurrency control. This is a strategy to ensure the
  // document you're updating didn't change between when you loaded it, and
  // when you update it.
  optimisticConcurrency: true
})

/**
 * Returns true if the schema has optimistic concurrency enabled.
 *
 * @returns {boolean} True if the schema has optimistic concurrency enabled; otherwise false.
 */
baseSchema.statics.checkConcurrency = function () {
  return this.schema.options.optimisticConcurrency
}

/**
 * Returns a map of the filtered schema properties.
 *
 * @returns {Map<string, object>} A map of the filtered schema properties.
 */
baseSchema.statics.getFilteredSchemaPropertyMap = function () {
  // TODO: Add support for subdocuments.

  // Memoize the filtered schema properties.
  if (!this._filteredSchemaPropertyMap) {
    // Filter out properties that should not be included in the DTO.
    this._filteredSchemaPropertyMap = Object.values(this.schema.paths)
      .filter(schemaType => !schemaType.options.auto && // _id
        this.schema.options.versionKey !== schemaType.path && // __v
        schemaType.path !== 'createdAt' && // createdAt
        schemaType.path !== 'updatedAt' // updatedAt
      )
      .reduce((map, schemaType) => {
        // Map the path to an object with the properties isRequired and hasDefaultValue.
        map.set(schemaType.path, {
          isRequired: !!schemaType.options.required,
          hasDefaultValue: Object.hasOwn(schemaType.options, 'default')
        })
        return map
      }, new Map())
  }

  return this._filteredSchemaPropertyMap
}

/**
 * Returns true if the object has excess properties.
 *
 * @param {object} obj - The object to check.
 * @param {boolean} [includeVersion=true] - If true, the version key property will be included.
 * @returns {boolean} True if the object has excess properties; otherwise false.
 */
baseSchema.statics.hasExcessProperties = function (obj, includeVersion = true) {
  // Get schema properties.
  const filteredProperties = Array.from(this.getFilteredSchemaPropertyMap().keys())

  // Add the version key to the list of filtered properties if optimistic
  // concurrency is enabled and includeVersion is true.
  if (this.schema.options.optimisticConcurrency && includeVersion) {
    filteredProperties.push(this.schema.options.versionKey)
  }

  // Get the properties in data that are not among the required properties
  // to check if there are any excess properties. Return true if there are
  // any excess properties; otherwise false.
  return Object.keys(obj)
    .filter(property => !filteredProperties.includes(property))
    .length > 0
}

/**
 * Returns an array of intersection properties between the schema and the object.
 *
 * @param {object} obj - The object to check.
 * @returns {string[]} An array of intersection properties between the schema and the object.
 */
baseSchema.statics.getIntersectionWithSchema = function (obj) {
  const filteredProperties = this.getFilteredSchemaPropertyMap()
  return Object.keys(obj).filter(property => filteredProperties.has(property))
}

/**
 * Returns true if the object has properties to create a document.
 *
 * @param {object} obj - The object to check.
 * @returns {boolean} True if the object has properties to create a document; otherwise false.
 */
baseSchema.statics.hasPropertiesToCreateDocument = function (obj) {
  // Filter out properties that are required and have a no default value,
  // and check if the object has all filtered out properties.
  return Array.from(this.getFilteredSchemaPropertyMap().entries())
    .filter(([, value]) => value.isRequired && !value.hasDefaultValue)
    .map(([key]) => key)
    .every(property => Object.hasOwn(obj, property))
}

/**
 * Returns true if the object has properties to delete a document.
 *
 * @param {object} obj - The object to check.
 * @returns {boolean} True if the object has properties to delete a document; otherwise false.
 */
baseSchema.statics.hasPropertiesToDeleteDocument = function (obj) {
  // If optimistic concurrency is enabled, the version key is required.
  // (The _id property is required, but it is not included in this object.)
  if (this.schema.options.optimisticConcurrency) {
    return Object.hasOwn(obj, this.schema.options.versionKey)
  }

  return true
}

/**
 * Returns true if the object has properties to replace a document.
 *
 * @param {object} obj - The object to check.
 * @returns {boolean} True if the object has properties to replace a document; otherwise false.
 */
baseSchema.statics.hasPropertiesToReplaceDocument = function (obj) {
  // Check if the intersection contains all properties.
  let result = this.getIntersectionWithSchema(obj).length === this.getFilteredSchemaPropertyMap().size

  // If optimistic concurrency is enabled, check if the object has a version key.
  if (result && this.schema.options.optimisticConcurrency) {
    result = result && Object.hasOwn(obj, this.schema.options.versionKey)
  }

  // Return true if the object has all properties to replace a document; otherwise false.
  return result
}

/**
 * Returns true if the object has at least one property to update a document.
 *
 * @param {object} obj - The object to check.
 * @returns {boolean} True if the object has at least one property to update a document; otherwise false.
 */
baseSchema.statics.hasPropertiesToUpdateDocument = function (obj) {
  // Check if the intersection contains at least one property.
  let result = this.getIntersectionWithSchema(obj).length > 0

  // If optimistic concurrency is enabled, check if the object has a version key.
  if (this.schema.options.optimisticConcurrency) {
    result = result && Object.hasOwn(obj, this.schema.options.versionKey)
  }

  // Return true if the object has at least one property to update a document; otherwise false.
  return result
}

/**
 * Determines if the object has a version key property or not.
 *
 * @param {object} obj - The object to check.
 * @returns {boolean} True if the object has a version key property; otherwise false.
 */
baseSchema.statics.hasVersionKey = function (obj) {
  return Object.hasOwn(obj, this.schema.options.versionKey)
}

export const BASE_SCHEMA = Object.freeze(baseSchema)
