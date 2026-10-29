import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { ALL_ENDPOINTS, API_GROUPS, AUTH_LEVELS } from '../data/apiDocs';

// What the caller has to send: token, and a body or not.
const bodyLabel = (endpoint) => {
  if (endpoint.body.length === 0) return 'No body';
  if (endpoint.bodyFormat) return 'Form data';
  return endpoint.body.some((field) => field.req) ? 'JSON body' : 'Optional body';
};

const statusTone = (status) => (status < 300 ? 'ok' : status < 500 ? 'client' : 'server');

const MethodChip = ({ method, altMethods }) => (
  <span className={`doc-method doc-method-${method.toLowerCase()}`}>
    {method}
    {altMethods?.length ? ` / ${altMethods.join(' / ')}` : ''}
  </span>
);

const SectionLabel = ({ children }) => (
  <div className="doc-section-label">
    <h4>{children}</h4>
  </div>
);

const ParamTable = ({ rows, showIn }) => (
  <div className="table-responsive">
    <table className="app-table doc-table">
      <thead>
        <tr>
          <th>Name</th>
          {showIn && <th>In</th>}
          <th>Type</th>
          <th>Required</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.name}>
            <td><code className="doc-inline-code">{row.name}</code></td>
            {showIn && <td className="doc-type-cell">{row.in}</td>}
            <td className="doc-type-cell">{row.type}</td>
            <td>
              <span className={`doc-req ${row.req ? 'doc-req-yes' : 'doc-req-no'}`}>
                {row.req ? 'required' : 'optional'}
              </span>
            </td>
            <td>{row.desc}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const FieldTable = ({ fields }) => (
  <div className="table-responsive">
    <table className="app-table doc-table">
      <thead>
        <tr>
          <th>Field</th>
          <th>Type</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {fields.map((field) => (
          <tr key={field.name}>
            <td><code className="doc-inline-code">{field.name}</code></td>
            <td className="doc-type-cell">{field.type}</td>
            <td>{field.desc}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const EndpointCard = ({ endpoint, isOpen, onToggle }) => {
  const auth = AUTH_LEVELS[endpoint.auth];
  const body = bodyLabel(endpoint);

  return (
    <article id={endpoint.id} className={`doc-endpoint ${isOpen ? 'is-open' : ''}`} data-testid={`endpoint-${endpoint.id}`}>
      <button
        type="button"
        className="doc-endpoint-head"
        onClick={() => onToggle(endpoint.id)}
        aria-expanded={isOpen}
        data-testid={`endpoint-toggle-${endpoint.id}`}
      >
        <MethodChip method={endpoint.method} altMethods={endpoint.altMethods} />
        <span className="doc-endpoint-path">{endpoint.path}</span>
        <span className="doc-endpoint-title">{endpoint.title}</span>
        <span className={`doc-auth doc-auth-${auth.tone}`}>{auth.label}</span>
        <span className={`doc-body-chip ${endpoint.body.length ? '' : 'is-none'}`}>{body}</span>
        <svg
          className={`chevron-icon ${isOpen ? 'is-open' : ''}`}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="doc-endpoint-body">
          <p className="doc-endpoint-summary">{endpoint.summary}</p>
          {endpoint.note && <p className="doc-note">{endpoint.note}</p>}

          {endpoint.params.length > 0 && (
            <>
              <SectionLabel>Parameters</SectionLabel>
              <ParamTable rows={endpoint.params} showIn />
            </>
          )}

          {endpoint.body.length > 0 && (
            <>
              <SectionLabel>Request body ({endpoint.bodyFormat || 'application/json'})</SectionLabel>
              <ParamTable rows={endpoint.body} showIn={false} />
            </>
          )}

          {endpoint.responses.map((response, index) => (
            <React.Fragment key={`${response.status}-${index}`}>
              <SectionLabel>
                <span className={`doc-status doc-status-${statusTone(response.status)}`}>{response.status}</span>
                {response.status === 204 ? ' No content' : ' Response'}
              </SectionLabel>
              <div className="doc-sample" data-testid={`endpoint-sample-${endpoint.id}-${index}`}>
                <span className="doc-sample-label">Sample response</span>
                <pre className="doc-json">
                  <code>{response.example}</code>
                </pre>
              </div>
              {response.fields.length > 0 && <FieldTable fields={response.fields} />}
            </React.Fragment>
          ))}

          {endpoint.errors.length > 0 && (
            <>
              <SectionLabel>Errors</SectionLabel>
              <div className="table-responsive" data-testid={`endpoint-errors-${endpoint.id}`}>
                <table className="app-table doc-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>errorCode</th>
                      <th>Returned when</th>
                    </tr>
                  </thead>
                  <tbody>
                    {endpoint.errors.map((err, index) => (
                      <tr key={`${err.status}-${index}`}>
                        <td><span className={`doc-status doc-status-${statusTone(err.status)}`}>{err.status}</span></td>
                        <td><code className="doc-inline-code">{err.code}</code></td>
                        <td>{err.when}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </article>
  );
};

// A pasted #endpoint-id link should land on an open card.
const idFromHash = () => {
  const hash = window.location.hash.replace('#', '');
  return ALL_ENDPOINTS.some((endpoint) => endpoint.id === hash) ? hash : null;
};

export const ApiDocsPage = () => {
  useDocumentTitle('APIs Docs');

  const [query, setQuery] = useState('');
  const [openIds, setOpenIds] = useState(() => {
    const hashId = idFromHash();
    return new Set(hashId ? [hashId] : []);
  });

  const term = query.trim().toLowerCase();

  const visibleGroups = useMemo(() => {
    if (!term) return API_GROUPS;
    return API_GROUPS.map((group) => ({
      ...group,
      endpoints: group.endpoints.filter((endpoint) =>
        `${endpoint.method} ${endpoint.path} ${endpoint.title} ${group.name}`.toLowerCase().includes(term)
      ),
    })).filter((group) => group.endpoints.length > 0);
  }, [term]);

  const toggle = useCallback((id) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const jumpTo = useCallback((id) => {
    setOpenIds((prev) => new Set(prev).add(id));
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  useEffect(() => {
    const hashId = idFromHash();
    if (hashId) document.getElementById(hashId)?.scrollIntoView({ block: 'start' });
  }, []);

  return (
    <div className="page-container doc-page" data-testid="api-docs-page">
      <div className="page-header">
        <h1 className="page-title">APIs Docs</h1>
        <p className="page-subtitle">
          Parameters, request body and response fields of all {ALL_ENDPOINTS.length} endpoints. Every success
          response also carries <code className="doc-inline-code">success: true</code>; errors carry{' '}
          <code className="doc-inline-code">success: false</code>, <code className="doc-inline-code">message</code> and{' '}
          <code className="doc-inline-code">errorCode</code>.
        </p>
      </div>

      <div className="doc-layout">
        <aside className="doc-sidebar" data-testid="api-docs-sidebar">
          <div className="doc-sidebar-inner">
            <div className="form-group">
              <input
                type="search"
                className="form-input"
                placeholder="Filter endpoints…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                data-testid="api-docs-search"
                aria-label="Filter endpoints"
              />
            </div>

            <div className="doc-sidebar-actions">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpenIds(new Set(ALL_ENDPOINTS.map((e) => e.id)))} data-testid="api-docs-expand-all">
                Expand all
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpenIds(new Set())} data-testid="api-docs-collapse-all">
                Collapse all
              </button>
            </div>

            <nav className="doc-nav">
              {visibleGroups.map((group) => (
                <div className="doc-nav-group" key={group.id}>
                  <p className="doc-nav-group-name">{group.name}</p>
                  <ul>
                    {group.endpoints.map((endpoint) => (
                      <li key={endpoint.id}>
                        <button
                          type="button"
                          className="doc-nav-link"
                          onClick={() => jumpTo(endpoint.id)}
                          data-testid={`api-docs-nav-${endpoint.id}`}
                        >
                          <MethodChip method={endpoint.method} />
                          <span className="doc-nav-path">{endpoint.path}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>
        </aside>

        <div className="doc-content">
          {visibleGroups.map((group) => (
            <section className="doc-group" id={`group-${group.id}`} key={group.id} data-testid={`api-docs-group-${group.id}`}>
              <h2 className="doc-group-title">
                {group.name}
                <span className="doc-group-count">{group.endpoints.length}</span>
              </h2>
              {group.endpoints.map((endpoint) => (
                <EndpointCard key={endpoint.id} endpoint={endpoint} isOpen={openIds.has(endpoint.id)} onToggle={toggle} />
              ))}
            </section>
          ))}

          {visibleGroups.length === 0 && (
            <div className="state-container empty-state" data-testid="api-docs-empty">
              <h2 className="empty-title">Nothing matches that filter</h2>
              <p className="empty-desc">Try a method (GET), a path fragment (/cart), or a group name (Orders).</p>
              <button type="button" className="btn btn-primary" onClick={() => setQuery('')}>Clear filter</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiDocsPage;
