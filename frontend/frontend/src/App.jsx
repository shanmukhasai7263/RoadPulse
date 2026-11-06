import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Capture from "./pages/Capture";
import AdminDashboard from "./pages/AdminDashboard";
import ComplaintDetails from "./pages/ComplaintDetails";
import SafetyTips from "./pages/SafetyTips";
import Map from "./pages/Map";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/capture" element={<Capture />} />

        <Route
  path="/admin"
  element={<AdminDashboard />}
/>

<Route
  path="/complaints/:id"
  element={<ComplaintDetails />}
/>

<Route path="/safety" element={<SafetyTips />} />

<Route path="/map" element={<Map />} />

        
      </Routes>
    </BrowserRouter>
  );
}

export default App;