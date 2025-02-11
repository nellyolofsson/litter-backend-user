import { ApplicationError } from './ApplicationError.js'

/**
 * Represents a repository error.
 *
 * @class RepositoryError
 */
export class RepositoryError extends ApplicationError {
  /**
   * Creates an instance of RepositoryError.
   *
   * @param {object} options - An object that has the following properties:
   * @param {string} options.message - A human-readable description of the error.
   * @param {Error} options.cause - A value indicating the specific cause of the error.
   * @param {object} options.data - Custom debugging information.
   */
  constructor ({ message = 'An error occurred while accessing the repository.', ...options } = {}) {
    super({ message, ...options })
  }
}
