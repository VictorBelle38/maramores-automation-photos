import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles/main.css";

// Configurações de ambiente (definidas no vite.config.js)
window.WEBHOOK_URL = __WEBHOOK_URL__;
window.MAX_FILE_SIZE = parseInt(__MAX_FILE_SIZE__) || 10485760;
window.MAX_INPUT_FILE_SIZE =
  parseInt(__MAX_INPUT_FILE_SIZE__) || window.MAX_FILE_SIZE || 83886080;
window.MAX_UPLOAD_FILE_SIZE =
  parseInt(__MAX_UPLOAD_FILE_SIZE__) || window.MAX_FILE_SIZE || 20971520;
window.ALLOWED_TYPES = __ALLOWED_TYPES__.split(",").map((type) => type.trim());
window.MOBILE_MAX_DIMENSION = parseInt(__MOBILE_MAX_DIMENSION__) || 2560;
window.MOBILE_JPEG_QUALITY = parseFloat(__MOBILE_JPEG_QUALITY__) || 0.86;
window.BATCH_SIZE = parseInt(__BATCH_SIZE__) || 5;
window.BATCH_DELAY_MS = parseInt(__BATCH_DELAY_MS__) || 30000;
window.MOBILE_BATCH_MAX_MB = parseFloat(__MOBILE_BATCH_MAX_MB__) || 8;
window.MOBILE_BATCH_MAX_FILES = parseInt(__MOBILE_BATCH_MAX_FILES__) || 3;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
