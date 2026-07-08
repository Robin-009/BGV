const { Router } = require('express');
const { resolveTenant } = require('../../middlewares/tenant.middleware');
const authService = require('./auth.service');
const { success }  = require('../../utils/response');

const router = Router();

router.post('/login', resolveTenant, async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const user = await authService.login(req.tenantId, email, password);
    success(res, user, 'Login successful');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
