import React from "react";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
} from "react-router";

import App from "./App";
import UiTranslationBridge from "./components/UiTranslationBridge";
import {
  AuthProvider,
} from "./context/AuthContext";

import "./i18n";

import "./index.css";
import "./styles/design-system.css";

ReactDOM.createRoot(
  document.getElementById("root"),
).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <UiTranslationBridge />
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);