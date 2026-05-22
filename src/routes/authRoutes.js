const express = require('express');
const { validate } = require('../middleware/validate');
const authController = require('../controllers/authController');

const router = express.Router();

router.get('/health', authController.health);
router.post('/register', validate(authController.registerSchema), authController.register);
router.post('/login', validate(authController.loginSchema), authController.login);
router.post('/refresh', validate(authController.refreshSchema), authController.refresh);
router.post('/logout', validate(authController.refreshSchema), authController.logout);
router.get('/verify', authController.verify);

module.exports = router;
