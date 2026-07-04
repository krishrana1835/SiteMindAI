import { Navigate, Route, Routes } from "react-router-dom";
import ChattingPage from "../pages/ChattingPage";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ChattingPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}