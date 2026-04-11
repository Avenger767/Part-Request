/**
 * pages/index.js
 *
 * AFG Part Procurement Request form.
 *
 * ── Editing dropdown values ──────────────────────────────────────────────────
 * Each <select> is driven by an array defined near the top of this file.
 * Search for "DROPDOWN VALUES" to find them all.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { useState } from 'react';
import Head from 'next/head';
import styles from '../styles/form.module.css';

// ── DROPDOWN VALUES ──────────────────────────────────────────────────────────
// Edit these arrays to change what appears in each dropdown.

const TRAINING_CENTERS = ['DFW2', 'ATL1', 'LAX3', 'ORD4', 'JFK5'];

const SIMULATORS = [
  'Select Simulator',
  'SIM-01',
  'SIM-02',
  'SIM-03',
  'SIM-04',
  'SIM-05',
];

const PRIORITIES = [
  'D - General Item',
  'A - Aircraft On Ground (AOG)',
  'B - Schedule Risk',
  'C - Deferred MEL',
];
// ────────────────────────────────────────────────────────────────────────────

/** Today's date as YYYY-MM-DD for the date input default */
function todayISO() {
  return new Date().toISOString().split('T')[0];
}

export default function Home() {
  // ── Form state ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    date: todayISO(),
    technician: '',
    trainingCenter: 'DFW2',
    simulator: 'Select Simulator',
    priority: 'D - General Item',
    discrepancyNumber: '',
    partNumber: '',
    partDescription: '',
    quantity: '1',
    reason: '',
    repairablePartNumber: '',
    repairablePartDescription: '',
    repairableSerialNumber: '',
  });

  const [photos, setPhotos] = useState([]); // FileList or array
  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'
  const [errorMsg, setErrorMsg] = useState('');

  // ── Change handlers ────────────────────────────────────────────────────────
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handlePhotoChange(e) {
    setPhotos(Array.from(e.target.files || []));
  }

  // ── Submit handler ─────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    setStatus('submitting');
    setErrorMsg('');

    try {
      const body = new FormData();

      // Append all text fields
      Object.entries(form).forEach(([key, value]) => body.append(key, value));

      // Append each photo
      photos.forEach((file) => body.append('photos', file));

      const res = await fetch('/api/submit', { method: 'POST', body });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Submission failed.');
      }

      setStatus('success');
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected error occurred.');
      setStatus('error');
    }
  }

  // ── Reset after success ───────────────────────────────────────────────────
  function handleReset() {
    setForm({
      date: todayISO(),
      technician: '',
      trainingCenter: 'DFW2',
      simulator: 'Select Simulator',
      priority: 'D - General Item',
      discrepancyNumber: '',
      partNumber: '',
      partDescription: '',
      quantity: '1',
      reason: '',
      repairablePartNumber: '',
      repairablePartDescription: '',
      repairableSerialNumber: '',
    });
    setPhotos([]);
    setStatus('idle');
    setErrorMsg('');
  }

  // ── Success screen ─────────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div className={styles.container}>
        <div className={styles.successBox}>
          <h2>✅ Request Submitted</h2>
          <p>Your parts request has been submitted and emailed successfully.</p>
          <button className={styles.btn} onClick={handleReset}>
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <>
      <Head>
        <title>AFG Part Request</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.container}>
        <h1 className={styles.title}>AFG Part Procurement Request</h1>

        <form onSubmit={handleSubmit} encType="multipart/form-data">

          {/* ── General Information ─────────────────────────────────────── */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>General Information</h2>

            <div className={styles.row}>
              <label className={styles.label}>
                Date <span className={styles.req}>*</span>
                <input
                  className={styles.input}
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  required
                />
              </label>

              <label className={styles.label}>
                Technician <span className={styles.req}>*</span>
                <input
                  className={styles.input}
                  type="text"
                  name="technician"
                  value={form.technician}
                  onChange={handleChange}
                  placeholder="Full name"
                  required
                />
              </label>
            </div>

            <div className={styles.row}>
              <label className={styles.label}>
                Training Center
                <select
                  className={styles.input}
                  name="trainingCenter"
                  value={form.trainingCenter}
                  onChange={handleChange}
                >
                  {TRAINING_CENTERS.map((tc) => (
                    <option key={tc} value={tc}>{tc}</option>
                  ))}
                </select>
              </label>

              <label className={styles.label}>
                Simulator <span className={styles.req}>*</span>
                <select
                  className={styles.input}
                  name="simulator"
                  value={form.simulator}
                  onChange={handleChange}
                  required
                >
                  {SIMULATORS.map((s) => (
                    <option key={s} value={s} disabled={s === 'Select Simulator'}>{s}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className={styles.row}>
              <label className={styles.label}>
                Priority
                <select
                  className={styles.input}
                  name="priority"
                  value={form.priority}
                  onChange={handleChange}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>

              <label className={styles.label}>
                Discrepancy Number
                <input
                  className={styles.input}
                  type="text"
                  name="discrepancyNumber"
                  value={form.discrepancyNumber}
                  onChange={handleChange}
                  placeholder="e.g. DISC-2024-001"
                />
              </label>
            </div>

            <label className={styles.label}>
              Photos
              <input
                className={styles.input}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                multiple
                onChange={handlePhotoChange}
              />
              {photos.length > 0 && (
                <span className={styles.fileHint}>
                  {photos.length} file(s) selected
                </span>
              )}
            </label>
          </section>

          {/* ── Part Information ────────────────────────────────────────── */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Part Information</h2>

            <div className={styles.row}>
              <label className={styles.label}>
                Part Number <span className={styles.req}>*</span>
                <input
                  className={styles.input}
                  type="text"
                  name="partNumber"
                  value={form.partNumber}
                  onChange={handleChange}
                  placeholder="e.g. ABC-12345"
                  required
                />
              </label>

              <label className={styles.label}>
                Quantity
                <input
                  className={styles.input}
                  type="number"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </label>
            </div>

            <label className={styles.label}>
              Part Description <span className={styles.req}>*</span>
              <input
                className={styles.input}
                type="text"
                name="partDescription"
                value={form.partDescription}
                onChange={handleChange}
                placeholder="Brief description of the part"
                required
              />
            </label>

            <label className={styles.label}>
              Reason / Justification <span className={styles.req}>*</span>
              <textarea
                className={styles.textarea}
                name="reason"
                value={form.reason}
                onChange={handleChange}
                rows={3}
                placeholder="Explain why this part is needed"
                required
              />
            </label>
          </section>

          {/* ── Repairable Part Information ─────────────────────────────── */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Repairable Part Information</h2>
            <p className={styles.hint}>Complete this section only if a repairable part is being returned.</p>

            <label className={styles.label}>
              Repairable Part Number
              <input
                className={styles.input}
                type="text"
                name="repairablePartNumber"
                value={form.repairablePartNumber}
                onChange={handleChange}
                placeholder="e.g. REP-99999"
              />
            </label>

            <label className={styles.label}>
              Repairable Part Description
              <input
                className={styles.input}
                type="text"
                name="repairablePartDescription"
                value={form.repairablePartDescription}
                onChange={handleChange}
              />
            </label>

            <label className={styles.label}>
              Repairable Serial Number
              <input
                className={styles.input}
                type="text"
                name="repairableSerialNumber"
                value={form.repairableSerialNumber}
                onChange={handleChange}
                placeholder="e.g. SN-000123"
              />
            </label>
          </section>

          {/* ── Approvals notice (filled on printed copy) ───────────────── */}
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Approvals</h2>
            <p className={styles.hint}>
              Approval signatures will appear on the generated PDF and are to be
              obtained on the printed copy per company policy:
            </p>
            <ul className={styles.approvalList}>
              <li>Manager / Assistant of Simulator Maintenance</li>
              <li>Director of Technical Operations ($5,000 and above)</li>
              <li>Vice President of Technical Operations ($50,000 and above)</li>
            </ul>
          </section>

          {/* ── Error message ──────────────────────────────────────────── */}
          {status === 'error' && (
            <p className={styles.error}>⚠ {errorMsg}</p>
          )}

          {/* ── Submit button ──────────────────────────────────────────── */}
          <button
            className={styles.btn}
            type="submit"
            disabled={status === 'submitting'}
          >
            {status === 'submitting' ? 'Submitting…' : 'Submit Request'}
          </button>
        </form>
      </div>
    </>
  );
}
