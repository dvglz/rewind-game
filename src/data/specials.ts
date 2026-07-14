import type { SpecialEventMedia } from '../types';

export interface SpecialRawEvent {
  id: string;
  title: string;
  date: string;
  reveal: string;
  media?: SpecialEventMedia;
}

export interface SpecialDay {
  slug: string;
  date: string;            // ISO event day: banner + live scoring start here; picker slot pins here
  /**
   * Optional last live day (inclusive) — extends the promo window: banner shows
   * and scores submit through this day, each day ranked on its own board (one
   * attempt per player total). Defaults to `date` (single-day event).
   */
  endDate?: string;
  enabled: boolean;        // KILL SWITCH — set false + deploy to hide the special everywhere
  flag: string;
  label: string;
  /** PlayHub game_mode for this special's own leaderboard chain. */
  gameMode: string;
  homeHeadline: string;
  homeSub: string;
  shareLine: string;
  weights: readonly number[];
  events: SpecialRawEvent[];
}

export const MESSI_SPECIAL: SpecialDay = {
  slug: 'messi',
  date: '2026-07-15',
  enabled: true,
  flag: '🇦🇷',
  label: 'Messi Special',
  gameMode: 'rewind_messi',
  homeHeadline: 'One More Messi Chapter?',
  homeSub: 'Before the next whistle, rewind 10 moments from the career that changed football.',
  shareLine: 'I rewound Messi’s GOAT career — 10 moments by year',
  weights: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
  events: [
    {
      id: 'evt_messi_napkin',
      title: 'A 13-year-old Messi gets his first Barcelona contract — written on a napkin',
      date: '2000-12-14',
      reveal: 'In 2000, Barcelona moved fast because they feared losing the tiny kid from Rosario — the first written promise was made on a paper napkin',
      media: {
        src: '/specials/messi/01-napkin.jpg',
        caption: 'A napkin sketch that later became part of aviation history — a fitting stand-in for Messi’s famous first Barcelona agreement',
        credit: 'Photo: NASA Armstrong Flight Research Center / NASA/Dennis Taylor, public domain, via Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:A_simple_sketch_on_a_TWA_napkin_by_NASA_Dryden_engineer_Frank_W_%22Bill%22_Burcham_led_to_development_and_validation_of_the_Propulsion-Controlled_Aircraft_concept_(EC94-42805-1).jpg',
      },
    },
    {
      id: 'evt_messi_debut',
      title: 'Messi makes his La Liga debut for Barcelona',
      date: '2004-10-16',
      reveal: 'In 2004, a 17-year-old Messi came on against Espanyol in the derby, becoming one of the youngest players ever to appear for Barcelona in La Liga',
      media: {
        src: '/specials/messi/02-debut.jpg',
        caption: 'A teenage Messi playing for Barcelona in the 2005–06 season, in the years right after his debut',
        credit: 'Photo: Josep Tomàs, CC BY-SA 4.0, via Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Leo_messi_barce_2005.jpg',
      },
    },
    {
      id: 'evt_messi_first_goal',
      title: 'Messi scores his first senior goal, chipped in from a Ronaldinho assist',
      date: '2005-05-01',
      reveal: 'In 2005, Ronaldinho lobbed the pass and the teenager finished it against Albacete — the first of more than 800 career goals',
      media: {
        src: '/specials/messi/03-first-goal.jpg',
        caption: 'Messi with Ronaldinho and his Barcelona teammates celebrating at Camp Nou, December 2005',
        credit: 'Photo: Hector Garcia, CC BY-SA 2.0, via Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Barca_team.jpg',
      },
    },
    {
      id: 'evt_messi_getafe',
      title: 'Messi scores the Getafe solo goal that echoes Maradona',
      date: '2007-04-18',
      reveal: 'In 2007, Messi ran from inside his own half, beat nearly everyone, and made the Maradona comparison impossible to avoid',
      media: {
        src: '/specials/messi/04-getafe.jpg',
        caption: 'Camp Nou during a Barcelona match — the stage for the kind of solo run that turned Messi from prodigy into myth',
        credit: 'Photo: ticketsluxury, CC0, via Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Stadium_of_Football_Club_FC_Barcelona_-_Camp_Nou.jpg',
      },
    },
    {
      id: 'evt_messi_first_ballon',
      title: 'Messi wins his first Ballon d’Or',
      date: '2009-12-01',
      reveal: 'In 2009, before the eight Ballons d’Or, there was the first one: Barcelona won everything available and Messi became the obvious center of the sport',
      media: {
        src: '/specials/messi/05-ballon-dor.jpg',
        caption: 'Messi taking a corner for Barcelona at Camp Nou, April 2009 — the season he won his first Ballon d’Or',
        credit: 'Photo: Tsutomu Takasu, CC BY 2.0, via Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Lionel_Messi_of_FC_Barcelona,_April_11,_2009.jpg',
      },
    },
    {
      id: 'evt_messi_91_goals',
      title: 'Messi sets the record for most goals in a calendar year: 91',
      date: '2012-12-22',
      reveal: 'In 2012, the number sounded fake: 79 goals for Barcelona, 12 for Argentina, and a record nobody has come close to since',
      media: {
        src: '/specials/messi/06-record-goals.jpg',
        caption: 'Messi strikes the ball for Argentina against Switzerland in Bern, February 2012 — during his record 91-goal calendar year',
        credit: 'Photo: Fanny Schertzer, CC BY 3.0, via Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Lionel_Messi_-_Switzerland_vs._Argentina,_29th_February_2012.jpg',
      },
    },
    {
      id: 'evt_messi_wc_final_loss',
      title: 'Messi loses the World Cup final to Germany at the Maracanã',
      date: '2014-07-13',
      reveal: 'In 2014, Götze’s extra-time volley broke Argentina’s hearts, and Messi’s long walk past the trophy became one of football’s most haunting images',
      media: {
        src: '/specials/messi/07-maracana.jpg',
        caption: 'A dejected Messi after Argentina’s loss to Germany in the 2014 World Cup final at the Maracanã',
        credit: 'Photo: Agência Brasil, CC BY 3.0 BR, via Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Lionel_Messi_in_tears_after_the_final.jpg',
      },
    },
    {
      id: 'evt_messi_retirement',
      title: 'Messi announces his retirement from international football',
      date: '2016-06-26',
      reveal: 'In 2016, after Argentina lost another final to Chile on penalties and Messi missed his kick, he said the national team was over for him — he was back within months',
      media: {
        src: '/specials/messi/08-chile-retirement.jpg',
        caption: 'MetLife Stadium in New Jersey, where Argentina lost the 2016 Copa América Centenario final to Chile',
        credit: 'Photo: Anthony Quintano, CC BY 2.0, via Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Metlife_stadium_(Aerial_view).jpg',
      },
    },
    {
      id: 'evt_messi_copa_win',
      title: 'Messi finally wins his first senior title with Argentina, beating Brazil at the Maracanã',
      date: '2021-07-10',
      reveal: 'In 2021, Argentina beat Brazil 1–0 at the Maracanã, and Messi finally got the senior international trophy that had followed him for 16 years',
      media: {
        src: '/specials/messi/09-copa-brazil.jpg',
        caption: 'The Maracanã in Rio de Janeiro — where Argentina beat Brazil in the 2021 Copa América final',
        credit: 'Photo: Tomasz Miłkoś, CC BY-SA 4.0, via Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Maracana_L.jpg',
      },
    },
    {
      id: 'evt_messi_wc_title',
      title: 'Messi lifts the World Cup after Argentina beats France in a 3–3 final',
      date: '2022-12-18',
      reveal: 'In 2022, Argentina beat France on penalties after a 3–3 final, and Messi finally held the trophy his career had been waiting for',
      media: {
        src: '/specials/messi/10-worldcup.jpg',
        caption: 'Messi captaining Argentina at the 2022 World Cup in Qatar, weeks before lifting the trophy',
        credit: 'Photo: Hossein Zohrevand / Tasnim News Agency, CC BY 4.0, via Wikimedia Commons',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Lionel-Messi-Argentina-2022-FIFA-World-Cup.jpg',
      },
    },
  ],
};

export const SPECIAL_DAYS: SpecialDay[] = [MESSI_SPECIAL];

const SPECIAL_PARAM = 'special';

/** Enabled special matching a slug, or null. */
export function getSpecialBySlug(slug: string): SpecialDay | null {
  return SPECIAL_DAYS.find((s) => s.enabled && s.slug === slug) ?? null;
}

/**
 * The special activated via `?special=<slug>` — the special runs as a parallel
 * mode beside the regular daily, never replacing it.
 */
export function getActiveSpecial(): SpecialDay | null {
  const slug = new URLSearchParams(window.location.search).get(SPECIAL_PARAM)?.trim();
  if (!slug) return null;
  return getSpecialBySlug(slug);
}

/** Last live day of a special's promo window (inclusive). */
export function specialEndDate(special: SpecialDay): string {
  return special.endDate ?? special.date;
}

/**
 * The special to promote on the regular home screen (banner): during its live
 * window only — afterwards the promo disappears while /slug stays reachable.
 */
export function getBannerSpecial(today: string): SpecialDay | null {
  return SPECIAL_DAYS.find((s) => s.enabled && today >= s.date && today <= specialEndDate(s)) ?? null;
}

/**
 * Whether a special submits real scores: during its live window. Each live day
 * ranks on its own daily board; afterwards /<slug> plays as practice.
 */
export function isSpecialScoringLive(special: SpecialDay, today: string): boolean {
  return today >= special.date && today <= specialEndDate(special);
}

/**
 * Vanity-path handling (e.g. /messi). Returns the search-preserving redirect
 * target, or null when the path isn't a special. Before the event day the
 * special stays hidden (plain home); from the day on, the path activates
 * special mode. ISO date strings compare lexicographically.
 */
export function computeSpecialRedirect(pathname: string, today: string): string | null {
  const slug = pathname.replace(/^\/+|\/+$/g, '');
  if (!slug) return null;
  const special = SPECIAL_DAYS.find((s) => s.slug === slug);
  if (!special) return null;
  if (!special.enabled || today < special.date) return '/';
  return `/?${SPECIAL_PARAM}=${special.slug}`;
}
