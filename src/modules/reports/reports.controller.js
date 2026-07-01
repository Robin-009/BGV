const svc = require('./reports.service');
const { success, paginated } = require('../../utils/response');

const create = async (req, res, next) => {
  try {
    const tenantId = req.headers['x-tenant-id'];
    const report   = await svc.createReport(tenantId, req.body);
    success(res, report, 'Report created', 201);
  } catch (e) { next(e); }
};

const list = async (req, res, next) => {
  try {
    const tenantId          = req.headers['x-tenant-id'];
    const { rows, total, page, limit } = await svc.listReports(tenantId, req.query);
    paginated(res, rows, { total, page, limit, pages: Math.ceil(total / limit) });
  } catch (e) { next(e); }
};

const getById = async (req, res, next) => {
  try {
    const tenantId = req.headers['x-tenant-id'];
    const report   = await svc.getReport(tenantId, req.params.id);
    success(res, report);
  } catch (e) { next(e); }
};

const getForCase = async (req, res, next) => {
  try {
    const tenantId = req.headers['x-tenant-id'];
    const report   = await svc.getLatestReportForCase(tenantId, req.params.caseId);
    success(res, report);
  } catch (e) { next(e); }
};

const update = async (req, res, next) => {
  try {
    const tenantId = req.headers['x-tenant-id'];
    const report   = await svc.updateReport(tenantId, req.params.id, req.body);
    success(res, report);
  } catch (e) { next(e); }
};

const submitForQc = async (req, res, next) => {
  try {
    const tenantId = req.headers['x-tenant-id'];
    const report   = await svc.submitForQc(tenantId, req.params.id, req.body);
    success(res, report, 'Report submitted for QC');
  } catch (e) { next(e); }
};

const qcDecision = async (req, res, next) => {
  try {
    const tenantId = req.headers['x-tenant-id'];
    const report   = await svc.qcDecision(tenantId, req.params.id, req.body);
    success(res, report, 'QC decision recorded');
  } catch (e) { next(e); }
};

module.exports = { create, list, getById, getForCase, update, submitForQc, qcDecision };
