const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { getTableData } = require('./tableData');
const { buildReportWorkbook } = require('./report');
const { refreshUatStatus, getUatStatusByBeis } = require('./googleDrive');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());

// Kick off periodic refresh of UAT Form status from Google Drive (hourly).
(async () => {
  await refreshUatStatus();
  const ONE_HOUR = 60 * 60 * 1000;
  setInterval(() => {
    refreshUatStatus();
  }, ONE_HOUR);
})();

function buildFiltersFromRequest(req) {
  return {
    region: req.query.region || '',
    schedule: req.query.schedule || '',
    installation: req.query.installation || '',
    approval: req.query.approval || '',
    star: req.query.star || '',
    calendar: req.query.calendar || '',
    uat: req.query.uat || '',
    outcome: req.query.outcome || '',
    tile: req.query.tile || '',
    lot: req.query.lot || '',
    final: req.query.final || '',
    validated: req.query.validated || '',
    includeUnscheduled: req.query.full === '1',
    search: req.query.search || ''
  };
}

app.get('/api/dashboard', async (req, res) => {
  try {
    const filters = buildFiltersFromRequest(req);
    const data = await getTableData(filters);
    res.json({
      ...data,
      lastUpdated: new Date().toISOString()
    });
  } catch (err) {
    console.error('Error in /api/dashboard', err);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

app.get('/api/report', async (req, res) => {
  try {
    const filters = buildFiltersFromRequest(req);
    const columns = req.query.column;
    const workbook = await buildReportWorkbook(filters, columns);

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const stamp = [
      now.getFullYear(),
      pad(now.getMonth() + 1),
      pad(now.getDate())
    ].join('') + '-' + pad(now.getHours()) + pad(now.getMinutes());

    const filename = `monitoring-report-${stamp}.xlsx`;

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('Error in /api/report', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// Force-refresh UAT Form status from Google Drive (manual trigger)
app.post('/api/uat/refresh', async (req, res) => {
  try {
    await refreshUatStatus();
    const map = getUatStatusByBeis();
    res.json({ status: 'ok', count: map.size });
  } catch (err) {
    console.error('Error in /api/uat/refresh', err);
    res.status(500).json({ error: 'Failed to refresh UAT status' });
  }
});

// Health endpoint for Render
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Monitoring Phase-2 API' });
});

// Serve React build (client/dist) for all non-API routes
const clientBuildPath = path.join(__dirname, '..', '..', 'client', 'dist');
const hasClientBuild = fs.existsSync(path.join(clientBuildPath, 'index.html'));

if (hasClientBuild) {
  app.use(express.static(clientBuildPath));

  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.status(503).send(
      'Client build not found. Run the Vite dev server with "npm run client" or build the frontend with "npm --workspace client run build".'
    );
  });
}

app.listen(PORT, () => {
  console.log(`Monitoring Phase-2 API listening on http://localhost:${PORT}`);
});
