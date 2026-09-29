import { Link } from 'react-router-dom';

export default function ProjectCard({ project, currentUserId, onJoin }) {
  const isMember = project.memberIds.includes(currentUserId);

  return (
    <div className="card project-card">
      <div className="project-card-header">
        <Link to={`/projects/${project.id}`} className="project-card-title">
          {project.name}
        </Link>
        {isMember && <span className="badge badge-member">Joined</span>}
      </div>
      <p className="project-card-dates">
        {project.startDate} &rarr; {project.endDate}
      </p>
      <p className="project-card-meta">
        {project.memberIds.length} member{project.memberIds.length === 1 ? '' : 's'} &middot;{' '}
        {project.checkouts.length} item{project.checkouts.length === 1 ? '' : 's'} checked out
      </p>
      <div className="project-card-actions">
        <Link to={`/projects/${project.id}`} className="btn btn-secondary">
          View
        </Link>
        {!isMember && (
          <button type="button" className="btn btn-primary" onClick={() => onJoin(project.id)}>
            Join
          </button>
        )}
      </div>
    </div>
  );
}
