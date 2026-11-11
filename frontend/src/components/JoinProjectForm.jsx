import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function JoinProjectForm() {
  const { joinProject } = useApp();

  const [joinId, setJoinId] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);
    const result = await joinProject(joinId);
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(`Joined ${result.project.name}.`);
    setJoinId('');
  }

  return (
    <form className="card create-project-form" onSubmit={handleSubmit}>
      <h2>Join a project</h2>
      <p className="subtitle">Enter the project ID shared by your project's leader.</p>
      <div className="field-row">
        <label className="field">
          <span>Project ID</span>
          <input
            type="text"
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            placeholder="e.g. robotics-capstone"
            required
          />
        </label>
      </div>
      {error && <p className="error-text">{error}</p>}
      {message && <p className="success-text">{message}</p>}
      <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
        Join project
      </button>
    </form>
  );
}
