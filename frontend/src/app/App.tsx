// frontend/src/app/App.tsx
import { Route, Routes } from "react-router-dom";
import AdminPage from "./pages/admin.tsx";
import LP from "./pages/LandingPage.tsx";
import Part from "./pages/part.tsx";
import Result from "./pages/result.tsx";

export default function App() {
  return (
    <Routes>
      <Route index element={<LP />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/part" element={<Part />} />
      <Route path="/result" element={<Result />} />
    </Routes>
  );
}
