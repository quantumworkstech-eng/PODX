import { homeSeed } from "./home";
import { partnersSeed } from "./partners";
import type { SeedPage } from "./types";

/** Pages the admin can manage. Adding a landing page = adding a seed here. */
export const SEED_PAGES: Record<string, SeedPage> = {
  home: homeSeed,
  partners: partnersSeed,
};

export const MANAGED_PAGES = Object.entries(SEED_PAGES).map(([slug, seed]) => ({
  slug,
  title: seed.title,
  description: seed.description,
  path: seed.path,
}));

export type { SeedPage, SeedSection } from "./types";
