import { Route, Routes } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard.jsx';
import Home from './pages/Home.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
