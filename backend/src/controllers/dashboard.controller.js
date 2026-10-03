const dashboardService = require('../services/dashboard.service');

async function getDashboard(req, res, next) {
  try {
    let data;

    switch (req.user.role) {
      case 'Administrator':
        data = await dashboardService.adminDashboard();
        break;
      case 'Class Advisor':
        data = await dashboardService.advisorDashboard(req.user.id);
        break;
      case 'Subject Teacher':
        data = await dashboardService.teacherDashboard(req.user.id);
        break;
      default:
        data = {};
    }

    res.status(200).json({ success: true, data: { dashboard: data } });
  } catch (err) { next(err); }
}

module.exports = { getDashboard };
