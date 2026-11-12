// Activity showcase: the latest play sessions (RA + Steam, idle games left out). The loop replays the
// last few arriving, oldest of them first, the way they came in.
import { useEffect, useRef, useState } from 'react';
import { asset, fmtHm, hubJson, monthDay, RA_MEDIA, raTitle } from '../lib/hub';
import { SESSIONS, type Session } from '../lib/fallbacks';
import { useLoop, useShowcase } from '../lib/hooks';

const SHOWN = 4;

const when = (ms: number) => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const d = new Date(ms), day0 = new Date(d); day0.setHours(0, 0, 0, 0);
    const n = Math.round((+today - +day0) / 864e5);
    const day = n === 0 ? 'Today' : n === 1 ? 'Yesterday' : n < 7 ? d.toLocaleDateString('en', { weekday: 'long' }) : monthDay(ms);
    return day + ' · ' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
};

type Row = { s: Session; key: number; state?: 'new' | 'out' };

export default function ActivityShow() {
    const ref = useRef<HTMLDivElement>(null);
    const { active, playing, replay, looping } = useShowcase('activity', ref);
    // oldest first
    const [old, setOld] = useState<Session[]>(() => SESSIONS.slice().reverse());
    const seq = useRef(0), next = useRef(0);
    const [rows, setRows] = useState<Row[]>([]);
    const [busy, setBusy] = useState(false);
    const [swap, setSwap] = useState(0);
    const max = Math.max(...old.map(s => s.minutes), 1);

    // Shows the SHOWN sessions before the ones that will arrive (or the latest, when there's nothing to replay)
    const reset = (list: Session[], final: boolean) => {
        const upto = final ? list.length : list.length - Math.max(0, Math.min(4, list.length - SHOWN));
        setRows(list.slice(Math.max(0, upto - SHOWN), upto).reverse().map(s => ({ s, key: seq.current++ })));
        next.current = upto;
    };
    const [hydrated, setHydrated] = useState(false);
    useEffect(() => { reset(old, true); setHydrated(true); }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Live sessions load the first time the tab opens
    const loaded = useRef(false);
    useEffect(() => {
        if (!active || loaded.current) return;
        loaded.current = true;
        const y = new Date().getFullYear();
        Promise.all([hubJson('data/hub/idle-games.json'), ...(['ra', 'steam'] as const).flatMap(p => [y - 1, y].map(yr => hubJson('data/' + p + '/playtime/' + yr + '.json').then(f => ({ p, f }))))]).then(([idleFile, ...files]) => {
            const idle = new Set<string>((idleFile && idleFile.games) || []);
            const list = (files as { p: 'ra' | 'steam'; f: any }[]).flatMap(({ p, f }) => ((f && f.sessions) || []).map((s: any) => {
                const g = (f.games || {})[s.gameId] || {};
                return { p, id: String(s.gameId), name: p === 'ra' ? raTitle(g.name) : g.name, icon: g.icon ? (p === 'ra' ? RA_MEDIA + g.icon : g.icon) : '', minutes: s.minutes, start: Date.parse(s.start), end: Date.parse(s.end) };
            })).filter((s: any) => !idle.has(s.p + ':' + s.id)).sort((a: any, b: any) => b.end - a.end).slice(0, 10);
            if (!list.length) return;
            const o = list.reverse();
            setOld(o); reset(o, !looping); replay();
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [active]);

    useLoop(looping, 4600, () => {
        if (next.current >= old.length) { reset(old, false); setSwap(n => n + 1); return; }
        setBusy(true);
        window.setTimeout(() => {
            const s = old[next.current++];
            if (!s) return;
            setRows(rs => [{ s, key: seq.current++, state: 'new' as const }, ...rs.filter(r => r.state !== 'out').map((r, i) => (i >= SHOWN - 1 ? { ...r, state: 'out' as const } : { ...r, state: undefined }))]);
            window.setTimeout(() => setRows(rs => rs.filter(r => r.state !== 'out')), 500);
            setBusy(false);
        }, 1200);
    }, () => reset(old, false));

    // Before hydration (and for crawlers) the latest sessions, rendered from the fallback
    const shown: Row[] = hydrated ? rows : SESSIONS.slice(0, SHOWN).map((s, i) => ({ s, key: -1 - i }));
    return (
        <div className={'feed show-card play' + (playing ? ' on' : '') + (busy ? ' busy' : '')} ref={ref} aria-label="Latest play sessions">
            <div className="feed-head">Recent sessions<span className="st" aria-live="polite"><i /><span>{busy ? 'Syncing…' : 'Synced · just now'}</span></span></div>
            <ul className={'sess' + (swap ? ' swap' : '')} key={swap}>
                {shown.map(({ s, key, state }, i) => (
                    <li key={key} className={state} data-p={s.p} style={{ '--i': state === 'new' ? 0 : i } as React.CSSProperties}>
                        <img alt="" src={s.icon || asset('icon-' + s.p + '.png')} className={s.p === 'ra' ? 'px' : undefined} />
                        <b>{s.name}</b><em>{fmtHm(s.minutes)}</em>
                        <span className="when">{hydrated ? when(s.start) : '\u00a0'}</span>
                        <span className="bar"><i style={{ width: Math.max(4, (s.minutes / max) * 100) + '%' }} /></span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
