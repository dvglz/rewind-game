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
  date: string;            // ISO day this special replaces
  enabled: boolean;        // KILL SWITCH — set false + deploy to restore the regular daily
  flag: string;
  label: string;
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
  homeHeadline: 'Maybe it’s his last game.',
  homeSub: 'Walk Messi’s journey — 10 moments, one career.',
  shareLine: 'I walked Messi’s journey — 10 moments by year',
  weights: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
  events: [
    {
      id: 'evt_messi_napkin',
      title: 'A 13-year-old Messi gets his first Barcelona contract — written on a napkin',
      date: '2000-12-14',
      reveal: 'In 2000, Barcelona were so scared of losing the tiny kid from Rosario that the first agreement was scribbled on a paper napkin during lunch at a tennis club',
    },
    {
      id: 'evt_messi_debut',
      title: 'Messi makes his La Liga debut for Barcelona',
      date: '2004-10-16',
      reveal: 'In 2004, a 17-year-old Messi came on against Espanyol in the derby, becoming one of the youngest players ever to appear for Barcelona in La Liga',
    },
    {
      id: 'evt_messi_first_goal',
      title: 'Messi scores his first senior goal, chipped in from a Ronaldinho assist',
      date: '2005-05-01',
      reveal: 'In 2005, Ronaldinho lobbed the pass and the teenager finished it against Albacete — the first of more than 800 career goals',
    },
    {
      id: 'evt_messi_first_ballon',
      title: 'Messi wins his first Ballon d’Or',
      date: '2009-12-01',
      reveal: 'In 2009, after Barcelona won six trophies in a single year, Messi claimed his first Ballon d’Or by what was then the widest margin in the award’s history',
    },
    {
      id: 'evt_messi_91_goals',
      title: 'Messi sets the record for most goals in a calendar year: 91',
      date: '2012-12-22',
      reveal: 'In 2012, Messi passed Gerd Müller’s 85-goal mark and finished on 91 goals for club and country — a record nobody has come close to since',
    },
    {
      id: 'evt_messi_wc_final_loss',
      title: 'Messi loses the World Cup final to Germany at the Maracanã',
      date: '2014-07-13',
      reveal: 'In 2014, Götze’s extra-time volley broke Argentina’s hearts, and Messi’s long walk past the trophy became one of football’s most haunting images',
    },
    {
      id: 'evt_messi_retirement',
      title: 'Messi announces his retirement from international football',
      date: '2016-06-26',
      reveal: 'In 2016, after missing a penalty in a third straight final defeat, Messi said “the national team is over for me” — he was back within months',
    },
    {
      id: 'evt_messi_copa_win',
      title: 'Messi finally wins his first title with Argentina — the Copa América',
      date: '2021-07-10',
      reveal: 'In 2021, Argentina beat Brazil at the Maracanã and Messi’s teammates threw him into the air — his first international trophy after 16 years of trying',
    },
    {
      id: 'evt_messi_wc_title',
      title: 'Messi lifts the World Cup in Qatar',
      date: '2022-12-18',
      reveal: 'In 2022, Messi won maybe the greatest final ever played, beating France on penalties after a 3–3 epic to complete football’s last unfinished résumé',
    },
    {
      id: 'evt_messi_miami',
      title: 'Messi debuts for Inter Miami and wins it with a last-minute free kick',
      date: '2023-07-21',
      reveal: 'In 2023, Messi’s first game in American soccer ended with a 94th-minute free-kick winner — and MLS was never the same',
    },
  ],
};

export const SPECIAL_DAYS: SpecialDay[] = [MESSI_SPECIAL];

export function getSpecialForDate(date: string): SpecialDay | null {
  return SPECIAL_DAYS.find((s) => s.enabled && s.date === date) ?? null;
}

/**
 * Vanity-path handling (e.g. /messi). Returns the search-preserving redirect
 * target, or null when the path isn't a special. ISO date strings compare
 * lexicographically, so <= is a correct date comparison.
 */
export function computeSpecialRedirect(pathname: string, today: string): string | null {
  const slug = pathname.replace(/^\/+|\/+$/g, '');
  if (!slug) return null;
  const special = SPECIAL_DAYS.find((s) => s.slug === slug);
  if (!special) return null;
  if (!special.enabled || today <= special.date) return '/';
  return '/?mode=archive';
}
