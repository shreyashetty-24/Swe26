import { useState } from 'react';
import { useApp } from '../context/AppContext';
import ProjectCard from '../components/ProjectCard';

export default function ProjectsPage() {
  const { currentUser, projects, joinProject, createProject } = useApp();

  const [showMyOnly, setShowMyOnly] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');

  const visibleProjects = showMyOnly
    ? projects.filter((p) => p.memberIds.includes(currentUser.id))
    : projects;

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
          <label className="filter-toggle">
            <input
              type="checkbox"
              checked={showMyOnly}
              onChange={(e) => setShowMyOnly(e.target.checked)}
            />
            My projects only
          </label>
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
              placeholder="e.g. Holiday Cookie Batch"
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

      {visibleProjects.length === 0 ? (
        <p className="empty-state">
          {showMyOnly ? "You haven't joined any projects yet." : 'No projects yet.'}
        </p>
      ) : (
        <div className="card-grid">
          {visibleProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              currentUserId={currentUser.id}
              onJoin={joinProject}
            />
          ))}
        </div>
      )}
    </div>
  );
}
