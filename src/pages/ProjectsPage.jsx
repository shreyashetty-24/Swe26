import { useState } from 'react';
import { useApp } from '../context/AppContext';
import ProjectCard from '../components/ProjectCard';

export default function ProjectsPage() {
  const { currentUser, projects, joinProject, createProject } = useApp();

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const [joinId, setJoinId] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinMessage, setJoinMessage] = useState('');

  // Students only see projects they belong to; others must be joined by project ID.
  const myProjects = projects.filter((p) => p.memberIds.includes(currentUser.id));

  function handleJoin(e) {
    e.preventDefault();
    setJoinError('');
    setJoinMessage('');

    const result = joinProject(joinId);
    if (!result.ok) {
      setJoinError(result.error);
      return;
    }

    setJoinMessage(`Joined ${result.project.name}.`);
    setJoinId('');
  }

  function handleCreate(e) {
    e.preventDefault();
    setError('');

    const result = createProject(name, startDate, endDate);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setName('');
    setStartDate('');
    setEndDate('');
    setShowForm(false);
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Projects</h1>
        <div className="page-header-actions">
          <button type="button" className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>
            {showForm ? 'Cancel' : 'New project'}
          </button>
        </div>
      </div>

      {showForm && (
        <form className="card create-project-form" onSubmit={handleCreate}>
          <h2>New project</h2>
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
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </label>
            <label className="field">
              <span>End date</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </label>
          </div>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="btn btn-primary">
            Create project
          </button>
        </form>
      )}

      <form className="card create-project-form" onSubmit={handleJoin}>
        <h2>Join a project</h2>
        <p className="subtitle">Enter the project ID shared by your teammate.</p>
        <div className="field-row">
          <label className="field">
            <span>Project ID</span>
            <input
              type="text"
              value={joinId}
              onChange={(e) => setJoinId(e.target.value)}
              placeholder="e.g. PRJ-1001"
              required
            />
          </label>
        </div>
        {joinError && <p className="error-text">{joinError}</p>}
        {joinMessage && <p className="success-text">{joinMessage}</p>}
        <button type="submit" className="btn btn-primary">
          Join project
        </button>
      </form>

      {myProjects.length === 0 ? (
        <p className="empty-state">You haven't joined any projects yet.</p>
      ) : (
        <div className="card-grid">
          {myProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
