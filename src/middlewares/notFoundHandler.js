import createHttpError from "http-errors";

export default (req, res, next) => {
  next(createHttpError(404, "Route not found"));
};
