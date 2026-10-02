function errorResponse(res, statusCode, message, errorCode, details = null) {
  const response = {
    success: false,
    message,
    errorCode,
  };
  if (details) {
    response.details = details;
  }
  return res.status(statusCode).json(response);
}

function successResponse(res, data, statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    ...data,
  });
}

module.exports = { errorResponse, successResponse };
