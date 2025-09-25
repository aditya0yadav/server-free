import bcrypt from 'bcryptjs';
import User from '../models/User.js';

class AuthService {
  async createUser({ email, password, name, googleId = null }) {
    try {
      // Hash password if provided
      let hashedPassword = null;
      if (password) {
        const salt = await bcrypt.genSalt(12);
        hashedPassword = await bcrypt.hash(password, salt);
      }

      const userData = {
        email,
        name,
        password: hashedPassword,
        googleId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const user = await User.create(userData);
      return user;
    } catch (error) {
      console.error('Create user error:', error);
      throw error;
    }
  }

  async findUserByEmail(email) {
    try {
      return await User.findByEmail(email);
    } catch (error) {
      console.error('Find user by email error:', error);
      throw error;
    }
  }

  async findUserById(id) {
    try {
      return await User.findById(id);
    } catch (error) {
      console.error('Find user by id error:', error);
      throw error;
    }
  }

  async findUserByGoogleId(googleId) {
    try {
      return await User.findByGoogleId(googleId);
    } catch (error) {
      console.error('Find user by Google ID error:', error);
      throw error;
    }
  }

  async verifyPassword(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      console.error('Verify password error:', error);
      throw error;
    }
  }

  async updateUser(id, userData) {
    try {
      return await User.update(id, userData);
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  }
}

export default new AuthService();