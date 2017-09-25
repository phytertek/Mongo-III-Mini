/* eslint no-confusing-arrow: 0 */
const sendResponse = (body, res) => !body.error
  ? res.json(body)
  : res.status(body.error.status).json(body);

const sendMongoCatchResponse = (error, res) => sendResponse({
  error: {
    status: 422,
    message: error.message
  }
}, res);

module.exports = {
  sendResponse,
  sendMongoCatchResponse
};

