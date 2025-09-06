// Type declarations for extending Express Request interface

declare namespace Express {
  interface Request {
    user?: any; // User object from Passport.js authentication
  }
}
