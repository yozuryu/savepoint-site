// Series showcase: one segment per game lights up in turn (gold finished, silver beaten, blue started,
// lit to its %). Rotates through the five series with the most progress.
import { useEffect, useRef, useState } from 'react';
import { hubJson, xboxImg } from '../lib/hub';
import { SERIES, type Series, type SerStatus } from '../lib/fallbacks';
import { useLoop, useShowcase } from '../lib/hooks';

const COL: Record<SerStatus, string> = { done: 'var(--gold)', beaten: '#b8c4ce', started: 'var(--blue)', none: 'transparent' };

async function load(): Promise<Series[]> {
    const f = await hubJson('data/hub/series-games.json');
    return ((f && f.series) || []).filter((s: any) => s.games.length >= 3 && s.games.length <= 24).map((s: any) => {
        const games = s.games.map((g: any) => {
            const done = g.total > 0 && g.unlocked >= g.total;
            return { title: g.title, icon: g.p === 'xbox' ? xboxImg(g.icon, 128) : g.icon, p: g.p, pct: g.total ? Math.round((g.unlocked / g.total) * 100) : 0, st: (done ? 'done' : g.beaten ? 'beaten' : g.unlocked > 0 ? 'started' : 'none') as SerStatus, last: g.lastMs || 0 };
        });
        const order = { done: 0, beaten: 1, started: 2, none: 3 };
        games.sort((a: any, b: any) => order[a.st as SerStatus] - order[b.st as SerStatus] || b.pct - a.pct);
        const score = games.reduce((a: number, g: any) => a + ({ done: 3, beaten: 2, started: 1, none: 0 } as const)[g.st as SerStatus], 0);
        const cover = s.games.find((g: any) => g.key === s.cover) || s.games.find((g: any) => g.art);
        return { name: s.name, art: cover && (cover.artFull || cover.art), games, score, last: Math.max(...games.map((g: any) => g.last)) };
    }).sort((a: any, b: any) => b.score - a.score || b.last - a.last).slice(0, 5);
}

export default function SeriesShow() {
    const ref = useRef<HTMLDivElement>(null);
    const { active, playing, replay, looping } = useShowcase('series', ref);
    const [list, setList] = useState<Series[]>([SERIES]);
    const [i, setI] = useState(0);
    const [swap, setSwap] = useState(0);

    const loaded = useRef(false);
    useEffect(() => {
        if (!active || loaded.current) return;
        loaded.current = true;
        load().then(l => { if (l[0]) { setList(l); setI(0); replay(); } });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active]);

    useLoop(looping, 5200, () => {
        if (list.length < 2) return;
        setI(n => (n + 1) % list.length);
        setSwap(n => n + 1);
        replay();
    });

    const s = list[i];
    const n = (k: SerStatus) => s.games.filter(g => g.st === k).length;
    return (
        <div className={'feed show-card play' + (playing ? ' on' : '') + (swap ? ' swap' : '')} ref={ref} aria-label="A series">
            <div className="ser-art" key={'a' + swap}>{s.art && <img alt="" src={s.art} />}<b>{s.name}</b></div>
            <div className="ser-body" key={'b' + swap}>
                <div className="segs">{s.games.map((g, j) => <i key={j} style={{ '--i': j, '--c': COL[g.st], '--w': (g.st === 'started' ? Math.max(15, g.pct) : g.st === 'none' ? 0 : 100) + '%' } as React.CSSProperties} />)}</div>
                <div className="ser-icons">{s.games.slice(0, 12).map((g, j) => <img key={j} alt="" title={g.title} src={g.icon} className={g.p === 'ra' ? 'px' : undefined} style={{ borderColor: g.st === 'none' ? 'var(--line)' : COL[g.st] }} />)}</div>
                <div className="ser-stats">
                    {([['done', 'finished'], ['beaten', 'beaten'], ['started', 'started']] as [SerStatus, string][]).filter(([k]) => n(k)).map(([k, w]) => <span key={k}><i style={{ background: COL[k] }} /><b>{n(k)}</b> {w}</span>)}
                    <span>of {s.games.length} games</span>
                </div>
            </div>
        </div>
    );
}
