// The last 13 weeks of real unlocks as a heatmap, filling in once when it comes into view.
import { useEffect, useRef, useState } from 'react';
import { localKey, recentUnlocks } from '../lib/hub';
import { HEAT } from '../lib/fallbacks';
import { useReduced, useSeen } from '../lib/hooks';

const level = (n: number) => (n === 0 ? 0 : n <= 2 ? 1 : n <= 5 ? 2 : n <= 9 ? 3 : 4);

export default function Heatmap() {
    const ref = useRef<HTMLDivElement>(null);
    const [counts, setCounts] = useState(HEAT);
    const seen = useSeen(ref, '0px 0px -15% 0px');
    const reduced = useReduced();
    useEffect(() => {
        recentUnlocks().then(all => {
            // Days in the viewer's own timezone, today last
            const per: Record<string, number> = {};
            for (const x of all) { const k = localKey(new Date(x.t)); per[k] = (per[k] || 0) + 1; }
            const today = new Date(), out: number[] = [];
            for (let i = 90; i >= 0; i--) out.push(per[localKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - i))] || 0);
            setCounts(out);
        }).catch(() => {});
    }, []);
    const total = counts.reduce((a, b) => a + b, 0), days = counts.filter(Boolean).length;
    return (
        <div className="heat" aria-label="The author’s unlocks per day over the last 13 weeks">
            <div className={'heat-grid' + (seen || reduced ? ' on' : '')} ref={ref}>
                {counts.map((n, i) => (
                    <i key={i} data-l={level(n)} style={{ '--c': Math.floor(i / 7), '--r': i % 7 } as React.CSSProperties} title={n + (n === 1 ? ' unlock' : ' unlocks')} />
                ))}
            </div>
            <div className="heat-meta"><span><b>{total.toLocaleString('en')}</b> unlocks · <b>{days}</b> active days</span><span>Last 13 weeks</span></div>
        </div>
    );
}
