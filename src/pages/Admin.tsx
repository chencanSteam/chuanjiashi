import { Outlet } from 'react-router-dom';
import './Admin.css';

export default function Admin() {
  return (
    <div className="admin-page">
      <Outlet />
    </div>
  );
}
