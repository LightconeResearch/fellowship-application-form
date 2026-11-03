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
 *
 * CVs live in the private `cvs` Storage bucket. Each refresh writes a fresh
 * signed link that expires after CV_LINK_SECONDS, so a copied link stops
 * working the next day. It also deletes CVs that no application points at
 * after ORPHAN_CV_MINUTES: uploads whose submission failed or was abandoned.
 *
 * Run by hand once: installHourlyTrigger() and installRetentionTrigger().
 */

const SHEET_NAME = 'Applications';
const CV_BUCKET = 'cvs';
const CV_LINK_SECONDS = 24 * 60 * 60;
// The form uploads the CV a moment before it submits the application, so give
// a submission in flight plenty of time before treating its CV as abandoned.
const ORPHAN_CV_MINUTES = 60;
// Keep in sync with the retention job in supabase/schema.sql.
const RETENTION_AT = new Date('2027-05-20T03:00:00Z');

// [header, column in fellowship_applications]
const COLUMNS = [
  ['ID', 'id'],
  ['Submitted at', 'submitted_at'],
  ['Name', 'name'],
  ['Email', 'email'],
  ['Institution', 'institution'],
  ['GitHub username', 'github_username'],
  ['CV', 'cv_url'],
  ['Career stage', 'career_stage'],
  ['Career stage (other)', 'career_stage_other'],
  ['Domain', 'domain'],
  ['Domain (other)', 'domain_other'],
  ['Project description', 'project_description'],
  ['Project status', 'project_status'],  // no longer asked; earlier applications only
  ['Ready on 1 Dec', 'start_ready'],
  ['Fellowship goals', 'project_goals'],
  ['Fit for AI agents', 'agentic_fit'],
  ['Shareable result', 'shareable_result'],
  ['Data shareable', 'data_sharing'],
  ['Relevant code or work', 'relevant_links'],
  ['Compute resources', 'compute_resources'],
  ['Compute details', 'compute_details'],
  ['PI / supervisor', 'pi_name'],
  ['PI email', 'pi_email'],
  ['PI agrees', 'pi_agreement'],
  ['Other individuals', 'group_members'],
  ['Availability', 'availability'],
  ['Availability notes', 'availability_notes'],
  ['Paris summit', 'workshop_attendance'],
];

// Headers earlier versions of this script wrote. Seeing one where a data column
// now goes is expected; seeing anything else means a committee column is there.
const PREVIOUS_HEADERS = [
  'Pilot goals', 'NERSC access', 'CC-IN2P3 access', 'Group members', 'Closing workshop',
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

/** Run once by hand to schedule the deletion of every CV on the retention date. */
function installRetentionTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === 'deleteAllCvs')
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger('deleteAllCvs').timeBased().at(RETENTION_AT).create();
}

function supabaseConfig() {
  const props = PropertiesService.getScriptProperties();
  const url = props.getProperty('SUPABASE_URL');
  const key = props.getProperty('SUPABASE_SERVICE_KEY');
  if (!url || !key) throw new Error('Set SUPABASE_URL and SUPABASE_SERVICE_KEY in Script Properties.');
  return { url, key };
}

/** Calls Supabase with the service role and returns the parsed JSON body. */
function supabaseFetch(path, options = {}) {
  const { url, key } = supabaseConfig();
  const params = {
    method: options.method || 'get',
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    muteHttpExceptions: true,
  };
  if (options.payload) {
    params.contentType = 'application/json';
    params.payload = options.payload;
  }
  const response = UrlFetchApp.fetch(`${url}${path}`, params);
  const code = response.getResponseCode();
  if (code < 200 || code >= 300) {
    throw new Error(`Supabase returned HTTP ${code} for ${path}: ${response.getContentText()}`);
  }
  return JSON.parse(response.getContentText() || 'null');
}

/** cv_path → signed link valid for CV_LINK_SECONDS. */
function signCvLinks(paths) {
  const links = new Map();
  if (paths.length === 0) return links;
  const { url } = supabaseConfig();
  const signed = supabaseFetch(`/storage/v1/object/sign/${CV_BUCKET}`, {
    method: 'post',
    payload: JSON.stringify({ expiresIn: CV_LINK_SECONDS, paths }),
  });
  signed.forEach(({ path, signedURL, error }) => {
    if (signedURL && !error) links.set(path, `${url}/storage/v1${signedURL}`);
  });
  return links;
}

/**
 * Deletes every file in the `cvs` bucket, including CVs whose application was
 * never submitted. Runs on the retention date (installRetentionTrigger) and can
 * be run by hand; it is safe to run more than once.
 */
function deleteAllCvs() {
  const files = listCvs();
  files.forEach(file => deleteCv(file.name));
  console.log(`Deleted ${files.length} CVs.`);
}

/** Every file in the `cvs` bucket, as returned by the Storage list API. */
function listCvs() {
  const files = [];
  for (let offset = 0; ; offset += 100) {
    const page = supabaseFetch(`/storage/v1/object/list/${CV_BUCKET}`, {
      method: 'post',
      payload: JSON.stringify({ prefix: '', limit: 100, offset, sortBy: { column: 'name', order: 'asc' } }),
    });
    page.filter(file => file.id).forEach(file => files.push(file));
    if (page.length < 100) break;
  }
  return files;
}

// Files must be deleted through the Storage API: deleting the row from SQL
// would leave the file itself in object storage.
function deleteCv(name) {
  supabaseFetch(`/storage/v1/object/${CV_BUCKET}/${encodeURIComponent(name)}`, { method: 'delete' });
}

/** Deletes CVs older than ORPHAN_CV_MINUTES that no application points at. */
function deleteOrphanCvs(applications) {
  const referenced = new Set(applications.map(a => a.cv_path).filter(Boolean));
  const cutoff = Date.now() - ORPHAN_CV_MINUTES * 60 * 1000;
  const orphans = listCvs().filter(file =>
    !referenced.has(file.name) && new Date(file.created_at).getTime() < cutoff,
  );
  orphans.forEach(file => deleteCv(file.name));
  if (orphans.length > 0) console.log(`Deleted ${orphans.length} orphan CVs.`);
}

function refreshApplications() {
  const applications = supabaseFetch('/rest/v1/fellowship_applications?select=*&order=submitted_at.asc');
  deleteOrphanCvs(applications);
  const cvLinks = signCvLinks(applications.map(a => a.cv_path).filter(Boolean));
  applications.forEach(application => {
    application.cv_url = cvLinks.get(application.cv_path) || null;
  });
  const cvColumn = COLUMNS.findIndex(([, column]) => column === 'cv_url') + 1;

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
  const width = COLUMNS.length;
  assertNoCommitteeColumnsInTheWay(sheet, width);

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
    if (application.cv_url) {
      sheet.getRange(row, cvColumn).setRichTextValue(
        SpreadsheetApp.newRichTextValue().setText('Open CV').setLinkUrl(application.cv_url).build(),
      );
    }
  });

  spreadsheet.toast(`${applications.length} applications synced.`, 'Lightcone');
}

/**
 * The data columns are written by position, so when COLUMNS grows they would
 * overwrite the committee's own columns to their right. Stop instead, and say
 * how many empty columns to insert.
 */
function assertNoCommitteeColumnsInTheWay(sheet, width) {
  const lastColumn = sheet.getLastColumn();
  if (lastColumn === 0) return;
  const known = new Set([...COLUMNS.map(([header]) => header), ...PREVIOUS_HEADERS]);
  const headers = sheet.getRange(1, 1, 1, Math.min(lastColumn, width)).getValues()[0];
  const first = headers.findIndex(header => header !== '' && !known.has(header));
  if (first === -1) return;
  const missing = width - first;
  const column = sheet.getRange(1, first + 1).getA1Notation().replace(/\d+/, '');
  throw new Error(
    `Column ${column} ("${headers[first]}") would be overwritten. ` +
    `Insert ${missing} empty column(s) to the left of column ${column}, then refresh again.`,
  );
}

function formatValue(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  // Applicant text must never be evaluated as a formula.
  if (typeof value === 'string' && /^[=+\-@]/.test(value)) return `'${value}`;
  return value;
}
