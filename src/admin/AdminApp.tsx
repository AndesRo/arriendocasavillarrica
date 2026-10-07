import type { Session } from '@supabase/supabase-js';
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { buildBookedNights } from '../lib/availability';
import { adminSupabase } from './adminClient';
import InquiryCard from './InquiryCard';
import ReservationsPanel from './ReservationsPanel';
import type { Consulta, Reserva } from './types';

type Tab = 'consultas' | 'reservas';

const pill =
  'inline-flex min-h-[2.75rem] items-center justify-center rounded-full px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40';

function Shell({ children, onLogout }: { children: ReactNode; onLogout?: () => void }) {
  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-ink/10 bg-cream/90">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <p className="font-serif text-xl font-semibold tracking-[0.18em]">CASA VILLARRICA · PANEL</p>
          <div className="flex items-center gap-2">
            <a href="/" className="px-3 py-2 text-sm font-medium text-ink/70 underline-offset-4 hover:underline">
              Ver sitio
            </a>
            {onLogout && (
              <button type="button" onClick={onLogout} className={`${pill} border border-ink/25 hover:border-forest`}>
                Cerrar sesión
              </button>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-5 py-10 sm:px-8">{children}</main>
    </div>
  );
}

function Login() {
  const sb = adminSupabase!;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error: err } = await sb.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (err) setError('Correo o contraseña incorrectos.');
  };

  return (
    <Shell>
      <form onSubmit={submit} className="mx-auto mt-6 max-w-md rounded-[1.75rem] bg-white p-7 sm:p-9" aria-label="Iniciar sesión">
        <h1 className="font-serif text-4xl">Ingresar</h1>
        <p className="mt-2 text-ink/65">Acceso solo para el administrador de la casa.</p>
        <div className="mt-6">
          <label htmlFor="l-email" className="mb-1.5 block text-[0.9375rem] font-semibold">Correo</label>
          <input id="l-email" type="email" autoComplete="username" className="field" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="mt-4">
          <label htmlFor="l-pass" className="mb-1.5 block text-[0.9375rem] font-semibold">Contraseña</label>
          <input id="l-pass" type="password" autoComplete="current-password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p role="alert" className="mt-4 text-sm text-[#a0412f]">{error}</p>}
        <button type="submit" disabled={busy} className={`${pill} mt-6 w-full bg-forest text-white hover:bg-forest-dark`}>
          {busy ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </Shell>
  );
}

export default function AdminApp() {
  const sb = adminSupabase;
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [tab, setTab] = useState<Tab>('consultas');
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  // El panel no debe indexarse en buscadores.
  useEffect(() => {
    document.title = 'Panel · Casa Villarrica';
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex,nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  useEffect(() => {
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = sb.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, [sb]);

  const userId = session?.user.id;
  useEffect(() => {
    if (!sb || !userId) {
      setIsAdmin(null);
      return;
    }
    sb.rpc('is_admin').then(({ data, error }) => setIsAdmin(error ? false : Boolean(data)));
  }, [sb, userId]);

  const reload = useCallback(async () => {
    if (!sb) return;
    const [c, r] = await Promise.all([
      sb.from('consultas').select('*').order('created_at', { ascending: false }),
      sb.from('reservas').select('*').order('fecha_inicio', { ascending: true }),
    ]);
    if (c.error || r.error) {
      setLoadError('No se pudieron cargar los datos. Revisa que ejecutaste supabase/admin.sql.');
      return;
    }
    setConsultas(c.data as Consulta[]);
    setReservas(r.data as Reserva[]);
    setLoadError('');
  }, [sb]);

  // Carga inicial + refresco automático cada minuto y al volver a la pestaña.
  useEffect(() => {
    if (!isAdmin) return;
    reload();
    const id = setInterval(reload, 60_000);
    const onVisible = () => document.visibilityState === 'visible' && reload();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [isAdmin, reload]);

  const booked = useMemo(() => buildBookedNights(reservas), [reservas]);
  const nuevas = consultas.filter((c) => c.estado === 'nueva');
  const historial = consultas.filter((c) => c.estado !== 'nueva');

  const accept = async (id: string) => {
    if (!sb) return;
    setBusyId(id);
    setActionError('');
    const { error } = await sb.rpc('aceptar_consulta', { p_consulta: id });
    setBusyId(null);
    if (error) setActionError(error.message);
    await reload();
  };

  const reject = async (id: string) => {
    if (!sb) return;
    setBusyId(id);
    setActionError('');
    const { error } = await sb.from('consultas').update({ estado: 'rechazada' }).eq('id', id).eq('estado', 'nueva');
    setBusyId(null);
    if (error) setActionError('No se pudo rechazar: ' + error.message);
    await reload();
  };

  if (!sb) {
    return (
      <Shell>
        <p className="rounded-2xl bg-white p-6">
          Supabase no está configurado. Define <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> y
          vuelve a publicar el sitio.
        </p>
      </Shell>
    );
  }

  if (session === undefined) return <Shell><p className="text-ink/60">Cargando…</p></Shell>;
  if (!session) return <Login />;

  const logout = () => void sb.auth.signOut();

  if (isAdmin === null) return <Shell onLogout={logout}><p className="text-ink/60">Verificando acceso…</p></Shell>;
  if (!isAdmin) {
    return (
      <Shell onLogout={logout}>
        <div role="alert" className="rounded-2xl bg-white p-6">
          <p className="font-serif text-3xl">Esta cuenta no tiene permisos de administrador.</p>
          <p className="mt-2 text-ink/70">
            Agrega tu usuario a la tabla <code>admins</code> (último paso de <code>supabase/admin.sql</code>).
          </p>
        </div>
      </Shell>
    );
  }

  const tabBtn = (id: Tab, label: string, count?: number) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      aria-pressed={tab === id}
      className={`min-h-[2.75rem] rounded-full border px-5 text-[0.95rem] font-medium transition ${
        tab === id ? 'border-forest bg-forest text-white' : 'border-ink/20 text-ink/80 hover:border-forest'
      }`}
    >
      {label}
      {count ? <span className="ml-2 rounded-full bg-sand px-2 py-0.5 text-xs font-semibold text-ink">{count}</span> : null}
    </button>
  );

  return (
    <Shell onLogout={logout}>
      <div className="flex flex-wrap gap-2">
        {tabBtn('consultas', 'Consultas', nuevas.length)}
        {tabBtn('reservas', 'Reservas y bloqueos')}
        <button type="button" onClick={() => void reload()} className="ml-auto px-3 text-sm font-medium text-ink/60 underline-offset-4 hover:underline">
          Actualizar
        </button>
      </div>

      {loadError && <p role="alert" className="mt-5 rounded-xl bg-[#F6E7E2] px-4 py-3 text-[#7A3A2D]">{loadError}</p>}
      {actionError && <p role="alert" className="mt-5 rounded-xl bg-[#F6E7E2] px-4 py-3 text-[#7A3A2D]">{actionError}</p>}

      {tab === 'consultas' ? (
        <div className="mt-8">
          <h2 className="font-serif text-4xl">Nuevas ({nuevas.length})</h2>
          {nuevas.length === 0 ? (
            <p className="mt-3 text-ink/65">No tienes consultas pendientes.</p>
          ) : (
            <div className="mt-5 space-y-4">
              {nuevas.map((c) => (
                <InquiryCard key={c.id} c={c} booked={booked} busy={busyId === c.id} onAccept={() => accept(c.id)} onReject={() => reject(c.id)} />
              ))}
            </div>
          )}

          {historial.length > 0 && (
            <details className="mt-12">
              <summary className="cursor-pointer font-serif text-3xl">Historial ({historial.length})</summary>
              <div className="mt-5 space-y-4">
                {historial.map((c) => (
                  <InquiryCard key={c.id} c={c} booked={booked} busy={false} onAccept={() => {}} onReject={() => {}} />
                ))}
              </div>
            </details>
          )}
        </div>
      ) : (
        <div className="mt-8">
          <ReservationsPanel sb={sb} reservas={reservas} onChanged={reload} />
        </div>
      )}
    </Shell>
  );
}
