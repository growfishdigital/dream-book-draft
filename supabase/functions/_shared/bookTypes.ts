import type { TextPlacement } from "./layouts.ts";

export type FrameworkId =
  | "curiosity_journey"
  | "bedtime_wind_down"
  | "brave_choice"
  | "generous_heart"
  | "silly_escalation";

export type SummaryPatternId =
  | "discovery_trail"
  | "softening_ritual"
  | "hard_but_safe_test"
  | "need_noticed"
  | "escalating_absurd_rule";

export type TitlePatternId =
  | "wonder_object_place"
  | "soft_ritual_goodnight_object"
  | "hard_thing_brave_object"
  | "shared_thing_room_making"
  | "absurd_rule_funny_problem";

export type AgeBand = "0-2" | "3-5" | "6-8" | "9-12";

export interface Pronouns {
  subject: string;
  object: string;
  possessive: string;
  reflexive: string;
}

export interface SupportingCastMember {
  name: string;
  role: "character" | "companion";
  description?: string;
}

export interface BookEngineInput {
  child_name: string;
  age: number;
  gender: "he" | "she" | "they";
  hero_pronouns: Pronouns;
  appearance?: string;
  traits: string[];
  interests: string[];
  value:
    | "courage"
    | "kindness"
    | "resilience"
    | "friendship"
    | "curiosity"
    | "self_confidence"
    | "sharing"
    | "nature"
    | "empathy"
    | "just_for_fun";
  genre: string;
  mood_tags: string[];
  supporting_cast: SupportingCastMember[];
  special_item?: string;
  art_style?: string;
  buyer_relationship?: string;
  occasion?: string;
  include_belongs_to_page?: boolean;
  things_already_good_at?: string;
  things_currently_tricky?: string;
  recent_meaningful_moment?: string;
}

export interface ApprovedConcept {
  title?: string;
  summary?: string;
  user_visible_summary?: string;
  framework_id?: FrameworkId | string;
  summary_pattern_id?: SummaryPatternId | string;
  summary_pattern?: SummaryPatternId | string;
  title_pattern_id?: TitlePatternId | string;
  title_pattern?: TitlePatternId | string;
  concept_anchor?: {
    primary_story_object?: string;
    central_problem?: string;
    emotional_choice?: string;
  };
  user_edited?: boolean;
  // Legacy fields: read only as fallback; do not create these in generate-summary.
  framework_reason?: string;
  story_seed?: Record<string, unknown> | null;
  personalization_notes?: Record<string, unknown> | null;
  full_book_instruction?: string | null;
}

export interface BookBlueprint {
  title: string;
  logline: string;
  framework_id: FrameworkId;
  summary_pattern_id: SummaryPatternId;
  title_pattern_id: TitlePatternId;
  core_conflict: string;
  emotional_arc: string;
  recurring_motif: string;
  visual_world: string;
  cast_usage: string;
  personalization_usage: string;
  avoid_list: string[];
  ending_feeling: string;
  page_arc: Array<{
    section: string;
    pages: string;
    purpose: string;
  }>;
  image_strategy: {
    character_consistency_notes: string;
    outfit_lock_notes: string;
    style_reference_notes: string;
    layout_notes: string;
  };
}

export interface RawBookPage {
  page_number: number;
  role: "title" | "dedication" | "story";
  spread_index?: number;
  story_beat?: "opening" | "rising" | "turn" | "climax" | "resolution" | "closing";
  layout_id: string;
  text: string;
  image_scene?: string;
  setting?: string;
  mood?: string;
  characters?: string[];
}

export interface BookPageV2 extends RawBookPage {
  image_prompt: string | null;
  text_placement?: TextPlacement;
}

export interface BookOutputV2 {
  schema_version: "v2";
  meta: {
    title: string;
    framework_id: FrameworkId;
    word_count_total: number;
    page_count: number;
    age_band: AgeBand;
    art_style: string | null;
    repeating_phrase?: string;
    book_outfit?: string;
    generated_at: string;
    model: string;
    prompt_version: string;
    generation_time_ms: number;
  };
  cover: {
    title: string;
    subtitle?: string;
    image_prompt: string;
  };
  pages: BookPageV2[];
}

export interface KernelVars {
  child_name: string;
  hero_pronouns: Pronouns;
  age_band: AgeBand;
  vocab_tier: string;
  value: BookEngineInput["value"];
  value_label: string;
  genre: string;
  mood_tags: string[];
  mood_label: string;
  interests: string;
  special_item?: string;
  cast_summary: string;
  buyer_relationship: string;
  occasion: string;
  things_already_good_at?: string;
  things_currently_tricky?: string;
  recent_meaningful_moment?: string;
  bedtime_setting_modifier?: boolean;
  word_count_target: string;
  spread_count: number;
  include_belongs_to_page?: boolean;
}

export interface ParsedBookPayload {
  meta: {
    title: string;
    repeating_phrase?: string;
    book_outfit?: string;
  };
  cover: {
    title: string;
    subtitle?: string;
    image_scene?: string;
    setting?: string;
    mood?: string;
  };
  pages: RawBookPage[];
}
