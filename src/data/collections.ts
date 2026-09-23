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
