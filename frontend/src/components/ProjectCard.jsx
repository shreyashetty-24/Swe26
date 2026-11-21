import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { formatDate } from '../utils/dates';
import ProjectDescription from './ProjectDescription';
import RoleBadge from './RoleBadge';

export default function ProjectCard({ project }) {
  const { isLeader } = useApp();
  const memberCount = project.memberIds.length;
  const unitsOut = project.checkouts.reduce((sum, c) => sum + c.quantity, 0);

  return (
    <div className="card project-card">
      <div className="project-card-header">
        <Link to={`/projects/${project.id}`} className="project-card-title" title={project.name}>
          {project.name}
        </Link>
        <span className="badge badge-member" title={project.id}>
          {project.id}
        </span>
      </div>

      <ProjectDescription text={project.description} />

      <div className="project-card-footer">
        <p className="project-card-dates">
          {formatDate(project.startDate)} &rarr; {formatDate(project.endDate)}
        </p>
        <p className="project-card-meta">
          {memberCount} member{memberCount === 1 ? '' : 's'} &middot; {unitsOut} unit
          {unitsOut === 1 ? '' : 's'} checked out
        </p>
        <div className="project-card-bottom">
          <RoleBadge isLeader={isLeader(project)} />
          <Link to={`/projects/${project.id}`} className="btn btn-secondary">
            View
          </Link>
        </div>
      </div>
    </div>
  );
}
