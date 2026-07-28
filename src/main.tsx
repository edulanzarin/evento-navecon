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

// The Mercado Pago back_urls (…/pagamento/*) load a lightweight result view;
// every other path is the landing page. These are full-page loads, so a simple
// pathname check replaces a router. Base-aware so it also matches under a
// subpath deploy (e.g. /imersao/pagamento/sucesso).
const basePrefix = import.meta.env.BASE_URL.replace(/\/+$/, "");
const relativePath = window.location.pathname.slice(basePrefix.length);
const isPaymentReturn = relativePath.startsWith("/pagamento/");

createRoot(rootElement).render(
  <StrictMode>{isPaymentReturn ? <PaymentResult /> : <App />}</StrictMode>
);
