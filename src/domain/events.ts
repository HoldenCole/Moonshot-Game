// Runtime event types. The authored templates live in EventContent
// (domain/content.ts); these are the resolved, slot-filled events the player
// actually sees, plus the bookkeeping that gates them.

import type { EventTone } from "./content";

export interface ResolvedChoice {
  label: string;
  detail: string;
  effects: string;
  outcomeRef: string;
}

/** An event after its conditions passed and its slots resolved — ready to show. */
export interface ResolvedEvent {
  id: string;
  category: string;
  tone: EventTone;
  headline: string;
  body: string;
  choices: ResolvedChoice[];
  week: number;
}

export interface EventState {
  /** eventId → week it last fired (for cooldowns). */
  cooldowns: Record<string, number>;
  /** one-shot event ids already fired. */
  fired: string[];
  /** Week the last event fired, for the minimum-gap between events. */
  lastEventWeek: number;
}

export const INITIAL_EVENT_STATE: EventState = {
  cooldowns: {},
  fired: [],
  lastEventWeek: -999,
};
