import { v4 as uuidv4 } from 'uuid';

// In-memory user store (replace with database in production)
class UserStore {
  constructor() {
    this.users = new Map();
    this.emailIndex = new Map();
    this.googleIdIndex = new Map();
  }

  create(userData) {
    const user = {
      id: uuidv4(),
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.users.set(user.id, user);
    this.emailIndex.set(user.email, user.id);
    
    if (user.googleId) {
      this.googleIdIndex.set(user.googleId, user.id);
    }

    return { ...user, password: undefined }; // Don't return password
  }

  findById(id) {
    const user = this.users.get(id);
    return user ? { ...user, password: undefined } : null;
  }

  findByEmail(email) {
    const userId = this.emailIndex.get(email);
    return userId ? this.users.get(userId) : null;
  }

  findByGoogleId(googleId) {
    const userId = this.googleIdIndex.get(googleId);
    return userId ? { ...this.users.get(userId), password: undefined } : null;
  }

  update(id, userData) {
    const user = this.users.get(id);
    if (!user) return null;

    const updatedUser = {
      ...user,
      ...userData,
      updatedAt: new Date()
    };

    this.users.set(id, updatedUser);
    
    // Update indexes if needed
    if (userData.googleId && !user.googleId) {
      this.googleIdIndex.set(userData.googleId, id);
    }

    return { ...updatedUser, password: undefined };
  }

  delete(id) {
    const user = this.users.get(id);
    if (!user) return false;

    this.users.delete(id);
    this.emailIndex.delete(user.email);
    
    if (user.googleId) {
      this.googleIdIndex.delete(user.googleId);
    }

    return true;
  }

  // For development/testing
  getAllUsers() {
    return Array.from(this.users.values()).map(user => ({ ...user, password: undefined }));
  }

  clear() {
    this.users.clear();
    this.emailIndex.clear();
    this.googleIdIndex.clear();
  }
}

// Create singleton instance
const userStore = new UserStore();

class User {
  static create(userData) {
    return userStore.create(userData);
  }

  static findById(id) {
    return userStore.findById(id);
  }

  static findByEmail(email) {
    return userStore.findByEmail(email);
  }

  static findByGoogleId(googleId) {
    return userStore.findByGoogleId(googleId);
  }

  static update(id, userData) {
    return userStore.update(id, userData);
  }

  static delete(id) {
    return userStore.delete(id);
  }

  static getAll() {
    return userStore.getAllUsers();
  }

  static clear() {
    return userStore.clear();
  }
}

export default User;