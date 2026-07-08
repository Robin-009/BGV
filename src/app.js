const path    = require('path');
const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const morgan  = require('morgan');

const { errorHandler } = require('./middlewares/error.middleware');
const authRoutes             = require('./modules/auth/auth.routes');
const tenantsRoutes          = require('./modules/tenants/tenants.routes');
const usersRoutes            = require('./modules/users/users.routes');
const casesRoutes            = require('./modules/cases/cases.routes');
const fieldAssignmentsRoutes = require('./modules/fieldAssignments/fieldAssignments.routes');
const fieldVisitsRoutes      = require('./modules/fieldVisits/fieldVisits.routes');
const visitSchedulesRoutes   = require('./modules/visitSchedules/visitSchedules.routes');
const reportsRoutes          = require('./modules/reports/reports.routes');
const ocrRoutes              = require('./modules/ocr/ocr.routes');

const UPLOAD_ROOT = process.env.UPLOAD_ROOT || 'uploads';

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files locally (dev only — in prod these come from S3)
app.use(`/${UPLOAD_ROOT}`, express.static(path.join(process.cwd(), UPLOAD_ROOT)));

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/v1/auth',              authRoutes);
app.use('/api/v1/tenants',           tenantsRoutes);
app.use('/api/v1/users',            usersRoutes);
app.use('/api/v1/cases',            casesRoutes);
app.use('/api/v1/field-assignments',  fieldAssignmentsRoutes);
app.use('/api/v1/field-visits',       fieldVisitsRoutes);
app.use('/api/v1/visit-schedules',    visitSchedulesRoutes);
app.use('/api/v1/reports',            reportsRoutes);
app.use('/api/v1',                    ocrRoutes);

app.use(errorHandler);

module.exports = app;
