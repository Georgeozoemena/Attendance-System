import { useEffect, cloneElement, Children } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { canAccess, isReadOnly } from '../../config/permissions';

function showAccessDeniedToast() {
  window.dispatchEvent(new CustomEvent('accessDenied', {
    detail: { message: "You don't have permission to access that page." }
  }));
}

export default function PermissionGuard({ route, children, module: moduleName }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;

  const permitted = canAccess(role, route);
  const redirectTo = role === 'usher' ? '/admin/check-in' : '/admin/live';

  useEffect(() => {
    if (!permitted) {
      showAccessDeniedToast();
      navigate(redirectTo, { replace: true });
    }
  }, [permitted, navigate, redirectTo]);

  if (!permitted) return null;

  const readOnly = moduleName ? isReadOnly(role, moduleName) : false;
  const viewMode = (role === 'pastor' && moduleName === 'absentees') ? 'summary' : undefined;

  if (readOnly || viewMode) {
    return (
      <>
        {Children.map(children, child =>
          child ? cloneElement(child, { readOnly, viewMode }) : child
        )}
      </>
    );
  }

  return <>{children}</>;
}
