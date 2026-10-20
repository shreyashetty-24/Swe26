import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { currentUser, projects, hardwareSets, checkOutHardware, checkInHardware } = useApp();

  const project = projects.find((p) => p.id === id);

  const [hardwareId, setHardwareId] = useState(hardwareSets[0]?.id ?? '');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');

  if (!project) {
    return (
      <div className="page">
        <p className="empty-state">Project not found.</p>
        <Link to="/projects" className="btn btn-secondary">
          Back to projects
        </Link>
      </div>
    );
  }

  const isMember = project.memberIds.includes(currentUser.id);

  if (!isMember) {
    return (
      <div className="page">
        <p className="empty-state">
          You're not a member of this project. Join it from the Projects page using its project ID.
        </p>
        <Link to="/projects" className="btn btn-secondary">
          Back to projects
        </Link>
      </div>
    );
  }

  function hardwareName(hwId) {
    return hardwareSets.find((h) => h.id === hwId)?.name ?? 'Unknown hardware';
  }

  function handleCheckout(e) {
    e.preventDefault();
    setError('');

    const result = checkOutHardware(project.id, hardwareId, Number(quantity));
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setQuantity(1);
  }

  return (
    <div className="page">
      <Link to="/projects" className="back-link">
        &larr; Back to projects
      </Link>

      <div className="page-header">
        <h1>{project.name}</h1>
        <span className="badge badge-member">{project.id}</span>
      </div>

      <p className="project-card-dates">
        Time window: {project.startDate} &rarr; {project.endDate}
      </p>
      <p className="project-card-meta">
        {project.memberIds.length} member{project.memberIds.length === 1 ? '' : 's'}
      </p>

      <section className="card">
        <h2>Hardware checked out by {project.name}</h2>
        {project.checkouts.length === 0 ? (
          <p className="empty-state">No hardware checked out yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Hardware set</th>
                <th>Qty</th>
                <th>When</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {project.checkouts.map((c) => (
                <tr key={c.id}>
                  <td>{hardwareName(c.hardwareId)}</td>
                  <td>{c.quantity}</td>
                  <td>{new Date(c.checkedOutAt).toLocaleString()}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => checkInHardware(project.id, c.id)}
                    >
                      Check in
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
          <h2>Check out hardware</h2>
          <form className="checkout-form" onSubmit={handleCheckout}>
            <label className="field">
              <span>Hardware set</span>
              <select value={hardwareId} onChange={(e) => setHardwareId(e.target.value)}>
                {hardwareSets.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.available} available)
                  </option>
                ))}
              </select>
            </label>
            <label className="field field-quantity">
              <span>Quantity</span>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </label>
            <button type="submit" className="btn btn-primary">
              Check out
            </button>
          </form>
          {error && <p className="error-text">{error}</p>}
      </section>
    </div>
  );
}
