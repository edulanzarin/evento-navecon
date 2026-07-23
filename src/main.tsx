import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { PaymentResult } from "./components/PaymentResult";
import "maplibre-gl/dist/maplibre-gl.css";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Root element with id "root" was not found.');
}

// The Mercado Pago back_urls (/pagamento/*) load a lightweight result view;
// every other path is the landing page. These are full-page loads, so a simple
// pathname check replaces a router.
const isPaymentReturn = window.location.pathname.startsWith("/pagamento/");

createRoot(rootElement).render(
  <StrictMode>{isPaymentReturn ? <PaymentResult /> : <App />}</StrictMode>
);
