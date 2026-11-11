import { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function CheckoutForm({ project }) {
  const { hardwareSets, checkOutHardware } = useApp();

  const [selectedId, setSelectedId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hardware loads asynchronously, so fall back to the first set until the
  // user picks one.
  const hardwareId = selectedId || hardwareSets[0]?.id || '';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const n = Number(quantity);
    if (!Number.isInteger(n) || n < 1) {
      setError('Quantity must be a whole number of at least 1.');
      return;
    }

    setIsSubmitting(true);
    const result = await checkOutHardware(project.id, hardwareId, n);
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setQuantity(1);
  }

  return (
    <section className="card">
      <h2>Check out hardware</h2>
      <form className="checkout-form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Hardware set</span>
          <select value={hardwareId} onChange={(e) => setSelectedId(e.target.value)}>
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
        <button type="submit" className="btn btn-primary" disabled={isSubmitting || !hardwareId}>
          Check out
        </button>
      </form>
      {error && <p className="error-text">{error}</p>}
    </section>
  );
}
