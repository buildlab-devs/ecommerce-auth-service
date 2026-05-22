const { z } = require('zod');
const authService = require('../services/authService');

const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1),
  }),
});

async function register(req, res, next) {
  try {
    const { body } = req.validated;
    const result = await authService.register(body);
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { body } = req.validated;
    const result = await authService.login(body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { body } = req.validated;
    const result = await authService.refresh(body.refreshToken);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const { body } = req.validated;
    const result = await authService.logout(body.refreshToken);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function verify(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Missing token' },
      });
    }
    const token = authHeader.slice(7);
    const result = await authService.verifyToken(token);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function health(_req, res) {
  res.json({ success: true, service: 'auth-service', status: 'ok' });
}

module.exports = {
  registerSchema,
  loginSchema,
  refreshSchema,
  register,
  login,
  refresh,
  logout,
  verify,
  health,
};
