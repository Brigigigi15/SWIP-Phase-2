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
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    onChange({
      ...filters,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const toggleSchedule = (value) => {
    const current = Array.isArray(filters.schedule) ? filters.schedule : [];
    const exists = current.includes(value);
    const next = exists
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({
      ...filters,
      schedule: next,
    });
  };

  const scheduleLabel =
    !filters.schedule || filters.schedule.length === 0
      ? "All Schedules"
      : filters.schedule.length === 1
      ? filters.schedule[0]
      : `${filters.schedule.length} selected`;

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

        <div className="relative">
          <button
            type="button"
            onClick={() => setScheduleOpen((open) => !open)}
            className="flex w-full items-center justify-between rounded-lg border border-slate-500 bg-slate-900 px-3 py-2 text-left text-sm text-slate-100 outline-none focus:border-indigo-300"
          >
            <span className="truncate">{scheduleLabel}</span>
            <span className="ml-2 text-[0.6rem] text-slate-400">▼</span>
          </button>
          {scheduleOpen && (
            <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-600 bg-slate-900 shadow-lg">
              <div className="px-3 py-2 text-[0.65rem] text-slate-400">
                Select schedules
              </div>
              {options.scheduleOptions.map((v) => (
                <label
                  key={v}
                  className="flex cursor-pointer items-center gap-2 px-3 py-1 text-sm text-slate-100 hover:bg-slate-800"
                >
                  <input
                    type="checkbox"
                    className="h-3 w-3 rounded border-slate-500 bg-slate-900 text-indigo-500"
                    checked={
                      Array.isArray(filters.schedule) &&
                      filters.schedule.includes(v)
                    }
                    onChange={() => toggleSchedule(v)}
                  />
                  <span className="truncate">{v}</span>
                </label>
              ))}
            </div>
          )}
        </div>

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
    schedule: [],
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
  const [forceRefreshing, setForceRefreshing] = useState(false);

  const resetFilters = () => {
    setFilters({
      region: '',
      installation: '',
      schedule: [],
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
    if (filters.schedule && filters.schedule.length) {
      filters.schedule.forEach((v) => {
        params.append('schedule', v);
      });
    }
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

  const handleForceUatRefresh = async () => {
    try {
      setForceRefreshing(true);
      await axios.post('/api/uat/refresh');
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
      console.error('Failed to Force Refresh', err);
    } finally {
      setForceRefreshing(false);
    }
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
            value={stats ? stats.s1_success : 'â€“'}
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
            value={stats ? stats.calendar_sent : 'â€“'}
            accent="text-sky-400"
            active={filters.calendarFilter === 'sent'}
            onClick={() =>
              setFilters((prev) => ({
                ...prev,
                calendarFilter: prev.calendarFilter === 'sent' ? '' : 'sent',
              }))
            }
          />
          {devFull && (
            <StatCard
              label="Calendar Not Sent"
              value={stats ? stats.calendar_not_sent : 'â€“'}
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
          )}
          {devFull && (
            <StatCard
              label="UAT Form Uploaded"
              value={stats ? stats.uat_uploaded : 'â€“'}
              accent="text-teal-400"
              active={filters.uatFilter === 'uploaded'}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  uatFilter: prev.uatFilter === 'uploaded' ? '' : 'uploaded',
                }))
              }
            />
          )}
          <StatCard
            label="S1 vs Scheduled (%)"
            value={stats ? stats.s1_vs_scheduled_pct : 'â€“'}
            accent="text-indigo-400"
          />
        </section>

        <section className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
            Sites
          </h2>
          <div className="flex items-center gap-2">
            {loading && (
              <span className="text-[0.65rem] text-slate-400">
                Loading latest data…
              </span>
            )}
            <button
              type="button"
              onClick={handleForceUatRefresh}
              disabled={forceRefreshing}
              className="inline-flex items-center gap-1 rounded-lg border border-teal-500 bg-teal-600/90 px-3 py-1 text-[0.7rem] font-medium text-slate-50 shadow-sm hover:bg-teal-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {forceRefreshing && (
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-[2px] border-slate-100 border-t-transparent" />
              )}
              <span>{forceRefreshing ? 'Refreshing…' : 'Force Refresh'}</span>
            </button>
            {devReport && (
              <button
                type="button"
                onClick={handleDownloadReport}
                className="rounded-lg border border-indigo-500 bg-indigo-600/90 px-3 py-1 text-[0.7rem] font-medium text-slate-50 shadow-sm hover:bg-indigo-500"
              >
                Download report (XLSX)
              </button>
            )}
          </div>
        </section>

        {/* <section className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-300">
            Sites
          </h2>
          {loading && (
            <span className="text-[0.65rem] text-slate-400">
              Loading latest dataâ€¦
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
        </section> */}

        <section>
          <DataTable rows={rows} />
        </section>
      </main>
    </div>
  );
}












