import type { SupabaseClient } from '@supabase/supabase-js';
import { useState, type FormEvent } from 'react';
import { diffNights, formatLong, todayISO } from '../lib/dates';
import type { Reserva } from './types';

interface Props {
  sb: SupabaseClient;
  reservas: Reserva[];
  onChanged: () => Promise<void>;
}

const pill =
  'inline-flex min-h-[2.75rem] items-center justify-center rounded-full px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40';

function Row({ r, onDelete, busy }: { r: Reserva; onDelete: () => void; busy: boolean }) {
  const nights = diffNights(r.fecha_inicio, r.fecha_fin);
  const blocked = r.estado === 'bloqueado';
  return (
    <li className="flex flex-wrap items-center justify-between gap-4 rounded-[1.25rem] bg-white px-5 py-4">
      <div className="min-w-0">
        <p className="font-serif text-2xl">
          {formatLong(r.fecha_inicio)} → {formatLong(r.fecha_fin)}
        </p>
        <p className="mt-0.5 text-ink/70">
          {nights} {nights === 1 ? 'noche' : 'noches'}
          {r.nombre_cliente ? ` · ${r.nombre_cliente}` : ''}
          {r.telefono ? ` · ${r.telefono}` : ''}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span
          className={`rounded-full px-3.5 py-1 text-[0.8125rem] font-semibold ${
            blocked ? 'border border-ink/30 text-ink/70' : 'bg-forest text-white'
          }`}
        >
          {blocked ? 'Bloqueado' : 'Reservado'}
        </span>
        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          className={`${pill} border border-ink/25 text-ink hover:border-[#a0412f] hover:text-[#a0412f]`}
        >
          {blocked ? 'Quitar bloqueo' : 'Cancelar reserva'}
        </button>
      </div>
    </li>
  );
}

export default function ReservationsPanel({ sb, reservas, onChanged }: Props) {
  const today = todayISO();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    inicio: '',
    fin: '',
    estado: 'bloqueado' as 'reservado' | 'bloqueado',
    nombre: '',
    telefono: '',
  });

  const upcoming = reservas.filter((r) => r.fecha_fin >= today).sort((a, b) => a.fecha_inicio.localeCompare(b.fecha_inicio));
  const past = reservas.filter((r) => r.fecha_fin < today).sort((a, b) => b.fecha_inicio.localeCompare(a.fecha_inicio));

  const remove = async (r: Reserva) => {
    const what = r.estado === 'bloqueado' ? 'el bloqueo' : 'la reserva';
    if (!window.confirm(`¿Quitar ${what} del ${formatLong(r.fecha_inicio)} al ${formatLong(r.fecha_fin)}? Las fechas quedarán libres en el calendario.`)) return;
    setBusyId(r.id);
    setError('');
    const { error: err } = await sb.from('reservas').delete().eq('id', r.id);
    setBusyId(null);
    if (err) setError('No se pudo eliminar: ' + err.message);
    await onChanged();
  };

  const add = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.inicio || !form.fin) return setError('Elige fecha de llegada y de salida.');
    if (form.fin <= form.inicio) return setError('La salida debe ser posterior a la llegada.');
    setSaving(true);
    const { error: err } = await sb.from('reservas').insert({
      fecha_inicio: form.inicio,
      fecha_fin: form.fin,
      estado: form.estado,
      nombre_cliente: form.nombre.trim() || null,
      telefono: form.telefono.trim() || null,
    });
    setSaving(false);
    if (err) {
      setError(err.code === '23P01' ? 'Esas fechas se cruzan con otra reserva o bloqueo.' : 'No se pudo guardar: ' + err.message);
      return;
    }
    setForm({ ...form, inicio: '', fin: '', nombre: '', telefono: '' });
    await onChanged();
  };

  return (
    <div>
      <form onSubmit={add} className="rounded-[1.5rem] bg-white p-5 sm:p-7" aria-label="Agregar reserva o bloqueo">
        <h3 className="font-serif text-3xl">Agregar reserva o bloqueo</h3>
        <p className="mt-1 text-ink/65">
          Útil para estadías que acordaste por WhatsApp o para bloquear días en que la casa no está disponible.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="a-inicio" className="mb-1.5 block text-[0.9375rem] font-semibold">Llegada</label>
            <input id="a-inicio" type="date" className="field" value={form.inicio} min={today} onChange={(e) => setForm({ ...form, inicio: e.target.value })} required />
          </div>
          <div>
            <label htmlFor="a-fin" className="mb-1.5 block text-[0.9375rem] font-semibold">Salida</label>
            <input id="a-fin" type="date" className="field" value={form.fin} min={form.inicio || today} onChange={(e) => setForm({ ...form, fin: e.target.value })} required />
          </div>
          <div>
            <label htmlFor="a-estado" className="mb-1.5 block text-[0.9375rem] font-semibold">Tipo</label>
            <select id="a-estado" className="field" value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value as 'reservado' | 'bloqueado' })}>
              <option value="bloqueado">Bloqueo (sin cliente)</option>
              <option value="reservado">Reserva de un cliente</option>
            </select>
          </div>
          <div>
            <label htmlFor="a-nombre" className="mb-1.5 block text-[0.9375rem] font-semibold">Nombre (opcional)</label>
            <input id="a-nombre" className="field" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="a-tel" className="mb-1.5 block text-[0.9375rem] font-semibold">Teléfono (opcional)</label>
            <input id="a-tel" type="tel" className="field" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          </div>
        </div>
        <button type="submit" disabled={saving} className={`${pill} mt-5 bg-forest text-white hover:bg-forest-dark`}>
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-[#F6E7E2] px-4 py-3 text-[#7A3A2D]">{error}</p>
      )}

      <h3 className="mt-10 font-serif text-3xl">Próximas y en curso</h3>
      {upcoming.length === 0 ? (
        <p className="mt-3 text-ink/65">No hay reservas ni bloqueos próximos.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {upcoming.map((r) => (
            <Row key={r.id} r={r} busy={busyId === r.id} onDelete={() => remove(r)} />
          ))}
        </ul>
      )}

      {past.length > 0 && (
        <details className="mt-8">
          <summary className="cursor-pointer text-lg font-medium text-ink/75">Pasadas ({past.length})</summary>
          <ul className="mt-4 space-y-3">
            {past.map((r) => (
              <Row key={r.id} r={r} busy={busyId === r.id} onDelete={() => remove(r)} />
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
