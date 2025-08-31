import createHttpError from "http-errors";

export const validateBody = (schemaOrFields) => {
  return (req, res, next) => {
    try {
      // режим 1: список обов'язкових полів
      if (Array.isArray(schemaOrFields)) {
        for (const field of schemaOrFields) {
          const v = req.body[field];
          if (v === undefined || v === null || v === "") {
            throw createHttpError(400, `Missing required field: ${field}`);
          }
        }
        return next();
      }

      // режим 2: Joi-схема
      const { error, value } = schemaOrFields.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const message = error.details.map((d) => d.message).join(", ");
        throw createHttpError(400, message);
      }

      req.body = value; // після stripUnknown
      next();
    } catch (err) {
      next(err);
    }
  };
};
