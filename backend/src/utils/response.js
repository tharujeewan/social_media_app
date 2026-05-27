/**
 * Standardised JSON response helpers.
 */

/**
 * Send a successful JSON response.
 * @param {import('express').Response} res
 * @param {Object} options
 * @param {*} [options.data]
 * @param {string} [options.message='Success']
 * @param {number} [options.statusCode=200]
 */
function success(res, { data, message = 'Success', statusCode = 200 } = {}) {
  return res.status(statusCode).json({
    success: true,
    message,
    data: data ?? null,
  });
}

/**
 * Send an error JSON response.
 * @param {import('express').Response} res
 * @param {Object} options
 * @param {string} [options.message='An error occurred']
 * @param {number} [options.statusCode=500]
 * @param {Array|Object} [options.errors]
 */
function error(res, { message = 'An error occurred', statusCode = 500, errors } = {}) {
  const payload = {
    success: false,
    error: {
      message,
    },
  };

  if (errors !== undefined) {
    payload.error.errors = errors;
  }

  return res.status(statusCode).json(payload);
}

module.exports = {
  success,
  error,
};
