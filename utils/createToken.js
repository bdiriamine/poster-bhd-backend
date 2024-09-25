const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config({ path: 'config.env' }); 
const createToken = (payload) => {
  const secretKey = process.env.JWT_SECRET_KEY || 'poster-xxxl-bhd'; 
  return jwt.sign({ userId: payload }, secretKey, {
      expiresIn: process.env.JWT_EXPIRE_TIME || '3h',
  });
};
module.exports = createToken;
