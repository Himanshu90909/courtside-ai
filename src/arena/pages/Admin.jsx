import React from 'react';
import { getStatus } from '../api.js';
import { useData, Skeleton, ErrorBox, Section, Badge } from '../ui.jsx';
import { ago, fmtDate } from '../format.js';

const kindOf = (st, fails) => (st === 'ok' ? 'good' : st === 'failed' ? 'bad' : fails ? 'bad' : 'neutral');
// Read-only status view. It is public, so it deliberately has no controls that change data and exposes no secrets.
export default function Admin() {
  const [s, reload] = useData(() => getStatus(), []);
  const d = s.data;
  const stale = (iso, mins) => !iso || (Date.now() - new Date(iso).getTime()) / 60000 > mins;
  return (
    <>
      <h1 className="page-h">Source health</h1>
      <div className="note" role="note"><b>Read-only status page.</b> Anyone can view this. Enabling or disabling sources, moderating articles and reviewing reports need an authenticated admin, which is not set up for this app, so those controls are intentionally absent rather than faked.</div>
      {s.status === 'loading' && <Skeleton rows={5} h={50} />}
      {s.status === 'error' && <ErrorBox message={s.error} onRetry={reload} />}
      {d && (<>
        <Section title="Overview" hint={d.snapshotBuiltAt ? `Snapshot built ${ago(d.snapshotBuiltAt)}` : undefined}>
          <div className="stats">{Object.entries({ 'Sources registered': d.sources.length, 'Sources failing': d.sources.filter((x) => x.lastStatus === 'failed').length, 'Sources never run': d.sources.filter((x) => x.lastStatus === 'never').length, 'Recent jobs ok': d.jobs.filter((j) => j.status === 'ok').length + '/' + d.jobs.length }).map(([k, v]) => <div key={k} className="stat"><b>{v}</b><span>{k}</span></div>)}</div>
        </Section>
        <Section title="Sources" hint={`${d.sources.length} registered`}>
          <div className="tbl"><table><thead><tr><th>Source</th><th>Type</th><th>Status</th><th>Last success</th><th>Last attempt</th><th>Items</th><th>Failures in a row</th><th>Last error</th></tr></thead><tbody>
            {d.sources.map((x) => (<tr key={x.key}><td><b>{x.key}</b><div className="mute small">{x.name}</div></td><td>{x.kind}</td>
              <td><Badge kind={kindOf(x.lastStatus, x.consecutiveFailures)}>{x.enabled ? x.lastStatus : 'disabled'}</Badge></td>
              <td>{x.lastSuccessAt ? <>{ago(x.lastSuccessAt)}{stale(x.lastSuccessAt, x.kind === 'sports_api' ? 30 : 180) && <Badge kind="bad">stale</Badge>}</> : 'never'}</td>
              <td>{x.lastAttemptAt ? ago(x.lastAttemptAt) : 'never'}</td><td>{x.lastItemCount ?? '–'}</td><td>{x.consecutiveFailures}</td><td className="small">{x.lastError || '–'}</td></tr>))}
          </tbody></table></div>
        </Section>
        {d.globalOpps && d.globalOpps.sources?.length > 0 && (
          <Section title="Worldwide opportunity sources" hint={`Jobs, scholarships, fellowships and competitions from ${d.globalOpps.sources.length} global sources · ${d.globalOpps.items} listings · snapshot ${ago(d.globalOpps.builtAt)}`}>
            <div className="tbl"><table><thead><tr><th>Source</th><th>Type</th><th>Status</th><th>Last success</th><th>Items</th><th>Failures in a row</th><th>Last error</th></tr></thead><tbody>
              {d.globalOpps.sources.map((x) => (<tr key={x.key}><td><b>{x.key}</b><div className="mute small">{x.name}</div></td><td>{x.kind}</td>
                <td><Badge kind={kindOf(x.lastStatus, x.consecutiveFailures)}>{x.enabled ? x.lastStatus : 'disabled'}</Badge></td>
                <td>{x.lastSuccessAt ? ago(x.lastSuccessAt) : 'never'}</td><td>{x.lastItemCount ?? '–'}</td><td>{x.consecutiveFailures}</td><td className="small">{x.lastError || '–'}</td></tr>))}
            </tbody></table></div>
          </Section>
        )}
        <Section title="Recent refresh jobs" hint="Newest first. A job only counts as successful if at least one source succeeded.">
          <div className="tbl"><table><thead><tr><th>Job</th><th>Started</th><th>Status</th><th>Sources ok</th><th>Fetched</th><th>New</th><th>Duplicates or unchanged</th><th>Errors</th></tr></thead><tbody>
            {d.jobs.map((j, i) => (<tr key={i}><td>{j.job}</td><td>{fmtDate(j.startedAt)}</td><td><Badge kind={j.status === 'ok' ? 'good' : j.status === 'partial' ? 'warn' : 'bad'}>{j.status}</Badge></td><td>{j.sourcesOk}/{j.sourcesTried}</td><td>{j.itemsFetched}</td><td>{j.itemsNew}</td><td>{j.duplicatesSkipped}</td><td className="small">{(j.errors || []).join('; ') || '–'}</td></tr>))}
          </tbody></table></div>
        </Section>
      </>)}
    </>
  );
}
