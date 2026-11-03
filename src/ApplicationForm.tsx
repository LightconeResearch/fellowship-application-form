import { useState } from 'react';
import {
  strings as t,
  CAREER_STAGES,
  DOMAINS,
  START_READINESS,
  SHAREABLE_RESULTS,
  DATA_SHARING,
  COMPUTE_RESOURCES,
  AVAILABILITIES,
  WORKSHOP_ATTENDANCE,
} from './strings';
import type { Option } from './strings';
import { currentTime, isPreview, windowState } from './config';
import { CV_MAX_BYTES, looksLikePdf, submitApplication, uploadCv } from './api/submitApplication';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Required() {
  return <span className="required" aria-hidden="true">*</span>;
}

function RadioGroup({ name, label, hint, options, value, onChange }: {
  name: string;
  label: string;
  hint?: string;
  options: Option[];
  value: string;
  onChange: (slug: string) => void;
}) {
  return (
    <div className="field">
      <span className="field-label" id={`${name}-label`}>{label}<Required /></span>
      {hint && <p className="field-hint field-hint-above" id={`${name}-hint`}>{hint}</p>}
      <div
        className="checkbox-list"
        role="radiogroup"
        aria-labelledby={`${name}-label`}
        aria-describedby={hint ? `${name}-hint` : undefined}
      >
        {options.map(option => (
          <label className="checkbox-item" key={option.slug}>
            <input
              type="radio"
              name={name}
              checked={value === option.slug}
              onChange={() => onChange(option.slug)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function SelectWithOther({ id, label, options, value, onChange, other, onOtherChange }: {
  id: string;
  label: string;
  options: Option[];
  value: string;
  onChange: (slug: string) => void;
  other: string;
  onOtherChange: (text: string) => void;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}<Required /></label>
      <select id={id} required value={value} onChange={e => onChange(e.target.value)}>
        <option value="" disabled>{t.placeholderSelect}</option>
        {options.map(option => (
          <option key={option.slug} value={option.slug}>{option.label}</option>
        ))}
      </select>
      {value === 'other' && (
        <div className="other-input">
          <input
            type="text"
            placeholder={t.placeholderOther}
            value={other}
            onChange={e => onOtherChange(e.target.value)}
            aria-label={`${label}: ${t.placeholderOther}`}
          />
        </div>
      )}
    </div>
  );
}

function StatusCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="form-card">
      <div className="thank-you">
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </div>
  );
}

export default function ApplicationForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [institution, setInstitution] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [cv, setCv] = useState<File | null>(null);
  const [cvError, setCvError] = useState('');
  const [careerStage, setCareerStage] = useState('');
  const [careerStageOther, setCareerStageOther] = useState('');
  const [domain, setDomain] = useState('');
  const [domainOther, setDomainOther] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [startReady, setStartReady] = useState('');
  const [shareableResult, setShareableResult] = useState('');
  const [dataSharing, setDataSharing] = useState('');
  const [projectGoals, setProjectGoals] = useState('');
  const [agenticFit, setAgenticFit] = useState('');
  const [relevantLinks, setRelevantLinks] = useState('');
  const [computeResources, setComputeResources] = useState<Set<string>>(new Set());
  const [computeDetails, setComputeDetails] = useState('');
  const [piName, setPiName] = useState('');
  const [piEmail, setPiEmail] = useState('');
  const [piAgreement, setPiAgreement] = useState(false);
  const [groupMembers, setGroupMembers] = useState('');
  const [availability, setAvailability] = useState('');
  const [availabilityNotes, setAvailabilityNotes] = useState('');
  const [workshopAttendance, setWorkshopAttendance] = useState('');
  const [consent, setConsent] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const state = windowState(currentTime());
  const previewing = state === 'not-open' && isPreview();

  function toggleComputeResource(slug: string) {
    setComputeResources(prev => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  async function handleCvChange(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0] ?? null;
    setCv(null);
    setCvError('');
    if (!file) return;
    if (file.size > CV_MAX_BYTES) {
      setCvError(t.cvSizeError);
    } else if (!(await looksLikePdf(file))) {
      setCvError(t.cvTypeError);
    } else {
      setCv(file);
      return;
    }
    input.value = '';
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const requiredText = [
      name, email, institution, careerStage, domain,
      projectDescription, startReady, projectGoals, agenticFit, shareableResult, dataSharing,
      piName, piEmail, availability, workshopAttendance,
    ];
    if (
      requiredText.some(value => !value.trim()) ||
      !cv ||
      computeResources.size === 0 ||
      (availability === 'partial' && !availabilityNotes.trim())
    ) {
      setError(t.requiredError);
      return;
    }
    if (!EMAIL_RE.test(email.trim()) || !EMAIL_RE.test(piEmail.trim())) {
      setError(t.emailError);
      return;
    }
    if (!piAgreement) {
      setError(t.piAgreementError);
      return;
    }
    if (!consent) {
      setError(t.consentError);
      return;
    }
    setSubmitting(true);
    try {
      const cvPath = await uploadCv(cv);
      await submitApplication({
        name: name.trim(),
        email: email.trim(),
        institution: institution.trim(),
        github_username: githubUsername.trim().replace(/^@/, '') || undefined,
        career_stage: careerStage,
        career_stage_other: careerStage === 'other' ? careerStageOther.trim() || undefined : undefined,
        domain,
        domain_other: domain === 'other' ? domainOther.trim() || undefined : undefined,
        project_description: projectDescription.trim(),
        start_ready: startReady,
        shareable_result: shareableResult,
        data_sharing: dataSharing,
        project_goals: projectGoals.trim(),
        agentic_fit: agenticFit.trim(),
        relevant_links: relevantLinks.trim() || undefined,
        cv_path: cvPath,
        compute_resources: Array.from(computeResources),
        compute_details: computeDetails.trim() || undefined,
        pi_name: piName.trim(),
        pi_email: piEmail.trim(),
        pi_agreement: piAgreement,
        group_members: groupMembers.trim() || undefined,
        availability,
        availability_notes: availability === 'partial' ? availabilityNotes.trim() : undefined,
        workshop_attendance: workshopAttendance,
        consent_data_policy: consent,
      });
      setSubmitted(true);
    } catch (err) {
      setError(t.errorMsg);
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) return <StatusCard title={t.successTitle} text={t.successText} />;
  if (state === 'not-open' && !previewing) return <StatusCard title={t.notOpenTitle} text={t.notOpenText} />;
  if (state === 'closed') return <StatusCard title={t.closedTitle} text={t.closedText} />;

  return (
    <div className="form-card">
      {/* Header */}
      <div className="form-header">
        <img src={`${import.meta.env.BASE_URL}logo-primary.svg`} alt="Lightcone Research" className="form-logo" />
      </div>

      {previewing && <p className="preview-banner" role="status">{t.previewBanner}</p>}

      <h1 className="form-title">{t.title}</h1>
      <div className="form-intro">
        {t.intro.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
        <p>{t.moreInfo} <a href={t.moreInfoUrl}>{t.moreInfoLabel}</a>.</p>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        {/* ── About you ───────────────────────────────────────── */}
        <section className="form-section" aria-labelledby="section-about">
          <h2 className="section-heading" id="section-about">{t.sectionAbout}</h2>

          <div className="field">
            <label htmlFor="name">{t.labelName}<Required /></label>
            <input
              id="name"
              type="text"
              required
              autoComplete="name"
              placeholder={t.placeholderName}
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="email">{t.labelEmail}<Required /></label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder={t.placeholderEmail}
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="institution">{t.labelInstitution}<Required /></label>
            <input
              id="institution"
              type="text"
              required
              autoComplete="organization"
              placeholder={t.placeholderInstitution}
              value={institution}
              onChange={e => setInstitution(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="github-username">{t.labelGithubUsername}</label>
            <input
              id="github-username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder={t.placeholderGithubUsername}
              value={githubUsername}
              onChange={e => setGithubUsername(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="cv">{t.labelCv}<Required /></label>
            <input
              id="cv"
              type="file"
              required
              accept="application/pdf,.pdf"
              aria-describedby="cv-hint"
              aria-invalid={cvError ? true : undefined}
              onChange={handleCvChange}
            />
            <p className="field-hint" id="cv-hint">{t.hintCv}</p>
            {cvError && <p className="error-msg field-error" role="alert">{cvError}</p>}
          </div>

          <SelectWithOther
            id="career-stage"
            label={t.labelCareerStage}
            options={CAREER_STAGES}
            value={careerStage}
            onChange={setCareerStage}
            other={careerStageOther}
            onOtherChange={setCareerStageOther}
          />

          <SelectWithOther
            id="domain"
            label={t.labelDomain}
            options={DOMAINS}
            value={domain}
            onChange={setDomain}
            other={domainOther}
            onOtherChange={setDomainOther}
          />
        </section>

        {/* ── Project ─────────────────────────────────────────── */}
        <section className="form-section" aria-labelledby="section-project">
          <h2 className="section-heading" id="section-project">{t.sectionProject}</h2>

          <div className="field">
            <label htmlFor="project-description">{t.labelProjectDescription}<Required /></label>
            <textarea
              id="project-description"
              className="textarea-longest"
              required
              placeholder={t.placeholderProjectDescription}
              value={projectDescription}
              onChange={e => setProjectDescription(e.target.value)}
            />
          </div>

          <RadioGroup
            name="start-ready"
            label={t.labelStartReady}
            hint={t.hintStartReady}
            options={START_READINESS}
            value={startReady}
            onChange={setStartReady}
          />

          <div className="field">
            <label htmlFor="project-goals">{t.labelProjectGoals}<Required /></label>
            <textarea
              id="project-goals"
              className="textarea-long"
              required
              placeholder={t.placeholderProjectGoals}
              value={projectGoals}
              onChange={e => setProjectGoals(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="agentic-fit">{t.labelAgenticFit}<Required /></label>
            <textarea
              id="agentic-fit"
              className="textarea-long"
              required
              placeholder={t.placeholderAgenticFit}
              value={agenticFit}
              onChange={e => setAgenticFit(e.target.value)}
            />
          </div>

          <RadioGroup
            name="shareable-result"
            label={t.labelShareableResult}
            options={SHAREABLE_RESULTS}
            value={shareableResult}
            onChange={setShareableResult}
          />

          <RadioGroup
            name="data-sharing"
            label={t.labelDataSharing}
            hint={t.hintDataSharing}
            options={DATA_SHARING}
            value={dataSharing}
            onChange={setDataSharing}
          />

          <div className="field">
            <label htmlFor="relevant-links">{t.labelRelevantLinks}</label>
            <textarea
              id="relevant-links"
              placeholder={t.placeholderRelevantLinks}
              value={relevantLinks}
              onChange={e => setRelevantLinks(e.target.value)}
            />
          </div>
        </section>

        {/* ── Computing resources ─────────────────────────────── */}
        <section className="form-section" aria-labelledby="section-compute">
          <h2 className="section-heading" id="section-compute">{t.sectionCompute}</h2>

          <div className="field">
            <span className="field-label" id="compute-label">{t.labelComputeResources}<Required /></span>
            <div className="checkbox-list" role="group" aria-labelledby="compute-label">
              {COMPUTE_RESOURCES.map(resource => (
                <label className="checkbox-item" key={resource.slug}>
                  <input
                    type="checkbox"
                    checked={computeResources.has(resource.slug)}
                    onChange={() => toggleComputeResource(resource.slug)}
                  />
                  <span>{resource.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="field">
            <label htmlFor="compute-details">{t.labelComputeDetails}</label>
            <input
              id="compute-details"
              type="text"
              placeholder={t.placeholderComputeDetails}
              value={computeDetails}
              onChange={e => setComputeDetails(e.target.value)}
            />
          </div>
        </section>

        {/* ── Supervision ─────────────────────────────────────── */}
        <section className="form-section" aria-labelledby="section-supervision">
          <h2 className="section-heading" id="section-supervision">{t.sectionSupervision}</h2>

          <div className="field">
            <label htmlFor="pi-name">{t.labelPiName}<Required /></label>
            <input
              id="pi-name"
              type="text"
              required
              value={piName}
              onChange={e => setPiName(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="pi-email">{t.labelPiEmail}<Required /></label>
            <input
              id="pi-email"
              type="email"
              required
              value={piEmail}
              onChange={e => setPiEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={piAgreement}
                onChange={e => setPiAgreement(e.target.checked)}
              />
              <span>{t.labelPiAgreement}<Required /></span>
            </label>
          </div>
        </section>

        {/* ── Group ───────────────────────────────────────────── */}
        <section className="form-section" aria-labelledby="section-group">
          <h2 className="section-heading" id="section-group">{t.sectionGroup}</h2>

          <div className="field">
            <label htmlFor="group-members">{t.labelGroupMembers}</label>
            <textarea
              id="group-members"
              placeholder={t.placeholderGroupMembers}
              value={groupMembers}
              onChange={e => setGroupMembers(e.target.value)}
            />
          </div>
        </section>

        {/* ── Availability ────────────────────────────────────── */}
        <section className="form-section" aria-labelledby="section-availability">
          <h2 className="section-heading" id="section-availability">{t.sectionAvailability}</h2>

          <RadioGroup
            name="availability"
            label={t.labelAvailability}
            options={AVAILABILITIES}
            value={availability}
            onChange={setAvailability}
          />

          {availability === 'partial' && (
            <div className="field">
              <label htmlFor="availability-notes">{t.labelAvailabilityNotes}<Required /></label>
              <input
                id="availability-notes"
                type="text"
                required
                placeholder={t.placeholderAvailabilityNotes}
                value={availabilityNotes}
                onChange={e => setAvailabilityNotes(e.target.value)}
              />
            </div>
          )}

          <RadioGroup
            name="workshop"
            label={t.labelWorkshop}
            options={WORKSHOP_ATTENDANCE}
            value={workshopAttendance}
            onChange={setWorkshopAttendance}
          />
        </section>

        {/* ── Data policy ─────────────────────────────────────── */}
        <section className="form-section" aria-labelledby="section-consent">
          <h2 className="section-heading" id="section-consent">{t.sectionConsent}</h2>

          <div
            className="gdpr-notice"
            dangerouslySetInnerHTML={{ __html: t.dataNotice }}
          />

          <div className="field">
            <label className="checkbox-item">
              <input
                type="checkbox"
                checked={consent}
                onChange={e => setConsent(e.target.checked)}
              />
              <span>{t.labelConsent}<Required /></span>
            </label>
          </div>
        </section>

        {/* ── Submit ──────────────────────────────────────────── */}
        <div className="submit-area">
          <button type="submit" className="btn-submit" disabled={submitting || previewing}>
            {submitting ? t.submitting : t.submit}
          </button>
          {error && <p className="error-msg" role="alert">{error}</p>}
        </div>
      </form>
    </div>
  );
}
