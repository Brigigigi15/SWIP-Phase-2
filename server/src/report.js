const ExcelJS = require('exceljs');
const { getTableData } = require('./tableData');

const DEFAULT_TABLE_COLUMNS = [
  'Region',
  'Province',
  'BEIS School ID',
  'Schedule',
  'Calendar Status',
  'Start Time',
  'End Time',
  'Installation Status',
  'Tp-link PHASE II',
  'Approval (Accepted / Decline)'
];

function normalizeReportColumns(columns, rows) {
  const requestedColumns = Array.isArray(columns)
    ? columns
    : columns
    ? [columns]
    : [];
  const rowKeys = rows[0] ? new Set(Object.keys(rows[0])) : new Set(DEFAULT_TABLE_COLUMNS);
  const validRequestedColumns = requestedColumns.filter((column) => rowKeys.has(column));

  return validRequestedColumns.length ? validRequestedColumns : DEFAULT_TABLE_COLUMNS;
}

async function buildReportWorkbook(filters, columns) {
  const { rows } = await getTableData(filters);
  const reportColumns = normalizeReportColumns(columns, rows);

  const workbook = new ExcelJS.Workbook();
  const wsTable = workbook.addWorksheet('Table');
  wsTable.columns = reportColumns.map((key) => ({
    header: key,
    key,
    width: 20
  }));
  wsTable.getRow(1).font = { bold: true };

  rows.forEach((row) => {
    const data = {};
    reportColumns.forEach((key) => {
      data[key] = row[key];
    });
    wsTable.addRow(data);
  });

  return workbook;
}

module.exports = {
  buildReportWorkbook
};
