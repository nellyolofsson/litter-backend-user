import { ApplicationError } from './ApplicationError.js'

/**
 *
 */
export class InvalidError extends ApplicationError {
  /**
   * Creates an instance of Invalid.
   *
   * @param {object} options - An object that has the following properties:
   * @param {string} options.message - A human-readable description of the error.
   * @param {Error} options.cause - A value indicating the specific cause of the error.
   * @param {object} options.data - Custom debugging information.
   */
  constructor ({ message = 'Invalid format, please try again.', ...options } = {}) {
    super({ message, ...options })
  }
}
