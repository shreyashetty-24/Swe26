import { Link } from 'react-router-dom';

export default function ProjectCard({ project }) {
  return (
    <div className="card project-card">
      <div className="project-card-header">
        <Link to={`/projects/${project.id}`} className="project-card-title">
          {project.name}
        </Link>
        <span className="badge badge-member">{project.id}</span>
      </div>
      <p className="project-card-dates">
        {project.startDate} &rarr; {project.endDate}
      </p>
      <p className="project-card-meta">
        {project.memberIds.length} member{project.memberIds.length === 1 ? '' : 's'} &middot;{' '}
        {project.checkouts.length} checkout{project.checkouts.length === 1 ? '' : 's'}
      </p>
      <div className="project-card-actions">
        <Link to={`/projects/${project.id}`} className="btn btn-secondary">
          View
        </Link>
      </div>
    </div>
  );
}
