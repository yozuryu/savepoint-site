// The docs contents rail: setup progress, the seven setup steps (ticked when done) and the guide pages.
// On the setup page it follows the reading position; on phones it's a sideways strip under the nav.
import { useEffect, useRef, useState } from 'react';
import { useDocs } from './useDocs';
import { SETUP_STEPS } from '../../lib/stores';

export const STEP_LABELS: Record<(typeof SETUP_STEPS)[number], string> = {
    repo: 'Create your repository', pages: 'Turn on Pages', keys: 'Get your API keys', secrets: 'Add the secrets',
    config: 'Make it yours', 'first-run': 'First data run', phone: 'On your phone',
};
export interface Guide { slug: string; label: string }

export default function DocsRail({ base, guides, current }: { base: string; guides: Guide[]; current: string }) {
    const s = useDocs();
    const rail = useRef<HTMLElement>(null);
    const onSetup = current === '';
    const [at, setAt] = useState('');
    const n = SETUP_STEPS.filter(k => s.done[k]).length;

    useEffect(() => {
        if (!onSetup) return;
        const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setAt(e.target.id); }), { rootMargin: '-30% 0px -60% 0px' });
        document.querySelectorAll('.doc section[id]').forEach(el => io.observe(el));
        return () => io.disconnect();
    }, [onSetup]);
    // Phone: keep the current link in view on the strip
    useEffect(() => {
        const on = rail.current?.querySelector<HTMLElement>('a.on');
        if (on && matchMedia('(max-width: 900px)').matches) rail.current!.scrollTo({ left: Math.max(0, on.offsetLeft - 120), behavior: 'smooth' });
    }, [at]);

    return (
        <aside className="rail" aria-label="Contents" ref={rail}>
            <div className="meter"><b>{n === SETUP_STEPS.length ? 'All set' : `${n} of ${SETUP_STEPS.length} done`}</b><div className="bar"><i style={{ width: `${(n / SETUP_STEPS.length) * 100}%` }} /></div><span>Your progress is kept in this browser</span></div>
            <div>
                <h4>Setup</h4>
                {SETUP_STEPS.map(k => (
                    <a key={k} href={(onSetup ? '' : base + 'docs/') + '#' + k} className={onSetup && at === k ? 'on' : undefined}>
                        <span className={'tick' + (s.done[k] ? ' done' : '')} />{STEP_LABELS[k]}
                    </a>
                ))}
            </div>
            <div>
                <h4>Guides</h4>
                {guides.map(g => (
                    <a key={g.slug} href={base + 'docs/' + g.slug + '/'} className={current === g.slug ? 'on' : undefined} aria-current={current === g.slug ? 'page' : undefined}>{g.label}</a>
                ))}
            </div>
        </aside>
    );
}
