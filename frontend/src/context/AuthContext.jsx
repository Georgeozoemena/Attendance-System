import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // On mount, restore session from localStorage
    const storedToken = localStorage.getItem('adminToken');
    const storedUser = localStorage.getItem('adminUser');
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Decode JWT to check expiry (without verifying signature client-side)
        const parts = storedToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.exp && Date.now() / 1000 < payload.exp) {
            setToken(storedToken);
            setUser(parsedUser);
          } else {
            // Token expired — clear storage
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            // Also clear old keys
            localStorage.removeItem('adminKey');
            localStorage.removeItem('adminTokenExpiry');
          }
        }
      } catch {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
      }
    }
    // Clear old auth keys on first load
    localStorage.removeItem('adminKey');
    localStorage.removeItem('adminTokenExpiry');
    setLoading(false);
  }, []);

  function login(newToken, newUser) {
    localStorage.setItem('adminToken', newToken);
    localStorage.setItem('adminUser', JSON.stringify(newUser));
    // Clear old keys
    localStorage.removeItem('adminKey');
    localStorage.removeItem('adminTokenExpiry');
    setToken(newToken);
    setUser(newUser);
  }

  function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminKey');
    localStorage.removeItem('adminTokenExpiry');
    setToken(null);
    setUser(null);
  }

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
