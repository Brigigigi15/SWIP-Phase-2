import React, { useEffect, useState } from 'react';
import axios from 'axios';

function StatCard({ label, value, accent, active = false, onClick }) {
  const baseClasses =
    'rounded-xl border p-4 shadow-sm cursor-pointer transition-colors duration-150';
  const inactiveClasses =
    'border-slate-600 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-300';
  const activeClasses = 'border-indigo-400 bg-slate-900/90 shadow-md';

  return (
    <div
      className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}
      onClick={onClick}
    >
      <div className="text-xs font-medium uppercase tracking-wide text-slate-300">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <div className={`text-2xl font-semibold ${accent}`}>{value}</div>
      </div>
    </div>
  );
}

function Filters({ filters, options, onChange, onReset }) {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    onChange({
      ...filters,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  return (
    <div className="rounded-xl border border-slate-600 bg-slate-900/70 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-300">
          Filters
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-[0.65rem] font-medium text-slate-300 hover:text-slate-50 hover:underline underline-offset-2"
        >
          Clear filters
        </button>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <select
          name="lot"
          value={filters.lot}
          onChange={handleChange}
          className="rounded-lg border border-slate-500 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-300"
        >
          <option value="">All Lots</option>
          <option value="Lot #1">Lot #1</option>
          <option value="Lot #2">Lot #2</option>
          <option value="Lot #3">Lot #3</option>
        </select>

        <select
          name="region"
          value={filters.region}
          onChange={handleChange}
          className="rounded-lg border border-slate-500 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-300"
        >
          <option value="">All Regions</option>
          {options.regionOptions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          name="installation"
          value={filters.installation}
          onChange={handleChange}
          className="rounded-lg border border-slate-500 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-300"
        >
          <option value="">All Installation Status</option>
          {options.installationOptions.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <select
          name="approval"
          value={filters.approval}
          onChange={handleChange}
          className="rounded-lg border border-slate-500 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-300"
        >
          <option value="">All Approvals</option>
          {options.approvalOptions?.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>

        <input
          type="text"
          name="search"
          value={filters.search}
          onChange={handleChange}
          placeholder="Search school, province, etc."
          className="rounded-lg border border-slate-500 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-300"
        />
      </div>
    </div>
  );
}

function DataTable({ rows }) {
  const columns = [
    'Region',
    'Province',
    'BEIS School ID',
    'Schedule',
    'Calendar Status',
    'Start Time',
    'End Time',
    'Installation Status',
    'Tp-link PHASE II',
    'Approval (Accepted / Decline)',
  ];

  const columnClasses = {};

  return (
    <div className="relative max-h-[60vh] overflow-x-auto overflow-y-auto rounded-xl border border-slate-600 bg-slate-900/70">
      <table className="min-w-full text-center text-[0.7rem] sm:text-[0.8rem]">
        <thead className="sticky top-0 z-10 bg-indigo-600/90 text-[0.7rem] sm:text-[0.8rem] uppercase tracking-wide text-slate-50 border-b border-indigo-400 shadow-sm">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className={`px-2 py-1.5 font-semibold border-r border-indigo-500/70 last:border-r-0 first:rounded-tl-xl last:rounded-tr-xl whitespace-nowrap ${columnClasses[col] || ''}`}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={idx}
              className={idx % 2 === 0 ? 'bg-slate-800' : 'bg-slate-900'}
            >
              {columns.map((col) => {
                const value = row[col];
                let colorClass = '';

                if (col === 'Calendar Status') {
                  const v = String(value || '').trim().toLowerCase();
                  if (v === 'sent') {
                    colorClass = 'text-emerald-400';
                  } else if (v) {
                    colorClass = 'text-rose-400';
                  }
                } else if (col === 'Approval (Accepted / Decline)') {
                  const v = String(value || '').trim().toLowerCase();
                  if (v.includes('accept')) {
                    colorClass = 'text-emerald-400';
                  } else if (v.includes('declin')) {
                    colorClass = 'text-rose-400';
                  } else {
                    colorClass = 'text-amber-300';
                  }
                }

                return (
                  <td
                    key={col}
                    className={`px-2 py-1 align-top text-[0.8rem] leading-tight ${columnClasses[col] || ''} whitespace-nowrap ${colorClass}`}
                  >
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
          {!rows.length && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-3 py-4 text-center text-xs text-slate-400"
              >
                No rows to display.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function App() {
  const searchParams = new URLSearchParams(window.location.search);
  const devFull = searchParams.get('full') === '1';
  const devReport = searchParams.get('report') === '1';

  const [filters, setFilters] = useState({
    region: '',
    installation: '',
    approval: '',
    final: '',
    validated: '',
    search: '',
    includeUnscheduled: devFull,
    starFilter: '',
    calendarFilter: '',
    uatFilter: '',
    lot: '',
  });
  const [options, setOptions] = useState({
    regionOptions: [],
    scheduleOptions: [],
    installationOptions: [],
    approvalOptions: [],
    finalStatusOptions: [],
    validatedOptions: [],
  });
  const [stats, setStats] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const resetFilters = () => {
    setFilters({
      region: '',
      installation: '',
      approval: '',
      final: '',
      validated: '',
      search: '',
      includeUnscheduled: devFull,
      starFilter: '',
      calendarFilter: '',
      uatFilter: '',
      lot: '',
    });
  };

  const buildParams = () => {
    const params = new URLSearchParams();
    if (filters.region) params.set('region', filters.region);
    if (filters.installation) params.set('installation', filters.installation);
    if (filters.approval) params.set('approval', filters.approval);
    if (filters.final) params.set('final', filters.final);
    if (filters.validated) params.set('validated', filters.validated);
    if (filters.search) params.set('search', filters.search);
    if (filters.includeUnscheduled) params.set('full', '1');
    if (filters.starFilter) params.set('star', filters.starFilter);
    if (filters.calendarFilter) params.set('calendar', filters.calendarFilter);
    if (filters.uatFilter) params.set('uat', filters.uatFilter);
    if (filters.lot) params.set('lot', filters.lot);
    return params;
  };

  const handleDownloadReport = () => {
    const params = buildParams();
    const url = `/api/report?${params.toString()}`;
    window.location.href = url;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const params = buildParams();
        const res = await axios.get(`/api/dashboard?${params.toString()}`);
        setRows(res.data.rows || []);
        setOptions({
          regionOptions: res.data.regionOptions || [],
          scheduleOptions: res.data.scheduleOptions || [],
          installationOptions: res.data.installationOptions || [],
          approvalOptions: res.data.approvalOptions || [],
          finalStatusOptions: res.data.finalStatusOptions || [],
          validatedOptions: res.data.validatedOptions || [],
        });
        setStats(res.data.stats || null);
        setLastUpdated(res.data.lastUpdated || null);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    };

    // initial load
    fetchData();

    // auto-refresh every 5 minutes
    const intervalId = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [filters]);

  return (
    <div className="min-h-screen bg-slate-900 pb-8">
      <header className="border-b border-slate-700 bg-slate-900/95 backdrop-blur">
        <div className="flex w-full items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-sm font-semibold text-slate-100">
              LEOxSOLAR Schedule Monitoring
            </h1>
            <p className="text-[0.65rem] text-slate-400">Phase 2</p>
          </div>
          {lastUpdated && (
            <div className="text-[0.65rem] text-slate-400">
              Last updated{' '}
              {new Date(lastUpdated).toLocaleString('en-PH', {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </div>
          )}
        </div>
      </header>

      <main className="mt-4 w-full px-4 space-y-4">
        <section>
          <Filters
            filters={filters}
            options={options}
            onChange={setFilters}
            onReset={resetFilters}
          />
        </section>

        <section className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <StatCard
            label="Installed (S1 Success)"
            value={stats ? stats.s1_success : '–'}
            accent="text-emerald-400"
            active={
              filters.installation.toLowerCase() === 's1 - installed (success)'
            }
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                installation:
                  prev.installation.toLowerCase() === 's1 - installed (success)'
                    ? ''
                    : 'S1 - Installed (Success)',
              }))
            }
          />
          <StatCard
            label="Calendar Sent"
            value={stats ? stats.calendar_sent : '–'}
            accent="text-sky-400"
            active={filters.calendarFilter === 'sent'}
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                calendarFilter: prev.calendarFilter === 'sent' ? '' : 'sent',
              }))
            }
          />
          <StatCard
            label="Calendar Not Sent"
            value={stats ? stats.calendar_not_sent : '–'}
            accent="text-amber-400"
            active={filters.calendarFilter === 'invite_not_sent'}
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                calendarFilter:
                  prev.calendarFilter === 'invite_not_sent'
                    ? ''
                    : 'invite_not_sent',
              }))
            }
          />
          <StatCard
            label="UAT Form Uploaded"
            value={stats ? stats.uat_uploaded : '–'}
            accent="text-teal-400"
            active={filters.uatFilter === 'uploaded'}
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                uatFilter: prev.uatFilter === 'uploaded' ? '' : 'uploaded',
              }))
            }
          />
          <StatCard
            label="S1 vs Scheduled (%)"
            value={stats ? stats.s1_vs_scheduled_pct : '–'}
            accent="text-indigo-400"
          />
        </section>

        <section className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
            Sites
          </h2>
          {loading && (
            <span className="text-[0.65rem] text-slate-400">
              Loading latest data…
            </span>
          )}
          {devReport && (
            <button
              type="button"
              onClick={handleDownloadReport}
              className="rounded-lg border border-indigo-500 bg-indigo-600/90 px-3 py-1 text-[0.7rem] font-medium text-slate-50 shadow-sm hover:bg-indigo-500"
            >
              Download report (XLSX)
            </button>
          )}
        </section>

        <section>
          <DataTable rows={rows} />
        </section>
      </main>
    </div>
  );
}
