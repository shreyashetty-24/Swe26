import { useState } from 'react';
import { useApp } from '../context/AppContext';

// Members get a "Leave project" button. The leader doesn't -- they own the
// project, so they get an explanation instead. (The server enforces this
// too; hiding the button is just the friendly half.)
export default function LeaveProjectSection({ project, onLeft }) {
  const { isLeader, leaveProject } = useApp();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isLeader(project)) {
    return (
      <section className="card">
        <h2>Membership</h2>
        <p className="hint-text">
          You're the leader of this project, so you can't leave it.
        </p>
      </section>
    );
  }

  async function handleLeave() {
    if (!window.confirm(`Leave ${project.name}? You can rejoin later with its project ID.`)) return;
    setError('');
    setIsSubmitting(true);
    const result = await leaveProject(project.id);
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    onLeft?.();
  }

  return (
    <section className="card">
      <h2>Membership</h2>
      <p className="hint-text">Hardware your project has checked out stays with the project.</p>
      <button type="button" className="btn btn-secondary" onClick={handleLeave} disabled={isSubmitting}>
        Leave project
      </button>
      {error && <p className="error-text">{error}</p>}
    </section>
  );
}
