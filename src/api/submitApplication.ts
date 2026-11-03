const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
// The publishable key (sb_publishable_…): safe to ship, it only reaches what
// the database grants and RLS policies allow anon.
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

// Keep in sync with the `cvs` bucket in supabase/schema.sql.
const CV_BUCKET = 'cvs';
export const CV_MAX_BYTES = 5 * 1024 * 1024;

export interface ApplicationFormData {
  name: string;
  email: string;
  institution: string;
  github_username?: string;
  career_stage: string;
  career_stage_other?: string;
  domain: string;
  domain_other?: string;
  project_description: string;
  start_ready: string;
  shareable_result: string;
  data_sharing: string;
  project_goals: string;
  agentic_fit: string;
  relevant_links?: string;
  cv_path: string;
  compute_resources: string[];
  compute_details?: string;
  pi_name: string;
  pi_email: string;
  pi_agreement: boolean;
  group_members?: string;
  availability: string;
  availability_notes?: string;
  workshop_attendance: string;
  consent_data_policy: boolean;
}

function requireConfig() {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.'
    );
  }
}

/** True when the file starts with the PDF signature, whatever its name or type. */
export async function looksLikePdf(file: File): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  return String.fromCharCode(...head) === '%PDF-';
}

/**
 * Uploads the CV to the private `cvs` bucket under a random name and returns
 * that name. Anonymous visitors may upload during the application window but
 * can never read, list or overwrite files.
 */
export async function uploadCv(file: File): Promise<string> {
  requireConfig();
  const path = `${crypto.randomUUID()}.pdf`;
  const response = await fetch(`${SUPABASE_URL}/storage/v1/object/${CV_BUCKET}/${path}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_PUBLISHABLE_KEY,
      'Content-Type': 'application/pdf',
      'x-upsert': 'false',
    },
    body: file,
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`CV upload failed (HTTP ${response.status}): ${errorText}`);
  }
  return path;
}

export async function submitApplication(data: ApplicationFormData): Promise<void> {
  requireConfig();

  const payload = {
    name:                data.name,
    email:               data.email,
    institution:         data.institution,
    github_username:     data.github_username || null,
    career_stage:        data.career_stage,
    career_stage_other:  data.career_stage_other || null,
    domain:              data.domain,
    domain_other:        data.domain_other || null,
    project_description: data.project_description,
    start_ready:         data.start_ready,
    shareable_result:    data.shareable_result,
    data_sharing:        data.data_sharing,
    project_goals:       data.project_goals,
    agentic_fit:         data.agentic_fit,
    relevant_links:      data.relevant_links || null,
    cv_path:             data.cv_path,
    compute_resources:   data.compute_resources,
    compute_details:     data.compute_details || null,
    pi_name:             data.pi_name,
    pi_email:            data.pi_email,
    pi_agreement:        data.pi_agreement,
    group_members:       data.group_members || null,
    availability:        data.availability,
    availability_notes:  data.availability_notes || null,
    workshop_attendance: data.workshop_attendance,
    consent_data_policy: data.consent_data_policy,
  };

  const response = await fetch(`${SUPABASE_URL}/rest/v1/fellowship_applications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_PUBLISHABLE_KEY,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Submit failed (HTTP ${response.status}): ${errorText}`);
  }
}
