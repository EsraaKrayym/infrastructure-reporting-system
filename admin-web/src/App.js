import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";

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
            {/* Accounts */}
            <Route
                path="/accounts"
                element={
                    <ProtectedRoute>
                        <Accounts />
                    </ProtectedRoute>
                }
            />
          {/* Default Route */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>

  );
}

export default App;