// const express = require('express');
// const { register, login } = require('../controllers/authController');

// const router = express.Router();

// router.post('/register', (req, res, next) => {
//   console.log('POST /api/auth/register');
//   next();
// }, register);

// router.post('/login', (req, res, next) => {
//   console.log('POST /api/auth/login');
//   next();
// }, login);

// module.exports = router;

const express = require('express');
const { login, register, refreshToken, checkToken  } = require('../controllers/authController');
const router = express.Router();

router.post('/login', (req, res, next) => {
    console.log('Login route hit, body:', req.body);
    if (!req.body || !req.body.emailOrUsername) {
      return res.status(400).json({ error: 'Email or username is required' });
    }
    next();
  }, login);
router.post('/register', register);
router.post('/refresh', refreshToken);
router.get('/check-token', checkToken);

module.exports = router;

