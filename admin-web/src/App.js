import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Benutzer from "./pages/Benutzer";
import ReportsMap from "./pages/ReportsMap";
import Reports from "./pages/Reports";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Categories from "./pages/Categories";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import Statistics from "./pages/Statistics";

function StaffRoute({ children }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (!["admin", "caseworker"].includes(user?.role)) {
    return <Navigate to="/login" />;
  }

  return children;
}

function CaseworkerRoute({ children }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (user?.role !== "caseworker") {
    return <Navigate to="/dashboard" />;
  }

  return children;
}

function AdminRoute({ children }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  if (!token) {
    return <Navigate to="/login" />;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" />;
  }

  return children;
}

function App() {
  return (
      <BrowserRouter>
        <Routes>
          {/* Login */}
          <Route path="/login" element={<Login />} />

          {/* Dashboard geschützt */}
          <Route
              path="/dashboard"
              element={
                <StaffRoute>
                  <Dashboard />
                </StaffRoute>
              }
          />
            {/* Benutzer */}
            <Route
                path="/users"
              element={
                <AdminRoute>
                  <Benutzer />
                </AdminRoute>
              }
            />
            <Route
                path="/map"
                element={
                    <StaffRoute>
                      <ReportsMap />
                    </StaffRoute>
                }
            />
            <Route
                path="/reports"
                element={
                    <StaffRoute>
                      <Reports />
                    </StaffRoute>
                }
            />
            <Route
              path="/notifications"
              element={
                    <StaffRoute>
                  <Notifications />
                    </StaffRoute>
              }
            />
            <Route
              path="/statistics"
              element={
                    <StaffRoute>
                  <Statistics />
                    </StaffRoute>
              }
            />
            <Route
                path="/settings"
                element={
                    <StaffRoute>
                      <Settings />
                    </StaffRoute>
                }
            />
            <Route
                path="/categories"
                element={
                    <CaseworkerRoute>
                      <Categories />
                    </CaseworkerRoute>
                }
            />
          {/* Default Route */}
          <Route path="*" element={<Navigate to="/login" />} />
            <Route
                path="/register"
                element={<Register />}
            />

            <Route
                path="/forgot-password"
                element={<ForgotPassword />}
            />
        </Routes>
      </BrowserRouter>

  );
}

export default App;