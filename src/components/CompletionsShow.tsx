// Completions showcase: the newest finished game lands as a card in its tier colour, and the count
// goes up by one for a gold-tier game.
import { useEffect, useRef, useState } from 'react';
import { hubJson, monthDay, RA_MEDIA, raTitle, steamHeader, xboxImg } from '../lib/hub';
import { COMPLETIONS, type Completion } from '../lib/fallbacks';
import { useHydrated, useLoop, useShowcase } from '../lib/hooks';

const beaten = (x: Completion) => (x.tier === 'Beaten' ? ' beaten' : '');

async function load() {
    const [ra, st, xb, art] = await Promise.all([hubJson('data/ra/profile.json'), hubJson('data/steam/profile.json'), hubJson('data/xbox/profile.json'), hubJson('data/ra/art.json')]);
    if (!ra && !st) return null;
    const picks = (art && art.games) || {};
    const best: Record<string, Completion & { rank: number }> = {};
    for (const a of (ra && ra.pageAwards && ra.pageAwards.visibleUserAwards) || []) {
        if (a.awardType !== 'Mastery/Completion' && a.awardType !== 'Game Beaten') continue;
        const top = a.awardType === 'Mastery/Completion', id = String(a.awardData);
        const x = { tier: top ? (a.awardDataExtra === 1 ? 'Mastered' : 'Completed') : 'Beaten', rank: top ? 2 : 1, name: raTitle(a.title), ms: Date.parse(a.awardedAt), icon: RA_MEDIA + a.imageIcon,
            art: (picks[id] && picks[id].hero && picks[id].hero.url) || RA_MEDIA + (a.imageIngame || a.imageIcon), px: !(picks[id] && picks[id].hero) };
        if (!best['ra:' + id] || best['ra:' + id].rank < x.rank) best['ra:' + id] = x;
    }
    for (const g of (st && st.perfectGames) || []) best['steam:' + g.appId] = { tier: 'Perfect', rank: 2, name: g.gameName, ms: Date.parse(g.completedAt), icon: g.iconUrl, art: steamHeader(g.appId, g.headerUrl) };
    for (const g of (xb && xb.perfectGames) || []) best['xbox:' + g.titleId] = { tier: 'Completed', rank: 2, name: g.gameName, ms: Date.parse(g.completedAt || g.lastUnlockedAt), icon: xboxImg(g.iconUrl, 128), art: xboxImg(g.heroUrl || g.posterUrl, 1080) };
    const all = Object.values(best).filter(x => x.ms).sort((a, b) => b.ms - a.ms);
    return { count: all.filter(x => x.rank === 2).length, items: all.slice(0, 7) as Completion[] };
}

export default function CompletionsShow() {
    const ref = useRef<HTMLDivElement>(null);
    const { active, playing, replay, looping } = useShowcase('completions', ref);
    const hydrated = useHydrated();
    const [data, setData] = useState(COMPLETIONS);
    // oldest first; k is the one shown as the big card
    const old = data.items.slice().reverse();
    const [k, setK] = useState(old.length - 1);
    const [arriving, setArriving] = useState(false);
    const [swap, setSwap] = useState(0);
    const startK = () => Math.max(0, old.length - 4);

    const loaded = useRef(false);
    useEffect(() => {
        if (!active || loaded.current) return;
        loaded.current = true;
        load().then(d => {
            if (!d) return;
            setData(d); setArriving(false);
            setK(looping ? Math.max(0, d.items.length - 4) : d.items.length - 1);
            replay();
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active]);

    useLoop(looping, 4200, () => {
        if (k >= old.length - 1) { setK(startK()); setArriving(false); setSwap(n => n + 1); return; }
        setK(k + 1); setArriving(true);
    }, () => { setK(startK()); setArriving(false); });

    const first = old[k], rest = [old[k - 1], old[k - 2], old[k - 3]].filter(Boolean);
    // The count as it was then: the total minus the gold-tier games that came later
    const count = data.count - old.slice(k + 1).filter(x => x.tier !== 'Beaten').length;
    const date = (ms: number) => (hydrated ? monthDay(ms) : '');
    return (
        <div className={'feed show-card play' + (playing ? ' on' : '') + (swap ? ' swap' : '')} ref={ref} aria-label="Latest completions">
            <div className="feed-head" key={'h' + swap}>Completions<span className="st count"><b key={k} className={arriving && first && first.tier !== 'Beaten' ? 'bump' : undefined}>{count}</b>completed</span></div>
            {first && (
                <div key={'n' + k} className={'cmp-new' + beaten(first) + (arriving ? ' arrive' : '')}>
                    <img alt="" src={first.art} className={first.px ? 'px' : undefined} />
                    <div className="cap"><span className={'tier' + beaten(first)}>{first.tier}</span><b>{first.name}</b><span>{date(first.ms)}</span></div>
                </div>
            )}
            <ul className="cmp-rest" key={'r' + swap}>
                {rest.map((x, i) => (
                    <li key={k + ':' + i} className={(beaten(x).trim() + (arriving && i === 0 ? ' new' : '')).trim() || undefined}>
                        <img alt="" src={x.icon} className={x.px ? 'px' : undefined} />
                        <b>{x.name}</b><span>{x.tier}{hydrated ? ' · ' + monthDay(x.ms) : ''}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
