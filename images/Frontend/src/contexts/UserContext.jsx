import { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    // Check user role from localStorage or API
    const storedUser = localStorage.getItem('userName');
    const storedRole = localStorage.getItem('userRole');
    
    if (storedUser && storedRole) {
      setUser({ name: storedUser, role: storedRole });
      setRole(storedRole);
    }
  }, []);

  const login = (userData, userRole = 'user') => {
    setUser(userData);
    setRole(userRole);
    localStorage.setItem('userName', userData.name);
    localStorage.setItem('userId', userData._id);
    localStorage.setItem('userRole', userRole);
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
  };

  return (
    <UserContext.Provider value={{ user, role, login, logout, setUser, setRole }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};