import { useApp } from '../context/AppContext';
import HardwareRow from '../components/HardwareRow';

export default function InventoryPage() {
  const { hardwareSets } = useApp();

  return (
    <div className="page">
      <div className="page-header">
        <h1>Hardware Inventory</h1>
      </div>
      <p className="subtitle">
        Shared equipment pools across the kitchen. Availability updates live as projects check
        equipment in and out.
      </p>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Equipment</th>
              <th>Total capacity</th>
              <th>In use</th>
              <th>Availability</th>
            </tr>
          </thead>
          <tbody>
            {hardwareSets.map((h) => (
              <HardwareRow key={h.id} hardware={h} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
