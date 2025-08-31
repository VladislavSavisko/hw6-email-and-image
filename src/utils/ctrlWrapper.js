export default (ctrl) => {
  return (req, res, next) => {
    Promise.resolve(ctrl(req, res, next)).catch(next);
  };
};
