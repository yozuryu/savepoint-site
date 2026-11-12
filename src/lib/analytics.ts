// The best of the hub's Analytics page for the last 3 months, read live. Same rules as that page
// (idle games and achievement farms left out, days and hours in the viewer's timezone).
import { hubJson as json, RA_MEDIA, xboxImg, raTitle, localKey, type Plat } from './hub';

const DAY = 864e5, WINDOW = 90;

export interface Rare { p: Plat; name: string; game: string; icon: string; px: boolean; r: number }
export type Story =
    | { kind: 'comeback'; p: Plat; name: string; icon: string; px?: boolean; gap: number; minutes: number; unlocks: number }
    | { kind: 'binge'; p: Plat; name: string; icon: string; px?: boolean; perDay: number; days: number }
    | { kind: 'days'; p: Plat; name: string; icon: string; px?: boolean; days: number; minutes: number };
export interface Top { p: Plat; name: string; icon: string; px?: boolean; art?: string; art2?: string; minutes: number; share: number }
export interface Analytics {
    recap: { minutes: number; prevMinutes: number; unlocks: number; prevUnlocks: number; days: number; prevDays: number };
    byHour: number[]; start: number | null;
    peak: { day: number; hour: number; share: number } | null;
    fav: { day: number; share: number }; weekend: number; late: number;
    top: Top | null; rares: Rare[]; stories: Story[];
}

/** The author's numbers on 2026-11-12, used until (or if) the live data can't be read. */
export const ANALYTICS_FALLBACK: Analytics = {"recap":{"minutes":5028,"prevMinutes":2354,"unlocks":119,"prevUnlocks":187,"days":51,"prevDays":52},"byHour":[6,0,0,0,0,0,10,14,48,23,125,233,236,91,175,489,430,531,312,345,642,592,551,175],"start":1106,"peak":{"day":4,"hour":19,"share":9},"fav":{"day":5,"share":34},"weekend":64,"late":0,"top":{"p":"steam","name":"LEGO® City Undercover","icon":"https://media.steampowered.com/steamcommunity/public/images/apps/578330/48536e84b21951f851ec4ecf8349370a867e2c37.jpg","art":"https://cdn.akamai.steamstatic.com/steam/apps/578330/library_hero.jpg","art2":"https://cdn.akamai.steamstatic.com/steam/apps/578330/header.jpg","minutes":1908,"share":38},"rares":[{"p":"steam","name":"Training","game":"OCTOPATH TRAVELER","icon":"https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/921570/dd8064abe5bdc0f20da8052248be32ade82b391d.jpg","px":false,"r":5.9}],"stories":[{"kind":"comeback","p":"ra","name":"Tomba! 2: The Evil Swine Return","icon":"https://media.retroachievements.org/Images/124477.png","px":true,"gap":123,"minutes":454,"unlocks":25}]};

export async function computeAnalytics(): Promise<Analytics> {
    const now = new Date();
    const day0 = (n: number) => new Date(now.getFullYear(), now.getMonth(), now.getDate() - n).getTime();
    const startMs = day0(WINDOW - 1), prevMs = day0(2 * WINDOW - 1), endMs = day0(-1);
    const inWin = (ms: number) => ms >= startMs && ms < endMs, inPrev = (ms: number) => ms >= prevMs && ms < startMs;

    // Play sessions (RA + Steam) for the window and the one before
    const years: number[] = [];
    for (let y = new Date(prevMs).getFullYear(); y <= now.getFullYear(); y++) years.push(y);
    const play = await Promise.all((['ra', 'steam'] as Plat[]).flatMap(p => years.map(y => json('data/' + p + '/playtime/' + y + '.json').then(f => ({ p, f })))));
    if (!play.some(x => x.f)) throw new Error('no playtime');
    const names: Record<string, Record<string, any>> = { ra: {}, steam: {}, xbox: {} };
    for (const { p, f } of play) for (const [id, g] of Object.entries((f && f.games) || {})) names[p][id] = g;
    const sessions = play.flatMap(({ p, f }) => ((f && f.sessions) || []).map((s: any) => ({ p, g: String(s.gameId), minutes: s.minutes as number, startMs: Date.parse(s.start), endMs: Date.parse(s.end) })));
    // Every unlock, all time (comebacks need the whole history; rarity is in it)
    const unlocks = (await Promise.all((['ra', 'steam', 'xbox'] as Plat[]).map(async p => {
        const idx = await json('data/' + p + '/history/index.json');
        const files = await Promise.all(Object.keys((idx && idx.years) || {}).map(y => json('data/' + p + '/history/' + y + '.json')));
        return files.flatMap(f => ((f && f.unlocks) || []).map((u: any) => ({ p, g: String(u.g), a: String(u.a), n: u.n as string, r: u.r as number | undefined, ms: Date.parse(u.t) })));
    }))).flat();

    // Farms (Steam, 10+ unlocks at over 15 an hour, plus the admin's marks) and idle games are left out
    const marks = (await json('data/hub/farm-games.json')) || {};
    const notFarm = new Set<string>(marks.notFarms || []);
    const steamIds = [...new Set([...sessions, ...unlocks.map(u => ({ ...u, endMs: u.ms }))].filter(x => x.p === 'steam' && x.endMs >= prevMs).map(x => x.g))];
    const farms = new Set<string>([...(await Promise.all(steamIds.map(async id => {
        if (notFarm.has('steam:' + id)) return null;
        const g = await json('data/steam/games/' + id + '.json');
        return g && g.unlocked >= 10 && g.unlocked / Math.max((g.playtimeForever || 0) / 60, 0.1) > 15 ? 'steam:' + id : null;
    }))).filter((x): x is string => !!x), ...(marks.farms || [])]);
    const idle = new Set<string>(((await json('data/hub/idle-games.json')) || {}).games || []);
    const keep = (x: { p: string; g: string }) => !farms.has(x.p + ':' + x.g) && !idle.has(x.p + ':' + x.g);
    const S = sessions.filter(keep), U = unlocks.filter(keep);

    const spread = (s: { startMs: number; endMs: number; minutes: number }, next: (d: Date) => number) => {
        const span = s.endMs - s.startMs;
        if (!(span > 0)) return [{ t: s.endMs, minutes: s.minutes }];
        const out: { t: number; minutes: number }[] = [];
        for (let t = s.startMs; t < s.endMs;) { const n = Math.min(next(new Date(t)), s.endMs); out.push({ t, minutes: s.minutes * ((n - t) / span) }); t = n; }
        return out;
    };
    const nextDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).getTime();
    const nextHour = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours() + 1).getTime();

    // Recap and per game, by local day
    let minutes = 0, prevMinutes = 0;
    const days = new Set<string>(), prevDays = new Set<string>(), perGame: Record<string, number> = {}, playDays: Record<string, Set<string>> = {};
    for (const s of S) for (const d of spread(s, nextDay)) {
        const k = s.p + ':' + s.g;
        if (inPrev(d.t)) { prevMinutes += d.minutes; if (d.minutes >= 1) prevDays.add(localKey(d.t)); }
        if (!inWin(d.t)) continue;
        minutes += d.minutes;
        perGame[k] = (perGame[k] || 0) + d.minutes;
        if (d.minutes >= 1) { days.add(localKey(d.t)); (playDays[k] ??= new Set()).add(localKey(d.t)); }
    }
    const winU = U.filter(u => inWin(u.ms)), prevU = U.filter(u => inPrev(u.ms));
    winU.forEach(u => days.add(localKey(u.ms)));
    prevU.forEach(u => prevDays.add(localKey(u.ms)));

    // Rhythm: sessions that ended in the window, spread over weekday × hour (Monday first)
    const grid = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);
    const winS = S.filter(s => inWin(s.endMs));
    for (const s of winS) for (const x of spread(s, nextHour)) { const d = new Date(x.t); grid[(d.getDay() + 6) % 7][d.getHours()] += x.minutes; }
    const flat = grid.flat(), total = flat.reduce((a, v) => a + v, 0) || 1;
    const byHour = Array.from({ length: 24 }, (_, h) => grid.reduce((a, r) => a + r[h], 0));
    let peakAt = 0;
    for (let i = 1; i < 168; i++) if (flat[i] + flat[(i + 1) % 168] > flat[peakAt] + flat[(peakAt + 1) % 168]) peakAt = i;
    const dayMinutes = grid.map(r => r.reduce((a, v) => a + v, 0));
    const fav = dayMinutes.indexOf(Math.max(...dayMinutes));
    // Typical start: median start time on a clock that starts at 05:00, so after-midnight play counts as late
    const starts = winS.map(s => { const d = new Date(s.startMs); return (d.getHours() * 60 + d.getMinutes() - 300 + 1440) % 1440; }).sort((a, b) => a - b);
    const med = starts.length ? (starts.length % 2 ? starts[(starts.length - 1) / 2] : (starts[starts.length / 2 - 1] + starts[starts.length / 2]) / 2) : null;

    // Game details (name, icon, art, achievements) from its own file
    const artPicks = (await json('data/ra/art.json')) || {};
    const info = async (p: string, id: string) => {
        const f = await json('data/' + p + '/games/' + id + '.json'), pt = names[p][id] || {};
        if (p === 'ra') {
            const pick = (artPicks.games || {})[id] || {};
            const icon = f && f.imageIcon ? RA_MEDIA + f.imageIcon : pt.icon ? RA_MEDIA + pt.icon : '';
            return { f, name: raTitle((f && f.title) || pt.name), icon, px: true, art: (pick.hero && pick.hero.url) || (f && f.imageIngame ? RA_MEDIA + f.imageIngame : ''), art2: undefined as string | undefined };
        }
        if (p === 'steam') return { f, name: (f && f.gameName) || pt.name, icon: (f && f.iconUrl) || pt.icon || '', px: false, art: 'https://cdn.akamai.steamstatic.com/steam/apps/' + id + '/library_hero.jpg', art2: (f && f.headerUrl) || 'https://cdn.akamai.steamstatic.com/steam/apps/' + id + '/header.jpg' };
        return { f, name: f && f.gameName, icon: xboxImg(f && f.iconUrl, 128), px: false, art: xboxImg(f && f.heroUrl, 1080), art2: undefined };
    };

    const topE = Object.entries(perGame).reduce<[string, number] | null>((m, e) => (!m || e[1] > m[1] ? e : m), null);
    let top: Top | null = null;
    if (topE) {
        const [p, id] = topE[0].split(':'), g = await info(p, id);
        top = { p: p as Plat, name: g.name, icon: g.icon, px: g.px, art: g.art, art2: g.art2, minutes: Math.round(topE[1]), share: Math.round((topE[1] / Math.max(minutes, 1)) * 100) };
    }

    // Rarest unlocks of the window (RA rarity = share of its players)
    const rares: Rare[] = [];
    for (const u of winU.filter(u => u.r != null).sort((a, b) => a.r! - b.r!).slice(0, 3)) {
        const g = await info(u.p, u.g), ach = g.f && g.f.achievements;
        let icon = '';
        if (u.p === 'ra') { const a = ach && (Array.isArray(ach) ? ach.find((x: any) => String(x.id) === u.a) : ach[u.a]); if (a) icon = RA_MEDIA + '/Badge/' + a.badgeName + '.png'; }
        else {
            const a = (ach || []).find((x: any) => String(x.apiName) === u.a);
            // Steam game files keep only the icon file name
            if (a) icon = u.p === 'xbox' ? xboxImg(a.iconUrl, 128) : /^https?:/.test(a.iconUrl) ? a.iconUrl : 'https://steamcdn-a.akamaihd.net/steamcommunity/public/images/apps/' + u.g + '/' + a.iconUrl;
        }
        rares.push({ p: u.p, name: u.n, game: g.name, icon: icon || g.icon, px: u.p === 'ra', r: u.r! });
    }

    // Stories, each about a different game and never the top game: the biggest comeback (60+ days away,
    // 30+ minutes or 3+ unlocks since), the biggest binge, the most days played
    const acts: Record<string, number[]> = {};
    for (const s of S) (acts[s.p + ':' + s.g] ??= []).push(s.startMs);
    for (const u of U) (acts[u.p + ':' + u.g] ??= []).push(u.ms);
    const comebacks: { k: string; gap: number; minutes: number; unlocks: number }[] = [];
    for (const [k, list] of Object.entries(acts)) {
        if (topE && k === topE[0]) continue;
        list.sort((a, b) => a - b);
        const i = list.findIndex((ms, n) => n > 0 && inWin(ms) && ms - list[n - 1] >= 60 * DAY);
        if (i < 0) continue;
        const back = list[i], [p, g] = k.split(':');
        const mins = S.filter(s => s.p === p && s.g === g && s.startMs >= back && inWin(s.endMs)).reduce((a, s) => a + s.minutes, 0);
        const unl = winU.filter(u => u.p === p && u.g === g && u.ms >= back).length;
        if (mins < 30 && unl < 3) continue;
        comebacks.push({ k, gap: Math.round((back - list[i - 1]) / DAY), minutes: Math.round(mins), unlocks: unl });
    }
    comebacks.sort((a, b) => b.minutes - a.minutes || b.unlocks - a.unlocks);
    const stories: Story[] = [], used = new Set(topE ? [topE[0]] : []);
    const c = comebacks.find(x => !used.has(x.k));
    if (c) {
        used.add(c.k);
        const [p, id] = c.k.split(':'), g = await info(p, id);
        stories.push({ kind: 'comeback', p: p as Plat, name: g.name, icon: g.icon, px: g.px, gap: c.gap, minutes: c.minutes, unlocks: c.unlocks });
    }
    const b = Object.entries(playDays).filter(([k, d]) => !used.has(k) && d.size >= 2 && perGame[k] >= 120).map(([k, d]) => [k, perGame[k] / d.size, d.size] as const).sort((x, y) => y[1] - x[1])[0];
    if (b) {
        used.add(b[0]);
        const [p, id] = b[0].split(':'), g = await info(p, id);
        stories.push({ kind: 'binge', p: p as Plat, name: g.name, icon: g.icon, px: g.px, perDay: Math.round(b[1]), days: b[2] });
    }
    const md = Object.entries(playDays).filter(([k, d]) => !used.has(k) && d.size >= 3).sort((x, y) => y[1].size - x[1].size || perGame[y[0]] - perGame[x[0]])[0];
    if (md) {
        const [p, id] = md[0].split(':'), g = await info(p, id);
        stories.push({ kind: 'days', p: p as Plat, name: g.name, icon: g.icon, px: g.px, days: md[1].size, minutes: Math.round(perGame[md[0]]) });
    }

    return {
        recap: { minutes: Math.round(minutes), prevMinutes: Math.round(prevMinutes), unlocks: winU.length, prevUnlocks: prevU.length, days: days.size, prevDays: prevDays.size },
        byHour: byHour.map(Math.round), start: med == null ? null : Math.round(med + 300) % 1440,
        peak: flat[peakAt] + flat[(peakAt + 1) % 168] ? { day: Math.floor(peakAt / 24), hour: peakAt % 24, share: Math.round(((flat[peakAt] + flat[(peakAt + 1) % 168]) / total) * 100) } : null,
        fav: { day: fav, share: Math.round((dayMinutes[fav] / total) * 100) },
        weekend: Math.round(((dayMinutes[5] + dayMinutes[6]) / total) * 100),
        late: Math.round((byHour.slice(0, 5).reduce((a, v) => a + v, 0) / total) * 100),
        top, rares, stories,
    };
}
