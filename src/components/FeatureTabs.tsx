// Feature tabs: Overview (the grid) plus one live showcase per major feature. The panels are static HTML
// on the page (so every word is crawlable); this bar shows one at a time. A tab can be linked
// (#features/analytics; #analytics still works).
import { useEffect, useRef } from 'react';
import { useStore } from '@nanostores/react';
import Pills from './Pills';
import { activeTab, demoPage, FEATURE_TABS, type FeatureTab } from '../lib/stores';
import { reducedMotion } from '../lib/hub';

const panel = (id: string) => document.getElementById('ft-' + id);

export default function FeatureTabs() {
    const tab = useStore(activeTab);
    const row = useRef<HTMLDivElement>(null);

    const select = (id: FeatureTab, scroll = false) => {
        if (!panel(id)) id = 'overview';
        activeTab.set(id);
        document.querySelectorAll<HTMLElement>('.fpanel').forEach(p => (p.hidden = p.id !== 'ft-' + id));
        // On a phone the row scrolls sideways: bring the picked tab to its middle
        const r = row.current, btn = r?.querySelectorAll<HTMLElement>('button')[FEATURE_TABS.findIndex(t => t.id === id)];
        if (r && btn) r.scrollTo({ left: btn.offsetLeft - (r.clientWidth - btn.offsetWidth) / 2, behavior: reducedMotion() ? 'auto' : 'smooth' });
        if (scroll) document.getElementById('features')?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth' });
    };

    const click = (id: FeatureTab) => {
        // Pinned and scrolled into a panel: start the new one at its top, under the bar
        const r = row.current!, box = r.getBoundingClientRect();
        const pinned = box.top <= parseFloat(getComputedStyle(r).top) + 6 && document.getElementById('features')!.getBoundingClientRect().top < 0;
        select(id);
        if (pinned) scrollTo({ top: panel(id)!.getBoundingClientRect().top + scrollY - box.bottom - 16, behavior: 'auto' });
        history.replaceState(null, '', id === 'overview' ? '#features' : '#features/' + id);
    };

    useEffect(() => {
        const fromHash = () => {
            const m = location.hash.match(/^#(?:features\/([a-z]+)|(analytics))$/);
            if (m) select((m[1] || m[2]) as FeatureTab, true);
        };
        fromHash();
        addEventListener('hashchange', fromHash);
        // "Open … in the live demo" switches the demo to that page on the way down
        const demo = (e: Event) => {
            const a = (e.target as Element).closest<HTMLElement>('[data-demo]');
            if (a) demoPage.set(a.dataset.demo!);
        };
        document.addEventListener('click', demo);
        return () => { removeEventListener('hashchange', fromHash); document.removeEventListener('click', demo); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <Pills tabs label="Features" className="tabs ftabs" items={FEATURE_TABS} value={tab} onChange={click} rowRef={row} />;
}
