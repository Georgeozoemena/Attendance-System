/*
  Google Apps Script for attendance webhook

  doPost(e): append a row
  doGet(e): lookup rows by email/phone/eventId

  Setup:
  - Create a new Apps Script project (standalone or container-bound).
  - Add Script Properties:
      SHEET_ID = <your sheet id>  (optional if container-bound)
      SCRIPT_KEY = <random secret> (optional)
  - Deploy -> New deployment -> Web app
    - Execute as: Me
    - Who has access: Anyone (or appropriate access)
  - Set APPS_SCRIPT_WEBHOOK to the exec URL, and set APPS_SCRIPT_KEY in backend .env to match SCRIPT_KEY if used.
*/

const COLS = [
  'timestamp', 'id', 'eventId', 'name', 'email', 'phone', 'address',
  'occupation', 'firstTimer', 'gender', 'nationality', 'department', 'deviceId'
];

function _getSheet() {
  const props = PropertiesService.getScriptProperties();
  const sheetId = props.getProperty('SHEET_ID');
  if (sheetId) {
    const ss = SpreadsheetApp.openById(sheetId);
    return ss.getSheets()[0];
  } else {
    return SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  }
}

function _checkKey(e) {
  const props = PropertiesService.getScriptProperties();
  const scriptKey = props.getProperty('SCRIPT_KEY');
  if (!scriptKey) return true;
  const paramKey = (e && e.parameter && e.parameter.key) || null;
  let bodyKey = null;
  if (e && e.postData && e.postData.contents) {
    try {
      const parsed = JSON.parse(e.postData.contents);
      bodyKey = parsed && parsed.key;
    } catch (err) {
      // ignore
    }
  }
  return paramKey === scriptKey || bodyKey === scriptKey;
}

function doPost(e) {
  try {
    if (!_checkKey(e)) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'invalid key' }))
        .setMimeType(ContentService.MimeType.JSON)
        .setStatusCode(401);
    }

    if (!e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'no postData' }))
        .setMimeType(ContentService.MimeType.JSON)
        .setStatusCode(400);
    }

    const payload = JSON.parse(e.postData.contents);
    const now = new Date().toISOString();
    const row = [
      payload.createdAt || now,
      payload.id || Utilities.getUuid(),
      payload.eventId || '',
      payload.name || '',
      payload.email || '',
      payload.phone || '',
      payload.address || '',
      payload.occupation || '',
      payload.firstTimer ? 'TRUE' : 'FALSE',
      payload.gender || '',
      payload.nationality || '',
      payload.department || '',
      payload.deviceId || ''
    ];

    const sheet = _getSheet();
    const headerRange = sheet.getRange(1, 1, 1, COLS.length);
    const headerValues = headerRange.getValues()[0];
    const needsHeader = headerValues.every((h) => h === '' || h === null);
    if (needsHeader) {
      headerRange.setValues([COLS]);
    }

    sheet.appendRow(row);

    const resp = {
      success: true,
      appended: {
        id: row[1],
        createdAt: row[0],
        eventId: row[2],
        name: row[3],
        email: row[4],
        phone: row[5]
      }
    };

    return ContentService.createTextOutput(JSON.stringify(resp)).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON)
      .setStatusCode(500);
  }
}

function doGet(e) {
  try {
    if (!_checkKey(e)) {
      return ContentService.createTextOutput(JSON.stringify({ error: 'invalid key' }))
        .setMimeType(ContentService.MimeType.JSON)
        .setStatusCode(401);
    }

    const params = e.parameter || {};
    const email = params.email || null;
    const phone = params.phone || null;
    const eventId = params.eventId || null;

    const sheet = _getSheet();
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();

    if (!values || values.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    }

    const header = values[0].map(String);
    const rows = values.slice(1);
    const results = [];

    rows.forEach((r) => {
      const obj = {};
      for (let i = 0; i < header.length; i++) {
        const key = header[i] || COLS[i] || `col${i}`;
        obj[key] = r[i];
      }
      const candidate = {
        timestamp: obj.timestamp || obj.Timestamp || '',
        createdAt: obj.createdAt || obj.timestamp || '',
        id: obj.id || '',
        eventId: obj.eventId || '',
        name: obj.name || '',
        email: obj.email || '',
        phone: obj.phone || '',
        address: obj.address || '',
        occupation: obj.occupation || '',
        firstTimer: (obj.firstTimer === true || String(obj.firstTimer).toUpperCase() === 'TRUE'),
        gender: obj.gender || '',
        nationality: obj.nationality || '',
        department: obj.department || '',
        deviceId: obj.deviceId || ''
      };

      if (eventId && candidate.eventId !== eventId) return;
      if (email && candidate.email && candidate.email.toLowerCase() === email.toLowerCase()) {
        results.push(candidate);
        return;
      }
      if (phone && candidate.phone && String(candidate.phone) === String(phone)) {
        results.push(candidate);
        return;
      }
      if (!email && !phone && eventId) {
        results.push(candidate);
        return;
      }
    });

    return ContentService.createTextOutput(JSON.stringify(results)).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON)
      .setStatusCode(500);
  }
}