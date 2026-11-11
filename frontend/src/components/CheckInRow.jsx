import { useState } from 'react';
import { useApp } from '../context/AppContext';

// One row of the "checked out" table. The member picks how many units to
// return -- anything from 1 up to what the project currently holds.
export default function CheckInRow({ projectId, checkout, hardwareName }) {
  const { checkInHardware } = useApp();

  const [amount, setAmount] = useState('1');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const n = Number(amount);
    if (!Number.isInteger(n) || n < 1) {
      setError('Enter a whole number of at least 1.');
      return;
    }
    if (n > checkout.quantity) {
      setError(`Only ${checkout.quantity} checked out.`);
      return;
    }

    setIsSubmitting(true);
    const result = await checkInHardware(projectId, checkout.hardwareId, n);
    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setAmount('1');
  }

  return (
    <tr>
      <td>{hardwareName}</td>
      <td>{checkout.quantity}</td>
      <td>{new Date(checkout.updatedAt).toLocaleString()}</td>
      <td>
        <form className="checkin-form" onSubmit={handleSubmit}>
          <input
            type="number"
            min="1"
            max={checkout.quantity}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="checkin-input"
            aria-label={`Units of ${hardwareName} to check in`}
          />
          <button
            type="button"
            className="link-button"
            onClick={() => setAmount(String(checkout.quantity))}
          >
            All
          </button>
          <button type="submit" className="btn btn-secondary btn-small" disabled={isSubmitting}>
            Check in
          </button>
        </form>
        {error && <p className="error-text checkin-error">{error}</p>}
      </td>
    </tr>
  );
}
