import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { testSupabaseConnection } from "./services/testSupabase";

testSupabaseConnection();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);