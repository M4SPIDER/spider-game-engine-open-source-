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
  mk("neon-drift", "Neon Drift", "M4 Spider Studios", "Adventure", "Action",
    "Immerse yourself in a rain-soaked cyberpunk metropolis. Infiltrate megacorporations, wield advanced tech blades and uncover dark conspiracies hidden in the neon.",
    [ver(2, "2026-11-01T12:00:00.000Z", 412000, "New district, tech blade upgrades, smoother camera."), ver(1, "2026-10-28T09:00:00.000Z", 360000)], { featured: true }),
  mk("velocity-x", "Velocity X", "DarQQ", "Racing", "Open World",
    "Race a prototype hypercar through an endless neon highway. Drift the corners, chain boosts and beat the ghost of your best lap.",
    [ver(2, "2026-10-31T16:00:00.000Z", 296000, "Night track, ghost lap, tuned handling."), ver(1, "2026-10-27T11:00:00.000Z", 236000)], { featured: true }),
  mk("strike-zone", "Strike Zone", "M4 Spider Studios", "Shooter", "Multiplayer",
    "Squad up and hold the ruins. Fast rounds, tight aiming and a map that changes every match.",
    [ver(2, "2026-10-30T18:10:00.000Z", 354000, "New map, recoil tuning."), ver(1, "2026-10-26T10:00:00.000Z", 322000)]),
  mk("eternal-realms", "Eternal Realms", "DarQQ", "Adventure", "Story",
    "Walk the shores of a forgotten kingdom, follow the old tree to the castle on the cliffs and decide how the story ends.",
    [ver(1, "2026-10-29T15:30:00.000Z", 288000)], { featured: true }),
  mk("dragon-isles", "Dragon Isles", "M4 Spider Studios", "Adventure", "Exploration",
    "Ride a friendly dragon over floating islands, find hidden waterfalls and collect the sky pearls.",
    [ver(1, "2026-11-02T09:00:00.000Z", 262000)]),
  mk("galaxy-siege", "Galaxy Siege", "DarQQ", "Strategy", "Space",
    "Command a fleet, shield the station and outsmart the swarm above a glowing nebula planet.",
    [ver(1, "2026-11-02T14:00:00.000Z", 318000)]),
  mk("zen-garden", "Zen Garden", "M4 Spider Studios", "Puzzle", "Relaxing",
    "Rake the sand, place the stones and grow the bonsai. A calm puzzle with no timer.",
    [ver(1, "2026-11-03T06:00:00.000Z", 142000)]),
];
export const sampleBySlug = (slug) => SAMPLE_GAMES.find((g) => g.slug === slug) || null;

// Demo library: two games installed at version 1, so Library and Updates have something to show.
export const SAMPLE_LIBRARY = { "velocity-x": 1, "strike-zone": 1 };
