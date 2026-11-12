// Where to get each platform's API key, one tab per platform the reader picked. The instructions are
// passed in as static HTML (one slot per platform), so they're in the page for search engines too.
import { useEffect, useState, type ReactNode } from 'react';
import { useDocs } from './useDocs';
import { PLATFORMS } from './AboutYou';
import { asset } from '../../lib/hub';
import type { Platforms } from '../../lib/stores';

export default function KeyTabs({ ra, steam, xbox }: { ra?: ReactNode; steam?: ReactNode; xbox?: ReactNode }) {
    const s = useDocs();
    const shown = PLATFORMS.filter(p => s.plats[p.id]);
    const [tab, setTab] = useState<keyof Platforms>('ra');
    useEffect(() => { if (!s.plats[tab] && shown[0]) setTab(shown[0].id); }, [s.plats]); // eslint-disable-line react-hooks/exhaustive-deps
    const panels = { ra, steam, xbox };
    return <>
        <div className="ptabs toggles" role="tablist" aria-label="Platform">
            {shown.map(p => (
                <button key={p.id} type="button" className="tg" role="tab" aria-selected={tab === p.id} aria-pressed={tab === p.id} onClick={() => setTab(p.id)}><img src={asset(p.icon)} alt="" />{p.name}</button>
            ))}
        </div>
        {PLATFORMS.map(p => (
            <div key={p.id} className={'ptab' + (tab === p.id ? ' on' : '')} role="tabpanel" style={{ marginTop: 10 }}>{panels[p.id]}</div>
        ))}
    </>;
}
