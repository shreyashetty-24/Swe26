import { useState } from 'react';
import { useApp } from '../context/AppContext';
import CreateProjectForm from '../components/CreateProjectForm';
import JoinProjectForm from '../components/JoinProjectForm';
import ProjectCard from '../components/ProjectCard';

export default function ProjectsPage() {
  const { projects, isLoading, loadError } = useApp();
  const [showForm, setShowForm] = useState(false);

  // The server only returns projects the current user belongs to; others
  // must be joined by project ID.
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

      {showForm && <CreateProjectForm onCreated={() => setShowForm(false)} />}

      <JoinProjectForm />

      {loadError && <p className="error-text">{loadError}</p>}

      {isLoading ? (
        <p className="empty-state">Loading your projects…</p>
      ) : projects.length === 0 ? (
        <p className="empty-state">You haven't joined any projects yet.</p>
      ) : (
        <div className="card-grid">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
