import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { SupabaseAuthProvider } from "./contexts/SupabaseAuthContext";
import "./i18n/index";
import "./index.css";
import { MinimalUserProvider } from "./services/MinimalUserProvider";

const rootElement = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <SupabaseAuthProvider>
          <MinimalUserProvider>
            <App />
          </MinimalUserProvider>
        </SupabaseAuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}
