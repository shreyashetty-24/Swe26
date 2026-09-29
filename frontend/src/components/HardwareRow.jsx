export default function HardwareRow({ hardware }) {
  const inUse = hardware.totalCapacity - hardware.available;
  const isLow = hardware.available === 0;

  return (
    <tr className={isLow ? 'row-unavailable' : ''}>
      <td>{hardware.name}</td>
      <td>{hardware.totalCapacity}</td>
      <td>{inUse}</td>
      <td>
        <span className={isLow ? 'badge badge-warning' : 'badge badge-ok'}>
          {hardware.available} available
        </span>
      </td>
    </tr>
  );
}
