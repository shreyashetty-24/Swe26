import { useApp } from '../context/AppContext';
import CheckInRow from './CheckInRow';

export default function CheckoutTable({ project }) {
  const { hardwareSets } = useApp();

  function hardwareName(hwId) {
    return hardwareSets.find((h) => h.id === hwId)?.name ?? 'Unknown hardware';
  }

  return (
    <section className="card">
      <h2>Hardware checked out by {project.name}</h2>
      {project.checkouts.length === 0 ? (
        <p className="empty-state">No hardware checked out yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Hardware set</th>
              <th>Qty out</th>
              <th>Last activity</th>
              <th>Check in</th>
            </tr>
          </thead>
          <tbody>
            {project.checkouts.map((c) => (
              <CheckInRow
                key={c.hardwareId}
                projectId={project.id}
                checkout={c}
                hardwareName={hardwareName(c.hardwareId)}
              />
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
