import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import authService from './authService.js';
import dotenv from 'dotenv';
dotenv.config();

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with Google ID
    let user = await authService.findUserByGoogleId(profile.id);
    
    if (user) {
      return done(null, user);
    }

    // Check if user exists with same email
    user = await authService.findUserByEmail(profile.emails[0].value);
    
    if (user) {
      // Update existing user with Google ID
      user = await authService.updateUser(user.id, { googleId: profile.id });
      return done(null, user);
    }

    // Create new user
    user = await authService.createUser({
      email: profile.emails[0].value,
      name: profile.displayName,
      googleId: profile.id
    });

    return done(null, user);
  } catch (error) {
    console.error('Google strategy error:', error);
    return done(error, null);
  }
}));

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await authService.findUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;