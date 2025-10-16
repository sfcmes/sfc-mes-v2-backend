const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const jwtVerify = promisify(jwt.verify);

const auth = async (req, res, next) => {
    console.log('Auth middleware reached');
    console.log('Headers:', req.headers);

    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
    if (!token) {
        console.log('No token provided, continuing as public request');
        req.user = null; // Set user to null for public routes
        return next();
    }

    try {
        const decoded = await jwtVerify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log('Authenticated user:', req.user);
        next();
    } catch (err) {
        console.error('Token verification failed:', err);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token has expired' });
        }
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = auth;