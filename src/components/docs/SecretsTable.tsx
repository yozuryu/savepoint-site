// The repository secrets to add, only for the platforms the reader picked.
import { useDocs } from './useDocs';
import { asset } from '../../lib/hub';
import type { Platforms } from '../../lib/stores';

const ROWS: [keyof Platforms, string, string][] = [
    ['ra', 'RA_USERNAME', 'Your RetroAchievements username'],
    ['ra', 'RA_API_KEY', 'Your Web API Key'],
    ['steam', 'STEAM_API_KEY', 'Your Steam Web API key'],
    ['steam', 'STEAM_USER_ID', 'Your 17-digit SteamID64'],
    ['xbox', 'XBOX_API_KEY', 'Your OpenXBL API key'],
];

export default function SecretsTable() {
    const s = useDocs();
    return (
        <div className="tbl"><table>
            <thead><tr><th>Secret</th><th>Value</th></tr></thead>
            <tbody>
                {ROWS.filter(([p]) => s.plats[p]).map(([p, name, value]) => (
                    <tr key={name}><td><img src={asset('icon-' + p + '.png')} alt="" /><code>{name}</code></td><td>{value}</td></tr>
                ))}
            </tbody>
        </table></div>
    );
}
