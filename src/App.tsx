/**
 * App page shell and full section wiring.
 *
 * - Sets `<html lang="pt-BR">` and a non-empty document title (Req 1.5).
 * - Applies the active theme palette as `:root` CSS custom properties via
 *   {@link applyPalette} (Req 1.2, 1.6, 1.7).
 * - Renders a sticky site header with anchor navigation and a header CTA, then
 *   the sections in the fixed top-to-bottom order Hero → About → Speakers →
 *   Themes → Audience → Location → FAQ → Registration → Footer (Req 1.1).
 * - Hosts a shared `formRef` (the Registration_Form region) and `firstInputRef`
 *   (the form's first input). The Hero CTA (Req 9.1), the header CTA, and the
 *   second CTA placed above the Footer (Req 9.2) all use these to scroll to the
 *   form and focus its first input (Req 9). Every CTA shares {@link CTA_LABEL}
 *   for identical wording (Req 9.3).
 */

import { useLayoutEffect, useRef } from "react";
import { eventContent } from "./content/eventContent";
import { ASSETS } from "./content/assets";
import { getActivePalette } from "./theme/theme";
import { applyPalette } from "./theme/applyPalette";
import { SafeImage } from "./components/SafeImage";
import { HeroSection } from "./components/HeroSection";
import { PainPointsSection } from "./components/PainPointsSection";
import { AboutSection } from "./components/AboutSection";
import { SpeakersSection } from "./components/SpeakersSection";
import { ThemesSection } from "./components/ThemesSection";
import { AudienceSection } from "./components/AudienceSection";
import { LocationSection } from "./components/LocationSection";
import { FaqSection } from "./components/FaqSection";
import { RegistrationForm } from "./components/RegistrationForm";
import { RegistrationCta } from "./components/RegistrationCta";
import { VideoPlayer } from "./components/VideoPlayer";
import { Footer } from "./components/Footer";

/**
 * Non-empty document title identifying the event (Req 1.5). Concise for the
 * browser tab — the full marketing headline lives in the hero `<h1>`.
 */
const DOCUMENT_TITLE =
  "Imersão em Marketplaces e Inteligência Tributária | Navecon Contabilidade";

/** Anchor navigation targets (resolve to section ids). */
const NAV_LINKS = [
  { href: "#hero", label: "Evento" },
  { href: "#about", label: "Sobre" },
  { href: "#speakers", label: "Palestrantes" },
  { href: "#themes", label: "Temas" },
  { href: "#audience", label: "Para quem é" },
  { href: "#location", label: "Local" },
  { href: "#faq", label: "FAQ" },
  { href: "#depoimentos", label: "Navecon" },
] as const;

/** Truthful event stats (no invented numbers; pending content stays generic). */
const STATS = [
  { value: "2 dias", label: "Imersão presencial completa" },
  { value: "16–17 set", label: "Setembro de 2026" },
  { value: "Brusque · SC", label: "Navecon Contabilidade" },
  { value: "Vagas limitadas", label: "Networking entre empresários" },
] as const;

export function App() {
  /** Registration form region — scroll target of every CTA (Req 9.4, 9.5). */
  const formRef = useRef<HTMLDivElement>(null);
  /** Form's first input (full name) — focus target of every CTA (Req 9.6). */
  const firstInputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    document.documentElement.lang = "pt-BR"; // Req 1.5
    document.title = DOCUMENT_TITLE; // Req 1.5
    applyPalette(getActivePalette()); // Req 1.2, 1.6, 1.7
  }, []);

  return (
    <div className="page" id="top">
      {/* Animated decorative background (behind all content). */}
      <div className="site-bg" aria-hidden="true">
        <span className="site-bg__orb site-bg__orb--1" />
        <span className="site-bg__orb site-bg__orb--2" />
        <span className="site-bg__orb site-bg__orb--3" />
        <div className="site-bg__grid" />
        <div className="site-bg__grain" />
      </div>

      {/* Sticky site header with brand, anchor nav, and CTA. */}
      <header className="site-header" aria-label="Cabeçalho">
        <div className="site-header__inner container">
          <a className="brand" href="#top" aria-label="Navecon Contabilidade">
            <SafeImage
              src={ASSETS.logo.light}
              alt="Navecon Contabilidade"
              width={46}
              height={46}
              fallback={<span aria-hidden="true">◆</span>}
            />
          </a>

          <nav className="site-nav" aria-label="Navegação principal">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>

          <RegistrationCta
            className="btn btn-primary"
            formRef={formRef}
            firstInputRef={firstInputRef}
          />
        </div>
      </header>

      <main className="page-main">
        {/* Hero — includes the primary CTA (Req 9.1), info card and countdown. */}
        <HeroSection
          eventName={eventContent.eventName}
          speakerNames={eventContent.speakerNames}
          dateLabel={eventContent.dateLabel}
          venueLabel={eventContent.venueLabel}
          eventTime={eventContent.eventTime}
          formRef={formRef}
          firstInputRef={firstInputRef}
        />

        {/* Stats band — full-bleed strip (no id → excluded from section list). */}
        <section className="stats-band" aria-label="Resumo do evento">
          <div className="container">
            <div className="stats">
              {STATS.map((s) => (
                <div className="stat" key={s.value}>
                  <div className="stat__value">{s.value}</div>
                  <div className="stat__label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* "Você sente que..." — qualification band (no id → excluded from
            the ordered section list, like the stats band). */}
        <PainPointsSection />

        <AboutSection
          aboutDetail={eventContent.aboutDetail}
          sideVideo={ASSETS.video.evento}
        />

        {/* Sobre a Navecon — video on the left, text on the right. */}
        <section className="section" aria-label="Sobre a Navecon">
          <div className="depo__grid">
            <VideoPlayer
              src={ASSETS.video.navecon}
              frameClass="video-frame--portrait about__video"
              label="Sobre a Navecon"
            />
            <div>
              <div className="section-head">
                <span className="eyebrow">Quem realiza</span>
                <h2 className="section-title">Sobre a Navecon</h2>
              </div>
              <p className="lead">
                A Navecon nasceu do desejo de transformar a contabilidade em uma
                força estratégica — capaz de tirar empresas do caos financeiro e
                guiá-las rumo à prosperidade, sem contrariar a lei nem perder a
                humanidade. Mais que uma contabilidade, somos o parceiro que
                entende, protege e impulsiona: segurança técnica, clareza e
                visão de futuro para quem acredita que resultados reais nascem de
                decisões inteligentes. Uma bússola para o sucesso ético e
                sustentável.
              </p>
            </div>
          </div>
        </section>

        {/* Divider banner between Navecon and speakers (same style as the
            pain-points closing banner). */}
        <div className="stack-block">
          <p className="made-for-you">
            <span>
              Dois dias que podem mudar{" "}
              <strong>o rumo do seu negócio.</strong>
            </span>
          </p>
        </div>

        <SpeakersSection speakers={eventContent.speakers} />
        <ThemesSection themes={eventContent.themes} />
        <AudienceSection audience={eventContent.audience} />

        <LocationSection address={eventContent.fullAddress} />

        {/* Conversion band — after Location, before FAQ. Scrolls to the form;
            identical wording (Req 9.2, 9.3). */}
        <section className="section" aria-label="Inscrição">
          <div className="cta-band">
            <div className="cta-band__glow" aria-hidden="true" />
            <div className="cta-band__text">
              <h2 className="section-title">Garanta sua vaga na imersão</h2>
              <p className="lead">
                Vagas limitadas — garanta seu lugar antes de esgotar.
              </p>
            </div>
            <RegistrationCta
              className="btn btn-primary"
              formRef={formRef}
              firstInputRef={firstInputRef}
            />
          </div>
        </section>

        <FaqSection faq={eventContent.faq} />

        {/* Client testimonials — long desktop video, full-width. */}
        <div id="depoimentos">
          <section className="section media" aria-label="Depoimentos de clientes">
            <div className="section-head section-head--center">
              <span className="eyebrow">Depoimentos</span>
              <h2 className="section-title">
              O que os clientes dizem sobre a Navecon
            </h2>
            <p className="lead">
              Empresários que já são clientes contam, na prática, como a Navecon
              organizou a contabilidade, protegeu a margem e trouxe
              previsibilidade pro caixa do negócio.
            </p>
          </div>
          <div className="media-feature">
            <VideoPlayer
              src={ASSETS.video.imersao}
              frameClass="video-frame--wide"
              label="depoimentos de clientes"
            />
          </div>
          </section>
        </div>

        {/* Registration region — scroll target of every CTA (Req 9). */}
        <div ref={formRef}>
          <RegistrationForm firstInputRef={firstInputRef} />
        </div>
      </main>

      <footer className="page-footer" aria-label="Rodapé">
        <div className="container">
          <Footer
            contacts={eventContent.contacts}
            address={eventContent.fullAddress}
          />
        </div>
      </footer>
    </div>
  );
}
