import { useEffect, useRef, useState, useCallback, type RefObject } from 'react';
import { useStore } from '@nanostores/react';
import { activeTab, type FeatureTab } from './stores';
import { reducedMotion } from './hub';

export const useReduced = () => {
    const [r, setR] = useState(false);
    useEffect(() => setR(reducedMotion()), []);
    return r;
};

/** Whether the element is on screen (by the given threshold / margin), and the page is visible. */
export function useOnScreen(ref: RefObject<Element | null>, opts: IntersectionObserverInit = {}) {
    const [on, setOn] = useState(false);
    const [visible, setVisible] = useState(true);
    useEffect(() => {
        const el = ref.current;
        if (!el || !('IntersectionObserver' in window)) { setOn(true); return; }
        const io = new IntersectionObserver(e => setOn(e[0].isIntersecting), opts);
        io.observe(el);
        const vis = () => setVisible(!document.hidden);
        document.addEventListener('visibilitychange', vis);
        return () => { io.disconnect(); document.removeEventListener('visibilitychange', vis); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ref]);
    return on && visible;
}

/** True once the element has come into view. */
export function useSeen(ref: RefObject<Element | null>, rootMargin = '0px') {
    const [seen, setSeen] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el || seen) return;
        if (!('IntersectionObserver' in window)) { setSeen(true); return; }
        const io = new IntersectionObserver(e => { if (e[0].isIntersecting) { setSeen(true); io.disconnect(); } }, { rootMargin });
        io.observe(el);
        return () => io.disconnect();
    }, [ref, rootMargin, seen]);
    return seen;
}

/**
 * A feature tab's showcase: `playing` turns on when its card comes into view while the tab is open
 * (its CSS entrance runs off `.on`), and `replay()` runs it again (new data arrived).
 * `loop(step, every)` repeats `step` only while the tab is open, the card is 30%+ on screen and the page visible.
 */
export function useShowcase(tab: FeatureTab, ref: RefObject<Element | null>) {
    const current = useStore(activeTab);
    const active = current === tab;
    const reduced = useReduced();
    const inView = useOnScreen(ref, { rootMargin: '0px 0px -15% 0px' });
    const running = useOnScreen(ref, { threshold: .3 });
    const [playing, setPlaying] = useState(false);
    useEffect(() => {
        if (reduced) setPlaying(true);
        else if (!active) setPlaying(false);
        else if (inView) setPlaying(true);
    }, [active, inView, reduced]);
    const replay = useCallback(() => {
        if (reduced) return;
        setPlaying(false);
        requestAnimationFrame(() => requestAnimationFrame(() => setPlaying(true)));
    }, [reduced]);
    return { active, playing: playing || reduced, replay, looping: active && running && !reduced };
}

/** Calls step() every `every` ms while `on`; onStart() when it (re)starts. */
export function useLoop(on: boolean, every: number, step: () => void, onStart?: () => void) {
    const stepRef = useRef(step), startRef = useRef(onStart);
    stepRef.current = step; startRef.current = onStart;
    useEffect(() => {
        if (!on) return;
        startRef.current?.();
        let t = 0;
        const tick = () => { stepRef.current(); t = window.setTimeout(tick, every); };
        t = window.setTimeout(tick, every);
        return () => clearTimeout(t);
    }, [on, every]);
}

/** False during the server render and hydration, true after: for text that depends on the viewer's clock or timezone. */
export function useHydrated() {
    const [h, setH] = useState(false);
    useEffect(() => setH(true), []);
    return h;
}
