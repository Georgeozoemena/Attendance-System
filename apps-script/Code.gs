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
  'occupation', 'firstTimer', 'gender', 'nationality', 'department', 'deviceId', 'uniqueCode'
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
  const lock = LockService.getScriptLock();
  // Wait up to 30 seconds for other processes to finish.
  if (!lock.tryLock(30000)) {
    return ContentService.createTextOutput(JSON.stringify({ error: 'Server busy, try again.' }))
      .setMimeType(ContentService.MimeType.JSON)
      .setStatusCode(503);
  }

  try {
    if (!_checkKey(e)) {
      lock.releaseLock();
      return ContentService.createTextOutput(JSON.stringify({ error: 'invalid key' }))
        .setMimeType(ContentService.MimeType.JSON)
        .setStatusCode(401);
    }

    if (!e.postData || !e.postData.contents) {
      lock.releaseLock();
      return ContentService.createTextOutput(JSON.stringify({ error: 'no postData' }))
        .setMimeType(ContentService.MimeType.JSON)
        .setStatusCode(400);
    }

    const payload = JSON.parse(e.postData.contents);
    const now = new Date().toISOString();

    const sheet = _getSheet();
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    // Ensure headers exist
    const headerRange = sheet.getRange(1, 1, 1, COLS.length);
    if (values.length === 0) {
       headerRange.setValues([COLS]);
    } else {
       // Check if we need to update headers to include uniqueCode if it was missing 
       // (simplification: assume if header row exists, we just append to it, 
       // but typically we should ensure the header row matches COLS. 
       // For now, let's just proceed with reading data to find existing user)
    }

    // Logic to find existing uniqueCode
    const emailIndex = COLS.indexOf('email');
    const phoneIndex = COLS.indexOf('phone');
    const uniqueCodeIndex = COLS.indexOf('uniqueCode');
    
    let assignedCode = null;
    let maxCode = 0;

    // Skip header row
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const rowEmail = String(row[emailIndex] || '').toLowerCase();
      const rowPhone = String(row[phoneIndex] || '');
      const rowCode = String(row[uniqueCodeIndex] || '');

      // Check for match
      // Logic update: Only link if Email/Phone matches AND Name is similar
      // This prevents "Esther John" and "Esther Emmanuel" (sharing phone) from getting same ID
      if ((payload.email && rowEmail === payload.email.toLowerCase()) || 
          (payload.phone && rowPhone === String(payload.phone))) {
        
        // Check name similarity if both exist
        const rowName = String(row[3] || '').toLowerCase().trim();
        const payloadName = String(payload.name || '').toLowerCase().trim();
        
        // Simple similarity check: do they share at least one significant word?
        // e.g. "Esther John" and "Esther" -> match
        // e.g. "Esther John" and "Esther Emmanuel" -> match?
        // User requested: "Esther John and Esther Emmanuel... having same unique ID" is BAD.
        // So we want strict separation if names are clearly different content-wise.
        
        let samePerson = false;
        
        // If exact match
        if (rowName === payloadName) samePerson = true; 
        else if (rowName && payloadName) {
           const rowParts = rowName.split(/\s+/);
           const plParts = payloadName.split(/\s+/);
           
           // If they share > 50% of names? or just strict?
           // User wants: Esther John != Esther Emmanuel.
           // They share "Esther".
           // So sharing 1 name is NOT enough if they have other names that differ.
           
           // Let's try: if EVERY word in one name appears in the other?
           // e.g. "Esther" in "Esther John" -> yes (maybe shorthand).
           // "Esther John" in "Esther Emmanuel" -> NO. "John" is missing.
           
           // Logic: If payloadName is a subset of rowName OR rowName is a subset of payloadName.
           // This allows "Esther" to match "Esther John" (shorthand).
           // But "Esther John" vs "Esther Emmanuel" -> "John" not in "Esther Emmanuel" -> mismatch.
           
           const rowHasAllPl = plParts.every(p => rowParts.includes(p));
           const plHasAllRow = rowParts.every(p => plParts.includes(p));
           
           if (rowHasAllPl || plHasAllRow) {
             samePerson = true;
           }
        } else {
           // If one name is missing/empty, fall back to email/phone Match
           samePerson = true; 
        }

        if (samePerson && rowCode) {
          assignedCode = rowCode;
        }
      }

      // Track max code to generate new one if needed
      if (rowCode) {
        // Assume code is a number like "001"
        const num = parseInt(rowCode, 10);
        if (!isNaN(num) && num > maxCode) {
          maxCode = num;
        }
      }
    }

    // Generate new code if not found
    if (!assignedCode) {
      const nextNum = maxCode + 1;
      assignedCode = String(nextNum).padStart(3, '0');
    }

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
      payload.deviceId || '',
      assignedCode // New field
    ];

    
    // If headers were missing, we might have set them above, but we need to append effectively.
    // If values was empty, we appended headers. 
    // Just append row now.
    sheet.appendRow(row);

    const resp = {
      success: true,
      appended: {
        id: row[1],
        createdAt: row[0],
        eventId: row[2],
        name: row[3],
        email: row[4],
        phone: row[5],
        uniqueCode: assignedCode
      }
    };

    lock.releaseLock();
    return ContentService.createTextOutput(JSON.stringify(resp)).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    lock.releaseLock();
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

    const sheet = _getSheet();
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      return ContentService.createTextOutput(JSON.stringify([])).setMimeType(ContentService.MimeType.JSON);
    }

    const params = e.parameter || {};
    const email = params.email ? params.email.toLowerCase() : null;
    const phone = params.phone ? String(params.phone) : null;
    const eventId = params.eventId || null;

    let rows = [];
    
    // Optimization: If we have Phone or Email, search specifically for them first
    if (phone || email) {
      const finder = sheet.createTextFinder(phone || email).matchEntireCell(true);
      const occurrences = finder.findAll();
      occurrences.forEach(range => {
        const rowData = sheet.getRange(range.getRow(), 1, 1, COLS.length).getValues()[0];
        rows.push(rowData);
      });
    } else if (eventId) {
       // Filter by eventId - read only the eventId column first to find rows?
       // For now, if no email/phone, we still read the whole range, 
       // but we can limit it to specific columns if the sheet is huge.
       rows = sheet.getRange(2, 1, lastRow - 1, COLS.length).getValues();
    } else {
       // Admin view (all rows)
       rows = sheet.getRange(2, 1, lastRow - 1, COLS.length).getValues();
    }

    const results = [];
    rows.forEach((r) => {
      const candidate = {
        timestamp: r[0] || '',
        createdAt: r[0] || '',
        id: r[1] || '',
        eventId: r[2] || '',
        name: r[3] || '',
        email: r[4] || '',
        phone: r[5] || '',
        address: r[6] || '',
        occupation: r[7] || '',
        firstTimer: (r[8] === 'TRUE' || r[8] === true),
        gender: r[9] || '',
        nationality: r[10] || '',
        department: r[11] || '',
        deviceId: r[12] || '',
        uniqueCode: r[13] || ''
      };

      if (eventId && candidate.eventId !== eventId) return;
      if (email && candidate.email && candidate.email.toLowerCase() === email) {
        results.push(candidate);
        return;
      }
      if (phone && candidate.phone && String(candidate.phone) === phone) {
        results.push(candidate);
        return;
      }
      if (!email && !phone) {
        results.push(candidate);
      }
    });

    // Deduplicate results if TextFinder found multiple candidates for same row
    const uniqueResults = [];
    const seenIds = new Set();
    results.forEach(res => {
      if (!seenIds.has(res.id)) {
        seenIds.add(res.id);
        uniqueResults.push(res);
      }
    });

    return ContentService.createTextOutput(JSON.stringify(uniqueResults)).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON)
      .setStatusCode(500);
  }
}