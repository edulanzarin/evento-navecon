/**
 * PainPointsSection — "Você sente que..." qualification band.
 *
 * Static copy from the event briefing: six pain points the target audience
 * recognizes, followed by the "essa imersão foi feita para você" closer.
 * Rendered right after the hero/stats band. Carries no `id`, so it stays out
 * of the fixed ordered section list asserted by the App tests (like the
 * stats band).
 */

const PAIN_POINTS = [
  "Vende pouco nos marketplaces e não consegue escalar.",
  "Depende apenas da loja física e não consegue expandir seu negócio.",
  "Não consegue competir com grandes vendedores e marketplaces.",
  "Possui margem mínima e não sabe como aumentar o lucro.",
  "Já tentou vender online, mas não conseguiu crescer de forma estruturada.",
  "Tem medo de crescer e pagar mais impostos sem planejamento.",
] as const;

export function PainPointsSection() {
  return (
    <section className="section" aria-label="Você sente que">
      <div className="section-head section-head--center">
        <span className="eyebrow">Isso parece familiar?</span>
        <h2 className="section-title">Você sente que...</h2>
      </div>

      <ul className="grid-multi" data-testid="pain-points-list">
        {PAIN_POINTS.map((point) => (
          <li key={point} className="list-card">
            {point}
          </li>
        ))}
      </ul>

      <p
        className="lead"
        style={{
          textAlign: "center",
          marginTop: "2rem",
          marginInline: "auto",
        }}
      >
        Essa imersão foi feita <strong>para você</strong>.
      </p>
    </section>
  );
}

export default PainPointsSection;
