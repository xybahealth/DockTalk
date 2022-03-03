const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../configs/secrets');

module.exports = function (req, res, next) {
  var token;
  if (req.header('x-access-token')) token = req.header('x-access-token');
  if (req.header('x-auth-token')) token = req.header('x-auth-token');
  if (!token) {
    return res.json({ msg: 'no token, authorization denied' });
  }
  console.log(token);

  jwt.verify(token, jwtSecret, function (error, user) {
    if (error)
      return res.json({
        msg: 'Error ',
        error: error,
      });
    if (user) {
      req.user = user;

      next();
    }
  });
};
