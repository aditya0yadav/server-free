import authService from '../services/authService.js';
import { generateToken, verifyToken } from '../jwt.js';

class AuthController {
  async signup(req, res) {
    try {
      const { email, password, name } = req.body;

      // Validation
      if (!email || !password || !name) {
        return res.status(400).json({
          success: false,
          message: 'Email, password, and name are required'
        });
      }

      // Check if user already exists
      const existingUser = await authService.findUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'User already exists with this email'
        });
      }

      const user = await authService.createUser({ email, password, name });
      
      const token = generateToken({ userId: user.id, email: user.email });

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        token
      });

    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Find user and verify password
      const user = await authService.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const isValidPassword = await authService.verifyPassword(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Generate token
      const token = generateToken({ userId: user.id, email: user.email });

      res.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        token
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

async googleCallback(req, res) {
  try {
    // User is available in req.user from Passport
    const user = req.user;

    // Generate token
    const token = generateToken({ userId: user.id, email: user.email });

    // Redirect to frontend with token + minimal user info (avoid raw JSON)
    const clientUrl = process.env.CLIENT_URL;
    const params = new URLSearchParams({
      token,
      id: user.id,
      email: user.email,
      name: user.name
    });

    res.redirect(`${clientUrl}?${params.toString()}`);

  } catch (error) {
    console.error('Google callback error:', error);
    const clientUrl = process.env.CLIENT_URL;
    res.redirect(`${clientUrl}?error=oauth_failed`);
  }
}


  async getProfile(req, res) {
    try {
      const userId = req.user.userId;
      const user = await authService.findUserById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });

    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async logout(req, res) {
    try {
      // In a real application, you might want to blacklist the token
      // For now, we'll just send a success response
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  async refreshToken(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token is required'
        });
      }

      // Verify the token
      const decoded = verifyToken(token);
      
      // Generate new token
      const newToken = generateToken({ userId: decoded.userId, email: decoded.email });

      res.json({
        success: true,
        token: newToken
      });

    } catch (error) {
      console.error('Refresh token error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }
  }
}

export default new AuthController();