import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import NotFound from "./pages/NotFound.tsx";
import Doctor from "./pages/Doctor.tsx";
import Patient from "./pages/Patient.tsx";
import Pharmacist from "./pages/Pharmacist.tsx";
import Admin from "./pages/Admin.tsx";
import Verify from "./pages/Verify.tsx";

const queryClient = new QueryClient();

const SecurityMonitor = () => {
  const { pathname } = useLocation();
  const { isAuthenticated, logout } = useAuth();

  useEffect(() => {
    const dashboardRoutes = ["/doctor", "/patient", "/pharmacist", "/admin"];
    const isDashboard = dashboardRoutes.some(route => pathname.startsWith(route));
    const isAuthRoute = ["/login", "/register"].includes(pathname);
    const isPublicVerify = pathname.startsWith("/verify");

    // If user is authenticated but leaves the dashboard/auth/verify area, log them out
    if (isAuthenticated && !isDashboard && !isAuthRoute && !isPublicVerify && pathname !== "/") {
      // Actually, the user specifically asked to logout when "leaving any dashboard"
      // So if they are on "/" (landing), they should be logged out too.
    }

    if (isAuthenticated && pathname === "/") {
      console.log("Auto-logout: User returned to landing page");
      logout();
    }
  }, [pathname, isAuthenticated, logout]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <SecurityMonitor />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify" element={<Verify />} />
            
            {/* Protected Routes */}
            <Route path="/doctor" element={<ProtectedRoute allowedRoles={["Doctor"]}><Doctor /></ProtectedRoute>} />
            <Route path="/patient" element={<ProtectedRoute allowedRoles={["Patient"]}><Patient /></ProtectedRoute>} />
            <Route path="/pharmacist" element={<ProtectedRoute allowedRoles={["Pharmacist"]}><Pharmacist /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={["Admin"]}><Admin /></ProtectedRoute>} />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
