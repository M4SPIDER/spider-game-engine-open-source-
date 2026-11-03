/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — sample games for the Explore screen
 * Fingerprint: [M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]
 *
 * Demo listings so Explore is not empty before real games exist. Posters are real Muse Image
 * (muse-image-1.0) generations in public/store-samples/. Entries are marked `sample: true`, are never sent
 * anywhere, have no playable build, and never block a real game's name.
 */
const base = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.BASE_URL) || "/";
const poster = (name) => [{ name, url: `${base}store-samples/${name}.webp`, sha256: name }];
const ver = (version, createdAt, bytes, notes = "") => ({ version, createdAt, bytes, notes });

const mk = (slug, name, developer, category, subtitle, description, versions, extra = {}) => ({
  slug, name, developer, category, subtitle, description, sample: true, images: poster(slug),
  createdAt: versions[versions.length - 1].createdAt, updatedAt: versions[0].createdAt, versions, ...extra,
});

// A real, playable game: NEON RIFT was written by Muse Spark inside Spider Engine and ships here as a static package.
const NEON_RIFT = {
  slug: "neon-rift", name: "Neon Rift", developer: "Muse Spark × DarQQ", category: "Shooter", subtitle: "Survival", demo: true, featured: true,
  description: "A neon survival shooter built by Muse Spark inside Spider Engine from one prompt and two follow-ups. Move, auto-fire at the swarm, pick an upgrade every level and take down the Rift Warden.",
  images: [1, 2, 3, 4].map((i) => ({ name: `neon-rift-${i}`, url: `${base}store-samples/${i === 1 ? "neon-rift" : `neon-rift-${i}`}.webp`, sha256: `neon-rift-${i}` })),
  packageUrl: `${base}store-samples/neon-rift.spider.json`,
  createdAt: "2026-11-01T10:00:00.000Z", updatedAt: "2026-11-03T08:00:00.000Z",
  versions: [ver(1, "2026-11-03T08:00:00.000Z", 26661, "Waves, boss with bullet rings, upgrade cards, victory screen.")],
};

export const SAMPLE_GAMES = [
  NEON_RIFT,
];
export const sampleBySlug = (slug) => SAMPLE_GAMES.find((g) => g.slug === slug) || null;

// Demo library: real games only
export const SAMPLE_LIBRARY = {};
