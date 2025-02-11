import { ApplicationError } from './ApplicationError.js'

/**
 * Represents a not modified error.
 *
 * @class NotModifiedError
 */
export class NotModifiedError extends ApplicationError {
  /**
   * Creates an instance of NotModifiedError.
   *
   * @param {object} options - An object that has the following properties:
   * @param {string} options.message - A human-readable description of the error.
   * @param {Error} options.cause - A value indicating the specific cause of the error.
   * @param {object} options.data - Custom debugging information.
   */
  constructor ({ message = 'No changes have been detected.', ...options } = {}) {
    super({ message, ...options })
  }
}
