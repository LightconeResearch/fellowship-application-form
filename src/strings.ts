export interface Option {
  slug: string;
  label: string;
}

export const CAREER_STAGES: Option[] = [
  { slug: 'phd',       label: 'PhD student' },
  { slug: 'postdoc',   label: 'Postdoc' },
  { slug: 'engineer',  label: 'Research engineer or staff scientist' },
  { slug: 'faculty',   label: 'Faculty or permanent researcher' },
  { slug: 'other',     label: 'Other' },
];

export const DOMAINS: Option[] = [
  { slug: 'astrophysics',   label: 'Astrophysics & cosmology' },
  { slug: 'particle',       label: 'Particle & nuclear physics' },
  { slug: 'earth-climate',  label: 'Earth & climate sciences' },
  { slug: 'life-sciences',  label: 'Life sciences' },
  { slug: 'chemistry',      label: 'Chemistry & materials' },
  { slug: 'cs-maths',       label: 'Computer science & applied maths' },
  { slug: 'social-sciences', label: 'Social sciences & humanities' },
  { slug: 'other',          label: 'Other' },
];

export const PROJECT_STATUSES: Option[] = [
  { slug: 'new',        label: 'A new project' },
  { slug: 'conversion', label: 'Conversion of an existing project' },
];

export const COMPUTE_RESOURCES: Option[] = [
  { slug: 'laptop',      label: 'Laptop or workstation' },
  { slug: 'lab-cluster', label: 'Lab or university cluster' },
  { slug: 'hpc-centre',  label: 'HPC centre' },
];

export const AVAILABILITIES: Option[] = [
  { slug: 'full',    label: 'Available for the full period' },
  { slug: 'partial', label: 'Partially available' },
];

export const WORKSHOP_ATTENDANCE: Option[] = [
  { slug: 'yes',    label: 'Yes' },
  { slug: 'no',     label: 'No' },
  { slug: 'unsure', label: 'Not sure yet' },
];

export const strings = {
  title: 'Lightcone Research Fellows — Application',
  intro: 'Apply to join the first cohort of Lightcone Research Fellows: carry out your own science project on the Lightcone stack, with direct support from our team, from 30 November to late February. Applications close on 13 November (end of day, AoE).',
  sectionAbout: 'About you',
  sectionProject: 'Your project',
  sectionCompute: 'Computing resources',
  sectionSupervision: 'PI or supervisor',
  sectionGroup: 'Group',
  sectionAvailability: 'Availability',
  sectionConsent: 'Data policy',
  labelName: 'Name',
  labelEmail: 'Email',
  labelInstitution: 'Institution',
  labelCareerStage: 'Career stage',
  labelDomain: 'Scientific domain',
  labelProjectDescription: 'Project description',
  labelProjectStatus: 'Current status',
  labelProjectGoals: 'What do you hope to achieve during the pilot?',
  labelComputeResources: 'Which computing resources will you use?',
  labelComputeDetails: 'Details (optional)',
  labelNersc: 'I have access to NERSC',
  labelCcin2p3: 'I have access to CC-IN2P3',
  labelPiName: 'PI or supervisor name',
  labelPiEmail: 'PI or supervisor email',
  labelPiAgreement: 'My PI or supervisor agrees to my participation in the pilot',
  labelGroupMembers: 'Other group members who would take part (optional)',
  labelAvailability: 'Availability over the pilot period (30 Nov – late Feb)',
  labelAvailabilityNotes: 'Please describe your availability',
  labelWorkshop: 'Can you attend the closing workshop in Paris (late February)?',
  labelConsent: 'I have read the data notice above and agree to my answers being processed as described',
  placeholderSelect: 'Select…',
  placeholderName: 'Your name',
  placeholderEmail: 'your@email.org',
  placeholderInstitution: 'University, lab…',
  placeholderOther: 'Please specify…',
  placeholderProjectDescription: 'The science question, data and methods',
  placeholderProjectGoals: 'E.g. a first analysis on the stack, converting an existing pipeline…',
  placeholderComputeDetails: 'E.g. cluster name, GPUs, allocation…',
  placeholderGroupMembers: 'Names, roles and emails',
  placeholderAvailabilityNotes: 'E.g. unavailable in January, ~50% of my time…',
  submit: 'Submit application',
  submitting: 'Submitting…',
  successTitle: 'Thank you!',
  successText: 'Your application has been received. We will get back to you by 20 November.',
  previewBanner: 'Preview — applications open on 30 October 2026. Submission is disabled.',
  notOpenTitle: 'Applications are not open yet',
  notOpenText: 'Applications open on 30 October 2026. Please come back then.',
  closedTitle: 'Applications are closed',
  closedText: 'Applications closed on 13 November 2026. Thank you for your interest in the Lightcone Research Fellows program.',
  errorMsg: 'An error occurred while submitting. Please try again or write to info@lightconeresearch.org if the problem persists.',
  requiredError: 'Please fill in all required fields.',
  emailError: 'Please enter a valid email address for yourself and your PI or supervisor.',
  piAgreementError: 'Your PI or supervisor must agree to your participation.',
  consentError: 'Please accept the data policy to submit your application.',
  dataNotice: 'Lightcone Research uses your answers only to select the first cohort of Fellows and, if you are selected, to organise your participation in the pilot. They are stored in Supabase (EU region) and shared with the selection committee in a restricted Google Sheet; they are not shared with anyone else. All application data is deleted 6 months after selection, by 20 May 2027. You may request access to, correction or deletion of your data at any time by writing to <a href="mailto:info@lightconeresearch.org">info@lightconeresearch.org</a>.',
};
