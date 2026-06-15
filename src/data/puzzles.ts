import type { Puzzle, GameEvent } from '../types';

interface RawEvent {
  id: string;
  title: string;
  date: string;
  reveal: string;
  revealContext?: string;
}

// ── American Sports: 10 days × 5 questions (easy → hard) ──────────────

const AMERICAN_SPORTS_DAYS: RawEvent[][] = [
  // Day 1
  [
    { id: "evt_lebron_drafted", title: "LeBron is drafted first overall by Cleveland", date: "2003-06-26", reveal: "In 2003, Cleveland selected LeBron straight out of high school as the NBA’s next superstar." },
    { id: "evt_brady_first_sb", title: "Brady and the Patriots win their first Super Bowl", date: "2002-02-03", reveal: "In 2002, New England upset the Rams and launched the Brady-Belichick dynasty." },
    { id: "evt_rose_youngest_mvp", title: "Derrick Rose becomes the youngest MVP in NBA history", date: "2011-05-03", reveal: "In 2011, Rose won MVP at 22, still the youngest winner in NBA history." },
    { id: "evt_red_sox_3_0", title: "The Red Sox come back from 3–0 down against the Yankees", date: "2004-10-20", reveal: "In 2004, Boston became the first MLB team to erase a 3–0 series deficit." },
    { id: "evt_nova_knicks_ncaa", title: "Brunson, Hart and Bridges win their first title together", date: "2016-04-04", reveal: "The Knicks’ Nova trio first won together at Villanova, taking the 2016 NCAA title." },
  ],
  // Day 2
  [
    { id: "evt_jordan_last_shot", title: "Jordan hits his last shot as a Bull to win the Finals", date: "1998-06-14", reveal: "In 1998, Jordan's jumper over Bryon Russell sealed Chicago's sixth title in eight years." },
    { id: "evt_eagles_first_sb", title: "The Eagles win their first Super Bowl with the Philly Special", date: "2018-02-04", reveal: "In 2018, Nick Foles caught the Philly Special TD and outdueled Tom Brady." },
    { id: "evt_vince_dunk_contest", title: "Vince Carter takes over the Slam Dunk Contest", date: "2000-02-12", reveal: "In 2000, Vince delivered the most iconic dunk contest ever, including the elbow dunk." },
    { id: "evt_cubs_ws", title: "The Cubs win the World Series after 108 years", date: "2016-11-02", reveal: "In 2016, Chicago beat Cleveland in a legendary extra-innings Game 7." },
    { id: "evt_ray_allen_game6", title: "Ray Allen hits the corner three to save Miami in Game 6", date: "2013-06-18", reveal: "In 2013, Ray Allen’s corner three forced overtime and saved Miami in Game 6." },
  ],
  // Day 3
  [
    { id: "evt_kawhi_bounce", title: "Kawhi’s shot bounces in to beat Philly in Game 7", date: "2019-05-12", reveal: "In 2019, Kawhi’s shot bounced four times before sending Toronto past Philly." },
    { id: "evt_the_decision", title: "LeBron announces The Decision on live TV", date: "2010-07-08", reveal: "In 2010, LeBron left Cleveland to join Wade and Bosh in Miami." },
    { id: "evt_curry_3pt_record", title: "Curry breaks the all-time three-point record at MSG", date: "2021-12-14", reveal: "In 2021, Curry passed Ray Allen’s career record on the road in New York." },
    { id: "evt_manning_last_sb", title: "Peyton Manning wins the Super Bowl in his final game", date: "2016-02-07", reveal: "In 2016, Denver’s defense carried Manning to his second ring before retirement." },
    { id: "evt_iverson_stepover", title: "Iverson drops 48 and creates the iconic step-over Finals image", date: "2001-06-06", reveal: "In 2001, Iverson stunned the Lakers in Game 1 and stepped over Tyronn Lue." },
  ],
  // Day 4
  [
    { id: "evt_kobe_drafted", title: "Kobe is drafted by Charlotte before being traded to the Lakers", date: "1996-06-26", reveal: "In 1996, Charlotte took Kobe at No. 13 before sending him to Los Angeles." },
    { id: "evt_mahomes_first_sb", title: "Mahomes wins his first Super Bowl with the Chiefs", date: "2020-02-02", reveal: "In 2020, Kansas City came back late to beat San Francisco." },
    { id: "evt_kd_joins_warriors", title: "Kevin Durant joins the Warriors in free agency", date: "2016-07-04", reveal: "In 2016, Durant’s move to Golden State reshaped the NBA." },
    { id: "evt_giannis_50_title", title: "Giannis drops 50 to win the Bucks their first title in 50 years", date: "2021-07-20", reveal: "In 2021, Giannis scored 50 in Game 6 to end Milwaukee’s title drought." },
    { id: "evt_phil_lakers_hired", title: "Phil Jackson takes over the Lakers before the three-peat", date: "1999-06-16", reveal: "In 1999, the Lakers hired Phil Jackson before winning three straight titles." },
  ],
  // Day 5
  [
    { id: "evt_lebron_scoring_record", title: "LeBron passes Kareem as the all-time scoring leader", date: "2023-02-07", reveal: "In 2023, LeBron became the NBA’s all-time scoring leader in LA." },
    { id: "evt_giants_upset_pats", title: "Eli Manning’s Giants end the Patriots’ 18-0 run in the Super Bowl", date: "2008-02-03", reveal: "In 2008, the Giants ruined New England’s perfect 18-0 season." },
    { id: "evt_linsanity", title: "Linsanity takes over New York", date: "2012-02-04", reveal: "In 2012, Jeremy Lin went from benchwarmer to Knicks sensation." },
    { id: "evt_judge_62", title: "Aaron Judge hits 62 homers breaking the AL single-season record", date: "2022-10-04", reveal: "In 2022, Judge broke Roger Maris’s American League home run record." },
    { id: "evt_dirk_upsets_heat", title: "The Mavs spoil Miami’s first Big Three Finals run", date: "2011-06-12", reveal: "In 2011, Dallas beat Miami’s new superteam in Dirk’s title run." },
  ],
  // Day 6
  [
    { id: "evt_ohtani_dodgers", title: "Ohtani signs the richest contract in sports history with the Dodgers", date: "2023-12-09", reveal: "In 2023, Ohtani's 10-year, $700 million deal became the largest in professional sports." },
    { id: "evt_brady_tampa", title: "Brady leaves the Patriots and signs with Tampa Bay", date: "2020-03-20", reveal: "In 2020, Brady ended his 20-year New England era, then won the Super Bowl with Tampa in year one." },
    { id: "evt_harden_rockets_trade", title: "James Harden is traded to the Rockets", date: "2012-10-27", reveal: "In 2012, Oklahoma City sent Harden to Houston, changing his career and the West." },
    { id: "evt_malice_palace", title: "The Malice at the Palace turns an NBA game into chaos", date: "2004-11-19", reveal: "In 2004, the Pacers-Pistons brawl became the NBA’s most infamous fight." },
    { id: "evt_ripken_streak", title: "Ripken plays his 2,131st straight game, breaking Gehrig's record", date: "1995-09-06", reveal: "In 1995, Ripken's consecutive games streak became one of baseball's most celebrated achievements." },
  ],
  // Day 7
  [
    { id: "evt_shaq_kobe_first", title: "Shaq and Kobe win their first title together", date: "2000-06-19", reveal: "In 2000, Los Angeles beat Indiana to start the Lakers' three-peat run." },
    { id: "evt_dream_team", title: "The Dream Team wins Olympic gold in Barcelona", date: "1992-08-08", reveal: "In 1992, the first US team with NBA players dominated the Olympics and changed basketball globally." },
    { id: "evt_tmac_13_35", title: "T-Mac scores 13 points in 35 seconds", date: "2004-12-09", reveal: "In 2004, McGrady stunned the Spurs with one of the wildest NBA comebacks ever." },
    { id: "evt_saints_first_sb", title: "The Saints win their first Super Bowl four years after Katrina", date: "2010-02-07", reveal: "In 2010, New Orleans' first championship became a symbol of the city's recovery." },
    { id: "evt_magic_center_finals", title: "Rookie Magic starts at center and wins Finals MVP", date: "1980-05-16", reveal: "In 1980, Magic started at center in Game 6 and led the Lakers to the title." },
  ],
  // Day 8
  [
    { id: "evt_warriors_73_9", title: "The Warriors finish 73–9 breaking the wins record", date: "2016-04-13", reveal: "In 2016, Golden State broke Chicago's 72–10 record but then lost the Finals to Cleveland." },
    { id: "evt_jordan_drafted", title: "Jordan is drafted third overall by the Bulls", date: "1984-06-19", reveal: "In 1984, Chicago took Jordan after Olajuwon and Bowie — arguably the greatest draft steal ever." },
    { id: "evt_celtics_big_three", title: "The Celtics Big Three of Pierce, Garnett, and Allen win the title", date: "2008-06-17", reveal: "In 2008, Boston beat the Lakers after assembling its superteam via blockbuster trades." },
    { id: "evt_butler_heat_finals", title: "Butler and the 8-seed Heat make the Finals as a play-in team", date: "2023-05-29", reveal: "In 2023, Jimmy Butler led Miami on an improbable run through the East before losing to Denver." },
    { id: "evt_flutie_hail_mary", title: "Flutie throws the Hail Mary for Boston College against Miami", date: "1984-11-23", reveal: "In 1984, Flutie's last-second touchdown became the most famous play in college football history." },
  ],
  // Day 9
  [
    { id: "evt_carmelo_62_msg", title: "Carmelo scores 62 at Madison Square Garden", date: "2014-01-24", reveal: "In 2014, Melo set the Knicks franchise scoring record under the MSG lights." },
    { id: "evt_astros_first_ws", title: "The Astros win their first World Series", date: "2017-11-01", reveal: "In 2017, Houston beat the Dodgers before the title was later clouded by scandal." },
    { id: "evt_luka_trae_trade", title: "Luka Doncic and Trae Young are swapped on draft night", date: "2018-06-21", reveal: "In 2018, Dallas traded up for Luka while Atlanta landed Trae Young." },
    { id: "evt_seahawks_demolish_broncos", title: "The Seahawks demolish the Broncos 43-8 in the Super Bowl", date: "2014-02-02", reveal: "In 2014, Seattle’s defense dominated Peyton Manning in a blowout." },
    { id: "evt_tim_duncan_drafted", title: "Tim Duncan goes first overall to the Spurs", date: "1997-06-25", reveal: "In 1997, San Antonio drafted Duncan and changed the franchise forever." },
  ],
  // Day 10
  [
    { id: "evt_wemby_drafted", title: "Wembanyama goes first overall to the Spurs", date: "2023-06-22", reveal: "In 2023, San Antonio selected the 7'4\" French phenom as the most anticipated prospect since LeBron." },
    { id: "evt_ichiro_debut", title: "Ichiro wins ROY and MVP in his first MLB season", date: "2001-11-20", reveal: "In 2001, Ichiro became an instant sensation in Seattle." },
    { id: "evt_cabrera_triple_crown", title: "Cabrera wins the Triple Crown, the first since 1967", date: "2012-10-03", reveal: "In 2012, Cabrera led the AL in average, homers, and RBI." },
    { id: "evt_carmelo_62_msg", title: "Carmelo scores 62 at Madison Square Garden", date: "2014-01-24", reveal: "In 2014, Melo set the Knicks franchise scoring record under the MSG lights." },
    { id: "evt_redeem_team_gold", title: "The Redeem Team wins Olympic gold for USA Basketball", date: "2008-08-24", reveal: "In 2008, Team USA beat Spain to reclaim Olympic gold in Beijing." },
  ],
];

// ── World Cup: 10 days × 5 questions (easy → hard) ────────────────────
// Day 1 Q3 swapped: South Africa hosting instead of Saudi/Argentina (avoids double-Messi/2022)
// Saudi Arabia moved to Day 5 Q2

const SOCCER_DAYS: RawEvent[][] = [
  // Day 1
  [
    { id: "evt_wc_messi_title", title: "🇦🇷 Messi wins the World Cup beating France on penalties", date: "2022-12-18", reveal: "In 2022, Argentina won one of the greatest Finals ever after Mbappe's hat-trick forced a shootout in Qatar." },
    { id: "evt_wc_france_first_title", title: "🇫🇷 Zidane scores twice as France wins its first World Cup at home", date: "1998-07-12", reveal: "In 1998, Zidane headed in two goals as France beat Brazil 3–0 in Paris." },
    { id: "evt_wc_south_africa_opener", title: "The first World Cup in Africa kicks off in South Africa", date: "2010-06-11", reveal: "In 2010, South Africa became the first African host, opening the tournament with vuvuzelas and Shakira." },
    { id: "evt_wc_senegal_stuns_france", title: "🇸🇳 Senegal stuns defending champion France in the opening match", date: "2002-05-31", reveal: "In 2002, Senegal's upset of the holders in the first game at South Korea/Japan was a sign of things to come." },
    { id: "evt_wc_van_persie_header", title: "🇳🇱 Van Persie scores the flying header as Netherlands destroy Spain 5–1", date: "2014-06-13", reveal: "In 2014, Van Persie's diving header from outside the box became one of the most replayed World Cup goals at Brazil." },
  ],
  // Day 2
  [
    { id: "evt_wc_zidane_headbutt", title: "🇫🇷 Zidane headbutts Materazzi in the World Cup final", date: "2006-07-09", reveal: "In 2006, Zidane was sent off in extra time of his final match, and Italy won the shootout in Berlin." },
    { id: "evt_wc_brazil_germany_7_1", title: "Germany beats Brazil 7–1 in the semifinal on Brazilian soil", date: "2014-07-08", reveal: "In 2014, Brazil's worst ever defeat happened at home — Germany scored four goals in six minutes." },
    { id: "evt_wc_morocco_semifinal", title: "🇲🇦 Morocco becomes the first African team to reach a semifinal", date: "2022-12-10", reveal: "In 2022, Morocco knocked out Spain and Portugal at Qatar before falling to France in the semis." },
    { id: "evt_wc_baggio_miss", title: "🇮🇹 Baggio misses the decisive penalty in the final shootout", date: "1994-07-17", reveal: "In 1994, the first World Cup final decided by penalties ended with Italy's star skying his kick at USA '94." },
    { id: "evt_wc_suarez_handball", title: "🇺🇾 Suarez handles the ball on the line to deny Ghana", date: "2010-07-02", reveal: "In 2010, Suarez was sent off but Ghana missed the resulting penalty, and Uruguay won the shootout at South Africa." },
  ],
  // Day 3
  [
    { id: "evt_wc_brazil_fifth_title", title: "🇧🇷 Ronaldo scores twice as Brazil wins its fifth title", date: "2002-06-30", reveal: "In 2002, Ronaldo's redemption after the mysterious 1998 final illness was the story of the tournament in Japan." },
    { id: "evt_wc_iniesta_winner", title: "🇪🇸 Iniesta scores in extra time to give Spain its first World Cup", date: "2010-07-11", reveal: "In 2010, Iniesta's goal deep into extra time beat the Netherlands and crowned Spain's golden generation." },
    { id: "evt_wc_japan_beats_germany", title: "🇯🇵 Japan comes from behind to beat Germany in the group stage", date: "2022-11-23", reveal: "In 2022, Japan's second-half comeback shocked the four-time champions at Qatar." },
    { id: "evt_wc_mbappe_hattrick", title: "🇫🇷 Mbappe scores a hat-trick in the final but France still loses", date: "2022-12-18", reveal: "In 2022, Mbappe scored twice in 97 seconds to force extra time, then added a third in the shootout drama." },
    { id: "evt_wc_beckham_red_card", title: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Beckham gets sent off against Argentina at France '98", date: "1998-06-30", reveal: "In 1998, Beckham's red card became a national talking point as England lost on penalties." },
  ],
  // Day 4
  [
    { id: "evt_wc_germany_2014_title", title: "🇩🇪 Gotze scores in extra time as Germany wins the World Cup", date: "2014-07-13", reveal: "In 2014, Mario Gotze's chest-and-volley in the 113th minute won it at Brazil's Maracana." },
    { id: "evt_wc_italy_2006_title", title: "🇮🇹 Italy wins the World Cup on penalties after the Zidane headbutt", date: "2006-07-09", reveal: "In 2006, Italy lifted the trophy in Berlin after one of the most dramatic finals ever." },
    { id: "evt_wc_morocco_beats_spain", title: "🇲🇦 Morocco knocks out Spain on penalties", date: "2022-12-06", reveal: "In 2022, Morocco's upset of Spain continued the biggest Cinderella run at Qatar." },
    { id: "evt_wc_russia_saudi_opener", title: "🇷🇺 Russia opens their home World Cup with a 5–0 rout", date: "2018-06-14", reveal: "In 2018, the host nation demolished Saudi Arabia at the Luzhniki Stadium in Moscow." },
    { id: "evt_wc_james_golden_boot", title: "🇨🇴 James Rodriguez wins the Golden Boot with a stunning volley vs Uruguay", date: "2014-06-28", reveal: "In 2014, Rodriguez's chest-and-volley against Uruguay might be the best World Cup goal of the decade." },
  ],
  // Day 5
  [
    { id: "evt_wc_france_2018_title", title: "🇫🇷 France beats Croatia in a high-scoring final to win its second title", date: "2018-07-15", reveal: "In 2018, a 4–2 final in Moscow gave France its second World Cup, with Mbappe scoring at 19." },
    { id: "evt_wc_saudi_stuns_argentina", title: "🇸🇦 Saudi Arabia stuns Messi's Argentina in the group stage", date: "2022-11-22", reveal: "In 2022, Saudi Arabia came from behind to beat the favorites in one of the biggest World Cup upsets ever." },
    { id: "evt_wc_germany_group_exit", title: "🇩🇪 Germany crashes out in the group stage losing to South Korea", date: "2018-06-27", reveal: "In 2018, the defending champions were stunned by two late Korean goals at Russia." },
    { id: "evt_wc_cameroon_stuns_argentina", title: "🇨🇲 Cameroon stuns defending champion Argentina in the opening match", date: "1990-06-08", reveal: "In 1990, Roger Milla and the Indomitable Lions became the first African team to reach the quarterfinals at Italia '90." },
    { id: "evt_wc_iceland_argentina", title: "🇮🇸 Iceland holds Messi's Argentina to a draw in their World Cup debut", date: "2018-06-16", reveal: "In 2018, the smallest nation ever to play in a World Cup held the favorites to 1–1 at Russia." },
  ],
  // Day 6
  [
    { id: "evt_wc_brazil_2014_host", title: "🇧🇷 Brazil hosts the World Cup for the first time since 1950", date: "2014-06-12", reveal: "In 2014, Brazil poured billions into stadiums, then suffered a traumatic 7–1 semifinal loss at home." },
    { id: "evt_wc_qatar_winter", title: "🇶🇦 Qatar hosts the first ever winter World Cup", date: "2022-11-20", reveal: "In 2022, the tournament was moved to November–December because of extreme summer heat in Qatar." },
    { id: "evt_wc_ronaldinho_free_kick", title: "🇧🇷 Ronaldinho lobs Seaman from a free kick", date: "2002-06-21", reveal: "In 2002, Ronaldinho's curling free kick sailed over England's goalkeeper — genius or fluke, still debated." },
    { id: "evt_wc_maradona_hand_of_god", title: "🇦🇷 Maradona scores the Hand of God and Goal of the Century in the same match", date: "1986-06-22", reveal: "In 1986, Maradona's two goals in Mexico City — one controversial, one breathtaking — remain the most famous in World Cup history." },
    { id: "evt_wc_miracle_of_bern", title: "🇩🇪 West Germany beats Hungary in the Miracle of Bern final", date: "1954-07-04", reveal: "In 1954, Hungary had been unbeaten for four years, but West Germany came back from 2–0 down to win 3–2." },
  ],
  // Day 7
  [
    { id: "evt_wc_neymar_injury", title: "🇧🇷 Neymar gets injured and Brazil collapses without him at home", date: "2014-07-04", reveal: "In 2014, Neymar's broken vertebra left Brazil without their star for the 7–1 demolition by Germany." },
    { id: "evt_wc_ronaldo_seizure", title: "🇧🇷 Ronaldo plays the final despite a mysterious pre-match seizure", date: "1998-07-12", reveal: "In 1998, Ronaldo was a shell of himself as Brazil lost 3–0 to France — what happened before kickoff remains debated." },
    { id: "evt_wc_croatia_first_final", title: "🇭🇷 Croatia reaches the World Cup final for the first time", date: "2018-07-11", reveal: "In 2018, Croatia fought through three straight penalty shootouts to reach the final against France at Russia." },
    { id: "evt_wc_ghana_beats_usa", title: "🇬🇭 Ghana knocks the US out with Gyan's extra-time winner", date: "2010-06-26", reveal: "In 2010, Asamoah Gyan's goal ended the US run at South Africa." },
    { id: "evt_wc_turkey_third", title: "🇹🇷 Turkey finishes third on their first deep World Cup run", date: "2002-06-29", reveal: "In 2002, Turkey shocked everyone by reaching the semifinals at South Korea/Japan." },
  ],
  // Day 8
  [
    { id: "evt_wc_donovan_algeria", title: "🇺🇸 Donovan scores in stoppage time to save the US against Algeria", date: "2010-06-23", reveal: "In 2010, Donovan's last-second winner at South Africa became an iconic American soccer moment." },
    { id: "evt_wc_messi_debut", title: "🇦🇷 A teenage Messi scores in his first World Cup", date: "2006-06-16", reveal: "In 2006, an 18-year-old Messi made his debut and scored at Germany, announcing himself on the biggest stage." },
    { id: "evt_wc_italy_fails_qualify", title: "🇮🇹 Italy fails to qualify for the World Cup for the first time in 60 years", date: "2017-11-13", reveal: "In 2018, four-time champions Italy were stunned by Sweden in the playoff and watched the tournament from home." },
    { id: "evt_wc_rossi_hattrick", title: "🇮🇹 Rossi scores a hat-trick to eliminate Brazil in a classic", date: "1982-07-05", reveal: "In 1982, Rossi came back from a betting ban to deliver one of the greatest individual World Cup performances at Spain." },
    { id: "evt_wc_east_west_germany", title: "🇩🇪 East and West Germany face each other for the only time", date: "1974-06-22", reveal: "In 1974, East Germany won 1–0 in the group stage, but West Germany went on to win the tournament at home." },
  ],
  // Day 9
  [
    { id: "evt_wc_usa_hosts", title: "🇺🇸 The United States hosts the World Cup for the first time", date: "1994-06-17", reveal: "In 1994, USA '94 set attendance records and helped grow soccer in America, ending with Brazil's shootout victory." },
    { id: "evt_wc_spain_destroyed", title: "🇪🇸 Defending champion Spain gets destroyed 5–1 by Netherlands", date: "2014-06-13", reveal: "In 2014, Van Persie and Robben tore Spain apart in the opening match — the end of the tiki-taka era." },
    { id: "evt_wc_korea_japan_hosts", title: "🇰🇷🇯🇵 South Korea and Japan co-host the first World Cup in Asia", date: "2002-05-31", reveal: "In 2002, the first Asian World Cup produced massive upsets, including co-host South Korea's run to the semis." },
    { id: "evt_wc_henry_handball", title: "🇫🇷 Henry's handball sends France to the World Cup over Ireland", date: "2009-11-18", reveal: "In 2009, Henry clearly handled the ball before assisting the decisive goal, sparking outrage in Ireland." },
    { id: "evt_wc_ronaldo_haircut", title: "🇧🇷 Ronaldo shaves a bizarre haircut before the World Cup final", date: "2002-06-30", reveal: "In 2002, Ronaldo said he did it so reporters would talk about his hair instead of his knee — it worked, and he scored twice." },
  ],
  // Day 10
  [
    { id: "evt_wc_russia_hosts", title: "🇷🇺 Russia hosts the World Cup and France wins", date: "2018-07-15", reveal: "In 2018, Russia 2018 was praised as one of the best-organized tournaments, with France dominating the knockout rounds." },
    { id: "evt_wc_france_scoreless", title: "🇫🇷 Defending champion France goes out without scoring a single goal", date: "2002-06-11", reveal: "In 2002, France played three group matches and didn't score once — one of the biggest title-holder collapses ever." },
    { id: "evt_wc_rivaldo_dive", title: "🇧🇷 Rivaldo fakes being hit in the face by a Turkish player's kick", date: "2002-06-03", reveal: "In 2002, Rivaldo's theatrical fall got the opponent sent off in one of the World Cup's most infamous dives." },
    { id: "evt_wc_klose_record", title: "🇩🇪 Klose breaks Ronaldo's all-time World Cup scoring record", date: "2014-07-08", reveal: "In 2014, Klose scored his 16th World Cup goal against Brazil in the 7–1 semifinal." },
    { id: "evt_wc_garrincha_1962", title: "🇧🇷 Garrincha leads Brazil to a second straight title without Pele", date: "1962-06-17", reveal: "In 1962, Garrincha stepped up in Pele's absence to carry Brazil to back-to-back championships at Chile." },
  ],
];

// ── Flat pools for random mode ─────────────────────────────────────────

const ALL_AMERICAN_SPORTS: RawEvent[] = AMERICAN_SPORTS_DAYS.flat();
const ALL_SOCCER: RawEvent[] = SOCCER_DAYS.flat();

const DAY_POOLS: Record<string, RawEvent[][]> = {
  american: AMERICAN_SPORTS_DAYS,
  soccer: SOCCER_DAYS,
};

const FLAT_POOLS: Record<string, RawEvent[]> = {
  american: ALL_AMERICAN_SPORTS,
  soccer: ALL_SOCCER,
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

  if (sport === 'soccer') {
    return formatEventDate(raw.date);
  }

  // American Sports reveals are self-contained ("In YYYY, ..."), no suffix needed
  if (sport === 'american') {
    return '';
  }

  return '';
}

function rawToGameEvent(raw: RawEvent, sport: Sport): GameEvent {
  const reveal = raw.reveal.trim().replace(/[.]+$/, '');
  const context = inferRevealContext(raw, sport);

  return {
    text: raw.title,
    year: new Date(raw.date).getFullYear(),
    detail: context ? `${reveal} ${context}.` : `${reveal}.`,
  };
}

/**
 * Day index into the pool (0-based).
 * Offset so that DAY_ZERO_DATE maps to index 0 (= Day 1 in the pool).
 * Change DAY_ZERO_DATE to shift which real date gets Day 1.
 */
const DAY_ZERO_DATE = '2026-06-15';

function dayIndex(dateStr: string): number {
  const ms = new Date(dateStr).getTime() - new Date(DAY_ZERO_DATE).getTime();
  return Math.floor(ms / 86_400_000);
}

export type Sport = 'american' | 'soccer';

export const SPORT_LABELS: Record<Sport, string> = {
  american: '🇺🇸 American Sports',
  soccer: '⚽ FIFA World Cup',
};

export const SPORT_ICONS: Record<Sport, string> = {
  american: '',
  soccer: '⚽',
};

export function getSport(): Sport {
  const params = new URLSearchParams(window.location.search);
  const sport = params.get('sport');
  if (sport === 'soccer') return 'soccer';
  return 'american';
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

export function getPuzzleForDate(dateStr: string, sport: Sport = 'american'): Puzzle {
  const seedSource = getPuzzleSeedSource(dateStr, sport);
  const dIdx = dayIndex(dateStr);

  let picked: RawEvent[];

  if (isRandomModeEnabled()) {
    // Random mode: seeded shuffle from entire flat pool
    const pool = FLAT_POOLS[sport] || FLAT_POOLS.american;
    const seed = hashString(seedSource);
    const shuffled = seededShuffle(pool, seed);
    picked = shuffled.slice(0, 5);
  } else {
    // Normal mode: curated day-based selection, cycling through available days
    const days = DAY_POOLS[sport] || DAY_POOLS.american;
    const idx = ((dIdx % days.length) + days.length) % days.length;
    picked = days[idx];
  }

  return {
    id: seedSource,
    number: dIdx + 1,
    sport,
    events: picked.map((raw) => rawToGameEvent(raw, sport)),
  };
}

/**
 * Read override date from ?date=YYYY-MM-DD URL param.
 * Defaults to DAY_ZERO_DATE so the game always opens on Day 1.
 * Once launched, swap the fallback to `new Date().toISOString().slice(0, 10)`
 * for real daily rotation.
 */
export function getDateOverride(): string {
  const params = new URLSearchParams(window.location.search);
  const dateParam = params.get('date');
  if (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return dateParam;
  }
  return new Date().toISOString().slice(0, 10);
}

export function getTodaysPuzzle(sport?: Sport): Puzzle {
  return getPuzzleForDate(getDateOverride(), sport ?? getSport());
}
