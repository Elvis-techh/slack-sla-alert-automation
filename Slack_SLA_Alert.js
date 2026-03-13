/***** CONFIG *****/
const CONFIG = {
  spreadsheetId: 'YOUR_SPREADSHEET_ID',
  sheetName: 'YOUR_SHEET_NAME',
  subject: 'Scheduled Status Update',
  matchHours: new Set([1, 2, 3]),                         
  testMode: false,                            
};

const WEBHOOK_PROP_KEY = 'SLACK_WEBHOOK_URL'; 

function SET_SLACK_WEBHOOK_ONCE() {
  const url = 'YOUR_SLACK_WEBHOOK_URL'; 
  PropertiesService.getScriptProperties().setProperty(WEBHOOK_PROP_KEY, url);
}

function slackPing() {
  const url = PropertiesService.getScriptProperties().getProperty(WEBHOOK_PROP_KEY);
  if (!url) throw new Error(`Script property ${WEBHOOK_PROP_KEY} is not set`);
  const resp = UrlFetchApp.fetch(url, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    payload: JSON.stringify({ text: 'Hello, World! ' }),
    muteHttpExceptions: true
  });
  Logger.log(`Ping -> ${resp.getResponseCode()} ${resp.getContentText()}`); 
}

function installHourlyTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'sendHourlyAlertToSlack') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('sendHourlyAlertToSlack').timeBased().everyHours(1).nearMinute(5).create();
}

function parseHoursLeft_(rawVal, displayVal) {
  const n1 = Number(rawVal);
  if (Number.isFinite(n1)) return n1;
  const s = String(displayVal ?? '').trim();
  if (!s) return NaN;
  const n2 = Number(parseFloat(s.replace(/[^0-9.\-]/g, '')));
  return Number.isFinite(n2) ? n2 : NaN;
}

function clean_(v) {
  return String(v).replace(/[\u0000-\u001F\u007F]/g, ' ').trim();
}

function toMonospaceTable_(rows) {
  const widths = [];
  for (const r of rows) r.forEach((c, i) => widths[i] = Math.max(widths[i] || 0, String(c ?? '').length));
  const pad = (v, i) => String(v ?? '').padEnd(widths[i], ' ');
  return rows.map(r => r.map(pad).join('  ')).join('\n');
}

function chunk_(str, max = 3500) {
  const out = [];
  for (let i = 0; i < str.length; i += max) out.push(str.slice(i, i + max));
  return out;
}

function sendHourlyAlertToSlack() {
  const ss = SpreadsheetApp.openById(CONFIG.spreadsheetId);
  const sh = ss.getSheetByName(CONFIG.sheetName);
  if (!sh) throw new Error(`Sheet "${CONFIG.sheetName}" not found`);
  SpreadsheetApp.flush();

  const lastRow = sh.getLastRow();
  if (lastRow < 2) {
    if (CONFIG.testMode) return postToSlack_(`*${CONFIG.subject}* [TEST MODE]\n_No data rows found._`);
    return;
  }
  const displayAE = sh.getRange(2, 1, lastRow - 1, 5).getDisplayValues().map(r => r.map(clean_));
  const rawAll    = sh.getRange(2, 1, lastRow - 1, 5).getValues();

  const rowsToSend = [];

  for (let i = 0; i < rawAll.length; i++) {
    if (CONFIG.testMode) {
      rowsToSend.push(displayAE[i].slice(0, 5));
      continue;
    }
    const hoursLeft = parseHoursLeft_(rawAll[i][4], displayAE[i][4]);
    if (Number.isFinite(hoursLeft) && CONFIG.matchHours.has(hoursLeft)) {
      rowsToSend.push(displayAE[i].slice(0, 5));
    }
  }

  if (rowsToSend.length === 0 && CONFIG.testMode) {
    return postToSlack_(`*${CONFIG.subject}* [TEST MODE]\n_No matching rows._`);
  }
  if (rowsToSend.length === 0) return;

  const headers = ['id_ref', 'unit_number', 'due_day', 'due_time', 'hours_left'];
  const tableText = toMonospaceTable_([headers, ...rowsToSend]);
  const prefix = CONFIG.testMode ? '[TEST MODE] ' : '';
  const fullText = `*${prefix}${CONFIG.subject}*\n\`\`\`\n${tableText}\n\`\`\``;

  for (const part of chunk_(fullText, 3500)) postToSlack_(part);
}


function postToSlack_(text) {
  const webhook = PropertiesService.getScriptProperties().getProperty(WEBHOOK_PROP_KEY);
  if (!webhook) throw new Error(`Script property ${WEBHOOK_PROP_KEY} is not set`);

  const resp = UrlFetchApp.fetch(webhook, {
    method: 'post',
    headers: { 'Content-Type': 'application/json' },
    payload: JSON.stringify({ text }),
    muteHttpExceptions: true
  });
  const code = resp.getResponseCode();
  const body = resp.getContentText();
  Logger.log(`Slack post -> ${code} ${body}`);
  if (code !== 200 || body !== 'ok') throw new Error(`Slack error ${code}: ${body}`);
}
