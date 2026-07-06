/**
 * Single source of truth for all event content.
 *
 * Filling in pending content later means editing the values below — no
 * structural or layout changes are required. Fields set to `null` or empty
 * arrays render their respective `Pending_Content_State` placeholders.
 *
 * Speaker `photoSrc` values are `null` until photos are provided; the
 * SpeakersSection renders a named-alt placeholder image in that case.
 */

import type { EventContent } from "./types";

export const eventContent: EventContent = {
  // Fixed, known-now content
  eventName: "Imersão Presencial com Mailson Junior e Fabio Edelberg",
  speakerNames: ["Fabio Edelberg", "Mailson Junior"],
  dateLabel: "16 e 17 de setembro de 2026",
  venueLabel: "Navecon Contabilidade – Unidade Brusque",
  fullAddress:
    "Av. 1º de Maio, 38 – Sala 12 – Centro 2, Brusque – SC, CEP 88353202",

  // Pending-capable content (null/empty → pending state)
  // Filler/placeholder content (lorem ipsum) to preview the finalized layout.
  eventTime: "08:00 às 18:00",
  aboutDetail:
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod " +
    "tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim " +
    "veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea " +
    "commodo consequat. Duis aute irure dolor in reprehenderit in voluptate.",
  themes: [
    "Lorem ipsum dolor sit amet",
    "Consectetur adipiscing elit",
    "Sed do eiusmod tempor incididunt",
    "Ut labore et dolore magna aliqua",
    "Quis nostrud exercitation ullamco",
    "Ullamco laboris nisi ut aliquip",
    "Duis aute irure dolor reprehenderit",
    "Excepteur sint occaecat cupidatat",
  ],
  audience: [
    "Lorem ipsum: empresários e fundadores",
    "Consectetur: gestores e diretores financeiros",
    "Sed do eiusmod: contadores e consultores",
    "Ut enim ad minim: sócios em crescimento",
  ],
  speakers: [
    {
      name: "Fabio Edelberg",
      role: "CEO da Navecon Contabilidade",
      bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
      photoSrc: "/assets/gallery/fabio.jpg",
    },
    {
      name: "Mailson Junior",
      role: "Fundador do Império Moda Atacadista",
      bio: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
      photoSrc: "/assets/gallery/mailson.jpeg",
    },
  ],
  faq: [
    {
      question: "Lorem ipsum dolor sit amet?",
      answer:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do " +
        "eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    },
    {
      question: "Consectetur adipiscing elit, sed do eiusmod?",
      answer:
        "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris " +
        "nisi ut aliquip ex ea commodo consequat.",
    },
    {
      question: "Sed do eiusmod tempor incididunt ut labore?",
      answer:
        "Duis aute irure dolor in reprehenderit in voluptate velit esse " +
        "cillum dolore eu fugiat nulla pariatur.",
    },
    {
      question: "Quis nostrud exercitation ullamco laboris?",
      answer:
        "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui " +
        "officia deserunt mollit anim id est laborum.",
    },
  ],
  contacts: [
    { kind: "phone", label: "(47) 3000-0000", href: "tel:+554730000000" },
    {
      kind: "email",
      label: "contato@navecon.com.br",
      href: "mailto:contato@navecon.com.br",
    },
    {
      kind: "instagram",
      label: "@navecon",
      href: "https://instagram.com/navecon",
    },
    {
      kind: "whatsapp",
      label: "Fale no WhatsApp",
      href: "https://wa.me/5547900000000",
    },
  ],

  // Event timing — 16 September 2026, start of day in Brasília time (UTC−03:00)
  eventStartDatetime: "2026-09-16T00:00:00-03:00",
};

export default eventContent;
