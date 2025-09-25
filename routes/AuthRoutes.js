import express from 'express';
import passport from 'passport';
import authController from '../controllers/authControllers.js';
import { authenticateToken } from '../jwt.js';

const router = express.Router();

// Email/Password Authentication
router.post('/signup', authController.signup);
router.post('/login', authController.login);

// Google OAuth routes
router.get('/google',
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}?error=oauth_failed` 
  }),
  authController.googleCallback
);

// Protected routes
router.get('/me', authenticateToken, authController.getProfile);
router.post('/logout', authenticateToken, authController.logout);

// Token refresh (optional)
router.post('/refresh', authController.refreshToken);

export default router;