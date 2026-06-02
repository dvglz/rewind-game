import type { Puzzle, GameEvent } from '../types';

interface RawEvent {
  id: string;
  title: string;
  date: string;
  reveal: string;
  revealContext?: string;
}

const NBA_EVENTS: RawEvent[] = [
  { id: "evt_jordan_drafted", title: "Michael Jordan is drafted by Chicago", date: "1984-06-19", reveal: "Chicago took Jordan with the third pick after Hakeem Olajuwon and Sam Bowie." },
  { id: "evt_jordan_first_title", title: "Jordan wins his first NBA title", date: "1991-06-12", reveal: "Chicago beat the Lakers to start the Bulls dynasty." },
  { id: "evt_dream_team_gold", title: "The Dream Team wins Olympic gold", date: "1992-08-08", reveal: "The Dream Team became the defining basketball team of the Barcelona Olympics." },
  { id: "evt_jordan_first_retirement", title: "Jordan retires for the first time", date: "1993-10-06", reveal: "Jordan stepped away from basketball at the peak of his powers." },
  { id: "evt_jordan_im_back", title: "Jordan returns with \"I'm back\"", date: "1995-03-18", reveal: "Jordan announced his return with a two-word fax: \"I'm back.\"" },
  { id: "evt_bulls_72_wins", title: "The Bulls finish 72–10", date: "1996-04-21", reveal: "Chicago set a regular-season wins record that stood for two decades." },
  { id: "evt_jordan_flu_game", title: "Jordan plays the Flu Game", date: "1997-06-11", reveal: "Jordan pushed through illness to lead Chicago in a classic Finals performance." },
  { id: "evt_jordan_last_shot_bulls", title: "Jordan hits his last shot with the Bulls", date: "1998-06-14", reveal: "Jordan's jumper over Bryon Russell sealed Chicago's sixth title." },
  { id: "evt_spurs_duncan_first_title", title: "Duncan and the Spurs win their first title", date: "1999-06-25", reveal: "San Antonio started the Tim Duncan championship era." },
  { id: "evt_vince_dunk_contest", title: "Vince Carter takes over the Dunk Contest", date: "2000-02-12", reveal: "Vince delivered one of the most famous dunk contest performances ever." },
  { id: "evt_lakers_threepeat", title: "Shaq and Kobe complete the three-peat", date: "2002-06-12", reveal: "The Lakers swept the Nets to finish their third straight title run." },
  { id: "evt_lebron_drafted", title: "LeBron James is drafted by Cleveland", date: "2003-06-26", reveal: "Cleveland selected LeBron with the first pick straight out of high school." },
  { id: "evt_malice_at_palace", title: "Malice at the Palace", date: "2004-11-19", reveal: "Pacers-Pistons turned into one of the most infamous nights in league history." },
  { id: "evt_kobe_81", title: "Kobe scores 81", date: "2006-01-22", reveal: "Kobe's 81 against Toronto remains one of the wildest scoring nights ever." },
  { id: "evt_wade_first_title", title: "Dwyane Wade wins his first title", date: "2006-06-20", reveal: "Miami beat Dallas behind Wade's breakout Finals run." },
  { id: "evt_lebron_first_finals", title: "LeBron reaches his first NBA Finals", date: "2007-06-07", reveal: "LeBron carried Cleveland to its first Finals appearance." },
  { id: "evt_celtics_big_three_title", title: "The Celtics Big Three win the title", date: "2008-06-17", reveal: "Boston's Pierce-Garnett-Allen core finished the job against the Lakers." },
  { id: "evt_steph_drafted", title: "Stephen Curry is drafted by Golden State", date: "2009-06-25", reveal: "Golden State picked Curry seventh overall out of Davidson." },
  { id: "evt_the_decision", title: "LeBron announces The Decision", date: "2010-07-08", reveal: "LeBron left Cleveland to join Wade and Bosh in Miami." },
  { id: "evt_rose_mvp", title: "Derrick Rose becomes the youngest MVP", date: "2011-05-03", reveal: "Rose won MVP at 22 after leading Chicago to the league's best record." },
  { id: "evt_dirk_title", title: "Dirk and the Mavericks win the title", date: "2011-06-12", reveal: "Dallas beat Miami to win the franchise's first championship." },
  { id: "evt_linsanity_begins", title: "Linsanity begins", date: "2012-02-04", reveal: "Jeremy Lin's breakout run turned into a New York basketball phenomenon." },
  { id: "evt_lebron_first_title", title: "LeBron wins his first NBA title", date: "2012-06-21", reveal: "LeBron broke through with Miami after years of Finals pressure." },
  { id: "evt_ray_allen_corner_three", title: "Ray Allen hits the corner three", date: "2013-06-18", reveal: "Allen's shot helped Miami survive Game 6 against San Antonio." },
  { id: "evt_giannis_drafted", title: "Giannis is drafted by Milwaukee", date: "2013-06-27", reveal: "Milwaukee selected Antetokounmpo with the 15th pick out of Greece." },
  { id: "evt_spurs_revenge_title", title: "The Spurs get revenge on Miami", date: "2014-06-15", reveal: "San Antonio's beautiful-game offense overwhelmed the Heat in the Finals." },
  { id: "evt_warriors_first_curry_title", title: "The Warriors win their first Curry-era title", date: "2015-06-16", reveal: "Golden State beat Cleveland to launch the Warriors dynasty." },
  { id: "evt_kobe_final_game", title: "Kobe scores 60 in his final game", date: "2016-04-13", reveal: "Kobe closed his career with one last ridiculous scoring night." },
  { id: "evt_warriors_73_9", title: "The Warriors finish 73–9", date: "2016-04-13", reveal: "Golden State broke Chicago's regular-season wins record." },
  { id: "evt_lebron_block", title: "LeBron makes The Block", date: "2016-06-19", reveal: "LeBron chased down Iguodala in Game 7 to help complete Cleveland's comeback." },
  { id: "evt_kd_joins_warriors", title: "Kevin Durant joins the Warriors", date: "2016-07-04", reveal: "Durant's move to Golden State instantly changed the league's balance." },
  { id: "evt_kd_first_title", title: "Kevin Durant wins his first title", date: "2017-06-12", reveal: "Durant won Finals MVP after Golden State beat Cleveland." },
  { id: "evt_westbrook_mvp", title: "Russell Westbrook wins MVP", date: "2017-06-26", reveal: "Westbrook's triple-double season became one of the defining solo campaigns." },
  { id: "evt_harden_mvp", title: "James Harden wins MVP", date: "2018-06-25", reveal: "Harden's Houston peak finally earned him the league's top individual award." },
  { id: "evt_luka_drafted", title: "Luka Doncic is drafted", date: "2018-06-21", reveal: "Doncic went third overall before landing in Dallas on draft night." },
  { id: "evt_lebron_lakers_debut", title: "LeBron makes his Lakers debut", date: "2018-10-18", reveal: "LeBron's Los Angeles chapter began against Portland." },
  { id: "evt_dame_wave", title: "Dame waves goodbye to OKC", date: "2019-04-23", reveal: "Lillard ended the series with a deep buzzer-beater and the wave." },
  { id: "evt_kawhi_bounce", title: "Kawhi hits the Game 7 bounce", date: "2019-05-12", reveal: "Kawhi's shot bounced around the rim before sending Toronto through." },
  { id: "evt_raptors_title", title: "The Raptors win their first title", date: "2019-06-13", reveal: "Toronto finished its one-year Kawhi run with a championship." },
  { id: "evt_bubble_restart", title: "The NBA restarts in the Bubble", date: "2020-07-30", reveal: "The league resumed play at Disney after the season pause." },
  { id: "evt_lakers_bubble_title", title: "The Lakers win the Bubble title", date: "2020-10-11", reveal: "LeBron and AD led Los Angeles through the Orlando playoff run." },
  { id: "evt_giannis_title", title: "Giannis drops 50 to win the title", date: "2021-07-20", reveal: "Giannis closed the Finals with a monster Game 6 against Phoenix." },
  { id: "evt_curry_threes_record", title: "Curry breaks the all-time threes record", date: "2021-12-14", reveal: "Curry passed Ray Allen at Madison Square Garden." },
  { id: "evt_warriors_2022_title", title: "The Warriors win another title", date: "2022-06-16", reveal: "Golden State beat Boston to complete its post-Durant comeback arc." },
  { id: "evt_lebron_scoring_record", title: "LeBron becomes the all-time scoring leader", date: "2023-02-07", reveal: "LeBron passed Kareem Abdul-Jabbar on the scoring list." },
  { id: "evt_jokic_title", title: "Jokic and the Nuggets win the title", date: "2023-06-12", reveal: "Denver won its first championship behind Jokic's playoff run." },
  { id: "evt_wemby_drafted", title: "Wemby is drafted by San Antonio", date: "2023-06-22", reveal: "The Spurs selected Victor Wembanyama with the first pick." },
  { id: "evt_celtics_18th_title", title: "The Celtics win their 18th title", date: "2024-06-17", reveal: "Boston moved back ahead in the all-time championship count." },
  { id: "evt_bronny_drafted", title: "Bronny James is drafted by the Lakers", date: "2024-06-27", reveal: "The Lakers picked Bronny, setting up the first father-son duo in NBA history." },
];

const SOCCER_EVENTS: RawEvent[] = [
  { id: "evt_wc_baggio_miss", title: "🇮🇹 Baggio misses in the shootout", date: "1994-07-17", reveal: "Brazil beat Italy after the first World Cup final penalty shootout.", revealContext: "at USA 1994" },
  { id: "evt_wc_beckham_red_card", title: "🏴 Beckham is sent off against Argentina", date: "1998-06-30", reveal: "England went out on penalties after Beckham's red card became a huge talking point.", revealContext: "at France 1998" },
  { id: "evt_wc_france_first_title", title: "🇫🇷 France wins its first World Cup", date: "1998-07-12", reveal: "Zidane scored twice as France beat Brazil in Paris.", revealContext: "at France 1998" },
  { id: "evt_wc_senegal_stuns_france", title: "🇸🇳 Senegal stuns defending champion France", date: "2002-05-31", reveal: "Senegal shocked France in the opening match.", revealContext: "at South Korea/Japan 2002" },
  { id: "evt_wc_brazil_fifth_title", title: "🇧🇷 Brazil wins its fifth World Cup", date: "2002-06-30", reveal: "Ronaldo scored twice against Germany in Yokohama.", revealContext: "at South Korea/Japan 2002" },
  { id: "evt_wc_zidane_headbutt", title: "🇫🇷 Zidane headbutts Materazzi", date: "2006-07-09", reveal: "Zidane was sent off in extra time of the final.", revealContext: "at Germany 2006" },
  { id: "evt_wc_italy_2006_title", title: "🇮🇹 Italy wins the World Cup on penalties", date: "2006-07-09", reveal: "Italy beat France in the final shootout in Berlin.", revealContext: "at Germany 2006" },
  { id: "evt_wc_south_africa_opener", title: "The first World Cup in Africa begins", date: "2010-06-11", reveal: "South Africa opened the tournament against Mexico.", revealContext: "at South Africa 2010" },
  { id: "evt_wc_suarez_handball", title: "🇺🇾 Suárez handball saves Uruguay", date: "2010-07-02", reveal: "Suárez handled on the line against Ghana, setting up one of the tournament's wildest endings.", revealContext: "at South Africa 2010" },
  { id: "evt_wc_iniesta_winner", title: "🇪🇸 Iniesta wins it for Spain", date: "2010-07-11", reveal: "Iniesta scored deep into extra time to give Spain its first World Cup.", revealContext: "at South Africa 2010" },
  { id: "evt_wc_van_persie_header", title: "🇳🇱 Van Persie scores the flying header", date: "2014-06-13", reveal: "Van Persie's diving header helped the Netherlands destroy Spain.", revealContext: "at Brazil 2014" },
  { id: "evt_wc_brazil_germany_7_1", title: "Germany beats Brazil 7–1", date: "2014-07-08", reveal: "Brazil's home World Cup collapsed in one of the most shocking semifinals ever.", revealContext: "at Brazil 2014" },
  { id: "evt_wc_germany_2014_title", title: "Germany wins the World Cup in Brazil", date: "2014-07-13", reveal: "Götze scored in extra time to beat Argentina.", revealContext: "at Brazil 2014" },
  { id: "evt_wc_russia_saudi_opener", title: "🇷🇺 Russia opens the World Cup with five goals", date: "2018-06-14", reveal: "The host nation started the tournament with a big win over Saudi Arabia.", revealContext: "at Russia 2018" },
  { id: "evt_wc_germany_group_exit", title: "🇩🇪 Germany crashes out in the group stage", date: "2018-06-27", reveal: "The defending champions were eliminated after losing to South Korea.", revealContext: "at Russia 2018" },
  { id: "evt_wc_france_2018_title", title: "🇫🇷 France wins its second World Cup", date: "2018-07-15", reveal: "France beat Croatia in a high-scoring final in Moscow.", revealContext: "at Russia 2018" },
  { id: "evt_wc_saudi_stuns_argentina", title: "🇸🇦 Saudi Arabia stuns Argentina", date: "2022-11-22", reveal: "Saudi Arabia beat Messi's Argentina in one of the tournament's biggest upsets.", revealContext: "at Qatar 2022" },
  { id: "evt_wc_japan_beats_germany", title: "🇯🇵 Japan beats Germany", date: "2022-11-23", reveal: "Japan came from behind to shock Germany in the group stage.", revealContext: "at Qatar 2022" },
  { id: "evt_wc_morocco_beats_spain", title: "🇲🇦 Morocco knocks out Spain", date: "2022-12-06", reveal: "Morocco won on penalties to continue its historic run.", revealContext: "at Qatar 2022" },
  { id: "evt_wc_morocco_first_african_semi", title: "🇲🇦 Morocco reaches the semifinals", date: "2022-12-10", reveal: "Morocco became the first African team to reach a World Cup semifinal.", revealContext: "at Qatar 2022" },
  { id: "evt_wc_messi_title", title: "🇦🇷 Messi wins the World Cup", date: "2022-12-18", reveal: "Argentina beat France on penalties after an all-time final.", revealContext: "at Qatar 2022" },
  { id: "evt_wc_messi_mbappe_final", title: "Messi and Mbappé deliver an all-time final", date: "2022-12-18", reveal: "Mbappé scored a hat-trick, Messi scored twice, and Argentina won the shootout.", revealContext: "at Qatar 2022" },
];

const MLB_EVENTS: RawEvent[] = [
  { id: "evt_mlb_griffey_drafted", title: "Ken Griffey Jr. is drafted by Seattle", date: "1987-06-02", reveal: "Seattle selected Griffey first overall in the amateur draft." },
  { id: "evt_mlb_jeter_drafted", title: "Derek Jeter is drafted by the Yankees", date: "1992-06-01", reveal: "New York took Jeter sixth overall out of high school." },
  { id: "evt_mlb_ripken_streak_record", title: "Cal Ripken Jr. breaks the consecutive games record", date: "1995-09-06", reveal: "Ripken passed Lou Gehrig by playing in his 2,131st straight game." },
  { id: "evt_mlb_mcgwire_62", title: "Mark McGwire hits home run No. 62", date: "1998-09-08", reveal: "McGwire broke Roger Maris's single-season home run record." },
  { id: "evt_mlb_ichiro_debut", title: "Ichiro begins his MLB career", date: "2001-04-02", reveal: "Ichiro's first season in Seattle launched one of baseball's most unique careers." },
  { id: "evt_mlb_red_sox_break_curse", title: "The Red Sox break the curse", date: "2004-10-27", reveal: "Boston won its first World Series since 1918." },
  { id: "evt_mlb_verlander_debut", title: "Justin Verlander makes his MLB debut", date: "2005-07-04", reveal: "Verlander debuted for Detroit before becoming one of the era's defining aces." },
  { id: "evt_mlb_bonds_756", title: "Barry Bonds hits home run No. 756", date: "2007-08-07", reveal: "Bonds passed Hank Aaron for the all-time home run record." },
  { id: "evt_mlb_trout_drafted", title: "Mike Trout is drafted by the Angels", date: "2009-06-09", reveal: "The Angels grabbed Trout with the 25th overall pick." },
  { id: "evt_mlb_harper_drafted", title: "Bryce Harper is drafted first overall", date: "2010-06-07", reveal: "Washington made Harper the No. 1 pick after his junior-college season." },
  { id: "evt_mlb_cabrera_triple_crown", title: "Miguel Cabrera wins the Triple Crown", date: "2012-10-03", reveal: "Cabrera became the first Triple Crown winner since 1967." },
  { id: "evt_mlb_bautista_bat_flip", title: "José Bautista hits the bat-flip homer", date: "2015-10-14", reveal: "Bautista's go-ahead blast became one of the defining playoff moments of the decade." },
  { id: "evt_mlb_cubs_title", title: "The Cubs win the World Series", date: "2016-11-02", reveal: "Chicago ended a 108-year championship drought in Game 7 at Cleveland." },
  { id: "evt_mlb_astro_first_title", title: "The Astros win their first World Series", date: "2017-11-01", reveal: "Houston beat the Dodgers in a seven-game series." },
  { id: "evt_mlb_ohtani_joins_angels", title: "Shohei Ohtani signs with the Angels", date: "2017-12-08", reveal: "Ohtani chose the Angels to begin his MLB career in the United States." },
  { id: "evt_mlb_nationals_title", title: "The Nationals win the World Series", date: "2019-10-30", reveal: "Washington won the franchise's first title by beating Houston in Game 7." },
  { id: "evt_mlb_freeman_braves_title", title: "Freddie Freeman and the Braves win the title", date: "2021-11-02", reveal: "Atlanta beat Houston to claim its first championship since 1995." },
  { id: "evt_mlb_ohtani_first_mvp", title: "Shohei Ohtani wins his first MVP", date: "2021-11-18", reveal: "Ohtani's two-way season earned him a unanimous AL MVP." },
  { id: "evt_mlb_judge_62", title: "Aaron Judge hits home run No. 62", date: "2022-10-04", reveal: "Judge broke Roger Maris's American League single-season home run mark." },
  { id: "evt_mlb_wbc_ohtani_trout", title: "Ohtani strikes out Trout to win the WBC", date: "2023-03-21", reveal: "Japan beat Team USA with the dream matchup finishing the tournament." },
];

const EVENT_POOLS: Record<string, RawEvent[]> = {
  nba: NBA_EVENTS,
  soccer: SOCCER_EVENTS,
  mlb: MLB_EVENTS,
};

const RANDOM_MODE_KEY = 'rewind_random_mode';
const RANDOM_SEED_KEY = 'rewind_random_seed';

/**
 * Deterministic hash for seeding.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Seeded shuffle using a simple LCG PRNG.
 */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) | 0;
    const j = Math.abs(s) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function formatEventDate(rawDate: string): string {
  if (/^\d{4}$/.test(rawDate)) {
    return rawDate;
  }

  if (/^\d{4}-\d{2}$/.test(rawDate)) {
    const [year, month] = rawDate.split('-').map(Number);
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, 1)));
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${rawDate}T00:00:00Z`));
}

function inferRevealContext(raw: RawEvent, sport: Sport): string {
  if (raw.revealContext) return raw.revealContext;

  const year = new Date(raw.date).getFullYear();
  const title = raw.title.toLowerCase();
  const reveal = raw.reveal.toLowerCase();

  if (sport === 'soccer') {
    return formatEventDate(raw.date);
  }

  if (sport === 'nba') {
    if (title.includes('draft')) return `at the ${year} NBA draft`;
    if (title.includes('mvp')) return `in ${year}`;
    if (title.includes('olympic gold')) return 'at the 1992 Barcelona Olympics';
    if (title.includes('dunk contest')) return `at the ${year} Slam Dunk Contest`;
    if (
      title.includes('title')
      || title.includes('finals')
      || reveal.includes('finals')
      || title.includes('block')
      || title.includes('corner three')
      || title.includes('flu game')
      || title.includes('last shot')
    ) {
      return `in the ${year} NBA Finals`;
    }
    return `in ${year}`;
  }

  if (sport === 'mlb') {
    if (title.includes('draft')) return `at the ${year} MLB draft`;
    if (title.includes('world series') || title.includes('win the title') || title.includes('wins the title')) {
      return `in the ${year} World Series`;
    }
    if (title.includes('mvp')) return `in ${year}`;
    if (title.includes('wbc')) return 'at the 2023 World Baseball Classic';
    return `in ${year}`;
  }

  return `in ${year}`;
}

function rawToGameEvent(raw: RawEvent, sport: Sport): GameEvent {
  const reveal = raw.reveal.trim().replace(/[.]+$/, '');
  const context = inferRevealContext(raw, sport);

  return {
    text: raw.title,
    year: new Date(raw.date).getFullYear(),
    detail: `${reveal} ${context}.`,
  };
}

/**
 * Calculate puzzle number from base date. Day 1 = 2026-06-01.
 */
function puzzleNumber(dateStr: string): number {
  const base = new Date('2026-06-01').getTime();
  const current = new Date(dateStr).getTime();
  return Math.floor((current - base) / 86_400_000) + 1;
}

export type Sport = 'nba' | 'soccer' | 'mlb';

export const SPORT_LABELS: Record<Sport, string> = {
  nba: '🏀 NBA',
  soccer: '⚽ FIFA World Cup',
  mlb: '⚾ MLB',
};

export const SPORT_ICONS: Record<Sport, string> = {
  nba: '🏀',
  soccer: '⚽',
  mlb: '⚾',
};

export function getSport(): Sport {
  const params = new URLSearchParams(window.location.search);
  const sport = params.get('sport');
  if (sport === 'soccer') return 'soccer';
  if (sport === 'mlb') return 'mlb';
  return 'nba';
}

export function isRandomModeEnabled(): boolean {
  return localStorage.getItem(RANDOM_MODE_KEY) === 'true';
}

export function setRandomModeEnabled(enabled: boolean): void {
  localStorage.setItem(RANDOM_MODE_KEY, enabled ? 'true' : 'false');
  if (!enabled) {
    sessionStorage.removeItem(RANDOM_SEED_KEY);
  }
}

export function beginPuzzleSession(): void {
  if (isRandomModeEnabled()) {
    sessionStorage.setItem(
      RANDOM_SEED_KEY,
      `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    );
  } else {
    sessionStorage.removeItem(RANDOM_SEED_KEY);
  }
}

function getPuzzleSeedSource(dateStr: string, sport: Sport): string {
  const randomSeed = sessionStorage.getItem(RANDOM_SEED_KEY);
  if (isRandomModeEnabled() && randomSeed) {
    return `random-${randomSeed}-${sport}`;
  }
  return `${dateStr}-${sport}`;
}

export function getPuzzleForDate(dateStr: string, sport: Sport = 'nba'): Puzzle {
  const pool = EVENT_POOLS[sport] || EVENT_POOLS.nba;
  const seedSource = getPuzzleSeedSource(dateStr, sport);
  const seed = hashString(seedSource);
  const shuffled = seededShuffle(pool, seed);
  const picked = shuffled.slice(0, 5);

  return {
    id: seedSource,
    number: puzzleNumber(dateStr),
    sport,
    events: picked.map((raw) => rawToGameEvent(raw, sport)),
  };
}

export function getTodaysPuzzle(sport?: Sport): Puzzle {
  const today = new Date().toISOString().slice(0, 10);
  return getPuzzleForDate(today, sport ?? getSport());
}
