// Voiced narrative generation (UI_LANGUAGE §3). A deterministic starter library
// (Path B): a small generated team, a continuity "thread of the week" that
// echoes across the CEO log and the team feed, and relational sector news drawn
// from the real company graph. Pure — derived from the save, not Date/random.

import type { GameState } from "@/domain/state";
import type { ContentDB } from "@/content/load";
import { makeRng, nextFloat } from "./rng";

export interface Teammate {
  id: string;
  name: string;
  role: string;
  initials: string;
}

export interface FeedItem {
  who: string;
  line: string;
  quote?: string;
  age: string;
  fresh?: boolean;
}

export interface ThreadState {
  teammate: Teammate;
  /** What's going on with them this week (second-person-aware). */
  status: string;
  quote: string;
  fresh: boolean;
}

export interface NarrativeData {
  team: Teammate[];
  thread: ThreadState;
  teamFeed: FeedItem[];
  sectorFeed: FeedItem[];
}

const FIRST = ["Lin", "Maya", "Sam", "Diane", "Marcus", "Priya", "Elena", "Sofia", "Omar", "Yuki", "Theo", "Nadia", "Raj", "Dana"];
const LAST = ["Wei", "Okafor", "Chen", "Vance", "Rao", "Cruz", "Park", "Adler", "Haddad", "Nguyen", "Boone", "Vos", "Mensah", "Iyer"];
const ROLES = ["Head of Research", "ML Lead", "Head of Engineering", "Chief Scientist", "Head of Product"];

const THREADS: { status: string; quote: string }[] = [
  { status: "came back from a recruiter meeting still undecided, and asked to talk Thursday", quote: "I'm not unhappy. I just want to know where this is going." },
  { status: "is energized after the last ship and is pushing to make a bigger bet", quote: "Let's not play it safe now — we're close to something real." },
  { status: "is quietly worried about the runway and what a slow raise would mean for the team", quote: "I trust you. I just want to know we'll make payroll." },
  { status: "is fielding inbound from a rival and hasn't said no yet", quote: "They keep calling. I haven't called back. But they keep calling." },
  { status: "wants a harder problem and is wondering if it's coming", quote: "Give me the thing that scares us. That's why I'm here." },
];

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

/** A stable 3-person team rolled from the save seed. */
export function generateTeam(seed: number): Teammate[] {
  const rng = makeRng(seed ^ 0x9e3779b9);
  const used = new Set<string>();
  const team: Teammate[] = [];
  for (let i = 0; i < 3; i++) {
    let first = "";
    let last = "";
    do {
      first = FIRST[Math.floor(nextFloat(rng) * FIRST.length)]!;
      last = LAST[Math.floor(nextFloat(rng) * LAST.length)]!;
    } while (used.has(first + last) && used.size < FIRST.length);
    used.add(first + last);
    const name = `${i === 0 ? "Dr. " : ""}${first} ${last}`;
    team.push({ id: `tm-${i}`, name, role: ROLES[i % ROLES.length]!, initials: initials(`${first} ${last}`) });
  }
  return team;
}

export function generateNarrative(state: GameState, content: ContentDB): NarrativeData {
  const team = generateTeam(state.meta.seed);
  const lead = team[0]!;

  // The thread evolves every ~6 weeks; it's "fresh" in its first couple of weeks.
  const bucket = Math.floor(state.clock.week / 6);
  const pick = THREADS[(bucket + state.meta.seed) % THREADS.length]!;
  const thread: ThreadState = {
    teammate: lead,
    status: pick.status,
    quote: pick.quote,
    fresh: state.clock.week % 6 < 2,
  };

  const teamFeed: FeedItem[] = [
    { who: lead.name, line: "wants to talk this week", quote: thread.quote, age: "just now", fresh: thread.fresh },
    { who: team[1]!.name, line: `shipped ${state.company.name}-${Math.max(1, Math.floor(state.clock.week / 12) + 1)} to eval`, age: "2 days ago" },
  ];
  if (state.company.financials.headcount >= 3) {
    teamFeed.push({ who: team[2]!.name, line: "onboarded two engineers from a rival", age: "5 days ago" });
  }

  // Relational sector news from real same-industry competitors.
  const peers = content.companies
    .filter((c) => c.industry === state.company.industry && c.tier === "anchor")
    .slice(0, 2);
  const sectorFeed: FeedItem[] = peers.map((c, i) => ({
    who: c.name,
    line: i === 0 ? "raised a new round at a premium" : capitalize(c.identity.narrative_hooks[0] ?? "is making moves"),
    quote: i === 0 ? "“The talent war just got more expensive.” — The Information" : undefined,
    age: i === 0 ? "1 day ago" : "3 days ago",
  }));

  return { team, thread, teamFeed, sectorFeed };
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
