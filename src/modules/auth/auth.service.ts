import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User, type IUser } from "@/modules/users/user.model";
import { RefreshToken } from "@/modules/auth/refreshToken.model";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "@/utils/tokens";
import { AppError } from "@/utils/AppError";
import { env } from "@/config/env";
import { sendVerificationEmail } from "@/services/email.service";
import type { RegisterInput, LoginInput } from "@/modules/auth/auth.validation";

const SALT_ROUNDS = 12;

function parseExpiryToMs(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const [, value, unit] = match;
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60000,
    h: 3600000,
    d: 86400000,
  };
  return Number(value) * multipliers[unit];
}

async function issueTokens(user: IUser) {
  const accessToken = signAccessToken({
    id: user._id.toString(),
    role: user.role,
  });
  const refreshToken = signRefreshToken(user._id.toString());

  await RefreshToken.create({
    user: user._id,
    token: refreshToken,
    expiresAt: new Date(
      Date.now() + parseExpiryToMs(env.JWT_REFRESH_EXPIRES_IN),
    ),
  });

  return { accessToken, refreshToken };
}

function generateEmailVerificationToken(userId: string): string {
  return jwt.sign(
    { id: userId, purpose: "email_verify" },
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: "24h",
    },
  );
}

async function sendVerificationEmailToUser(user: IUser) {
  const token = generateEmailVerificationToken(user._id.toString());
  const verifyUrl = `${env.CLIENT_URL[0]}/verify-email?token=${token}`;
  try {
    await sendVerificationEmail(user.email, verifyUrl);
  } catch (error) {
    // Ne obaraj registraciju ako slanje email-a padne — korisnik i dalje može
    // da koristi nalog, samo bez verifikacije za sada (može zatražiti ponovno slanje)
    console.error("Failed to send verification email:", error);
  }
}

export async function registerUser(
  input: RegisterInput,
  avatarFile?: Express.Multer.File,
) {
  const existing = await User.findOne({ email: input.email });
  if (existing) {
    throw new AppError("An account with this email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await User.create({
    name: input.name,
    email: input.email,
    passwordHash,
    role: input.role,
    avatarUrl: avatarFile ? avatarFile.path : undefined,
  });

  await sendVerificationEmailToUser(user);

  const tokens = await issueTokens(user);
  return { user, ...tokens };
}

export async function loginUser(input: LoginInput) {
  const user = await User.findOne({ email: input.email }).select(
    "+passwordHash",
  );
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isMatch = await bcrypt.compare(input.password, user.passwordHash);
  if (!isMatch) {
    throw new AppError("Invalid email or password", 401);
  }

  const tokens = await issueTokens(user);
  return { user, ...tokens };
}

export async function verifyEmail(token: string) {
  let payload: { id: string; purpose: string };
  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
      id: string;
      purpose: string;
    };
  } catch {
    throw new AppError("Verification link is invalid or has expired", 400);
  }

  if (payload.purpose !== "email_verify") {
    throw new AppError("Invalid verification token", 400);
  }

  const user = await User.findById(payload.id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  if (user.emailVerified) {
    return user; // već verifikovan, tretiraj kao uspeh (idempotentno)
  }

  user.emailVerified = true;
  await user.save();
  return user;
}

export async function resendVerificationEmail(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  if (user.emailVerified) {
    throw new AppError("Email is already verified", 400);
  }
  await sendVerificationEmailToUser(user);
}

export async function refreshTokens(oldToken: string) {
  const payload = verifyRefreshToken(oldToken).id
    ? verifyRefreshToken(oldToken)
    : null;

  if (!payload) {
    throw new AppError("Invalid refresh token", 401);
  }

  const stored = await RefreshToken.findOne({
    token: oldToken,
    revoked: false,
  });
  if (!stored) {
    throw new AppError("Refresh token not recognized or already used", 401);
  }

  stored.revoked = true;
  await stored.save();

  const user = await User.findById(payload.id);
  if (!user) {
    throw new AppError("User not found", 401);
  }

  return issueTokens(user);
}

export async function logoutUser(token: string) {
  await RefreshToken.updateOne({ token }, { revoked: true });
}

export async function getCurrentUser(userId: string) {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return user;
}

export async function updateProfile(
  userId: string,
  input: { name?: string; avatarUrl?: string },
) {
  const updateQuery =
    input.avatarUrl === undefined && "avatarUrl" in input
      ? { $set: { name: input.name }, $unset: { avatarUrl: "" } }
      : { $set: input };

  const user = await User.findByIdAndUpdate(userId, updateQuery, { new: true });
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return user;
}

export async function changePassword(
  userId: string,
  input: { currentPassword: string; newPassword: string },
) {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const isMatch = await bcrypt.compare(
    input.currentPassword,
    user.passwordHash,
  );
  if (!isMatch) {
    throw new AppError("Current password is incorrect", 401);
  }

  user.passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
  await user.save();

  await RefreshToken.updateMany(
    { user: userId, revoked: false },
    { $set: { revoked: true } },
  );
}
