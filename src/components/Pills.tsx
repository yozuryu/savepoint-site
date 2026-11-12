import { useLayoutEffect, useRef, type ReactNode } from 'react';

export interface Pill<T extends string> { id: T; label: ReactNode; title?: string }

/** A pill switch whose highlight slides to the picked option (and jumps, without sliding, on a resize). */
export default function Pills<T extends string>({ items, value, onChange, className = 'tabs', label, tabs, rowRef }: {
    items: Pill<T>[]; value: T; onChange: (id: T) => void; className?: string; label: string;
    /** Feature tabs: tablist semantics instead of a toggle group */
    tabs?: boolean; rowRef?: React.RefObject<HTMLDivElement | null>;
}) {
    const own = useRef<HTMLDivElement>(null);
    const row = rowRef ?? own;
    const ind = useRef<HTMLSpanElement>(null);
    const move = (instant: boolean) => {
        const b = row.current?.querySelector<HTMLElement>('[aria-pressed="true"]'), i = ind.current;
        if (!b || !i || !b.offsetWidth) return;
        if (instant) i.style.transition = 'none';
        i.style.width = b.offsetWidth + 'px';
        i.style.height = b.offsetHeight + 'px';
        i.style.transform = `translate(${b.offsetLeft}px,${b.offsetTop}px)`;
        if (instant) { void i.offsetWidth; i.style.transition = ''; }
    };
    useLayoutEffect(() => move(false), [value]);
    useLayoutEffect(() => {
        const ro = new ResizeObserver(() => move(true));
        if (row.current) ro.observe(row.current);
        return () => ro.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return (
        <div ref={row} className={className + ' has-ind'} role={tabs ? 'tablist' : 'group'} aria-label={label}>
            <span className="tab-ind" ref={ind} />
            {items.map(it => (
                <button key={it.id} type="button" role={tabs ? 'tab' : undefined} aria-pressed={it.id === value} aria-selected={tabs ? it.id === value : undefined}
                    title={it.title} onClick={() => onChange(it.id)}>{it.label}</button>
            ))}
        </div>
    );
}
