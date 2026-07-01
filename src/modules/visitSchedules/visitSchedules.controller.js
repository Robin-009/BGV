const svc = require('./visitSchedules.service');
const { success, paginated } = require('../../utils/response');

const create = async (req, res, next) => {
  try {
    const data = await svc.createSchedule(req.tenantId, req.body);
    success(res, data, 'Visit schedule created', 201);
  } catch (e) { next(e); }
};

const list = async (req, res, next) => {
  try {
    const { schedules, meta } = await svc.listSchedules(req.tenantId, req.query);
    paginated(res, schedules, meta);
  } catch (e) { next(e); }
};

const get = async (req, res, next) => {
  try {
    const data = await svc.getSchedule(req.params.id, req.tenantId);
    success(res, data);
  } catch (e) { next(e); }
};

const update = async (req, res, next) => {
  try {
    const data = await svc.updateSchedule(req.params.id, req.tenantId, req.body);
    success(res, data);
  } catch (e) { next(e); }
};

const remove = async (req, res, next) => {
  try {
    await svc.deleteSchedule(req.params.id, req.tenantId);
    success(res, null, 'Visit schedule deleted');
  } catch (e) { next(e); }
};

const updateDoc = async (req, res, next) => {
  try {
    const data = await svc.updateScheduleDoc(req.params.id, req.params.docId, req.tenantId, req.body);
    success(res, data);
  } catch (e) { next(e); }
};

module.exports = { create, list, get, update, remove, updateDoc };
