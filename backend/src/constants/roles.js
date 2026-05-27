/**
 * Application role definitions.
 */

const ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  MODERATOR: 'MODERATOR',
};

/**
 * All valid role values as an array.
 * @type {string[]}
 */
const ROLE_VALUES = Object.values(ROLES);

/**
 * Check whether a given string is a valid role.
 * @param {string} role
 * @returns {boolean}
 */
function isValidRole(role) {
  return ROLE_VALUES.includes(role);
}

module.exports = {
  ROLES,
  ROLE_VALUES,
  isValidRole,
};
