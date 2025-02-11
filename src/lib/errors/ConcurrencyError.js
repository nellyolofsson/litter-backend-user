import { ApplicationError } from './ApplicationError.js'

/**
 * Represents a concurrency error.
 *
 * @class ConcurrencyError
 */
export class ConcurrencyError extends ApplicationError {
  /**
   * Creates an instance of ConcurrencyError.
   *
   * @param {object} options - An object that has the following properties:
   * @param {string} options.message - A human-readable description of the error.
   * @param {Error} options.cause - A value indicating the specific cause of the error.
   * @param {object} options.data - Custom debugging information.
   */
  constructor ({ message = 'A concurrency conflict occurred while accessing shared resources.', ...options } = {}) {
    super({ message, ...options })
  }
}
