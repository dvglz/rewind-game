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
  date: '2026-07-14',
  endDate: '2026-07-21',
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

// ⚠️ HIDDEN DEMO (not launched) — reachable via /bron & ?special=bron / /bron2 &
// ?special=bron2 (computeSpecialRedirect passes: today >= date), but `endDate` is
// set BEFORE `date` so the live window is EMPTY: NO home banner and NO leaderboard
// slot (both require today <= endDate), and play is practice (scores not
// submitted). `date` = today only to keep the header number clean (#NNN). Normal
// visitors see nothing; only the direct link reaches it. Before a REAL launch:
// set real staggered dates, add images, and wire the all-time board (alltime flag
// + board slot) per the 2026-07-21 spec.
export const BRON_VOL1: SpecialDay = {
  slug: 'bron',
  date: '2026-07-21',
  endDate: '2026-07-20',
  enabled: true,
  flag: '👑',
  label: 'BRON Vol I',
  gameMode: 'rewind_bron',
  homeHeadline: 'The King, in 10 Moments',
  homeSub: 'Rewind LeBron’s come-up — from draft night to the Cleveland promise kept.',
  shareLine: 'I rewound LeBron’s come-up — 10 moments, Vol I',
  weights: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
  events: [
    {
      id: 'evt_bron_draft',
      title: 'Cleveland drafts LeBron out of high school',
      date: '2003-06-26',
      reveal: 'Cleveland used the No. 1 pick on a teenager from nearby Akron. Before playing an NBA game, LeBron had already appeared on the cover of Sports Illustrated as “The Chosen One.”',
    },
    {
      id: 'evt_bron_56',
      title: 'LeBron drops 56 on Toronto at age 20',
      date: '2005-03-20',
      reveal: 'LeBron became the youngest player ever to score 50 in an NBA game. He held that record until Brandon Jennings did it at 20 years and 52 days.',
    },
    {
      id: 'evt_bron_poolad',
      title: 'Nike introduces the four LeBrons',
      date: '2006-10-24',
      reveal: 'The commercial split LeBron into Kid, Athlete, Business and Wise. Wise LeBron’s random “Oh Lord” resurfaced 15 years later as a viral TikTok sound.',
    },
    {
      id: 'evt_bron_48special',
      title: 'LeBron scores 25 straight to stun Detroit',
      date: '2007-05-31',
      reveal: 'LeBron scored Cleveland’s final 25 points and 29 of its last 30 in a double-overtime win. He was only 22.',
    },
    {
      id: 'evt_bron_mvp',
      title: 'LeBron wins his first MVP',
      date: '2009-05-04',
      reveal: 'LeBron led Cleveland to a franchise-record 66 wins, then received the MVP trophy inside his old high-school gym in Akron.',
    },
    {
      id: 'evt_bron_decision',
      title: 'LeBron takes his talents to South Beach',
      date: '2010-07-08',
      reveal: 'Nearly 10 million people watched The Decision live. The backlash included burned jerseys and a furious open letter from Cleveland’s owner written in Comic Sans.',
    },
    {
      id: 'evt_bron_firsttitle',
      title: 'LeBron finally wins his first championship',
      date: '2012-06-21',
      reveal: 'LeBron closed out his first title with a triple-double: 26 points, 11 rebounds and 13 assists against Oklahoma City.',
    },
    {
      id: 'evt_bron_rayallen',
      title: 'Ray Allen saves LeBron’s season',
      date: '2013-06-20',
      reveal: 'Miami was five seconds from losing the Finals when Chris Bosh found Ray Allen in the corner. The shot forced overtime and eventually a Game 7.',
    },
    {
      id: 'evt_bron_2015finals',
      title: 'LeBron leads both Finals teams in everything',
      date: '2015-06-16',
      reveal: 'LeBron became the first player to lead both Finals teams in total points, rebounds and assists. Cleveland still lost the series in six.',
    },
    {
      id: 'evt_bron_theblock',
      title: 'LeBron completes the 3–1 Finals comeback',
      date: '2016-06-19',
      reveal: 'LeBron led every player in the Finals in points, rebounds, assists, steals and blocks, something no one had ever done before.',
    },
  ],
};

export const BRON_VOL2: SpecialDay = {
  slug: 'bron2',
  date: '2026-07-21',
  endDate: '2026-07-20',
  enabled: true,
  flag: '👑',
  label: 'BRON Vol II',
  gameMode: 'rewind_bron',
  homeHeadline: 'The Reign — Vol II',
  homeSub: 'Ten more moments — the Lakers, the records, and a first with his son.',
  shareLine: 'I rewound LeBron’s reign — 10 moments, Vol II',
  weights: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
  events: [
    {
      id: 'evt_bron_meme',
      title: 'LeBron posts “smiling through it all”',
      date: '2018-02-16',
      reveal: 'LeBron posted the poolside photo shortly after being told to “shut up and dribble.” It later became a reaction meme for pretending everything is completely fine.',
    },
    {
      id: 'evt_bron_51jr',
      title: 'LeBron scores 51 and still loses the Finals opener',
      date: '2018-05-31',
      reveal: 'LeBron delivered the highest-scoring Finals performance ever in a loss. J.R. Smith then dribbled out the clock because he thought Cleveland was winning.',
    },
    {
      id: 'evt_bron_passjordan',
      title: 'LeBron passes Michael Jordan in career points',
      date: '2019-03-06',
      reveal: 'The kid who chose No. 23 because of Jordan passed him with an and-one layup against Denver. LeBron covered his face and cried during the timeout.',
    },
    {
      id: 'evt_bron_bubble',
      title: 'LeBron wins the NBA bubble title',
      date: '2020-10-11',
      reveal: 'LeBron became the first player to win Finals MVP with three different franchises: Miami, Cleveland and the Lakers.',
    },
    {
      id: 'evt_bron_kareem',
      title: 'LeBron breaks Kareem’s scoring record',
      date: '2023-02-07',
      reveal: 'Kareem’s record had stood for almost 39 years. The game stopped for a ceremony immediately after LeBron’s record-breaking shot, even though the third quarter was still going.',
    },
    {
      id: 'evt_bron_paris',
      title: 'LeBron carries the Team USA flag in Paris',
      date: '2024-08-10',
      reveal: 'LeBron became the first U.S. men’s basketball player to serve as an Olympic Opening Ceremony flag bearer. He later won gold and tournament MVP at age 39.',
    },
    {
      id: 'evt_bron_bronny',
      title: 'LeBron and Bronny share an NBA court',
      date: '2024-10-22',
      reveal: 'They became the first father and son to play together in an NBA game. Baseball’s famous father-son teammates, Ken Griffey Sr. and Jr., watched courtside.',
    },
    {
      id: 'evt_bron_luka',
      title: 'The Lakers trade for Luka Dončić',
      date: '2025-02-01',
      reveal: 'The Lakers landed a 25-year-old superstar who had taken Dallas to the Finals only months earlier. LeBron said he was just as shocked as everyone else.',
    },
    {
      id: 'evt_bron_50k',
      title: 'LeBron reaches 50,000 total points',
      date: '2025-03-04',
      reveal: 'LeBron entered the game one point short and crossed 50,000 with a three assisted by Luka. The milestone combines regular-season and playoff points.',
    },
    {
      id: 'evt_bron_games',
      title: 'LeBron breaks the NBA games-played record',
      date: '2026-03-23',
      reveal: 'LeBron passed Robert Parish by appearing in his 1,612th regular-season game. It happened during his record 23rd NBA season.',
    },
  ],
};

export const SPECIAL_DAYS: SpecialDay[] = [MESSI_SPECIAL, BRON_VOL1, BRON_VOL2];

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
