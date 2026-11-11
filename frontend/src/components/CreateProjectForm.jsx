import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function CreateProjectForm({ onCreated }) {
  const { createProject } = useApp();

  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    const result = await createProject({ id, name, startDate, endDate });
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    onCreated?.(result.project);
  }

  return (
    <form className="card create-project-form" onSubmit={handleSubmit}>
      <h2>New project</h2>
      <p className="subtitle">You'll be the project's leader.</p>

      <label className="field">
        <span>Project ID</span>
        <input
          type="text"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="e.g. robotics-capstone"
          maxLength={32}
          required
        />
        <small className="hint-text">
          This is what teammates type to join. 3-32 characters: letters, numbers, hyphens or
          underscores.
        </small>
      </label>

      <label className="field">
        <span>Project name</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Robotics Capstone"
          required
        />
      </label>

      <div className="field-row">
        <label className="field">
          <span>Start date</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
        </label>
        <label className="field">
          <span>End date</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
        </label>
      </div>

      {error && <p className="error-text">{error}</p>}
      <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
        {isSubmitting ? 'Creating…' : 'Create project'}
      </button>
    </form>
  );
}
