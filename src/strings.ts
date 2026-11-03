export interface Option {
  slug: string;
  label: string;
}

export const CAREER_STAGES: Option[] = [
  { slug: 'phd',       label: 'PhD student' },
  { slug: 'postdoc',   label: 'Postdoc' },
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

export const START_READINESS: Option[] = [
  { slug: 'yes',    label: 'Yes' },
  { slug: 'mostly', label: 'Mostly: a few things are still to come' },
  { slug: 'no',     label: 'Not yet' },
];

export const SHAREABLE_RESULTS: Option[] = [
  { slug: 'yes',   label: 'Yes' },
  { slug: 'maybe', label: 'Possibly' },
  { slug: 'no',    label: 'No' },
];

export const DATA_SHARING: Option[] = [
  { slug: 'public',  label: 'Yes: the data is public or can be made public' },
  { slug: 'partly',  label: 'Partly: some of the data is private or restricted' },
  { slug: 'private', label: 'No: the data must stay private' },
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
  title: 'Apply for the Lightcone Research',
  titleAccent: 'Fellowship',
  siteUrl: 'https://lightconeresearch.org/',
  intro: [
    'Join the first cohort of Lightcone Research Fellows, an interdisciplinary group of early-career researchers excited to build the future of research with AI agents. Bring your own project and carry it out with Lightcone’s tools, with hands-on support from our team.',
    'The fellowship runs remotely from early December to late February. Applications close on 20 November (end of day, AoE).',
  ],
  moreInfo: 'More information at',
  moreInfoUrl: 'https://lightconeresearch.org/fellowship',
  moreInfoLabel: 'lightconeresearch.org/fellowship',
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
  labelGithubUsername: 'GitHub username (optional)',
  labelCv: 'CV',
  hintCv: 'PDF, up to 5 MB.',
  labelCareerStage: 'Career stage',
  labelDomain: 'Scientific domain',
  labelProjectDescription: 'Project description',
  labelStartReady: 'Will you have everything you need to start on 1 December?',
  hintStartReady: 'E.g. your data, code and access to computing resources.',
  labelShareableResult: 'Do you expect to reach a publicly shareable result by the end of the fellowship, such as a preprint?',
  labelDataSharing: 'Can the data behind your project be shared publicly by the end of the fellowship?',
  hintDataSharing: 'This is not a requirement: projects using private data are welcome.',
  labelProjectGoals: 'What do you hope to achieve during the fellowship?',
  labelAgenticFit: 'Why is this project a good fit for working with AI agents?',
  labelRelevantLinks: 'Relevant code or previous work (optional)',
  labelComputeResources: 'Which computing resources will you use?',
  labelComputeDetails: 'Details (optional)',
  labelPiName: 'PI or supervisor name',
  labelPiEmail: 'PI or supervisor email',
  labelPiAgreement: 'My PI or supervisor agrees to my participation in the fellowship',
  labelGroupMembers: 'Other individuals involved on this project (optional)',
  labelAvailability: 'Availability during the fellowship (early Dec – late Feb)',
  labelAvailabilityNotes: 'Please describe your availability',
  labelWorkshop: 'Can you attend the Paris Agentic AI for Science Summit (late February)?',
  labelConsent: 'I have read the data notice above and agree to my answers being processed as described',
  placeholderSelect: 'Select…',
  placeholderName: 'Your name',
  placeholderEmail: 'your@email.org',
  placeholderInstitution: 'University, lab…',
  placeholderGithubUsername: 'your-username',
  placeholderOther: 'Please specify…',
  placeholderProjectDescription: 'The science question, data and methods',
  placeholderProjectGoals: 'E.g. learn and help build best practices for AI-assisted research, complete an analysis ready for publication, make an existing analysis easier to check and reuse…',
  placeholderAgenticFit: 'E.g. which parts of the work you would hand to an agent, and what you expect to gain',
  placeholderRelevantLinks: 'Links to GitHub repositories, arXiv papers or other work related to your project, one per line',
  placeholderComputeDetails: 'E.g. cluster name, GPUs, allocation…',
  placeholderGroupMembers: 'Names, roles and emails',
  placeholderAvailabilityNotes: 'E.g. unavailable in January, ~50% of my time…',
  submit: 'Submit application',
  submitting: 'Submitting…',
  successTitle: 'Thank you!',
  successText: 'Your application has been received. We will get back to you by 23 November.',
  previewBanner: 'Preview — applications open on 30 October 2026. Submission is disabled.',
  notOpenTitle: 'Applications are not open yet',
  notOpenText: 'Applications open on 30 October 2026. Please come back then.',
  closedTitle: 'Applications are closed',
  closedText: 'Applications closed on 20 November 2026. Thank you for your interest in the Lightcone Research Fellowship.',
  errorMsg: 'An error occurred while submitting. Please try again or write to info@lightconeresearch.org if the problem persists.',
  requiredError: 'Please fill in all required fields.',
  emailError: 'Please enter a valid email address for yourself and your PI or supervisor.',
  cvSizeError: 'Your CV must be 5 MB or smaller.',
  cvTypeError: 'Please upload your CV as a PDF.',
  piAgreementError: 'Your PI or supervisor must agree to your participation.',
  consentError: 'Please accept the data policy to submit your application.',
  dataNotice: 'Lightcone Research uses your answers and CV only to select the first cohort of Fellows and, if you are selected, to organise your participation in the fellowship. They are stored securely and seen only by the selection committee. All application data, including CVs, is deleted by 20 May 2027. You may request access to, correction or deletion of your data at any time by writing to <a href="mailto:info@lightconeresearch.org">info@lightconeresearch.org</a>.',
};
