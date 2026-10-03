const { Router } = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const authenticate        = require('../middleware/authenticate');
const authorize           = require('../middleware/authorize');

const router = Router();

router.use(authenticate);

/**
 * GET /api/v1/dashboard
 * Returns role-aware summary stats.
 * Accessible by all roles — content differs per role.
 */
router.get(
  '/',
  authorize('Administrator', 'Class Advisor', 'Subject Teacher'),
  dashboardController.getDashboard,
);

module.exports = router;
