const Joi = require('joi');
const { ValidationError } = require('../constants/errors');

/**
 * Create a middleware that validates request data against Joi schemas.
 *
 * Supports two calling conventions:
 *
 * 1. **Legacy** (single source):
 *    `validate(schema, source)` — validates `req[source]` (default: 'body').
 *
 * 2. **Multi-source** (object map):
 *    `validate({ body: bodySchema, params: paramsSchema, query: querySchema })`
 *    — validates each specified source in a single middleware.
 *
 * Options applied to every schema:
 * - `abortEarly: false`  — collect all validation errors at once.
 * - `stripUnknown: true`  — silently remove unexpected keys.
 *
 * On failure: passes a `ValidationError` with structured details to `next()`.
 * On success: replaces `req[source]` with the validated (and stripped) value.
 *
 * @param {Joi.ObjectSchema|Object<string, Joi.ObjectSchema>} schemaOrMap
 * @param {string} [source='body'] — only used with the legacy signature.
 * @returns {import('express').RequestHandler}
 */
function validate(schemaOrMap, source = 'body') {
  // ── Detect calling convention ──────────────────────────────────
  // If the first argument has a `.validate` method it is a Joi schema (legacy).
  // Otherwise treat it as a { body?, params?, query? } map.
  const isJoiSchema =
    schemaOrMap && typeof schemaOrMap.validate === 'function';

  if (isJoiSchema) {
    // Legacy: validate(schema, source)
    return _validateSingle(schemaOrMap, source);
  }

  // Multi-source: validate({ body, params, query })
  return _validateMultiple(schemaOrMap);
}

// ─── Internal helpers ──────────────────────────────────────────────

/**
 * Validate a single request source against a Joi schema.
 */
function _validateSingle(schema, source) {
  return (req, _res, next) => {
    const data = req[source];

    if (data === undefined) {
      return next(new ValidationError(`Request ${source} is missing`));
    }

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      return next(_buildValidationError(error));
    }

    // Replace the raw input with the validated (and stripped) value
    req[source] = value;
    next();
  };
}

/**
 * Validate multiple request sources against a map of Joi schemas.
 */
function _validateMultiple(schemaMap) {
  return (req, _res, next) => {
    const allDetails = [];

    for (const [source, schema] of Object.entries(schemaMap)) {
      if (!schema) continue;

      const data = req[source];

      if (data === undefined) {
        allDetails.push({
          field: source,
          message: `Request ${source} is missing`,
        });
        continue;
      }

      const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const details = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message,
        }));
        allDetails.push(...details);
      } else {
        // Replace with validated value
        req[source] = value;
      }
    }

    if (allDetails.length > 0) {
      const err = new ValidationError('Validation failed');
      err.details = allDetails;
      return next(err);
    }

    next();
  };
}

/**
 * Build a ValidationError from a Joi error.
 */
function _buildValidationError(joiError) {
  const details = joiError.details.map((detail) => ({
    field: detail.path.join('.'),
    message: detail.message,
  }));

  const err = new ValidationError('Validation failed');
  err.details = details;
  return err;
}

module.exports = validate;
