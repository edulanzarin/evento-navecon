/**
 * Example/unit tests for the `FaqSection` component (task 11.4).
 *
 * Verifies the FAQ accordion contract from the design (FaqSection):
 *  - the section renders the heading "Perguntas frequentes" and one question
 *    button per provided item, each showing its question text (Req 12.1);
 *  - on first render every item is collapsed: each button has
 *    aria-expanded="false" and its answer panel is hidden (Req 12.4);
 *  - single-open behavior: opening an item collapses any other so at most one
 *    is expanded, and re-activating the open item collapses it (Req 12.2/12.3/12.5);
 *  - when fewer than three finalized items are provided, a pending placeholder
 *    set of at least three items is rendered with identical expand/collapse
 *    behavior (Req 12.6).
 *
 * These are example-based unit tests (not property-based).
 *
 * Requirements: 12.1, 12.4, 12.6
 */
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FaqSection } from "./FaqSection";
import type { FaqItem } from "../content/types";

const HEADING = "Perguntas frequentes";

/** A finalized FAQ set with more than the minimum (3) items. */
const FINALIZED_FAQ: FaqItem[] = [
  { question: "Onde será o evento?", answer: "No Navecon Contabilidade – Unidade Brusque." },
  { question: "Quando acontece?", answer: "Nos dias 16 e 17 de setembro de 2026." },
  { question: "Preciso levar material?", answer: "Não, todo o material será fornecido." },
  { question: "Há estacionamento?", answer: "Sim, há estacionamento no local." },
];

/** All question header buttons, in document order. */
function getQuestionButtons(): HTMLElement[] {
  return screen
    .getAllByRole("button")
    .filter((el) => el.classList.contains("faq-question"));
}

describe("FaqSection", () => {
  describe("heading + count (Req 12.1)", () => {
    it('renders the heading "Perguntas frequentes"', () => {
      render(<FaqSection faq={FINALIZED_FAQ} />);

      expect(
        screen.getByRole("heading", { name: HEADING })
      ).toBeInTheDocument();
    });

    it("renders one question button per provided item when given 3+ items", () => {
      render(<FaqSection faq={FINALIZED_FAQ} />);

      const buttons = getQuestionButtons();
      expect(buttons).toHaveLength(FINALIZED_FAQ.length);
    });

    it("shows the question text of each provided item", () => {
      render(<FaqSection faq={FINALIZED_FAQ} />);

      for (const item of FINALIZED_FAQ) {
        expect(
          screen.getByRole("button", { name: new RegExp(item.question) })
        ).toBeInTheDocument();
      }
    });
  });

  describe("initial collapsed state (Req 12.4)", () => {
    it("renders every item collapsed with answer panels hidden on first render", () => {
      const { container } = render(<FaqSection faq={FINALIZED_FAQ} />);

      const buttons = getQuestionButtons();
      expect(buttons.length).toBeGreaterThanOrEqual(3);

      for (const button of buttons) {
        expect(button).toHaveAttribute("aria-expanded", "false");

        const panelId = button.getAttribute("aria-controls")!;
        const panel = container.querySelector(`#${panelId}`)!;
        expect(panel).toBeInTheDocument();
        // Collapsed panels carry the `hidden` attribute (Req 12.4).
        expect(panel).toHaveAttribute("hidden");
      }
    });
  });

  describe("single-open behavior (Req 12.2/12.3/12.5)", () => {
    it("expands a clicked item and reveals its panel", async () => {
      const user = userEvent.setup();
      const { container } = render(<FaqSection faq={FINALIZED_FAQ} />);

      const buttons = getQuestionButtons();
      await user.click(buttons[0]);

      expect(buttons[0]).toHaveAttribute("aria-expanded", "true");
      const panel0 = container.querySelector(
        `#${buttons[0].getAttribute("aria-controls")}`
      )!;
      expect(panel0).not.toHaveAttribute("hidden");
    });

    it("collapses the previously open item when another item is opened (at most one open)", async () => {
      const user = userEvent.setup();
      render(<FaqSection faq={FINALIZED_FAQ} />);

      const buttons = getQuestionButtons();

      await user.click(buttons[0]);
      expect(buttons[0]).toHaveAttribute("aria-expanded", "true");

      await user.click(buttons[1]);
      // Newly opened item is expanded, the previous one collapsed.
      expect(buttons[1]).toHaveAttribute("aria-expanded", "true");
      expect(buttons[0]).toHaveAttribute("aria-expanded", "false");

      // At most one item is expanded at any time.
      const expanded = buttons.filter(
        (b) => b.getAttribute("aria-expanded") === "true"
      );
      expect(expanded).toHaveLength(1);
    });

    it("collapses the open item when it is activated again (none open)", async () => {
      const user = userEvent.setup();
      render(<FaqSection faq={FINALIZED_FAQ} />);

      const buttons = getQuestionButtons();

      await user.click(buttons[1]);
      expect(buttons[1]).toHaveAttribute("aria-expanded", "true");

      await user.click(buttons[1]);
      expect(buttons[1]).toHaveAttribute("aria-expanded", "false");

      const expanded = buttons.filter(
        (b) => b.getAttribute("aria-expanded") === "true"
      );
      expect(expanded).toHaveLength(0);
    });
  });

  describe("pending placeholder behavior (Req 12.6)", () => {
    it("renders at least three placeholder question buttons when no finalized content is provided", () => {
      render(<FaqSection faq={[]} />);

      const list = screen.getByTestId("faq-list");
      // The list is flagged as a pending placeholder set.
      expect(list).toHaveAttribute("data-pending", "true");

      const buttons = within(list)
        .getAllByRole("button")
        .filter((el) => el.classList.contains("faq-question"));
      expect(buttons.length).toBeGreaterThanOrEqual(3);
    });

    it("falls back to placeholders when fewer than three finalized items are provided", () => {
      const tooFew: FaqItem[] = [
        { question: "Pergunta 1?", answer: "Resposta 1." },
        { question: "Pergunta 2?", answer: "Resposta 2." },
      ];
      render(<FaqSection faq={tooFew} />);

      const list = screen.getByTestId("faq-list");
      expect(list).toHaveAttribute("data-pending", "true");

      const buttons = getQuestionButtons();
      expect(buttons.length).toBeGreaterThanOrEqual(3);
      // The provided (insufficient) items are not shown; placeholders are used.
      expect(
        screen.queryByRole("button", { name: /Pergunta 1\?/ })
      ).not.toBeInTheDocument();
    });

    it("supports the same expand/collapse behavior for placeholder items", async () => {
      const user = userEvent.setup();
      const { container } = render(<FaqSection faq={[]} />);

      const buttons = getQuestionButtons();

      // Initially collapsed.
      expect(buttons[0]).toHaveAttribute("aria-expanded", "false");

      // Clicking expands the placeholder item and reveals its panel.
      await user.click(buttons[0]);
      expect(buttons[0]).toHaveAttribute("aria-expanded", "true");
      const panel0 = container.querySelector(
        `#${buttons[0].getAttribute("aria-controls")}`
      )!;
      expect(panel0).not.toHaveAttribute("hidden");

      // Single-open still holds for placeholders.
      await user.click(buttons[1]);
      expect(buttons[1]).toHaveAttribute("aria-expanded", "true");
      expect(buttons[0]).toHaveAttribute("aria-expanded", "false");
    });
  });
});
