import React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter as Router } from "react-router-dom";

// Create a root
const container = document.getElementById("root");
const root = createRoot(container);

// Render your app with the router
root.render(
  <Router>
    <App />
  </Router>
);
