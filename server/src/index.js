const express = require('express');
const cors = require('cors');
const path = require('path');
const { getTableData } = require('./tableData');
const { buildReportWorkbook } = require('./report');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());

function buildFiltersFromRequest(req) {
  return {
    region: req.query.region || '',
    schedule: req.query.schedule || '',
    installation: req.query.installation || '',
    star: req.query.star || '',
    calendar: req.query.calendar || '',
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
    const workbook = await buildReportWorkbook(filters);

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

// Health endpoint for Render
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Monitoring Phase-2 API' });
});

// Serve React build (client/dist) for all non-API routes
const clientBuildPath = path.join(__dirname, '..', '..', 'client', 'dist');
app.use(express.static(clientBuildPath));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Monitoring Phase-2 API listening on http://localhost:${PORT}`);
});
