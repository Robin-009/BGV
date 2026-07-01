const fieldVisitsService = require('./fieldVisits.service');
const { success } = require('../../utils/response');

const createForAssignment = async (req, res, next) => {
  try {
    const visit = await fieldVisitsService.createVisit(
      req.params.assignmentId, req.tenantId, req.body
    );
    success(res, visit, 'Field visit started', 201);
  } catch (err) {
    next(err);
  }
};

const listForAssignment = async (req, res, next) => {
  try {
    const visits = await fieldVisitsService.listVisitsByAssignment(
      req.params.assignmentId, req.tenantId
    );
    success(res, visits);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const visit = await fieldVisitsService.getVisit(req.params.id, req.tenantId);
    success(res, visit);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const visit = await fieldVisitsService.updateVisit(req.params.id, req.tenantId, req.body);
    success(res, visit, 'Field visit updated');
  } catch (err) {
    next(err);
  }
};

const uploadEvidence = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }
    const uploadedById = req.body.uploadedById ?? null;
    const saved = await fieldVisitsService.uploadEvidence(
      req.params.id, req.tenantId, req.files, uploadedById
    );
    success(res, saved, `${saved.length} evidence file(s) uploaded`, 201);
  } catch (err) {
    next(err);
  }
};

const listEvidence = async (req, res, next) => {
  try {
    const files = await fieldVisitsService.listEvidence(req.params.id, req.tenantId);
    success(res, files);
  } catch (err) {
    next(err);
  }
};

module.exports = { createForAssignment, listForAssignment, getById, update, uploadEvidence, listEvidence };
