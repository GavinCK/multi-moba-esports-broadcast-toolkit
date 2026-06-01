import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { DashboardApp } from "./App";
import "./styles.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Admin dashboard root element was not found.");
}

createRoot(rootElement).render(
  <StrictMode>
    <DashboardApp />
  </StrictMode>
);
