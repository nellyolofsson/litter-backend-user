import http from 'node:http'
import { ApplicationError } from './ApplicationError.js'

/**
 * Represents a validation error.
 *
 * @class HttpError
 */
export class HttpError extends ApplicationError {
  /**
   * Creates an instance of HttpError.
   *
   * @param {object} options - An object that has the following properties:
   * @param {Error} options.cause - A value indicating the specific cause of the error.
   * @param {object} options.data - Custom debugging information.
   * @param {string} options.message - A human-readable description of the error.
   * @param {number} options.status - The HTTP status code.
   */
  constructor ({ message, status, ...options } = {}) {
    super({
      message: message || http.STATUS_CODES[status],
      ...options
    })

    this.status = Number(status)
  }

  /**
   * Gets the HTTP status' reason phrase.
   *
   * @returns {string|undefined} The status message.
   */
  get reasonPhrase () {
    return http.STATUS_CODES[this.status]
  }
}
