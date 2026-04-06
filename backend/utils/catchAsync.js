/**
 * Utility to wrap async express controllers and catch unhandled promise rejections.
 * Eliminates the need for manual try-catch in every controller.
 */
const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;
