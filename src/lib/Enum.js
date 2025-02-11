/**
 * @file This file encapsulates an enum.
 * @module Enum
 */

/**
 * Creates a new enum.
 *
 * @param {object} baseEnum - The base enum.
 * @returns {Proxy} The new enum.
 */
export const Enum = (baseEnum) => {
  return new Proxy(baseEnum, {
  /**
   * Returns the value of the specified property.
   *
   * @param {*} target - The target object.
   * @param {string} name - The property name.
   * @returns {*} The value of the specified property.
   */
    get (target, name) {
      if (!Object.hasOwn(baseEnum, name)) {
        throw new Error(`"${name}" value does not exist in the enum.`)
      }
      return baseEnum[name]
    },
    /**
     * Sets the value of the specified property.
     *
     */
    set () {
      throw new Error('Cannot add a new value to the enum.')
    }
  })
}
