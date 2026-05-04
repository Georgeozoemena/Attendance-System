export const ROLE_PERMISSIONS = {
  developer: {
    routes: ['*'],
    readOnly: [],
    redirectTo: '/admin/live',
  },
  church_admin: {
    routes: [
      '/admin/live', '/admin/analysis', '/admin/events', '/admin/members',
      '/admin/departments', '/admin/absentees', '/admin/prayer',
      '/admin/testimonies', '/admin/qrcode', '/admin/settings',
    ],
    readOnly: [],
    redirectTo: '/admin/live',
  },
  followup_head: {
    routes: ['/admin/live', '/admin/absentees', '/admin/followup'],
    readOnly: ['dashboard'],
    redirectTo: '/admin/live',
  },
  pastor: {
    routes: [
      '/admin/live', '/admin/analysis', '/admin/events',
      '/admin/absentees', '/admin/prayer', '/admin/testimonies',
    ],
    readOnly: ['events', 'prayer', 'testimonies', 'analytics', 'absentees'],
    redirectTo: '/admin/live',
  },
  usher: {
    routes: ['/admin/check-in'],
    readOnly: [],
    redirectTo: '/admin/check-in',
  },
};

export const ROLE_LABELS = {
  developer: 'Developer',
  church_admin: 'Church Admin',
  followup_head: 'Follow-Up Head',
  pastor: 'Pastor',
  usher: 'Usher',
};

export const ROLE_COLORS = {
  developer: '#ef4444',
  church_admin: '#2563eb',
  followup_head: '#7c3aed',
  pastor: '#16a34a',
  usher: '#d97706',
};

export function canAccess(role, route) {
  if (!role) return false;
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return false;
  if (perms.routes.includes('*')) return true;
  return perms.routes.includes(route);
}

export function isReadOnly(role, module) {
  if (!role) return true;
  const perms = ROLE_PERMISSIONS[role];
  if (!perms) return true;
  if (perms.routes.includes('*')) return false; // developer has no read-only restrictions
  return perms.readOnly.includes(module);
}
