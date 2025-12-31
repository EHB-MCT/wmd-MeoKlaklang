import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function AdminProtectedRoute({ children }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminAuth = () => {
      const userRole = localStorage.getItem("userRole");
      const adminToken = localStorage.getItem("adminToken");
      
      // Check if user has admin role OR has valid admin token from admin login
      if ((userRole === "admin" || userRole === "manager") || adminToken === "true") {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
      setIsLoading(false);
    };

    checkAdminAuth();
  }, []);

  if (isLoading) {
    return (
      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        height: "100vh",
        fontSize: "18px" 
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthorized) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}