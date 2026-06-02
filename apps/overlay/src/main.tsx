import { createRoot } from "react-dom/client";

import { App } from "./App";
import "./styles.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Overlay root element was not found.");
}

createRoot(rootElement).render(<App />);
