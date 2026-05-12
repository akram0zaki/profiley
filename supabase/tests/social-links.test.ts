import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

import {
  extractSocialLinks,
  extractSocialLinksFromSources,
  mergeSocialLinks,
  normalizeSocialLink,
} from "../functions/_shared/profile/socialLinks.ts";

Deno.test("normalizeSocialLink canonicalizes platform URLs and handles", () => {
  assertEquals(normalizeSocialLink("linkedin", "linkedin.com/in/akram-zaki/"), "https://www.linkedin.com/in/akram-zaki");
  assertEquals(normalizeSocialLink("github", "akramzaki"), "https://github.com/akramzaki");
  assertEquals(normalizeSocialLink("twitter", "@akramzaki"), "https://x.com/akramzaki");
  assertEquals(normalizeSocialLink("reddit", "u/akramzaki"), "https://www.reddit.com/user/akramzaki");
  assertEquals(normalizeSocialLink("discord", "akramzaki#1234"), "akramzaki#1234");
  assertEquals(normalizeSocialLink("instagram", "instagram.com/akram.zaki"), "https://www.instagram.com/akram.zaki");
  assertEquals(normalizeSocialLink("tiktok", "akramzaki"), "https://www.tiktok.com/@akramzaki");
  assertEquals(normalizeSocialLink("youtube", "@akramzaki"), "https://www.youtube.com/@akramzaki");
});

Deno.test("extractSocialLinks reads direct URLs and labeled handles", () => {
  const out = extractSocialLinks(`
Akram Zaki
LinkedIn: akram-zaki
GitHub https://github.com/akramzaki
X: @akramzaki
Discord: akramzaki#1234
Instagram: @akram.zaki
  `);

  assertEquals(out, {
    linkedin: "https://www.linkedin.com/in/akram-zaki",
    github: "https://github.com/akramzaki",
    twitter: "https://x.com/akramzaki",
    discord: "akramzaki#1234",
    instagram: "https://www.instagram.com/akram.zaki",
  });
});

Deno.test("extractSocialLinksFromSources keeps the newest non-empty value per platform", () => {
  const out = extractSocialLinksFromSources([
    { text: "LinkedIn: latest-profile\nTwitter: @latest" },
    { text: "LinkedIn: older-profile\nGitHub: olderdev" },
  ]);

  assertEquals(out, {
    linkedin: "https://www.linkedin.com/in/latest-profile",
    twitter: "https://x.com/latest",
    github: "https://github.com/olderdev",
  });
});

Deno.test("mergeSocialLinks preserves existing values while filling blanks", () => {
  const out = mergeSocialLinks(
    { linkedin: "https://www.linkedin.com/in/manual" },
    { linkedin: "https://www.linkedin.com/in/extracted", github: "https://github.com/extracted" },
  );

  assertEquals(out, {
    linkedin: "https://www.linkedin.com/in/manual",
    github: "https://github.com/extracted",
  });
});