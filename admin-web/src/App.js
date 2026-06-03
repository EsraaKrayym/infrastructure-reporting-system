import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Benutzer from "./pages/Benutzer";
import ReportsMap from "./pages/ReportsMap";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" />;
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
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
          />
            {/* Benutzer */}
            <Route
                path="/benutzer"
                element={
                    <ProtectedRoute>
                        <Benutzer />
                    </ProtectedRoute>
                }
            />
            <Route path="/map" element={<ReportsMap />} />

          {/* Default Route */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>

  );
}

export default App;