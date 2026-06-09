import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Benutzer from "./pages/Benutzer";
import ReportsMap from "./pages/ReportsMap";
import Reports from "./pages/Reports";


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
                path="/users"
                element={<Benutzer
                />}
            />
            <Route path="/map" element={<ReportsMap />} />
            <Route path="/reports" element={<Reports />} />
          {/* Default Route */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>

  );
}

export default App;