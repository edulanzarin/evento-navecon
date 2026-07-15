/**
 * SpeakersSection — "Quem são os palestrantes".
 *
 * Renders the heading and exactly two speaker entries (Req 6.1/6.4) as
 * alternating full-width feature blocks: a large portrait photo on one side,
 * name/role/bio on the other. The second block mirrors the first (photo on
 * the right) for a dynamic rhythm.
 *
 * Each entry pairs the speaker's name with their role (Req 6.2/6.3) and shows
 * their photo when provided, or a named-alt placeholder when not
 * (Req 6.5/6.6).
 *
 * The photo loader is resilient to the file extension: it tries the configured
 * path first, then alternative image extensions, and finally falls back to the
 * placeholder — so swapping fabio.jpg ↔ fabio.png "just works".
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */
import { useMemo, useState } from "react";
import type { SpeakerContent } from "../content/types";
import { withBase } from "../content/assets";
import { SafeImage } from "./SafeImage";

/** Placeholder box size when no photo resolves (layout stays stable). */
const PLACEHOLDER_SIZE = 320;

/** Candidate extensions tried, in order, when a speaker photo fails to load. */
const PHOTO_EXTS = ["jpg", "jpeg", "jpe", "png", "webp"];

/** Builds the ordered list of URLs to try (configured ext first, then others). */
function candidatesFor(src: string): string[] {
  const dot = src.lastIndexOf(".");
  const base = dot >= 0 ? src.slice(0, dot) : src;
  const orig = dot >= 0 ? src.slice(dot + 1).toLowerCase() : "";
  const exts = [orig, ...PHOTO_EXTS.filter((e) => e !== orig)].filter(Boolean);
  return exts.map((e) => `${base}.${e}`);
}

interface SpeakerPhotoProps {
  src: string;
  name: string;
}

/**
 * A large portrait photo that tries multiple extensions before giving up to
 * the named-alt placeholder. Fills the feature block's media column.
 */
function SpeakerPhoto({ src, name }: SpeakerPhotoProps) {
  const candidates = useMemo(() => candidatesFor(withBase(src)), [src]);
  const [idx, setIdx] = useState(0);
  const alt = `Foto de ${name}`;

  if (idx >= candidates.length) {
    // Every candidate failed → named placeholder.
    return (
      <SafeImage
        src={null}
        alt={alt}
        width={PLACEHOLDER_SIZE}
        height={PLACEHOLDER_SIZE}
      />
    );
  }

  return (
    <img
      className="speaker-feature__photo"
      src={candidates[idx]}
      alt={alt}
      loading="lazy"
      onError={() => setIdx((i) => i + 1)}
    />
  );
}

export interface SpeakersSectionProps {
  /** Exactly two speaker entries (Req 6.4). */
  speakers: [SpeakerContent, SpeakerContent];
}

export function SpeakersSection({ speakers }: SpeakersSectionProps) {
  return (
    <section
      id="speakers"
      className="section"
      aria-labelledby="speakers-heading"
    >
      <div className="section-head">
        <span className="eyebrow">Quem ministra</span>
        <h2 id="speakers-heading" className="section-title">
          Quem são os palestrantes
        </h2>
      </div>

      <div className="speakers-flow">
        {speakers.map((speaker, index) => (
          <article
            key={speaker.name}
            className={
              index % 2 === 1
                ? "speaker-feature speaker-feature--flip"
                : "speaker-feature"
            }
          >
            <div className="speaker-feature__media">
              {speaker.photoSrc ? (
                <SpeakerPhoto src={speaker.photoSrc} name={speaker.name} />
              ) : (
                <SafeImage
                  src={null}
                  alt={`Foto de ${speaker.name}`}
                  width={PLACEHOLDER_SIZE}
                  height={PLACEHOLDER_SIZE}
                />
              )}
            </div>

            <div className="speaker-feature__body">
              <p className="speaker-name">{speaker.name}</p>
              <p className="speaker-role">{speaker.role}</p>
              {speaker.bio && <p className="speaker-bio">{speaker.bio}</p>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export default SpeakersSection;
