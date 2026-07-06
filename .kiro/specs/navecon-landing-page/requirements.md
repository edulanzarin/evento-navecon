# Requirements Document

## Introduction

This feature is a responsive, dark-themed, single-page marketing landing page for an in-person event hosted by Navecon Contabilidade: the "Imersão Presencial com Mailson Junior e Fabio Edelberg", a two-day immersion on 16 and 17 September 2026 at the Navecon Contabilidade Brusque unit (Av. 1º de Maio, 38 – Sala 12 – Centro 2, Brusque – SC, CEP 88353202).

The page is structured and styled with inspiration from a reference high-conversion event landing page (dark theme, hero with countdown, content blocks, location/map, FAQ accordion, and a registration form), but uses only Navecon's own event content. The primary goal is to drive event registrations.

Several content pieces are still pending at requirements time (event time, "Sobre o Evento" detail, "Temas abordados", "Para quem é", and some brand/media assets). The page MUST render these sections with placeholder/pending states so content can be filled in later without structural changes.

## Glossary

- **Landing_Page**: The single web page that presents the event and captures registrations.
- **Visitor**: Any person who opens the Landing_Page in a web browser.
- **Hero_Section**: The top banner area that presents the event name, speakers, date, location, and primary registration call-to-action.
- **Countdown_Timer**: The component that displays remaining time until the event start date.
- **About_Section**: The "Sobre o Evento" section describing the event.
- **Speakers_Section**: The "Quem são os palestrantes" section presenting the speakers.
- **Themes_Section**: The "Temas abordados" section listing event themes.
- **Audience_Section**: The "Para quem é" section describing the target audience.
- **Registration_CTA**: A call-to-action control that directs the Visitor to the Registration_Form.
- **Registration_Form**: The form that collects Visitor registration data.
- **Location_Section**: The section presenting the event address and an embedded map.
- **FAQ_Section**: The frequently-asked-questions section with expandable items.
- **Footer**: The bottom section containing Navecon Contabilidade identification and contact information.
- **Pending_Content_State**: A defined placeholder state for a section whose final content has not yet been provided.
- **Event_Start_Datetime**: The configured starting date and time of the event used by the Countdown_Timer.
- **Brand_Assets**: The logo, speaker photos, brand colors, videos, and images used on the Landing_Page.

## Requirements

### Requirement 1: Page Shell and Dark Theme

**User Story:** As a Visitor, I want a cohesive dark-themed page, so that the event presentation feels professional and matches the brand.

#### Acceptance Criteria

1. THE Landing_Page SHALL render all sections within a single scrollable page in the following top-to-bottom order: Hero_Section, About_Section, Speakers_Section, Themes_Section, Audience_Section, Location_Section, FAQ_Section, Registration_Form, Footer.
2. THE Landing_Page SHALL apply a dark color theme as the default visual style, using a dark background with light foreground text that maintains a contrast ratio of at least 4.5:1 for body text and at least 3:1 for large text and interactive controls.
3. WHEN the Landing_Page loads, THE Landing_Page SHALL display the light logo variant (icon-light.png) in the page header.
4. IF the light logo variant fails to load, THEN THE Landing_Page SHALL display the event name as text in the logo position.
5. THE Landing_Page SHALL set the document language attribute to "pt-BR" and SHALL set a non-empty document title that identifies the event.
6. WHERE a brand color palette has been provided, THE Landing_Page SHALL apply the provided brand colors to primary interface elements including headings, Registration_CTA controls, and section accents.
7. IF a brand color palette has not been provided, THEN THE Landing_Page SHALL apply a default dark palette consistent with the dark theme to the same primary interface elements.
8. WHILE the Landing_Page is rendered at viewport widths from 320 pixels to 1920 pixels, THE Landing_Page SHALL render without horizontal page scrolling.

### Requirement 2: Responsive Layout

**User Story:** As a Visitor on any device, I want the page to adapt to my screen, so that I can read content and register comfortably.

#### Acceptance Criteria

1. WHILE the viewport width is 768 pixels or less, THE Landing_Page SHALL present a single-column layout.
2. WHILE the viewport width is greater than 768 pixels, THE Landing_Page SHALL present multi-column layouts of at least two columns for the Speakers_Section, Themes_Section, and Audience_Section where those sections contain multiple items.
3. THE Landing_Page SHALL render all text and interactive controls without horizontal page scrolling at viewport widths from 320 pixels to 1920 pixels.
4. THE Landing_Page SHALL scale images and videos to fit within their containing section at viewport widths from 320 pixels to 1920 pixels, preserving each asset's aspect ratio without distortion or clipping.
5. WHEN the viewport width or device orientation changes, THE Landing_Page SHALL reflow its layout to match the new dimensions within 500 milliseconds without requiring a page reload.
6. WHILE the viewport width is 768 pixels or less, THE Landing_Page SHALL render all interactive controls with a minimum touch target size of 44 by 44 pixels.

### Requirement 3: Hero Section

**User Story:** As a Visitor, I want a prominent hero banner, so that I immediately understand what the event is, who is speaking, when and where it happens, and how to register.

#### Acceptance Criteria

1. THE Hero_Section SHALL display the event name "Imersão Presencial com Mailson Junior e Fabio Edelberg".
2. THE Hero_Section SHALL display the speaker names "Fabio Edelberg" and "Mailson Junior".
3. THE Hero_Section SHALL display the event dates "16 e 17 de setembro de 2026".
4. THE Hero_Section SHALL display the event location venue and city "Navecon Contabilidade – Unidade Brusque".
5. WHERE the event time has been defined, THE Hero_Section SHALL display the event time expressed in hours and minutes.
6. IF the event time has not been defined, THEN THE Hero_Section SHALL display a Pending_Content_State label "Horário a definir".
7. THE Hero_Section SHALL display a Registration_CTA labeled with a call-to-action text directing the Visitor to register.
8. WHEN the Hero_Section completes its initial load, THE Hero_Section SHALL display the Registration_CTA within the initial visible viewport without requiring the Visitor to scroll.
9. WHEN the Visitor activates the Hero_Section Registration_CTA, THE Landing_Page SHALL scroll to the Registration_Form within 1 second, positioning the top of the Registration_Form inside the visible viewport.
10. WHILE the Landing_Page is rendered at viewport widths from 320 pixels to 1920 pixels, THE Hero_Section SHALL display the event name, speaker names, event dates, event location, and Registration_CTA without horizontal scrolling and without text truncation.

### Requirement 4: Countdown Timer

**User Story:** As a Visitor, I want a countdown to the event, so that I feel the urgency to register.

#### Acceptance Criteria

1. WHEN the page loads and the current time is before the Event_Start_Datetime, THE Countdown_Timer SHALL display the remaining time as four separate numeric fields: days (0 or greater), hours (0 to 23), minutes (0 to 59), and seconds (0 to 59) until the Event_Start_Datetime, each field padded to a minimum of two digits.
2. WHILE the current time is before the Event_Start_Datetime, THE Countdown_Timer SHALL update the displayed remaining time at least once per second.
3. WHEN the current time reaches or passes the Event_Start_Datetime, THE Countdown_Timer SHALL stop decrementing the displayed remaining time and display a started-state message indicating the event has begun.
4. THE Countdown_Timer SHALL compute remaining time using the Event_Start_Datetime of 16 September 2026 interpreted in Brasília time (UTC−03:00).
5. IF the event time of day has not been defined, THEN THE Countdown_Timer SHALL compute remaining time using the start of day (00:00:00) on 16 September 2026 in Brasília time (UTC−03:00).
6. IF the remaining time computation yields a value of zero or less, THEN THE Countdown_Timer SHALL display all numeric fields as zero and present the started-state message.

### Requirement 5: About Section ("Sobre o Evento")

**User Story:** As a Visitor, I want to read about the event, so that I can decide whether it is relevant to me.

#### Acceptance Criteria

1. THE About_Section SHALL display a heading with the text "Sobre o Evento".
2. THE About_Section SHALL display an event format summary stating that the event is a two-day in-person immersion held on 16 and 17 de setembro de 2026 at Navecon Contabilidade – Unidade Brusque.
3. WHERE final About_Section detailed content has been provided, THE About_Section SHALL display the provided content and SHALL NOT display the Pending_Content_State placeholder.
4. IF final About_Section detailed content has not been provided, THEN THE About_Section SHALL display a visible Pending_Content_State placeholder containing a Brazilian Portuguese (pt-BR) message indicating the detailed description is forthcoming.
5. THE About_Section SHALL display either the provided final content or the Pending_Content_State placeholder, but not both simultaneously.

### Requirement 6: Speakers Section ("Quem são os palestrantes")

**User Story:** As a Visitor, I want to learn who the speakers are, so that I can assess their credibility.

#### Acceptance Criteria

1. THE Speakers_Section SHALL display a heading "Quem são os palestrantes".
2. THE Speakers_Section SHALL display a single speaker entry that contains both the name "Fabio Edelberg" and the role "CEO da Navecon Contabilidade" associated within that same entry.
3. THE Speakers_Section SHALL display a single speaker entry that contains both the name "Mailson Junior" and the role "Fundador do Império Moda Atacadista" associated within that same entry.
4. THE Speakers_Section SHALL display exactly two speaker entries.
5. WHERE a photo for a speaker has been provided, THE Speakers_Section SHALL display the provided photo within that speaker's entry, including a text alternative that identifies the speaker by name.
6. IF a photo for a speaker has not been provided, THEN THE Speakers_Section SHALL display a placeholder image within that speaker's entry, including a text alternative that identifies the speaker by name.

### Requirement 7: Themes Section ("Temas abordados")

**User Story:** As a Visitor, I want to see the themes covered, so that I understand what I will learn.

#### Acceptance Criteria

1. THE Themes_Section SHALL display a heading "Temas abordados".
2. WHERE one or more event themes have been defined, THE Themes_Section SHALL display each defined theme as a distinct visible item, supporting from 1 up to 20 theme items.
3. WHERE one or more event themes have been defined, THE Themes_Section SHALL display the theme items in the same order in which they were defined.
4. IF event themes have not been defined or the defined themes collection is empty, THEN THE Themes_Section SHALL display a Pending_Content_State placeholder indicating the themes are forthcoming.

### Requirement 8: Target Audience Section ("Para quem é")

**User Story:** As a Visitor, I want to know who the event is for, so that I can confirm it fits my profile.

#### Acceptance Criteria

1. THE Audience_Section SHALL display a heading "Para quem é".
2. WHERE target audience content has been defined with at least one audience description, THE Audience_Section SHALL display each defined audience description as a distinct item.
3. IF target audience content has not been defined, or has been defined with zero audience descriptions, THEN THE Audience_Section SHALL display a Pending_Content_State placeholder indicating the content is forthcoming.
4. WHILE the Audience_Section displays the Pending_Content_State placeholder, THE Audience_Section SHALL NOT display any defined audience descriptions.

### Requirement 9: Registration Call-to-Action

**User Story:** As a Visitor, I want clear registration prompts throughout the page, so that I can register at the moment I decide to.

#### Acceptance Criteria

1. THE Landing_Page SHALL display at least one Registration_CTA within the Hero_Section.
2. THE Landing_Page SHALL display at least one additional Registration_CTA positioned below the Audience_Section and above the Footer.
3. THE Landing_Page SHALL render the text label of every Registration_CTA in Brazilian Portuguese (pt-BR) using identical wording across all Registration_CTA instances.
4. WHEN the Visitor activates any Registration_CTA by pointer click, touch tap, or keyboard activation, THE Landing_Page SHALL scroll the viewport to the Registration_Form such that the top of the Registration_Form is positioned within the visible viewport.
5. WHEN the Visitor activates any Registration_CTA, THE Landing_Page SHALL complete the scroll to the Registration_Form within 1 second.
6. WHEN the scroll to the Registration_Form completes, THE Landing_Page SHALL move keyboard focus to the first input field of the Registration_Form.
7. IF the Visitor activates any Registration_CTA while the Registration_Form is already fully visible within the viewport, THEN THE Landing_Page SHALL retain the current scroll position and SHALL move keyboard focus to the first input field of the Registration_Form.

### Requirement 10: Registration Form

**User Story:** As a Visitor, I want to submit my registration details, so that I can secure my place at the event.

#### Acceptance Criteria

1. THE Registration_Form SHALL provide input fields for full name, email address, and phone number as required fields and a company name field as an optional field, where full name accepts up to 100 characters, email address accepts up to 254 characters, phone number accepts up to 11 digits, and company name accepts up to 100 characters.
2. WHEN the Visitor submits the Registration_Form with all required fields (full name, email address, phone number) populated and valid, THE Registration_Form SHALL display a success confirmation message within 5 seconds of the submission being accepted.
3. IF the Visitor submits the Registration_Form with any required field empty or containing only whitespace, THEN THE Registration_Form SHALL display a validation message identifying each empty required field and SHALL retain the values already entered in all fields.
4. IF the Visitor submits the Registration_Form with an email value that does not contain exactly one "@" separating a non-empty local part from a domain part containing at least one dot, THEN THE Registration_Form SHALL display a validation message indicating the email format is invalid and SHALL retain the values already entered in all fields.
5. IF the Visitor submits the Registration_Form with a phone value that does not contain either 10 or 11 numeric digits including a 2-digit area code (DDD), THEN THE Registration_Form SHALL display a validation message indicating the phone format is invalid and SHALL retain the values already entered in all fields.
6. WHILE a valid submission is being processed, THE Registration_Form SHALL disable the submit control to prevent duplicate submissions.
7. IF a valid submission fails to be accepted within 30 seconds or is rejected during processing, THEN THE Registration_Form SHALL display an error message indicating the submission did not complete, SHALL re-enable the submit control, and SHALL retain the values already entered in all fields.

### Requirement 11: Location and Map Section

**User Story:** As a Visitor, I want to see the venue address and a map, so that I can plan how to get there.

#### Acceptance Criteria

1. THE Location_Section SHALL display the full venue address "Av. 1º de Maio, 38 – Sala 12 – Centro 2, Brusque – SC, CEP 88353202".
2. THE Location_Section SHALL display an embedded map centered on the venue address with a visible marker identifying the venue location.
3. WHEN the Visitor activates the embedded map, THE Location_Section SHALL open the venue location in an external map service in a new browser tab.
4. IF the embedded map fails to load, THEN THE Location_Section SHALL display a fallback containing the full venue address text and a control that opens the venue location in an external map service in a new browser tab, AND SHALL keep the remaining Location_Section content visible.

### Requirement 12: FAQ Section

**User Story:** As a Visitor, I want answers to common questions, so that I can resolve doubts before registering.

#### Acceptance Criteria

1. THE FAQ_Section SHALL display a non-empty heading and a list of at least three question items, where each item displays its question text.
2. WHEN the Visitor activates a collapsed FAQ item, THE FAQ_Section SHALL expand that item to reveal its answer within 500 milliseconds.
3. WHEN the Visitor activates an expanded FAQ item, THE FAQ_Section SHALL collapse that item to hide its answer within 500 milliseconds.
4. WHEN the FAQ_Section is first rendered, THE FAQ_Section SHALL display every FAQ item in a collapsed state with its answer hidden.
5. WHILE another FAQ item is expanded, WHEN the Visitor activates a collapsed FAQ item, THE FAQ_Section SHALL collapse the previously expanded item so that at most one item is expanded at a time.
6. IF final FAQ content has not been provided, THEN THE FAQ_Section SHALL display a Pending_Content_State containing at least three placeholder question items that support the same expand and collapse behavior defined for finalized items.

### Requirement 13: Footer

**User Story:** As a Visitor, I want footer information, so that I can identify and contact Navecon Contabilidade.

#### Acceptance Criteria

1. THE Footer SHALL display the name "Navecon Contabilidade".
2. THE Footer SHALL display the full venue address of the Brusque unit "Av. 1º de Maio, 38 – Sala 12 – Centro 2, Brusque – SC, CEP 88353202".
3. THE Footer SHALL display the light logo variant (icon-light.png).
4. IF the light logo variant (icon-light.png) fails to load, THEN THE Footer SHALL display a fallback placeholder in the logo position and SHALL keep the remaining Footer content visible.
5. WHERE contact details have been provided, THE Footer SHALL display each provided contact detail as a distinct item.
6. IF contact details have not been provided, THEN THE Footer SHALL display a Pending_Content_State placeholder indicating the contact details are forthcoming.

### Requirement 14: Brand Asset Handling

**User Story:** As a developer, I want event media organized in a public assets folder, so that the Landing_Page can reference logos, photos, and videos reliably.

#### Acceptance Criteria

1. THE Landing_Page SHALL reference all logo, image, and video assets exclusively from a public assets directory within the project, using relative paths resolvable at build and runtime.
2. WHERE event videos have been placed in the public assets directory, THE Landing_Page SHALL reference those videos from the same public assets directory using relative paths.
3. WHEN a referenced media asset begins loading, THE Landing_Page SHALL render the remaining page sections without waiting for that asset to finish loading.
4. IF a referenced media asset fails to load within 10 seconds or returns a load error, THEN THE Landing_Page SHALL display a fallback placeholder occupying the same dimensions and position as the original asset, AND SHALL keep all remaining sections fully interactive.
5. IF a referenced media asset path cannot be resolved within the public assets directory, THEN THE Landing_Page SHALL display the fallback placeholder for that asset and SHALL provide a visible indication that the media is unavailable, without blocking page rendering.
