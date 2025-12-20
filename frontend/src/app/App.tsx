// frontend/src/app/App.tsx
import { Route, Routes } from "react-router-dom";
import AdminPage from "./pages/admin.tsx";
import LP from "./pages/lp.tsx";

export default function App() {
  return (
    <Routes>
      <Route index element={<LP />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  );
}
