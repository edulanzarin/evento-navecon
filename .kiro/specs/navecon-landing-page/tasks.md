# Implementation Plan: Navecon Contabilidade Event Landing Page

## Overview

This plan implements the dark-themed, single-page (pt-BR) event landing page with Vite + React + TypeScript, tested with Vitest + fast-check + React Testing Library. It follows a pure-logic-first order: the framework-free modules (`countdown.ts`, `validation.ts`, `faqState.ts`, content resolvers) are implemented and property-tested before the React components that consume them. Media assets are migrated into `public/assets/` early, then the page shell, theming, media wrappers, and configurable submitter are built, followed by each section component, and finally full wiring plus responsive verification.

Each task builds on previous ones and ends with integration so no orphaned code remains. Property-based tests cover the 7 correctness properties from the design and are tagged in the required format. Sub-tasks marked with `*` are optional tests.

## Tasks

- [x] 1. Project setup and asset migration
  - [x] 1.1 Scaffold the Vite + React + TypeScript project and test tooling
    - Initialize a Vite React-TS project (`package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`)
    - Add and configure Vitest, fast-check, and React Testing Library (test setup file, jsdom environment, scripts using `--run` for single execution)
    - Create the source folder structure: `src/logic/`, `src/content/`, `src/components/`, `src/theme/`
    - _Requirements: 1.5_

  - [x] 1.2 Migrate and rename media assets into the public assets directory
    - Copy/move from `info/` into `public/assets/...` per the design asset map, renaming to lowercase, hyphenated, space-free names:
      `icon-light.png`→`public/assets/logo/icon-light.png`, `icon-dark.png`→`public/assets/logo/icon-dark.png`,
      `Evento.mp4`→`public/assets/video/evento.mp4`, `IMG_2212.MP4`→`public/assets/video/img-2212.mp4`, `IMG_4226.MP4`→`public/assets/video/img-4226.mp4`,
      `WhatsApp Image ...14.18.17.jpeg`→`public/assets/gallery/ambient-1.jpeg`, `WhatsApp Image ...11.31.22.jpeg`→`public/assets/gallery/ambient-2.jpeg`
    - Create `src/content/assets.ts` centralizing all asset paths as relative paths rooted under the public assets directory
    - _Requirements: 14.1, 14.2_

  - [x] 1.3 Write smoke test for the asset map
    - Assert every path in `assets.ts` is relative and rooted under the public assets directory
    - _Requirements: 14.1, 14.2_

- [x] 2. Content and configuration layer
  - [x] 2.1 Define content model types and the event content config
    - Create `src/content/types.ts` with `EventContent`, `SpeakerContent`, `ContactDetail`, `FaqItem`, `Resolved<T>`
    - Create `src/content/eventContent.ts` with the fixed/known content (event name, speaker names + roles, date label, venue label, full address) and pending-capable fields (eventTime, aboutDetail, themes, audience, faq, contacts) plus `eventStartDatetime`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 5.2, 6.2, 6.3, 11.1, 13.1, 13.2_

  - [x] 2.2 Define the theme palette and environment config
    - Create `src/theme/theme.ts` with `ThemePalette`, `DEFAULT_DARK_PALETTE` (body text ≥4.5:1, large text/controls ≥3:1), and optional `brandPalette` selection
    - Create an env/config module exposing `VITE_REGISTRATION_ENDPOINT` and the computed `Event_Start_Datetime` (Brasília UTC−03:00, defaulting to 00:00:00 on 16 Sep 2026)
    - _Requirements: 1.2, 1.6, 1.7, 4.4, 4.5_

- [x] 3. Pure logic: countdown
  - [x] 3.1 Implement `src/logic/countdown.ts`
    - Implement `computeRemaining(nowMs, targetMs)` returning `{ total, days, hours, minutes, seconds, started }` and `pad2(n)`
    - Clamp to zeros with `started = true` when `now >= target`
    - _Requirements: 4.1, 4.3, 4.6_

  - [x] 3.2 Write property test for countdown computation
    - **Property 1: Countdown computation is correct for all instants**
    - **Validates: Requirements 4.1, 4.3, 4.6**
    - Tag: `// Feature: navecon-landing-page, Property 1: ...`; minimum 100 iterations; arbitrary `now`/`target` on both sides of the boundary; assert field ranges, recomposition to floored remaining seconds, started flag, and `pad2` length ≥ 2

- [x] 4. Pure logic: form validation
  - [x] 4.1 Implement `src/logic/validation.ts`
    - Implement `isNonEmpty`, `isValidEmail` (exactly one `@`, non-empty local, domain with a dot), `isValidBrazilPhone` (10 or 11 digits after stripping non-digits), and `validateRegistration` returning a discriminated `ValidationResult` without mutating input
    - _Requirements: 10.1, 10.3, 10.4, 10.5_

  - [x] 4.2 Write property test for email validation
    - **Property 4: Email validation accepts well-formed and rejects malformed addresses**
    - **Validates: Requirements 10.4**
    - Tag in required format; minimum 100 iterations; generators for well-formed plus malformed families (zero/multiple `@`, empty local, dotless domain)

  - [x] 4.3 Write property test for Brazilian phone validation
    - **Property 5: Brazilian phone validation depends only on digit count**
    - **Validates: Requirements 10.5**
    - Tag in required format; minimum 100 iterations; arbitrary digit strings plus injected formatting noise (spaces, parentheses, dashes, `+`)

  - [x] 4.4 Write property test for registration validation
    - **Property 6: Registration validation flags exactly the invalid required fields and never mutates input**
    - **Validates: Requirements 10.1, 10.3**
    - Tag in required format; minimum 100 iterations; arbitrary `RegistrationInput`; assert correct per-field flags, no error for optional company, `valid: true` only when all required pass, and input immutability

- [x] 5. Pure logic: FAQ reducer and content resolvers
  - [x] 5.1 Implement `src/logic/faqState.ts`
    - Implement `toggle(state, index)` single-open reducer (collapsed start, activating collapsed opens and collapses others, activating open collapses it)
    - _Requirements: 12.2, 12.3, 12.4, 12.5_

  - [x] 5.2 Write property test for the FAQ accordion reducer
    - **Property 7: FAQ accordion keeps at most one item open**
    - **Validates: Requirements 12.2, 12.3, 12.4, 12.5**
    - Tag in required format; minimum 100 iterations; arbitrary item counts and arbitrary action sequences from all-collapsed; assert at-most-one-open after every step

  - [x] 5.3 Implement content resolvers
    - Create `src/content/resolvers.ts` with `PENDING_MESSAGES`, `resolveText` (null/whitespace-only → pending) and `resolveList` (empty → pending; themes display-capped at 20), returning `Resolved<T>`
    - _Requirements: 3.5, 3.6, 5.3, 5.4, 5.5, 7.4, 8.3, 8.4, 13.6_

  - [x] 5.4 Write property test for content resolvers
    - **Property 2: Content resolver yields exactly one of finalized or pending**
    - **Validates: Requirements 5.3, 5.4, 5.5, 7.4, 8.3, 8.4, 13.6**
    - Tag in required format; minimum 100 iterations; arbitrary `string | null` and `string[]` (including whitespace-only and empty); assert exactly one of finalized/pending, never both/neither

- [x] 6. Checkpoint - Ensure all pure-logic tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Media wrappers and page shell
  - [x] 7.1 Implement `SafeImage` and `SafeVideo` wrappers
    - Reserve fixed box dimensions to prevent layout shift; swap to an equal-dimension fallback on `onError` or a 10s load timeout while keeping the page interactive; render a visible "mídia indisponível" indication for unresolved paths
    - _Requirements: 14.3, 14.4, 14.5_

  - [x] 7.2 Write unit/edge tests for media wrappers
    - Test error and timeout fallbacks render at equal dimensions and keep the page interactive
    - _Requirements: 14.3, 14.4, 14.5_

  - [x] 7.3 Implement the `App` page shell and theming
    - Set `<html lang="pt-BR">` and a non-empty document title; apply the theme palette as `:root` CSS custom properties; establish mobile-first layout (768px breakpoint) and semantic landmarks; create a placeholder section order Hero → About → Speakers → Themes → Audience → Location → FAQ → Registration → Footer and a shared `formRef`
    - _Requirements: 1.1, 1.2, 1.5, 1.6, 1.7, 1.8_

  - [x] 7.4 Write tests for shell, lang/title, and theme contrast
    - Assert `lang="pt-BR"`, non-empty title, provided-vs-default palette application, and computed WCAG contrast (≥4.5:1 / ≥3:1) on the default palette
    - _Requirements: 1.2, 1.5, 1.6, 1.7_

- [x] 8. Configurable registration submitter
  - [x] 8.1 Implement `src/logic/submitter.ts`
    - Define `RegistrationSubmitter` interface and `SubmitResult`; implement `HttpSubmitter` (POST JSON to `VITE_REGISTRATION_ENDPOINT`) and `PlaceholderSubmitter` (simulated success + logs); enforce a 30s timeout via `AbortSignal`; select the implementation by env var
    - _Requirements: 10.2, 10.7_

  - [x] 8.2 Write unit tests for the submitter
    - Test endpoint selection, success/non-OK/rejection handling, and 30s abort/timeout behavior with mocked fetch and fake timers
    - _Requirements: 10.2, 10.7_

- [x] 9. Hero, CTA, and countdown
  - [x] 9.1 Implement the shared `RegistrationCta` and scroll-to-form behavior
    - Single reusable component with an identical pt-BR label constant; on click/tap/Enter/Space call `scrollToForm(formRef)` — smooth-scroll the form top into view then focus the first input, or skip scroll and only focus when the form is already fully visible; render as a real button/link with a 44×44px minimum touch target
    - _Requirements: 9.3, 9.4, 9.5, 9.6, 9.7, 2.6_

  - [x] 9.2 Implement the `CountdownTimer` component
    - Consume `computeRemaining` and the configured `Event_Start_Datetime`; tick via 1000ms interval with cleanup on unmount; render four zero-padded fields; on `now >= start` stop ticking, show all zeros and a started-state message
    - _Requirements: 4.1, 4.2, 4.3, 4.6_

  - [x] 9.3 Implement the `HeroSection`
    - Render event name, both speaker names, dates, and venue; show event time `HH:MM` or the pending label "Horário a definir"; embed the primary `RegistrationCta` above the fold and the `CountdownTimer`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.10_

  - [x] 9.4 Write tests for hero, countdown, and CTA
    - Test hero fields, pending time label, CTA presence/label, CTA scroll+focus (including already-visible branch) with mocked scroll/visibility, and countdown ticking with fake timers
    - _Requirements: 3.1, 3.5, 3.6, 3.8, 4.2, 9.4, 9.6, 9.7_

- [x] 10. Content sections (About, Speakers, Themes, Audience)
  - [x] 10.1 Implement `AboutSection`
    - Heading "Sobre o Evento" + fixed format summary; resolver renders finalized detail or pending placeholder, never both
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 10.2 Implement `SpeakersSection`
    - Heading "Quem são os palestrantes"; exactly two entries (Fabio Edelberg / CEO da Navecon Contabilidade; Mailson Junior / Fundador do Império Moda Atacadista); each renders photo or placeholder via `SafeImage` with name-identifying alt text
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 10.3 Implement `ThemesSection`
    - Heading "Temas abordados"; render 1–20 themes as distinct items in declared order via `resolveList`, else pending placeholder; multi-column above 768px
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 2.2_

  - [x] 10.4 Implement `AudienceSection`
    - Heading "Para quem é"; render ≥1 audience items as distinct items via `resolveList`, else pending placeholder, never both; multi-column above 768px
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 2.2_

  - [x] 10.5 Write property test for list-section rendering
    - **Property 3: List sections render every item once, in order**
    - **Validates: Requirements 7.2, 7.3, 8.2, 13.5**
    - Tag in required format; minimum 100 iterations; arbitrary non-empty string arrays (themes capped at 20); assert one distinct rendered item per input, none added/dropped, same order

  - [x] 10.6 Write unit tests for section content
    - Test About heading/summary and pending branch, Speakers entries/roles and no-photo placeholder alt, and section headings
    - _Requirements: 5.1, 5.2, 6.1, 6.6, 7.1, 8.1_

- [x] 11. Location, FAQ, registration form, and footer
  - [x] 11.1 Implement `LocationSection`
    - Display the full venue address; embed a Google Maps iframe centered on the venue with a marker; clicking opens the venue in an external map service in a new tab (`target="_blank" rel="noopener noreferrer"`); on iframe load error show address + "Abrir no mapa" fallback while keeping the section visible
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 11.2 Write unit/edge tests for the location section
    - Test address/map presence, external-link attributes, and iframe-failure fallback
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [x] 11.3 Implement `FaqSection`
    - Heading + ≥3 items (finalized or ≥3 pending placeholders with identical behavior); accessible button headers (`aria-expanded`, `aria-controls`); drive open state with `faqState.toggle`; all collapsed initially; animation ≤500ms
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

  - [x] 11.4 Write unit tests for the FAQ section
    - Test heading/count, initial collapsed state, single-open behavior, and pending placeholder behavior
    - _Requirements: 12.1, 12.4, 12.6_

  - [x] 11.5 Implement `RegistrationForm`
    - Fields: full name (req ≤100), email (req ≤254), phone (req ≤11 digits), company (optional ≤100); validate with `validation.ts` showing per-field pt-BR messages and retaining values on failure; on valid submit disable the control, call the `RegistrationSubmitter` with a 30s `AbortSignal`, show success within 5s or an error on failure/timeout while re-enabling and retaining values; expose `firstInputRef`
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

  - [x] 11.6 Write unit tests for registration form async behavior
    - Test field set/limits, validation messages with retained values, success via mocked submitter, submit disabled during processing, and rejection/timeout error path
    - _Requirements: 10.1, 10.2, 10.3, 10.6, 10.7_

  - [x] 11.7 Implement `Footer`
    - Display "Navecon Contabilidade", full Brusque address, and the light logo via `SafeImage` with a placeholder fallback; render provided contact details as distinct items or a pending placeholder
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

  - [x] 11.8 Write unit tests for the footer
    - Test name/address/logo, logo-failure fallback, and contacts vs pending placeholder
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6_

- [x] 12. Final wiring and verification
  - [x] 12.1 Wire all sections into the App and integrate CTAs
    - Replace shell placeholders with the real sections in fixed order, pass content from `eventContent.ts`, connect the shared `formRef`, and add the second `RegistrationCta` below `AudienceSection` and above the `Footer`
    - _Requirements: 1.1, 9.1, 9.2_

  - [x] 12.2 Write responsive/layout checks
    - Across widths 320, 375, 768, 1024, 1920 assert no horizontal overflow (`scrollWidth <= clientWidth`) and single- vs multi-column layout at the 768px breakpoint
    - _Requirements: 1.8, 2.1, 2.2, 2.3, 2.4, 3.10_

  - [x] 12.3 Write an end-to-end integration smoke test
    - Render the full page and assert section order, both CTAs present with identical labels, and a CTA activation scrolls to and focuses the form
    - _Requirements: 1.1, 9.1, 9.2, 9.3_

- [x] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test sub-tasks and can be skipped for a faster MVP.
- Pure-logic modules (countdown, validation, faqState, resolvers) are implemented and property-tested before the components that consume them.
- Each property-based test uses fast-check with a minimum of 100 iterations and is tagged `// Feature: navecon-landing-page, Property {number}: {property_text}`.
- Each task references specific requirement sub-clauses for traceability; checkpoints ensure incremental validation.
- Long-running commands (dev server, watch mode) should be run manually; tests use `--run` for single execution.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1", "2.2"] },
    { "id": 2, "tasks": ["1.3", "3.1", "4.1", "5.1", "5.3", "7.1", "8.1"] },
    { "id": 3, "tasks": ["7.3", "3.2", "4.2", "4.3", "4.4", "5.2", "5.4", "7.2", "8.2"] },
    { "id": 4, "tasks": ["7.4", "9.1", "9.2", "10.1", "10.2", "10.3", "10.4", "11.1", "11.3", "11.5", "11.7"] },
    { "id": 5, "tasks": ["9.3", "10.5", "10.6", "11.2", "11.4", "11.6", "11.8"] },
    { "id": 6, "tasks": ["9.4", "12.1"] },
    { "id": 7, "tasks": ["12.2", "12.3"] }
  ]
}
```
