// const { createSheetsClient } = require('./googleSheets');
// const { getUatStatusByBeis } = require('./googleDrive');

// // Spreadsheet IDs (Starlink activation + main schedule/outcome data)
// const SPREADSHEET_ID_STARLINK = '1XdByRZ3zYX5pfqEoufLXb3qnPTIh2rBmnfl4JzWoEbQ';
// const SPREADSHEET_ID_MAIN = '1N7_h13n87Moh5n666e2OLi8jKwuZU1Ae3-kK69kuX18';

// // Column headers (including embedded newlines) to match the Sheets layout
// const SCHEDULE_COL = 'Schedule of Delivery/\nInstallation\n(Start Date)';
// const SCHEDULE_END_COL = 'Schedule of Delivery/\nInstallation\n(End Date)';
// const OUTCOME_COL = 'Outcome Status \n (to be Accomplished by Supplier)';
// const BLOCKER_COL = 'Blocker \n (to be Accomplished by Supplier)';

// async function loadSheet(spreadsheetId, sheetName) {
//   const sheets = createSheetsClient();
//   const res = await sheets.spreadsheets.values.get({
//     spreadsheetId,
//     range: `'${sheetName}'!A1:ZZ`
//   });
//   const values = res.data.values || [];
//   if (!values.length) {
//     return { header: [], rows: [] };
//   }
//   const [header, ...rows] = values;
//   return { header, rows };
// }

// function normalizeRows(header, rows) {
//   const colsLen = header.length;
//   return rows.map((r) => {
//     const row = r.slice(0, colsLen);
//     while (row.length < colsLen) {
//       row.push('');
//     }
//     return row;
//   });
// }

// async function loadStarlink() {
//   const { header, rows } = await loadSheet(SPREADSHEET_ID_STARLINK, 'Master');
//   if (!header.length) return [];

//   const idx = {
//     beis: header.indexOf('BEIS School ID'),
//     status: header.indexOf('Status of Activation'),
//     approval: header.indexOf('Approval (Accepted / Decline) ')
//   };
//   if (idx.beis === -1 || idx.status === -1 || idx.approval === -1) {
//     return [];
//   }
//   const idxTpLink = header.indexOf('Tp-link PHASE II');

//   const normalized = normalizeRows(header, rows);
//   const result = [];
//   const seen = new Map();

//   for (const r of normalized) {
//     const beis = String(r[idx.beis] || '').trim();
//     if (!beis) continue;
//     const record = {
//       beis,
//       status: String(r[idx.status] || '').trim(),
//       approval: String(r[idx.approval] || '').trim(),
//       tpLink:
//         idxTpLink !== -1 ? String(r[idxTpLink] || '').trim() : ''
//     };
//     seen.set(beis, record);
//   }

//   for (const value of seen.values()) {
//     result.push(value);
//   }
//   return result;
// }

// async function loadMain() {
//   const { header: rawHeader, rows } = await loadSheet(SPREADSHEET_ID_MAIN, 'Master');
//   if (!rawHeader.length) return { header: [], rows: [] };

//   const header = [...rawHeader];
//   if (header[0] && header[0].trim() === '') {
//     header[0] = 'Region';
//   }
//   if (!header.includes(SCHEDULE_END_COL)) {
//     header.push(SCHEDULE_END_COL);
//     rows.forEach((r) => r.push(''));
//   }

//   const required = [
//     'Region',
//     'Province',
//     'BEIS School ID',
//     SCHEDULE_COL,
//     SCHEDULE_END_COL,
//     'Start Time',
//     'End Time',
//     OUTCOME_COL,
//     BLOCKER_COL,
//     'Status of Calendar'
//   ];

//   for (const col of required) {
//     if (!header.includes(col)) {
//       return { header: [], rows: [] };
//     }
//   }

//   const normalized = normalizeRows(header, rows);
//   return { header, rows: normalized };
// }

// function parseDateFlexible(value) {
//   if (!value) return null;
//   const text = String(value).trim();
//   if (!text) return null;
//   const tried = Date.parse(text);
//   if (!Number.isNaN(tried)) {
//     return new Date(tried);
//   }
//   return null;
// }

// function formatScheduleDisplay(startRaw, endRaw) {
//   if (!startRaw) return '';
//   const startDate = parseDateFlexible(startRaw);
//   const endDate = endRaw ? parseDateFlexible(endRaw) : null;

//   const fmt = (d, fallback) => {
//     if (!d) return fallback || '';
//     try {
//       return d.toLocaleDateString('en-US', {
//         month: 'short',
//         day: '2-digit',
//         year: 'numeric'
//       });
//     } catch {
//       return fallback || '';
//     }
//   };

//   const startText = fmt(startDate, String(startRaw));
//   if (!endRaw) {
//     return startText;
//   }
//   const endText = fmt(endDate, String(endRaw));
//   return `${startText} - ${endText}`;
// }

// function buildFilterOptions(rows) {
//   const setFromField = (field) => {
//     const set = new Set();
//     for (const r of rows) {
//       const v = (r[field] || '').toString().trim();
//       if (v) set.add(v);
//     }
//     return Array.from(set).sort((a, b) => a.localeCompare(b));
//   };

//   return {
//     regionOptions: setFromField('Region'),
//     scheduleOptions: setFromField('Schedule'),
//     installationOptions: setFromField('Installation Status'),
//     approvalOptions: setFromField('Approval (Accepted / Decline)'),
//     finalStatusOptions: setFromField('Final Status'),
//     validatedOptions: setFromField('Validated?')
//   };
// }

// function buildStats(rows) {
//   if (!rows.length) {
//     return {
//       active: false,
//       star_activated: 0,
//       star_not_activated: 0,
//       approval_accepted: 0,
//       approval_pending: 0,
//       approval_decline: 0,
//       calendar_sent: 0,
//       calendar_not_sent: 0,
//       s1_success: 0,
//       scheduled: 0,
//       unscheduled: 0,
//       s1_vs_scheduled_pct: 0,
//       uat_uploaded: 0
//     };
//   }

//   let starActivated = 0;
//   let starNotActivated = 0;
//   let approvalAccepted = 0;
//   let approvalDecline = 0;
//   let calendarSent = 0;
//   let calendarNotSent = 0;
//   let s1Success = 0;
//   let scheduled = 0;
//   let unscheduled = 0;
//   let uatUploaded = 0;

//   for (const row of rows) {
//     const star = String(row['Starlink Status'] || '').trim().toLowerCase();
//     const appr = String(row['Approval'] || '').trim().toLowerCase();
//     const cal = String(row['Calendar Status'] || '').trim().toLowerCase();
//     const inst = String(row['Installation Status'] || '').trim().toLowerCase();
//     const sched = String(row['Schedule'] || '').trim();

//     if (star === 'activated') {
//       starActivated += 1;
//     } else {
//       starNotActivated += 1;
//     }

//     if (appr.includes('accept')) {
//       approvalAccepted += 1;
//     } else if (appr.includes('declin')) {
//       approvalDecline += 1;
//     }

//     if (cal === 'sent') {
//       calendarSent += 1;
//     } else if (cal === 'invite not sent' || cal === '') {
//       calendarNotSent += 1;
//     }

//     if (inst === 's1 - installed (success)') {
//       s1Success += 1;
//     }

//     if (row._hasUatForm) {
//       uatUploaded += 1;
//     }

//     if (sched) {
//       scheduled += 1;
//     } else {
//       unscheduled += 1;
//     }
//   }

//   const total = rows.length;
//   const approvalPending = total - approvalAccepted - approvalDecline;
//   const s1VsScheduledPct =
//     scheduled > 0 ? Math.round((s1Success / scheduled) * 1000) / 10 : 0;

//   return {
//     active: true,
//     star_activated: starActivated,
//     star_not_activated: starNotActivated,
//     approval_accepted: approvalAccepted,
//     approval_pending: approvalPending,
//     approval_decline: approvalDecline,
//     calendar_sent: calendarSent,
//     calendar_not_sent: calendarNotSent,
//     s1_success: s1Success,
//     scheduled,
//     unscheduled,
//     s1_vs_scheduled_pct: s1VsScheduledPct,
//     uat_uploaded: uatUploaded
//   };
// }

// function applyFilters(rows, filters) {
//   return rows.filter((row) => {
//     const region = filters.region?.trim();
//     if (region && String(row.Region || '') !== region) return false;

//     // Optional Lot # filter (map lot to a set of regions)
//     const lot = (filters.lot || '').trim();
//     if (lot) {
//       const lotMap = {
//         'Lot #1': new Set([
//           'Region I',
//           'Region II',
//           'Region III',
//           'Region IV-A',
//           'Region IV-B',
//           'MIMAROPA',
//           'Region V',
//           'CAR',
//         ]),
//         'Lot #2': new Set(['Region VI', 'Region VII', 'Region VIII', 'NIR']),
//         'Lot #3': new Set([
//           'Region IX',
//           'Region X',
//           'Region XI',
//           'Region XII',
//           'Region CARAGA',
//         ]),
//       };
//       const allowedRegions = lotMap[lot];
//       if (allowedRegions && !allowedRegions.has(String(row.Region || ''))) {
//         return false;
//       }
//     }

//     const installation = filters.installation?.trim();
//     if (installation && String(row['Installation Status'] || '') !== installation) {
//       return false;
//     }

//     const approvalFilter = filters.approval?.trim();
//     if (approvalFilter && String(row['Approval (Accepted / Decline)'] || '') !== approvalFilter) {
//       return false;
//     }

//     const star = filters.star?.trim().toLowerCase();
//     if (star === 'activated') {
//       if (String(row['Starlink Status'] || '').trim().toLowerCase() !== 'activated') {
//         return false;
//       }
//     } else if (star === 'not_activated') {
//       if (String(row['Starlink Status'] || '').trim().toLowerCase() === 'activated') {
//         return false;
//       }
//     }

//     const calendar = filters.calendar?.trim().toLowerCase();
//     if (calendar === 'sent') {
//       // Only rows explicitly marked as Sent
//       if (String(row['Calendar Status'] || '').trim().toLowerCase() !== 'sent') {
//         return false;
//       }
//     } else if (calendar === 'invite_not_sent') {
//       // Treat blank Calendar Status as part of "Calendar Not Sent"
//       const calVal = String(row['Calendar Status'] || '').trim().toLowerCase();
//       if (calVal !== 'invite not sent' && calVal !== '') {
//         return false;
//       }
//     }

//     const uat = filters.uat?.trim().toLowerCase();
//     if (uat === 'uploaded') {
//       if (!row._hasUatForm) {
//         return false;
//       }
//     }

//     const finalStatus = filters.final?.trim();
//     if (finalStatus && String(row['Final Status'] || '') !== finalStatus) {
//       return false;
//     }

//     const validated = filters.validated?.trim();
//     if (validated && String(row['Validated?'] || '') !== validated) {
//       return false;
//     }

//     const search = filters.search?.trim().toLowerCase();
//     if (search) {
//       const haystack = [
//         row.Region,
//         row.Province,
//         row['BEIS School ID'],
//         row['Installation Status'],
//         row['Starlink Status'],
//         row['Tp-link PHASE II'],
//         row['Approval (Accepted / Decline)'],
//         row['Final Status'],
//         row['Validated?'],
//         row.Blocker
//       ]
//         .map((v) => (v == null ? '' : String(v)))
//         .join(' ')
//         .toLowerCase();
//       if (!haystack.includes(search)) return false;
//     }

//     if (!filters.includeUnscheduled) {
//       const sched = String(row.Schedule || '').trim();
//       if (!sched) return false;
//     }

//     const scheduleFilter = filters.schedule;
//     if (scheduleFilter && scheduleFilter.length) {
//       const selected = Array.isArray(scheduleFilter)
//         ? scheduleFilter
//         : [scheduleFilter];
//       if (!selected.includes(row.Schedule)) return false;
//     }

//     return true;
//   });
// }

// async function getTableData(filters) {
//   const { header, rows } = await loadMain();
//   if (!header.length) {
//     return {
//       rows: [],
//       regionOptions: [],
//       scheduleOptions: [],
//       installationOptions: [],
//       finalStatusOptions: [],
//       validatedOptions: [],
//       stats: buildStats([])
//     };
//   }

//   const starlink = await loadStarlink();
//   const starByBeis = new Map();
//   for (const s of starlink) {
//     starByBeis.set(s.beis, s);
//   }

//   const colIndex = (name) => header.indexOf(name);
//   const idx = {
//     region: colIndex('Region'),
//     province: colIndex('Province'),
//     beis: colIndex('BEIS School ID'),
//     schedStart: colIndex(SCHEDULE_COL),
//     schedEnd: colIndex(SCHEDULE_END_COL),
//     startTime: colIndex('Start Time'),
//     endTime: colIndex('End Time'),
//     outcome: colIndex(OUTCOME_COL),
//     blocker: colIndex(BLOCKER_COL),
//     statusCalendar: colIndex('Status of Calendar')
//   };

//   const uatStatusMap = getUatStatusByBeis();

//   const mergedRows = rows.map((r) => {
//     const beis = String(r[idx.beis] || '').trim();
//     const starInfo = beis ? starByBeis.get(beis) : undefined;
//     const schedule = r[idx.schedStart] || '';
//     const scheduleEnd = r[idx.schedEnd] || '';

//     const calendarRaw = String(r[idx.statusCalendar] || '').trim();
//     let calendarStatus = '';
//     if (calendarRaw === 'Invite Sent') {
//       calendarStatus = 'Sent';
//     } else if (calendarRaw) {
//       calendarStatus = 'Invite Not Sent';
//     }

//     const scheduleSort = parseDateFlexible(schedule);

//     const uatInfo = beis ? uatStatusMap.get(beis) : undefined;
//     const hasUat = !!(uatInfo && uatInfo.hasContent);

//     let installationStatus = r[idx.outcome] || '';
//     if (hasUat) {
//       installationStatus = 'S1 - Installed (Success)';
//     }

//     const row = {
//       Region: r[idx.region] || '',
//       Province: r[idx.province] || '',
//       'BEIS School ID': beis,
//       Schedule: formatScheduleDisplay(schedule, scheduleEnd),
//       'Calendar Status': calendarStatus,
//       'Start Time': r[idx.startTime] || '',
//       'End Time': r[idx.endTime] || '',
//       'Installation Status': installationStatus,
//       'Starlink Status': starInfo ? starInfo.status : '',
//       Approval: starInfo ? starInfo.approval || 'Pending' : 'Pending',
//       'Tp-link PHASE II': starInfo ? starInfo.tpLink || '' : '',
//       'Approval (Accepted / Decline)': starInfo ? starInfo.approval || 'Pending' : 'Pending',
//       'Final Status': '',
//       'Validated?': '',
//       Blocker: r[idx.blocker] || '',
//       _hasUatForm: hasUat,
//       _scheduleSort: scheduleSort
//     };
//     return row;
//   });

//   const filteredRows = applyFilters(mergedRows, filters).sort((a, b) => {
//     const da = a._scheduleSort;
//     const db = b._scheduleSort;

//     if (da && db) {
//       return da - db; // earlier dates first
//     }
//     if (da && !db) return -1; // dated rows before undated
//     if (!da && db) return 1;
//     return 0;
//   });
//   const stats = buildStats(filteredRows);

//   // For filter option lists (especially Regions), respect Lot mapping so that
//   // the "All Regions" dropdown only shows regions allowed for the selected Lot.
//   let optionSourceRows = mergedRows;
//   const selectedLot = (filters.lot || '').trim();
//   if (selectedLot) {
//     const lotMap = {
//       'Lot #1': new Set([
//         'Region I',
//         'Region II',
//         'Region III',
//         'Region IV-A',
//         'Region IV-B',
//         'MIMAROPA',
//         'Region V',
//         'CAR',
//       ]),
//       'Lot #2': new Set(['Region VI', 'Region VII', 'Region VIII', 'NIR']),
//       'Lot #3': new Set([
//         'Region IX',
//         'Region X',
//         'Region XI',
//         'Region XII',
//         'Region CARAGA',
//       ]),
//     };
//     const allowedRegions = lotMap[selectedLot];
//     if (allowedRegions) {
//       optionSourceRows = mergedRows.filter((r) =>
//         allowedRegions.has(String(r.Region || ''))
//       );
//     }
//   }

//   const {
//     regionOptions,
//     scheduleOptions,
//     installationOptions,
//     approvalOptions,
//     finalStatusOptions,
//     validatedOptions
//   } = buildFilterOptions(optionSourceRows);

//   return {
//     rows: filteredRows,
//     regionOptions,
//     scheduleOptions,
//     installationOptions,
//     approvalOptions,
//     finalStatusOptions,
//     validatedOptions,
//     stats
//   };
// }

// module.exports = {
//   getTableData
// };



const { createSheetsClient } = require('./googleSheets');
const { getUatStatusByBeis } = require('./googleDrive');

// Spreadsheet IDs
const SPREADSHEET_ID_STARLINK = '1XdByRZ3zYX5pfqEoufLXb3qnPTIh2rBmnfl4JzWoEbQ';
const SPREADSHEET_ID_MAIN = '1N7_h13n87Moh5n666e2OLi8jKwuZU1Ae3-kK69kuX18';

// Column headers (matching Sheets layout)
const SCHEDULE_COL = 'Schedule of Delivery/\nInstallation\n(Start Date)';
const SCHEDULE_END_COL = 'Schedule of Delivery/\nInstallation\n(End Date)';
const OUTCOME_COL = 'Outcome Status \n (to be Accomplished by Supplier)';
const BLOCKER_COL = 'Blocker \n (to be Accomplished by Supplier)';

// Load sheet data
async function loadSheet(spreadsheetId, sheetName) {
  const sheets = createSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `'${sheetName}'!A1:ZZ`
  });
  const values = res.data.values || [];
  if (!values.length) return { header: [], rows: [] };
  const [header, ...rows] = values;
  return { header, rows };
}

function normalizeRows(header, rows) {
  const colsLen = header.length;
  return rows.map((r) => {
    const row = r.slice(0, colsLen);
    while (row.length < colsLen) row.push('');
    return row;
  });
}

// Load Starlink spreadsheet
async function loadStarlink() {
  const { header, rows } = await loadSheet(SPREADSHEET_ID_STARLINK, 'Master');
  if (!header.length) return [];

  // Column T should be "Phase II - Approval (Accepted / Decline)".
  // We try several possible header texts, then fall back to index 19 (T)
  // if the header name cannot be found but the sheet has enough columns.
  const approvalHeaderCandidates = [
    'Phase II - Approval (Accepted / Decline)',
    'Approval (Accepted / Decline)',
    'Approval (Accepted / Decline) '
  ];
  let approvalIdx = -1;
  for (const name of approvalHeaderCandidates) {
    const idx = header.indexOf(name);
    if (idx !== -1) {
      approvalIdx = idx;
      break;
    }
  }
  if (approvalIdx === -1 && header.length > 19) {
    approvalIdx = 19; // Column T (0‑based index)
  }

  const idx = {
    beis: header.indexOf('BEIS School ID'),
    status: header.indexOf('Status of Activation'),
    // Force Approval to read from column T (index 19) of the Starlink sheet.
    approval: 19
  };
  const idxTpLink = header.indexOf('Tp-link PHASE II');

  const normalized = normalizeRows(header, rows);
  const seen = new Map();

  for (const r of normalized) {
    const beis = String(r[idx.beis] || '').trim();
    if (!beis) continue;
    const record = {
      beis,
      status: String(r[idx.status] || '').trim(),
      approval: String(r[idx.approval] || '').trim(),
      tpLink: idxTpLink !== -1 ? String(r[idxTpLink] || '').trim() : ''
    };
    seen.set(beis, record);
  }
  return Array.from(seen.values());
}

// Load Main spreadsheet
async function loadMain() {
  const { header: rawHeader, rows } = await loadSheet(SPREADSHEET_ID_MAIN, 'Master');
  if (!rawHeader.length) return { header: [], rows: [] };

  const header = [...rawHeader];
  if (header[0] && header[0].trim() === '') header[0] = 'Region';
  if (!header.includes(SCHEDULE_END_COL)) {
    header.push(SCHEDULE_END_COL);
    rows.forEach(r => r.push(''));
  }

  const required = [
    'Region',
    'Province',
    'BEIS School ID',
    SCHEDULE_COL,
    SCHEDULE_END_COL,
    'Start Time',
    'End Time',
    OUTCOME_COL,
    BLOCKER_COL,
    'Status of Calendar'
  ];
  for (const col of required) if (!header.includes(col)) return { header: [], rows: [] };

  const normalized = normalizeRows(header, rows);
  return { header, rows: normalized };
}

function parseDateFlexible(value) {
  if (!value) return null;
  const text = String(value).trim();
  if (!text) return null;
  const tried = Date.parse(text);
  return !Number.isNaN(tried) ? new Date(tried) : null;
}

function formatScheduleDisplay(startRaw, endRaw) {
  if (!startRaw) return '';
  const startDate = parseDateFlexible(startRaw);
  const endDate = endRaw ? parseDateFlexible(endRaw) : null;

  const fmt = (d, fallback) => {
    if (!d) return fallback || '';
    try {
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      });
    } catch { return fallback || ''; }
  };

  const startText = fmt(startDate, String(startRaw));
  if (!endRaw) return startText;
  const endText = fmt(endDate, String(endRaw));
  return `${startText} - ${endText}`;
}

// Filter options
function buildFilterOptions(rows) {
  const setFromField = (field) => {
    const set = new Set();
    for (const r of rows) {
      const v = (r[field] || '').toString().trim();
      if (v) set.add(v);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  };
  return {
    regionOptions: setFromField('Region'),
    scheduleOptions: setFromField('Schedule'),
    installationOptions: setFromField('Installation Status'),
    approvalOptions: setFromField('Approval (Accepted / Decline)'),
    finalStatusOptions: setFromField('Final Status'),
    validatedOptions: setFromField('Validated?')
  };
}

// Build stats
function buildStats(rows) {
  if (!rows.length) return {
    active: false,
    star_activated: 0,
    star_not_activated: 0,
    approval_accepted: 0,
    approval_pending: 0,
    approval_decline: 0,
    calendar_sent: 0,
    calendar_not_sent: 0,
    s1_success: 0,
    scheduled: 0,
    unscheduled: 0,
    s1_vs_scheduled_pct: 0,
    uat_uploaded: 0
  };

  let starActivated = 0, starNotActivated = 0, approvalAccepted = 0, approvalDecline = 0;
  let calendarSent = 0, calendarNotSent = 0, s1Success = 0, scheduled = 0, unscheduled = 0, uatUploaded = 0;

  for (const row of rows) {
    const star = String(row['Starlink Status'] || '').trim().toLowerCase();
    const appr = String(row['Approval'] || '').trim().toLowerCase();
    const cal = String(row['Calendar Status'] || '').trim().toLowerCase();
    const inst = String(row['Installation Status'] || '').trim().toLowerCase();
    const sched = String(row['Schedule'] || '').trim();

    if (star === 'activated') starActivated++; else starNotActivated++;
    if (appr.includes('accept')) approvalAccepted++;
    else if (appr.includes('declin')) approvalDecline++;

    if (cal === 'sent') calendarSent++;
    else if (cal === 'invite not sent' || cal === '') calendarNotSent++;

    if (inst === 's1 - installed (success)') s1Success++;
    if (row._hasUatForm) uatUploaded++;

    if (sched) scheduled++; else unscheduled++;
  }

  const total = rows.length;
  const approvalPending = total - approvalAccepted - approvalDecline;
  const s1VsScheduledPct = scheduled > 0 ? Math.round((s1Success / scheduled) * 1000) / 10 : 0;

  return {
    active: true,
    star_activated: starActivated,
    star_not_activated: starNotActivated,
    approval_accepted: approvalAccepted,
    approval_pending: approvalPending,
    approval_decline: approvalDecline,
    calendar_sent: calendarSent,
    calendar_not_sent: calendarNotSent,
    s1_success: s1Success,
    scheduled,
    unscheduled,
    s1_vs_scheduled_pct: s1VsScheduledPct,
    uat_uploaded: uatUploaded
  };
}

// Apply filters
function applyFilters(rows, filters) {
  return rows.filter((row) => {
    const region = filters.region?.trim();
    if (region && String(row.Region || '') !== region) return false;

    const lot = (filters.lot || '').trim();
    if (lot) {
      const lotMap = {
        'Lot #1': new Set(['Region I','Region II','Region III','Region IV-A','Region IV-B','MIMAROPA','Region V','CAR']),
        'Lot #2': new Set(['Region VI','Region VII','Region VIII','NIR']),
        'Lot #3': new Set(['Region IX','Region X','Region XI','Region XII','Region CARAGA'])
      };
      const allowedRegions = lotMap[lot];
      if (allowedRegions && !allowedRegions.has(String(row.Region || ''))) return false;
    }

    const installationRaw = filters.installation?.trim();
    if (installationRaw) {
      const instVal = String(row['Installation Status'] || '');
      const instLower = instVal.trim().toLowerCase();
      const installation = installationRaw.toLowerCase();

      if (installation === 'installed') {
        if (instLower !== 's1 - installed (success)') return false;
      } else if (instVal !== installationRaw) {
        return false;
      }
    }

    const approvalFilter = filters.approval?.trim();
    if (approvalFilter && String(row['Approval (Accepted / Decline)'] || '') !== approvalFilter) return false;

    const star = filters.star?.trim().toLowerCase();
    if (star === 'activated' && String(row['Starlink Status'] || '').trim().toLowerCase() !== 'activated') return false;
    if (star === 'not_activated' && String(row['Starlink Status'] || '').trim().toLowerCase() === 'activated') return false;

    const calendar = filters.calendar?.trim().toLowerCase();
    const calVal = String(row['Calendar Status'] || '').trim().toLowerCase();
    if (calendar === 'sent' && calVal !== 'sent') return false;
    if (calendar === 'invite_not_sent' && calVal !== 'invite not sent' && calVal !== '') return false;

    const uat = filters.uat?.trim().toLowerCase();
    if (uat === 'uploaded' && !row._hasUatForm) return false;

    const finalStatus = filters.final?.trim();
    if (finalStatus && String(row['Final Status'] || '') !== finalStatus) return false;

    const validated = filters.validated?.trim();
    if (validated && String(row['Validated?'] || '') !== validated) return false;

    const search = filters.search?.trim().toLowerCase();
    if (search) {
      const haystack = [
        row.Region,row.Province,row['BEIS School ID'],row['Installation Status'],
        row['Starlink Status'],row['Tp-link PHASE II'],row['Approval (Accepted / Decline)'],
        row['Final Status'],row['Validated?'],row.Blocker
      ].map(v => (v==null?'':String(v))).join(' ').toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    if (!filters.includeUnscheduled) {
      const sched = String(row.Schedule || '').trim();
      if (!sched) return false;
    }

    const scheduleFilter = filters.schedule;
    if (scheduleFilter && scheduleFilter.length) {
      const selected = Array.isArray(scheduleFilter) ? scheduleFilter : [scheduleFilter];
      if (!selected.includes(row.Schedule)) return false;
    }

    return true;
  });
}

// Main function to get table data
async function getTableData(filters) {

  const { header, rows } = await loadMain();
  if (!header.length) return {
    rows: [], regionOptions: [], scheduleOptions: [], installationOptions: [],
    finalStatusOptions: [], validatedOptions: [], stats: buildStats([])
  };

  const starlink = await loadStarlink();
  const starByBeis = new Map();
  for (const s of starlink) starByBeis.set(s.beis, s);

  const colIndex = (name) => header.indexOf(name);
  const idx = {
    region: colIndex('Region'),
    province: colIndex('Province'),
    beis: colIndex('BEIS School ID'),
    schedStart: colIndex(SCHEDULE_COL),
    schedEnd: colIndex(SCHEDULE_END_COL),
    startTime: colIndex('Start Time'),
    endTime: colIndex('End Time'),
    outcome: colIndex(OUTCOME_COL),
    blocker: colIndex(BLOCKER_COL),
    statusCalendar: colIndex('Status of Calendar')
  };

  const uatStatusMap = getUatStatusByBeis();

  const mergedRows = rows.map((r) => {
    const beis = String(r[idx.beis] || '').trim();
    const starInfo = beis ? starByBeis.get(beis) : undefined;
    const schedule = r[idx.schedStart] || '';
    const scheduleEnd = r[idx.schedEnd] || '';
    const calendarRaw = String(r[idx.statusCalendar] || '').trim();
    let calendarStatus = '';
    if (calendarRaw === 'Invite Sent') calendarStatus = 'Sent';
    else if (calendarRaw) calendarStatus = 'Invite Not Sent';
    const scheduleSort = parseDateFlexible(schedule);

    const uatInfo = beis ? uatStatusMap.get(beis) : undefined;
    const hasUat = !!(uatInfo && uatInfo.hasFiles);
    const parentFolderName = uatInfo?.parentFolderName || '';

    // Installation Status is now derived only from UAT + Tp-link PHASE II,
    // no longer taken from the "Outcome Status" column.
    let installationStatus = '';
    const tpPhase = starInfo && starInfo.tpLink
      ? String(starInfo.tpLink).trim().toLowerCase()
      : '';

    // Installation Status is derived from Tp-link PHASE II, with UAT only
    // determining the success case for fully installed sites.
    if (hasUat && tpPhase === 'installed') {
      installationStatus = 'S1 - Installed (Success)';
    } else if (tpPhase === 'upload uat') {
      installationStatus = 'Installed - (Incomplete Document)';
    } else if (tpPhase === 'ready to deploy') {
      installationStatus = 'Not yet Installed';
    }

    return {
      Region: r[idx.region] || '',
      Province: r[idx.province] || '',
      'BEIS School ID': beis,
      Schedule: formatScheduleDisplay(schedule, scheduleEnd),
      'Calendar Status': calendarStatus,
      'Start Time': r[idx.startTime] || '',
      'End Time': r[idx.endTime] || '',
      'Installation Status': installationStatus,
      'Starlink Status': starInfo ? starInfo.status : '',
      Approval: starInfo ? starInfo.approval || 'Pending' : 'Pending',
      'Tp-link PHASE II': starInfo ? starInfo.tpLink || '' : '',
      'Approval (Accepted / Decline)': starInfo ? starInfo.approval || 'Pending' : 'Pending',
      'Final Status': '',
      'Validated?': '',
      Blocker: r[idx.blocker] || '',
      _hasUatForm: hasUat,
      _uatParentFolderName: parentFolderName,
      _scheduleSort: scheduleSort
    };
  });

  const filteredRows = applyFilters(mergedRows, filters).sort((a,b)=>{
    const da=a._scheduleSort, db=b._scheduleSort;
    if(da && db) return da-db;
    if(da && !db) return -1;
    if(!da && db) return 1;
    return 0;
  });

  const stats = buildStats(filteredRows);

  let optionSourceRows = mergedRows;
  const selectedLot = (filters.lot || '').trim();
  if(selectedLot){
    const lotMap = {
      'Lot #1': new Set(['Region I','Region II','Region III','Region IV-A','Region IV-B','MIMAROPA','Region V','CAR']),
      'Lot #2': new Set(['Region VI','Region VII','Region VIII','NIR']),
      'Lot #3': new Set(['Region IX','Region X','Region XI','Region XII','Region CARAGA'])
    };
    const allowedRegions = lotMap[selectedLot];
    if(allowedRegions) optionSourceRows = mergedRows.filter(r => allowedRegions.has(String(r.Region || '')));
  }

  const {regionOptions,scheduleOptions,installationOptions,approvalOptions,finalStatusOptions,validatedOptions} = buildFilterOptions(optionSourceRows);

  return { rows: filteredRows, regionOptions, scheduleOptions, installationOptions, approvalOptions, finalStatusOptions, validatedOptions, stats };
}

module.exports = { getTableData };


