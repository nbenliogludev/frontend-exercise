import { Navigate, Route, Routes } from "react-router-dom";

import { UsersShell } from "./pages/UsersShell";

export const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/users" replace />} />
      <Route path="/users" element={<UsersShell />} />
    </Routes>
  );
};
