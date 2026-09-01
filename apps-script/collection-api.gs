const COLLECTION_CONFIG = Object.freeze({
  SPREADSHEET_ID: '1zSlXVTy9wKJE90lM8GZKpqZuuNqsT3Z3Dt0CD8nXzKs',
  TIMEZONE: 'Asia/Manila',
  SUPABASE_URL: 'https://tcexzfztdgximrzuosqs.supabase.co',
  SUPABASE_KEY: 'sb_publishable_8H8_S7NTWvzPCLvYUe2C4g_k3Ltjfiz',
  STATUS_OPTIONS: [
    'Paid',
    'For Pullout',
    'Done Pullout',
    'Expired',
    'Unable to Pullout',
    'Disconnected/Relocation',
    'Disconnected',
    'Exempted'
  ],
  NOTE_REQUIRED: [
    'Unable to Pullout',
    'Disconnected/Relocation',
    'Disconnected',
    'Exempted'
  ],
  MONTH_NAMES: [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ],
  // Recommended future tab format: "September 2026", "January 2027", etc.
  // Legacy month-only tabs are still supported; their year is inferred from Period/Due Date data.
  LEGACY_FALLBACK_YEAR: 2026
});

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Collection API')
    .addItem('Setup API', 'setupCollectionApi')
    .addItem('Test Collection List', 'testCollectionList')
    .addItem('Show Detected Months', 'showDetectedCollectionMonths')
    .addToUi();
}

function setupCollectionApi() {
  const ss = SpreadsheetApp.openById(COLLECTION_CONFIG.SPREADSHEET_ID);
  ss.setSpreadsheetTimeZone(COLLECTION_CONFIG.TIMEZONE);
  console.log('Collection API setup complete.');
  console.log('Spreadsheet timezone: ' + ss.getSpreadsheetTimeZone());
  console.log('Authentication: Supabase employee session');
  console.log('Recommended monthly tab format: Month YYYY (example: September 2026, January 2027).');
  return {
    success: true,
    timezone: ss.getSpreadsheetTimeZone(),
    auth: 'SUPABASE_EMPLOYEE_SESSION',
    monthly_tab_format: 'Month YYYY'
  };
}

function testCollectionList() {
  const result = listCollections_({});
  console.log(JSON.stringify({
    success: result.success,
    sheet: result.sheet,
    period_key: result.period_key,
    total: result.total,
    available_sheets: result.available_sheets,
    sample: result.rows.slice(0, 3)
  }, null, 2));
  return result;
}

function showDetectedCollectionMonths() {
  const ss = SpreadsheetApp.openById(COLLECTION_CONFIG.SPREADSHEET_ID);
  const months = listCollectionSheets_(ss);
  console.log(JSON.stringify(months, null, 2));
  return months;
}

function doGet(e) {
  try {
    const p = (e && e.parameter) || {};
    const action = String(p.action || 'health').toLowerCase();

    if (action === 'health') {
      return json_({
        success: true,
        service: 'TechGeekPH Collection API',
        timezone: COLLECTION_CONFIG.TIMEZONE,
        auth: 'SUPABASE_EMPLOYEE_SESSION',
        monthly_tab_format: 'Month YYYY'
      });
    }

    throw new Error('Use POST for authenticated collection requests.');
  } catch (err) {
    return json_({ success: false, error: errorText_(err) });
  }
}

function doPost(e) {
  try {
    const body = parseJsonBody_(e);
    const accessToken = clean_(body.access_token);
    if (!accessToken) throw new Error('Employee session is required.');

    const staff = getSupabaseStaff_(accessToken);
    const action = String(body.action || '').toLowerCase();

    if (action === 'list') {
      return json_(listCollections_({
        sheet: body.sheet || body.month || body.period || '',
        status: body.status || '',
        search: body.search || ''
      }));
    }

    if (action === 'months') {
      const ss = SpreadsheetApp.openById(COLLECTION_CONFIG.SPREADSHEET_ID);
      return json_({ success: true, months: listCollectionSheets_(ss) });
    }

    if (action === 'update') {
      return json_(updateCollection_(body, staff, accessToken));
    }

    throw new Error('Unsupported action: ' + action);
  } catch (err) {
    return json_({ success: false, error: errorText_(err) });
  }
}

function listCollections_(opt) {
  opt = opt || {};
  const ss = SpreadsheetApp.openById(COLLECTION_CONFIG.SPREADSHEET_ID);
  const resolved = resolveCollectionSheetInfo_(ss, opt.sheet);
  const sheet = resolved.sheet;
  const lastRow = sheet.getLastRow();
  const lastCol = Math.max(sheet.getLastColumn(), 19);
  const availableSheets = listCollectionSheets_(ss);

  if (lastRow < 2) {
    return {
      success: true,
      sheet: sheet.getName(),
      period_key: resolved.period_key,
      total: 0,
      statuses: COLLECTION_CONFIG.STATUS_OPTIONS.slice(),
      available_sheets: availableSheets,
      rows: []
    };
  }

  const values = sheet.getRange(1, 1, lastRow, lastCol).getDisplayValues();
  const headers = values[0].map(v => String(v || '').trim());
  const statusFilter = String(opt.status || '').trim().toLowerCase();
  const search = String(opt.search || '').trim().toLowerCase();
  const rows = [];

  for (let i = 1; i < values.length; i++) {
    const r = values[i];
    const account = clean_(r[0]);
    if (!account) continue;

    const item = {
      row: i + 1,
      account: account,
      due_summary: clean_(r[1]),
      tech_name: clean_(r[2]),
      collection_status: clean_(r[3]),
      note: clean_(r[4]),
      date_update: clean_(r[5]),
      client_name: clean_(r[6]),
      phone: clean_(r[7]),
      account_no: clean_(r[8]),
      invoice_no: clean_(r[9]),
      period: clean_(r[10]),
      total: clean_(r[11]),
      billing_status: clean_(r[12]),
      due_date: clean_(r[13]),
      isolation_date: clean_(r[14]),
      date_payment: clean_(r[15]),
      reference: clean_(r[16]),
      address: clean_(r[17]),
      action: clean_(r[18])
    };

    if (statusFilter && item.collection_status.toLowerCase() !== statusFilter) continue;

    if (search) {
      const haystack = [
        item.account,
        item.client_name,
        item.phone,
        item.account_no,
        item.address,
        item.tech_name,
        item.collection_status,
        item.note
      ].join(' ').toLowerCase();
      if (haystack.indexOf(search) === -1) continue;
    }

    rows.push(item);
  }

  return {
    success: true,
    sheet: sheet.getName(),
    period_key: resolved.period_key,
    total: rows.length,
    statuses: COLLECTION_CONFIG.STATUS_OPTIONS.slice(),
    available_sheets: availableSheets,
    headers: headers,
    rows: rows
  };
}

function updateCollection_(body, staff, accessToken) {
  const account = clean_(body.account || body.account_no);
  const employeeName = clean_(staff.employee_name);
  const newStatus = normalizeStatus_(body.status || body.collection_status);
  const note = clean_(body.note);

  if (!account) throw new Error('Account number is required.');
  if (!employeeName) throw new Error('Employee profile name is missing.');
  if (!newStatus) throw new Error('Collection status is required.');

  if (COLLECTION_CONFIG.NOTE_REQUIRED.indexOf(newStatus) !== -1 && !note) {
    throw new Error('A comment/note is required for status: ' + newStatus);
  }

  const ss = SpreadsheetApp.openById(COLLECTION_CONFIG.SPREADSHEET_ID);
  const resolved = resolveCollectionSheetInfo_(ss, body.sheet || body.month || body.period || '');
  const sheet = resolved.sheet;
  const row = findAccountRow_(sheet, account);
  if (!row) throw new Error('Account not found in ' + sheet.getName() + ': ' + account);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const oldTech = sheet.getRange(row, 3).getValue();
    const oldStatus = clean_(sheet.getRange(row, 4).getDisplayValue());
    const oldNote = sheet.getRange(row, 5).getValue();
    const oldDate = sheet.getRange(row, 6).getValue();
    const clientName = clean_(sheet.getRange(row, 7).getDisplayValue());

    sheet.getRange(row, 3).setValue(employeeName);
    sheet.getRange(row, 4).setValue(newStatus);
    sheet.getRange(row, 5).setValue(note);
    sheet.getRange(row, 6).setValue(new Date());
    sheet.getRange(row, 6).setNumberFormat('mmm d, yyyy h:mm AM/PM');
    SpreadsheetApp.flush();

    try {
      supabaseRpc_('app_log_collection_update', accessToken, {
        p_account_no: account,
        p_client_name: clientName,
        p_old_status: oldStatus,
        p_new_status: newStatus,
        p_note: note,
        p_sheet_name: sheet.getName(),
        p_sheet_row: row
      });
    } catch (logErr) {
      sheet.getRange(row, 3).setValue(oldTech);
      sheet.getRange(row, 4).setValue(oldStatus);
      sheet.getRange(row, 5).setValue(oldNote);
      sheet.getRange(row, 6).setValue(oldDate);
      SpreadsheetApp.flush();
      throw new Error('Monitoring log failed, so the Sheet update was rolled back. ' + errorText_(logErr));
    }

    return {
      success: true,
      sheet: sheet.getName(),
      period_key: resolved.period_key,
      row: row,
      account: account,
      client_name: clientName,
      employee_id: clean_(staff.employee_id),
      employee_name: employeeName,
      old_status: oldStatus,
      new_status: newStatus,
      note: note,
      monitoring_logged: true,
      date_update: Utilities.formatDate(new Date(), COLLECTION_CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX")
    };
  } finally {
    lock.releaseLock();
  }
}

function getSupabaseStaff_(accessToken) {
  const staff = supabaseRpc_('app_current_staff_context', accessToken, {});
  if (!staff || !staff.employee_id || !staff.employee_name) {
    throw new Error('Active employee account is required.');
  }
  return staff;
}

function supabaseRpc_(rpcName, accessToken, payload) {
  const response = UrlFetchApp.fetch(
    COLLECTION_CONFIG.SUPABASE_URL + '/rest/v1/rpc/' + encodeURIComponent(rpcName),
    {
      method: 'post',
      contentType: 'application/json',
      headers: {
        apikey: COLLECTION_CONFIG.SUPABASE_KEY,
        Authorization: 'Bearer ' + accessToken
      },
      payload: JSON.stringify(payload || {}),
      muteHttpExceptions: true
    }
  );

  const code = response.getResponseCode();
  const text = response.getContentText();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_) {
    data = text;
  }

  if (code < 200 || code >= 300) {
    const msg = data && data.message ? data.message : text || ('HTTP ' + code);
    throw new Error('Supabase RPC ' + rpcName + ' failed: ' + msg);
  }

  return data;
}

function resolveCollectionSheet_(ss, requested) {
  return resolveCollectionSheetInfo_(ss, requested).sheet;
}

function resolveCollectionSheetInfo_(ss, requested) {
  const req = clean_(requested);
  const candidates = getCollectionSheetCandidates_(ss);

  if (req) {
    const exact = ss.getSheetByName(req);
    if (exact) {
      const exactInfo = getCollectionSheetInfo_(exact);
      return {
        sheet: exact,
        period_key: exactInfo ? exactInfo.period_key : req
      };
    }

    const normalizedReq = normalizePeriodRequest_(req);
    if (normalizedReq) {
      const matched = candidates.find(x => x.period_key === normalizedReq);
      if (matched) return matched;
    }

    throw new Error('Collection sheet not found: ' + req);
  }

  if (!candidates.length) throw new Error('No monthly collection sheet found.');

  const currentKey = Utilities.formatDate(new Date(), COLLECTION_CONFIG.TIMEZONE, 'yyyy-MM');
  const currentOrPast = candidates.filter(x => x.period_key <= currentKey);

  if (currentOrPast.length) {
    return currentOrPast[currentOrPast.length - 1];
  }

  return candidates[candidates.length - 1];
}

function listCollectionSheets_(ss) {
  return getCollectionSheetCandidates_(ss).map(x => ({
    sheet: x.sheet.getName(),
    period_key: x.period_key,
    year: x.year,
    month: x.month,
    label: COLLECTION_CONFIG.MONTH_NAMES[x.month - 1] + ' ' + x.year
  }));
}

function getCollectionSheetCandidates_(ss) {
  return ss.getSheets()
    .map(sheet => getCollectionSheetInfo_(sheet))
    .filter(Boolean)
    .sort((a, b) => a.period_key.localeCompare(b.period_key));
}

function getCollectionSheetInfo_(sheet) {
  const name = clean_(sheet.getName());
  if (!name) return null;

  let month = 0;
  let year = 0;

  // Preferred: "September 2026" / "Sep 2026"
  let m = name.match(/^([A-Za-z]+)\s+(20\d{2})$/);
  if (m) {
    month = monthNumberFromName_(m[1]);
    year = Number(m[2]);
  }

  // Also supported: "2026-09", "2026_09", "2026 09"
  if (!month) {
    m = name.match(/^(20\d{2})[-_\s](0?[1-9]|1[0-2])$/);
    if (m) {
      year = Number(m[1]);
      month = Number(m[2]);
    }
  }

  // Legacy: "August". Infer year from Period/Due Date values.
  if (!month) {
    month = monthNumberFromName_(name);
    if (month) year = inferYearFromSheet_(sheet) || COLLECTION_CONFIG.LEGACY_FALLBACK_YEAR;
  }

  if (!month || !year || year < 2020 || year > 9999) return null;

  const periodKey = String(year) + '-' + String(month).padStart(2, '0');
  return {
    sheet: sheet,
    period_key: periodKey,
    year: year,
    month: month
  };
}

function inferYearFromSheet_(sheet) {
  const lastRow = Math.min(sheet.getLastRow(), 30);
  if (lastRow < 2) return 0;

  // K = Period, N = Due Date. Scan first rows for a recognizable 4-digit year.
  const periodValues = sheet.getRange(2, 11, lastRow - 1, 1).getDisplayValues();
  const dueValues = sheet.getRange(2, 14, lastRow - 1, 1).getDisplayValues();

  for (let i = 0; i < periodValues.length; i++) {
    const year = extractYear_(periodValues[i][0]) || extractYear_(dueValues[i][0]);
    if (year) return year;
  }

  return 0;
}

function extractYear_(value) {
  const s = clean_(value);
  const m = s.match(/\b(20\d{2})\b/);
  return m ? Number(m[1]) : 0;
}

function normalizePeriodRequest_(value) {
  const s = clean_(value);
  if (!s) return '';

  let m = s.match(/^(20\d{2})[-_\s](0?[1-9]|1[0-2])$/);
  if (m) return m[1] + '-' + String(Number(m[2])).padStart(2, '0');

  m = s.match(/^([A-Za-z]+)\s+(20\d{2})$/);
  if (m) {
    const month = monthNumberFromName_(m[1]);
    if (month) return m[2] + '-' + String(month).padStart(2, '0');
  }

  return '';
}

function monthNumberFromName_(value) {
  const raw = clean_(value).toLowerCase();
  if (!raw) return 0;

  for (let i = 0; i < COLLECTION_CONFIG.MONTH_NAMES.length; i++) {
    const full = COLLECTION_CONFIG.MONTH_NAMES[i].toLowerCase();
    const short = full.slice(0, 3);
    if (raw === full || raw === short) return i + 1;
  }

  return 0;
}

function findAccountRow_(sheet, account) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;

  const values = sheet.getRange(2, 1, lastRow - 1, 1).getDisplayValues();
  const target = String(account).trim().toLowerCase();

  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0] || '').trim().toLowerCase() === target) return i + 2;
  }
  return 0;
}

function normalizeStatus_(value) {
  const raw = clean_(value);
  if (!raw) return '';
  const match = COLLECTION_CONFIG.STATUS_OPTIONS.find(s => s.toLowerCase() === raw.toLowerCase());
  if (!match) throw new Error('Invalid collection status: ' + raw);
  return match;
}

function parseJsonBody_(e) {
  const raw = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
  try {
    return JSON.parse(raw || '{}');
  } catch (_) {
    throw new Error('Invalid JSON body.');
  }
}

function clean_(value) {
  return String(value == null ? '' : value).trim();
}

function errorText_(err) {
  return String(err && err.message ? err.message : err);
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
