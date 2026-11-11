import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import CheckoutForm from '../components/CheckoutForm';
import CheckoutTable from '../components/CheckoutTable';
import LeaveProjectSection from '../components/LeaveProjectSection';
import RoleBadge from '../components/RoleBadge';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, getProject, isLeader, isLoading } = useApp();

  const project = getProject(id);

  if (isLoading) {
    return (
      <div className="page">
        <p className="empty-state">Loading…</p>
      </div>
    );
  }

  // Only projects the user belongs to are loaded, so "not found" also covers
  // projects that exist but that this user hasn't joined.
  if (!project || !project.memberIds.includes(currentUser.id)) {
    return (
      <div className="page">
        <p className="empty-state">
          Project not found, or you're not a member. Join a project from the Projects page using
          its project ID.
        </p>
        <Link to="/projects" className="btn btn-secondary">
          Back to projects
        </Link>
      </div>
    );
  }

  return (
    <div className="page">
      <Link to="/projects" className="back-link">
        &larr; Back to projects
      </Link>

      <div className="page-header">
        <h1>{project.name}</h1>
        <div className="page-header-actions">
          <RoleBadge isLeader={isLeader(project)} />
          <span className="badge badge-member">{project.id}</span>
        </div>
      </div>

      <p className="project-card-dates">
        Time window: {project.startDate} &rarr; {project.endDate}
      </p>
      <p className="project-card-meta">
        {project.memberIds.length} member{project.memberIds.length === 1 ? '' : 's'}
      </p>

      <CheckoutTable project={project} />
      <CheckoutForm project={project} />
      <LeaveProjectSection project={project} onLeft={() => navigate('/projects')} />
    </div>
  );
}
