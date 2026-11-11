export default function RoleBadge({ isLeader }) {
  return (
    <span className={isLeader ? 'badge badge-leader' : 'badge badge-role-member'}>
      {isLeader ? 'Leader' : 'Member'}
    </span>
  );
}
