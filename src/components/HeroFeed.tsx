// The hub taking an hourly update: plays the newest real unlocks from the live hub (two per game at most,
// so it shows a mix), one arriving every few seconds while the hero is on screen.
import { useEffect, useRef, useState } from 'react';
import { asset, recentUnlocks } from '../lib/hub';
import { FEED, type FeedItem } from '../lib/fallbacks';
import { useOnScreen, useReduced } from '../lib/hooks';

const SHOWN = 3;
type Row = FeedItem & { key: number; state?: 'new' | 'out' };

const pick = (all: FeedItem[]) => {
    const per: Record<string, number> = {}, out: FeedItem[] = [];
    for (const x of all.slice().sort((a, b) => ((a.t ?? '') < (b.t ?? '') ? 1 : -1))) {
        if ((per[x.g] = (per[x.g] || 0) + 1) > 2) continue;
        out.push(x);
        if (out.length === 9) break;
    }
    return out;
};

export default function HeroFeed() {
    const ref = useRef<HTMLDivElement>(null);
    const reduced = useReduced();
    const onScreen = useOnScreen(ref);
    // Oldest of the newest go in first, so the real newest unlock is the last to arrive
    const [items, setItems] = useState<FeedItem[]>(() => FEED.slice().reverse());
    const seq = useRef(0);
    const first = (list: FeedItem[]) => (reduced ? list.slice(-SHOWN) : list.slice(0, SHOWN)).reverse().map(x => ({ ...x, key: seq.current++ }));
    const [rows, setRows] = useState<Row[]>(() => first(FEED.slice().reverse()));
    const next = useRef(SHOWN);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        recentUnlocks().then(all => {
            const live = pick(all);
            if (live.length < SHOWN) return;
            const list = live.reverse();
            setItems(list); setRows(first(list)); next.current = SHOWN % list.length;
        }).catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // Reduced motion: no arrivals, just the real newest three
    useEffect(() => { if (reduced) setRows(first(items)); }, [reduced]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!onScreen || reduced) return;
        let t = 0;
        const tick = () => {
            setBusy(true);
            t = window.setTimeout(() => {
                const x = items[next.current];
                next.current = (next.current + 1) % items.length;
                setRows(rs => [{ ...x, key: seq.current++, state: 'new' as const }, ...rs.filter(r => r.state !== 'out').map((r, i) => (i >= SHOWN - 1 ? { ...r, state: 'out' as const } : { ...r, state: undefined }))]);
                window.setTimeout(() => setRows(rs => rs.filter(r => r.state !== 'out')), 500);
                setBusy(false);
                t = window.setTimeout(tick, 3600);
            }, 1300);
        };
        t = window.setTimeout(tick, 1600);
        return () => clearTimeout(t);
    }, [onScreen, reduced, items]);

    return (
        <div className={'feed' + (busy ? ' busy' : '')} ref={ref} aria-label="Latest unlocks">
            <div className="feed-head">Recent unlocks<span className="st" aria-live="polite"><i /><span>{busy ? 'Syncing…' : 'Synced · just now'}</span></span></div>
            <ul>
                {rows.map(x => (
                    <li key={x.key} className={x.state}>
                        <img src={x.i} alt="" loading="lazy" className={x.p === 'steam' ? 'st-icon' : undefined} />
                        <div><b>{x.n}</b><span>{x.g}</span></div>
                        <em className={x.p === 'ra' ? 'pts' : undefined}><img alt="" src={asset('icon-' + x.p + '.png')} />{x.p === 'ra' ? '+' + x.v : x.v + '%'}</em>
                    </li>
                ))}
            </ul>
        </div>
    );
}
