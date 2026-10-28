/**
 * Lightcone Research Fellows — Supabase → Google Sheet export.
 *
 * Bound to the selection committee's Sheet (Extensions → Apps Script).
 * Script Properties (Project Settings → Script Properties):
 *   SUPABASE_URL          https://xxxx.supabase.co
 *   SUPABASE_SERVICE_KEY  service_role key (only Sheet editors can see it)
 *
 * Rows are upserted into the "Applications" tab by application id. Only the
 * data columns (A → last COLUMNS entry) are written: committee columns added
 * to the right (notes, score, decision, decline reason…) are never touched.
 */

const SHEET_NAME = 'Applications';

// [header, column in fellowship_applications]
const COLUMNS = [
  ['ID', 'id'],
  ['Submitted at', 'submitted_at'],
  ['Name', 'name'],
  ['Email', 'email'],
  ['Institution', 'institution'],
  ['Career stage', 'career_stage'],
  ['Career stage (other)', 'career_stage_other'],
  ['Domain', 'domain'],
  ['Domain (other)', 'domain_other'],
  ['Project description', 'project_description'],
  ['Project status', 'project_status'],
  ['Pilot goals', 'project_goals'],
  ['Compute resources', 'compute_resources'],
  ['Compute details', 'compute_details'],
  ['NERSC access', 'nersc_access'],
  ['CC-IN2P3 access', 'ccin2p3_access'],
  ['PI / supervisor', 'pi_name'],
  ['PI email', 'pi_email'],
  ['PI agrees', 'pi_agreement'],
  ['Group members', 'group_members'],
  ['Availability', 'availability'],
  ['Availability notes', 'availability_notes'],
  ['Closing workshop', 'workshop_attendance'],
];

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Lightcone')
    .addItem('Refresh applications', 'refreshApplications')
    .addToUi();
}

/** Run once by hand to install the hourly refresh. */
function installHourlyTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === 'refreshApplications')
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger('refreshApplications').timeBased().everyHours(1).create();
}

function refreshApplications() {
  const props = PropertiesService.getScriptProperties();
  const url = props.getProperty('SUPABASE_URL');
  const key = props.getProperty('SUPABASE_SERVICE_KEY');
  if (!url || !key) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY in Script Properties.');

  const response = UrlFetchApp.fetch(
    `${url}/rest/v1/fellowship_applications?select=*&order=submitted_at.asc`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` }, muteHttpExceptions: true },
  );
  if (response.getResponseCode() !== 200) {
    throw new Error(`Supabase returned HTTP ${response.getResponseCode()}: ${response.getContentText()}`);
  }
  const applications = JSON.parse(response.getContentText());

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
  const width = COLUMNS.length;

  sheet.getRange(1, 1, 1, width)
    .setValues([COLUMNS.map(([header]) => header)])
    .setFontWeight('bold');
  sheet.setFrozenRows(1);

  // Existing ids → sheet row number.
  const rowById = new Map();
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 1).getValues()
      .forEach(([id], i) => { if (id) rowById.set(id, i + 2); });
  }

  let nextRow = Math.max(lastRow, 1) + 1;
  applications.forEach(application => {
    const values = COLUMNS.map(([, column]) => formatValue(application[column]));
    const row = rowById.get(application.id) || nextRow++;
    sheet.getRange(row, 1, 1, width).setValues([values]);
  });

  spreadsheet.toast(`${applications.length} applications synced.`, 'Lightcone');
}

function formatValue(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  // Applicant text must never be evaluated as a formula.
  if (typeof value === 'string' && /^[=+\-@]/.test(value)) return `'${value}`;
  return value;
}
