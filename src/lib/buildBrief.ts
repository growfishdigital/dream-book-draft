/**
 * Assembles the wizard answers into a compact "story brief" payload
 * sent to the generate-summary / generate-cover edge functions.
 *
 * Keep this pure — no React, no side effects.
 */

export interface StoryBrief {
  child: {
    name: string;
    ageRange?: string;
    gender?: string;
  };
  story: {
    genre?: string;
    mood?: string;
    lesson?: string;
    interests: string[];
    customInterest?: string;
  };
  protagonist?: {
    name?: string;
    hair?: string;
    skin?: string;
    eyes?: string;
    clothing?: string;
    accessories?: string;
    vibe?: string;
    photoDataUrl?: string;
  };
  supportingCharacters: Array<{
    name?: string;
    relationship?: string;
    description?: string;
  }>;
  artStyle?: string;
  cover: {
    layout?: string;
    workingTitle?: string;
  };
  specialThing?: string;
}

export function buildBrief(answers: Record<string, any>): StoryBrief {
  const proto = answers.protagonist || {};
  const supporting = (answers.supportingCharacters as any[]) || [];

  return {
    child: {
      name: (answers.childName || proto.name || "the child").trim(),
      ageRange: answers.ageRange,
      gender: answers.gender,
    },
    story: {
      genre: answers.genre,
      mood: answers.mood,
      lesson: answers.lesson,
      interests: (answers.interests as string[]) || [],
      customInterest: (answers.customInterest as string)?.trim() || undefined,
    },
    protagonist: {
      name: proto.name,
      hair: proto.hair,
      skin: proto.skin,
      eyes: proto.eyes,
      clothing: proto.clothing,
      accessories: proto.accessories,
      vibe: proto.vibe,
      photoDataUrl: proto.photoDataUrl || proto.photo || answers.protagonistPhoto,
    },
    supportingCharacters: supporting.map((c) => ({
      name: c.surpriseName ? undefined : c.name,
      relationship:
        c.relationship === "Other"
          ? c.relationshipOther
          : c.relationship,
      description: c.description,
    })),
    artStyle: answers.artStyle,
    cover: {
      layout: answers.coverLayout,
      workingTitle: answers.bookTitle,
    },
    specialThing: answers.specialThing?.category,
  };
}
