const ExcelJS = require('exceljs');
const { getTableData } = require('./tableData');

const TABLE_COLUMNS = [
  'Region',
  'Province',
  'BEIS School ID',
  'Schedule',
  'Calendar Status',
  'Start Time',
  'End Time',
  'Installation Status',
  'Starlink Status',
  'Approval',
  'Final Status',
  'Validated?',
  'Blocker'
];

async function buildReportWorkbook(filters) {
  const { rows, stats } = await getTableData(filters);

  const workbook = new ExcelJS.Workbook();

  // Table sheet
  const wsTable = workbook.addWorksheet('Table');
  wsTable.columns = TABLE_COLUMNS.map((key) => ({
    header: key,
    key,
    width: 20
  }));

  rows.forEach((row) => {
    const data = {};
    TABLE_COLUMNS.forEach((key) => {
      data[key] = row[key];
    });
    wsTable.addRow(data);
  });

  // Simple stats sheet
  const wsStats = workbook.addWorksheet('Stats');
  wsStats.columns = [
    { header: 'Metric', key: 'metric', width: 35 },
    { header: 'Value', key: 'value', width: 15 }
  ];

  if (stats && stats.active) {
    const metrics = [
      ['Starlink Activated', stats.star_activated],
      ['Starlink Not Activated', stats.star_not_activated],
      ['Approval Accepted', stats.approval_accepted],
      ['Approval Pending/Blank', stats.approval_pending],
      ['Approval Decline/Other', stats.approval_decline],
      ['Calendar Sent', stats.calendar_sent],
      ['Calendar Invite Not Sent', stats.calendar_not_sent],
      ['S1 Success', stats.s1_success],
      ['Scheduled (non-empty schedule)', stats.scheduled],
      ['Unscheduled', stats.unscheduled],
      ['S1 vs Scheduled (%)', stats.s1_vs_scheduled_pct]
    ];
    metrics.forEach(([metric, value]) => {
      wsStats.addRow({ metric, value });
    });
  }

  return workbook;
}

module.exports = {
  buildReportWorkbook
};

