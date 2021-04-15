const jwt = require('jsonwebtoken');
const userDB = require('../models/user');
const { secret } = require('../utils/index');

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if not token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    jwt.verify(token, secret, async (error, decoded)=>{
      if(error) {
        next(error);
      } else{
        const { _id } = decoded;
        const user = await userDB.findOne({ _id });
        if (!user)
          throw new Error('UnAuthorized Access');
        if ((user.tokens.filter(t => t === token)).length === 0)
          throw new Error('Invalid Token');
        req.user = _id;
        next();
      }
    });
  } catch (err) {
    next(err);
  }
};
