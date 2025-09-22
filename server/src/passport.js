import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/momentum';
await mongoose.connect(MONGO_URI);

// User model
const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, required: true, unique: true },
    email: { type: String, required: true },
    name: String,
    image: String,
    theme: { type: String, enum: ['light', 'dark'], default: 'light' }
  },
  { timestamps: true }
);
export const User = mongoose.models.User || mongoose.model('User', userSchema);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).lean();
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

if (googleEnabled) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/auth/google/callback'
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value || '';
          const name = profile.displayName || '';
          const image = profile.photos?.[0]?.value || '';

          let user = await User.findOne({ googleId });
          if (!user) {
            user = await User.create({ googleId, email, name, image });
          } else {
            const updates = {};
            if (user.email !== email) updates.email = email;
            if (user.name !== name) updates.name = name;
            if (user.image !== image) updates.image = image;
            if (Object.keys(updates).length) {
              await User.updateOne({ _id: user._id }, { $set: updates });
              user = await User.findById(user._id);
            }
          }
          done(null, user);
        } catch (err) {
          done(err);
        }
      }
    )
  );
} else {
  console.warn('Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
}
