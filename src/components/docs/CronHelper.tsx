// The cron-job.org job, filled in for the reader's repository: URL, schedule, method, headers, body.
import { useState } from 'react';
import { useDocs } from './useDocs';
import { CopyButton } from './ConfigBuilder';
import { owner, repo } from '../../lib/stores';

export default function CronHelper() {
    const s = useDocs();
    const [mode, setMode] = useState('incremental');
    const [plat, setPlat] = useState('all');
    const url = `https://api.github.com/repos/${owner(s)}/${repo(s)}/actions/workflows/fetch-data.yml/dispatches`;
    const body = JSON.stringify({ ref: 'main', inputs: { mode, platforms: plat } });
    const headers = 'Authorization: Bearer <your token>\nAccept: application/vnd.github+json\nX-GitHub-Api-Version: 2022-11-28';
    return <>
        <div className="fields" style={{ margin: '12px 0' }}>
            <label className="f">Job<select id="cron-mode" value={mode} onChange={e => setMode(e.target.value)}><option value="incremental">Regular: incremental</option><option value="midnight">Daily: midnight</option></select></label>
            <label className="f">Platforms<select id="cron-plat" value={plat} onChange={e => setPlat(e.target.value)}><option>all</option><option>ra</option><option>steam</option><option>xbox</option></select></label>
        </div>
        <div className="tbl"><table>
            <tbody>
                <tr><td style={{ width: 140 }}>URL</td><td><div className="codebox"><pre>{url}</pre><CopyButton text={url} /></div></td></tr>
                <tr><td>Schedule</td><td>{mode === 'midnight' ? 'Every day at 00:00 (UTC)' : 'Every 30 minutes'}</td></tr>
                <tr><td>Method</td><td><code>POST</code> (under Advanced)</td></tr>
                <tr><td>Headers</td><td><div className="codebox"><pre>Authorization: Bearer <span className="s">&lt;your token&gt;</span>{'\n'}Accept: application/vnd.github+json{'\n'}X-GitHub-Api-Version: 2022-11-28</pre><CopyButton text={headers} /></div></td></tr>
                <tr><td>Body</td><td><div className="codebox"><pre>{body}</pre><CopyButton text={body} /></div></td></tr>
            </tbody>
        </table></div>
    </>;
}
