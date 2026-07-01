const svc = require('./fieldAssignments.service');
const { success, paginated } = require('../../utils/response');
const { listAssignmentsQuerySchema } = require('./fieldAssignments.validation');

const listForCase = async (req, res, next) => {
  try {
    const assignments = await svc.listAssignmentsByCase(req.params.caseId, req.tenantId);
    success(res, assignments);
  } catch (err) { next(err); }
};

const createForCase = async (req, res, next) => {
  try {
    const assignment = await svc.createAssignment(req.params.caseId, req.tenantId, req.body);
    success(res, assignment, 'Field assignment created', 201);
  } catch (err) { next(err); }
};

const list = async (req, res, next) => {
  try {
    const query = listAssignmentsQuerySchema.parse(req.query);
    const { assignments, meta } = await svc.listAssignments({ tenantId: req.tenantId, ...query });
    paginated(res, assignments, meta);
  } catch (err) { next(err); }
};

const update = async (req, res, next) => {
  try {
    const assignment = await svc.updateAssignment(req.params.id, req.tenantId, req.body);
    success(res, assignment, 'Assignment updated');
  } catch (err) { next(err); }
};

module.exports = { listForCase, createForCase, list, update };
