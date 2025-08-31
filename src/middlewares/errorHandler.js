export default (err, req, res, next) => {
  res.status(err.status || 500).json({
    status: err.status || 500,
    message: "Something went wrong",
    data: err.message,
  });
};
