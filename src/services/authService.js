const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');
const { AppError } = require('../lib/errors');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev-access-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const REFRESH_EXPIRES_DAYS = parseInt(process.env.JWT_REFRESH_EXPIRES_DAYS || '7', 10);

function signAccessToken(userId, email) {
  return jwt.sign({ sub: userId, email }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}

function signRefreshToken(userId) {
  return jwt.sign({ sub: userId }, REFRESH_SECRET, { expiresIn: `${REFRESH_EXPIRES_DAYS}d` });
}

function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET);
}

async function register({ email, password }) {
  const existing = await prisma.userCredential.findUnique({ where: { email } });
  if (existing) {
    throw new AppError('Email already registered', 409, 'EMAIL_EXISTS');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.userCredential.create({
    data: { email, passwordHash },
  });

  const tokens = await issueTokens(user.id, user.email);
  return { user: { id: user.id, email: user.email }, ...tokens };
}

async function login({ email, password }) {
  const user = await prisma.userCredential.findUnique({ where: { email } });
  if (!user) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
  }

  const tokens = await issueTokens(user.id, user.email);
  return { user: { id: user.id, email: user.email }, ...tokens };
}

async function issueTokens(userId, email) {
  const accessToken = signAccessToken(userId, email);
  const refreshToken = signRefreshToken(userId);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_EXPIRES_DAYS);

  await prisma.refreshToken.create({
    data: { token: refreshToken, userId, expiresAt },
  });

  return { accessToken, refreshToken };
}

async function refresh(refreshToken) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new AppError('Invalid refresh token', 401, 'INVALID_TOKEN');
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError('Refresh token expired', 401, 'TOKEN_EXPIRED');
  }

  const user = await prisma.userCredential.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  await prisma.refreshToken.delete({ where: { id: stored.id } });
  return issueTokens(user.id, user.email);
}

async function logout(refreshToken) {
  await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  return { success: true };
}

async function verifyToken(accessToken) {
  try {
    const payload = verifyAccessToken(accessToken);
    return { valid: true, userId: payload.sub, email: payload.email };
  } catch {
    throw new AppError('Invalid or expired token', 401, 'INVALID_TOKEN');
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  verifyToken,
  verifyAccessToken,
};
