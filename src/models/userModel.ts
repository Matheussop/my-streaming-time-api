import mongoose, { Schema, Document, Model } from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { IUserResponse } from '../interfaces/user';

interface IUserSchema extends Document, IUserResponse {
  _id: string;
  password: string;
  correctPassword(candidatePassword: string): Promise<boolean>;
  changedPasswordAfter(JWTTimestamp: number): boolean;
  createPasswordResetToken(): string;
  createVerificationToken(): string;
  passwordConfirm?: string;
  verificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  passwordChangedAt?: Date;
}

interface IUserMethods {
  correctPassword(candidatePassword: string, userPassword: string): Promise<boolean>;
  changedPasswordAfter(JWTTimestamp: number): boolean;
  createPasswordResetToken(): string;
  createVerificationToken(): string;
}

export interface IUserModel extends Model<IUserSchema, {}, IUserMethods> {
  findByEmail(email: string): Promise<IUserResponse | null>;
  findByLogin: (login: string) => Promise<IUserResponse | null>;
  updateWatchStats: (userId: string, contentType: 'movie' | 'episode', durationInMinutes: number) => Promise<void>;
}

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

const userSchema = new Schema<IUserSchema, IUserModel, IUserMethods>(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [20, 'Username cannot be more than 20 characters long'],
      validate: {
        validator: function(value: string) {
          return /^[a-zA-Z0-9_]+$/.test(value);
        },
        message: 'Username can only contain letters, numbers, and underscores',
      },
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      validate: [isValidEmail, 'Please provide a valid email'],
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'moderator'],
      default: 'user',
    },
    profilePicture: {
      type: String,
      default: "",
    },
    preferences: {
      favoriteGenres: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Genre',
      }],
      contentMaturity: {
        type: String,
        enum: ['G', 'PG', 'PG-13', 'R', 'NC-17', 'All'],
        default: 'All',
      },
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      pushNotifications: {
        type: Boolean,
        default: true,
      },
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system',
      },
      language: {
        type: String,
        default: 'en',
      },
    },
    stats: {
      totalWatchTimeInMinutes: {
        type: Number,
        default: 0,
      },
      moviesWatched: {
        type: Number,
        default: 0,
      },
      episodesWatched: {
        type: Number,
        default: 0,
      },
      seriesCompleted: {
        type: Number,
        default: 0,
      },
      lastActive: {
        type: Date,
        default: Date.now,
      },
      joinDate: {
        type: Date,
        default: Date.now,
      },
      favoriteStreamingType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StreamingType',
      },
    },
    watchList: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content',
    }]
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        delete ret.__v;
        delete ret.password;
        delete ret.passwordConfirm;
        delete ret.passwordChangedAt;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.verificationToken;
        return ret;
      },
    },
  },
);

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'preferences.favoriteGenres': 1 });
userSchema.index({ 'stats.lastActive': -1 });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  
  this.passwordConfirm = undefined;
  
  next();
});


userSchema.pre(/^find/, function(this: any, next) {
  this.find({ active: { $ne: false } });
  next();
});

userSchema.static('findByEmail', function (email: string) {
  return this.findOne({ email: new RegExp(email, 'i') });
});

userSchema.methods.correctPassword = async function(
  candidatePassword: string,
  userPassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp: number): boolean {
  if (this.passwordChangedAt) {
    const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
    return JWTTimestamp < changedTimestamp;
  }
  
  return false;
};

userSchema.methods.createPasswordResetToken = function(): string {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  // Define a expiração para 10 minutos
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
  
  return resetToken;
};

// Método para criar um token de verificação de email
userSchema.methods.createVerificationToken = function(): string {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  this.verificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  
  return verificationToken;
};

userSchema.static('findByLogin', async function(login: string): Promise<IUserResponse | null> {
  return this.findOne({
    $or: [
      { email: login.toLowerCase() },
      { username: login }
    ]
  });
});

// Move updateWatchStats to a static method instead of an instance method
userSchema.static('updateWatchStats', async function(
  userId: string,
  contentType: 'movie' | 'episode',
  durationInMinutes: number
): Promise<void> {
  const updateObj: any = {
    $inc: {
      'stats.totalWatchTimeInMinutes': durationInMinutes
    },
    $set: {
      'stats.lastActive': new Date()
    }
  };
  
  if (contentType === 'movie') {
    updateObj.$inc['stats.moviesWatched'] = 1;
  } else if (contentType === 'episode') {
    updateObj.$inc['stats.episodesWatched'] = 1;
  }
  
  await this.findByIdAndUpdate(userId, updateObj);
});

const User = mongoose.model<IUserSchema, IUserModel>('User', userSchema);

export default User;
