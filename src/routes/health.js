const { Router } = require('express');
const { version } = require('../../package.json');

const router = Router();

/**
 * GET /api/v1/health
 * Public health-check endpoint.
 * Returns the service status, version, and current timestamp.
 */
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      service: 'DAS API',
      version,
      timestamp: new Date().toISOString(),
    },
  });
});

module.exports = router;
