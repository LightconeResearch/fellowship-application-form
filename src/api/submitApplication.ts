const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

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
  project_status: string;
  project_goals: string;
  agentic_fit: string;
  relevant_links?: string;
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

export async function submitApplication(data: ApplicationFormData): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Missing Supabase environment variables. ' +
      'Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    );
  }

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
    project_status:      data.project_status,
    project_goals:       data.project_goals,
    agentic_fit:         data.agentic_fit,
    relevant_links:      data.relevant_links || null,
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
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Submit failed (HTTP ${response.status}): ${errorText}`);
  }
}
