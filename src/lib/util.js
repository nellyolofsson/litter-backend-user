/**
 * @file Utility functions.
 * @module util
 */

// Application modules.
import { HttpError } from './errors/HttpError.js'

const errorStatusMap = {
  InsufficientDataError: 400, // Bad Request
  ExcessDataError: 400, // Bad Request
  ValidationError: 400, // Bad Request
  NotFoundError: 404, // Not Found
  NotAcceptable: 406, // Not Acceptable
  ConcurrencyError: 409, // Conflict
  InvalidCreditError: 403 // Forbidden
}

/**
 * Converts the specified error to an HTTP error.
 *
 * @param {Error} error - The error to convert.
 * @returns {HttpError} The converted error.
 */
export function convertToHttpError (error) {
  // Default to Internal Server Error.
  return new HttpError({
    status: errorStatusMap[error.constructor.name] || 500,
    cause: error
  })
}

/**
 * Checks if an error is of a specified type.
 *
 * @param {Error} error - The error to check.
 * @param {Error} errorClass - The error class to check for.
 * @returns {boolean} True if the error is of the specified type; otherwise false.
 */
export function hasErrorOfType (error, errorClass) {
  if (error instanceof errorClass) {
    return true
  }

  if (error.cause) {
    return hasErrorOfType(error.cause, errorClass)
  }

  return false
}
