export const fontCategories = [
  { key: "SANS_SERIF", slug: "sans_serif", label: "Sans Serif", title: "Sans Serif Fonts", note: "Clean and versatile", description: "Clean, flexible typefaces for interfaces, brands and everyday reading." },
  { key: "SERIF", slug: "serif", label: "Serif", title: "Serif Fonts", note: "Editorial and timeless", description: "Editorial and timeless fonts for long-form reading, invitations and refined identities." },
  { key: "DISPLAY", slug: "display", label: "Display", title: "Display Fonts", note: "Made to be noticed", description: "Expressive display faces designed to make headlines, posters and campaigns stand out." },
  { key: "HANDWRITING", slug: "handwriting", label: "Handwriting", title: "Handwriting Fonts", note: "Personal and expressive", description: "Personal script and handwritten styles for warm, human and creative designs." },
  { key: "MONOSPACE", slug: "monospace", label: "Monospace", title: "Monospace Fonts", note: "For code and systems", description: "Structured monospaced families for code, technical layouts and digital products." },
] as const;

export type FontCategory = (typeof fontCategories)[number];

export function getFontCategory(value: string) {
  const normalized = value.toLowerCase();
  return fontCategories.find((category) => category.slug === normalized) ?? null;
}

export const useCases = [
  { slug: "logo", title: "Fonts for logos", description: "Distinctive typefaces for brand marks, packaging and identity work.", categories: ["SANS_SERIF", "SERIF", "DISPLAY"] },
  { slug: "wedding", title: "Fonts for weddings", description: "Elegant serif and handwriting families for invitations and keepsakes.", categories: ["SERIF", "HANDWRITING"] },
  { slug: "poster", title: "Fonts for posters", description: "Strong display faces that hold their own at large sizes.", categories: ["DISPLAY", "SANS_SERIF"] },
  { slug: "editorial", title: "Fonts for editorial design", description: "Readable families for stories, magazines and long-form layouts.", categories: ["SERIF", "SANS_SERIF"] },
  { slug: "retro", title: "Retro and vintage fonts", description: "Expressive display and serif families with character and warmth.", categories: ["DISPLAY", "SERIF"] },
  { slug: "kids", title: "Fonts for kids", description: "Friendly, playful typefaces for learning, toys and family projects.", categories: ["HANDWRITING", "DISPLAY"] },
] as const;

export const legalPages = {
  privacy: { title: "Privacy policy", description: "How Bliss Fonts handles basic site information and analytics." },
  terms: { title: "Terms of use", description: "Rules for using Bliss Fonts and downloading files from the catalog." },
  licenses: { title: "Font license guide", description: "A practical reminder to review the original license supplied with every font." },
} as const;
