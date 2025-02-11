/**
 * Represents an application error.
 *
 * @class ApplicationError
 */
export class ApplicationError extends Error {
  /**
   * A collection of key/value pairs that provide additional user-defined information about the error.
   *
   * @type {Map}
   */
  data

  /**
   * Creates an instance of ApplicationError.
   *
   * @param {object} options - An object that has the following properties:
   * @param {string} options.message - A human-readable description of the error.
   * @param {Error} options.cause - A value indicating the specific cause of the error.
   * @param {object} options.data - Custom debugging information.
   */
  constructor ({ message, ...options } = {}) {
    super(message, options)

    // Additional data about the error.
    this.data = new Map(Object.entries(options.data || {}).map(([key, value]) => [key, value]))

    // Help to identify this error.
    this.name = this.constructor.name

    // Maintains proper stack trace for where our error was thrown (only available on V8).
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}
