import { ApplicationError } from './ApplicationError.js'

/**
 * Represents a validation error.
 *
 * @class ValidationError
 */
export class ValidationError extends ApplicationError {
  /**
   * Creates an instance of ValidationError.
   *
   * @param {object} options - An object that has the following properties:
   * @param {string} options.message - A human-readable description of the error.
   * @param {Error} options.cause - A value indicating the specific cause of the error.
   * @param {object} options.data - Custom debugging information.
   */
  constructor ({ message = 'The provided data is invalid or in incorrect format.', ...options } = {}) {
    super({ message, ...options })
  }
}
