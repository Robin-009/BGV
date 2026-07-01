const usersService = require('./users.service');
const { success, paginated } = require('../../utils/response');
const { listUsersQuerySchema } = require('./users.validation');

const list = async (req, res, next) => {
  try {
    const query = listUsersQuerySchema.parse(req.query);
    const { users, meta } = await usersService.listUsers({ tenantId: req.tenantId, ...query });
    paginated(res, users, meta);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const user = await usersService.getUserById(req.params.id, req.tenantId);
    success(res, user);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const user = await usersService.createUser({ tenantId: req.tenantId, ...req.body });
    success(res, user, 'User created successfully', 201);
  } catch (err) {
    next(err);
  }
};

const getByEmail = async (req, res, next) => {
  try {
    const user = await usersService.getUserByEmail(req.params.email, req.tenantId);
    success(res, user);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const user = await usersService.updateUser(req.params.id, req.tenantId, req.body);
    success(res, user, 'User updated successfully');
  } catch (err) {
    next(err);
  }
};

const deactivate = async (req, res, next) => {
  try {
    const result = await usersService.deactivateUser(req.params.id, req.tenantId);
    success(res, result, 'User deactivated');
  } catch (err) {
    next(err);
  }
};

const toggleStatus = async (req, res, next) => {
  try {
    const result = await usersService.toggleUserStatus(req.params.id, req.tenantId);
    success(res, result, `User ${result.isActive ? 'activated' : 'deactivated'}`);
  } catch (err) {
    next(err);
  }
};

module.exports = { list, getById, getByEmail, create, update, deactivate, toggleStatus };
