import { Navigate, useLocation } from 'react-router-dom';
import { auth } from '../lib/auth';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const user = auth.getUser();
  const location = useLocation();

  if (!user) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Redirect to respective home if role not allowed
    const homePaths = {
      patient: '/patient/home',
      doctor: '/doctor/dashboard',
      admin: '/admin/dashboard'
    };
    return <Navigate to={homePaths[user.role] || '/'} replace />;
  }

  return children;
};

export default ProtectedRoute;
