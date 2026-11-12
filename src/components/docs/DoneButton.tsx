// Marks a setup step done (kept in this browser).
import { useDocs } from './useDocs';
import { updateDocs } from '../../lib/stores';

export default function DoneButton({ step }: { step: string }) {
    const s = useDocs();
    const on = !!s.done[step];
    return <button type="button" className="done-btn" aria-pressed={on} onClick={() => updateDocs({ done: { ...s.done, [step]: !on } })}>{on ? 'Done' : 'Mark done'}</button>;
}
