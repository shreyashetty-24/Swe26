import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import RoleBadge from './RoleBadge';

export default function ProjectCard({ project }) {
  const { isLeader } = useApp();
  const unitsOut = project.checkouts.reduce((sum, c) => sum + c.quantity, 0);

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
        <RoleBadge isLeader={isLeader(project)} /> &middot; {project.memberIds.length} member
        {project.memberIds.length === 1 ? '' : 's'} &middot; {unitsOut} unit
        {unitsOut === 1 ? '' : 's'} checked out
      </p>
      <div className="project-card-actions">
        <Link to={`/projects/${project.id}`} className="btn btn-secondary">
          View
        </Link>
      </div>
    </div>
  );
}
