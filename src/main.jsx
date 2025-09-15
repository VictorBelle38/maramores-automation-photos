import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/main.css";

// Configurações de ambiente (definidas no vite.config.js)
window.WEBHOOK_URL = __WEBHOOK_URL__;
window.MAX_FILE_SIZE = parseInt(__MAX_FILE_SIZE__) || 10485760;
window.ALLOWED_TYPES = __ALLOWED_TYPES__.split(",").map((type) => type.trim());

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
