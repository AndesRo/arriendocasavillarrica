import { useCallback, useEffect, useRef, useState } from 'react';
import { WEATHER_REFRESH_MS } from '../lib/config';
import { describeWeather, fetchWeather, type Weather } from '../lib/weather';
import { Droplet, Refresh, Wind } from './Icons';
import Reveal from './Reveal';

type Status = 'loading' | 'ok' | 'error';

function useWeather() {
  const [status, setStatus] = useState<Status>('loading');
  const [data, setData] = useState<Weather | null>(null);
  const [refreshFailed, setRefreshFailed] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const lastRef = useRef(0);

  const refresh = useCallback(async () => {
    abortRef.current?.abort();

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    const timeout = setTimeout(() => ctrl.abort(), 12_000);

    try {
      const w = await fetchWeather(ctrl.signal);

      setData(w);
      setStatus('ok');
      setRefreshFailed(false);
      lastRef.current = Date.now();
    } catch (err) {
      if (
        (err as Error).name === 'AbortError' &&
        abortRef.current !== ctrl
      ) {
        return;
      }

      console.warn('No se pudo actualizar el clima', err);

      setRefreshFailed(true);
      setStatus((s) => (s === 'ok' ? 'ok' : 'error'));
    } finally {
      clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    refresh();

    const id = setInterval(refresh, WEATHER_REFRESH_MS);

    const onVisible = () => {
      if (
        document.visibilityState === 'visible' &&
        Date.now() - lastRef.current > WEATHER_REFRESH_MS
      ) {
        refresh();
      }
    };

    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      abortRef.current?.abort();
    };
  }, [refresh]);

  return {
    status,
    data,
    refreshFailed,
    refresh,
  };
}

function agoText(ms: number) {
  const min = Math.floor(ms / 60_000);

  if (min < 1) return 'Actualizado hace instantes';

  if (min === 1) return 'Actualizado hace 1 minuto';

  if (min < 60) {
    return `Actualizado hace ${min} minutos`;
  }

  const h = Math.floor(min / 60);

  return h === 1
    ? 'Actualizado hace 1 hora'
    : `Actualizado hace ${h} horas`;
}

export default function WeatherWidget() {
  const { status, data, refreshFailed, refresh } = useWeather();

  const [, tick] = useState(0);

  // Re-renderiza cada 30 s para mantener "hace X minutos" al día.
  useEffect(() => {
    const id = setInterval(
      () => tick((n) => n + 1),
      30_000
    );

    return () => clearInterval(id);
  }, []);

  const info = data
    ? describeWeather(data.code, data.isDay)
    : null;

  return (
    <section
      id="villarrica"
      className="on-dark bg-forest py-20 text-white sm:py-28"
      aria-labelledby="clima-titulo"
    >
      <div className="mx-auto grid max-w-[90rem] items-center gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:px-12">

        {/* Información */}
        <Reveal className="lg:col-span-5">
          <p className="eyebrow text-sand">
            Villarrica ahora
          </p>

          <h2
            id="clima-titulo"
            className="section-title mt-5"
          >
            El clima, en tiempo real.
          </h2>

          <p className="mt-6 max-w-md text-lg leading-relaxed text-white/80 sm:text-xl">
            Mira cómo está el día en Villarrica antes de planear tu viaje.
          </p>
        </Reveal>

        {/* Widget */}
        <Reveal
          className="lg:col-span-7"
          delay={120}
        >
          <div
            className="rounded-[1.75rem] border border-white/15 bg-white/[0.06] p-7 sm:p-10"
            aria-live="polite"
            aria-busy={status === 'loading'}
          >

            {/* Loading */}
            {status === 'loading' && (
              <div
                className="animate-pulse space-y-6"
                role="status"
                aria-label="Cargando clima"
              >
                <div className="h-6 w-40 rounded bg-white/15" />

                <div className="h-24 w-64 rounded bg-white/15" />

                <div className="h-6 w-56 rounded bg-white/15" />
              </div>
            )}

            {/* Error */}
            {status === 'error' && (
              <div
                role="alert"
                className="py-4"
              >
                <p className="font-serif text-3xl">
                  No pudimos actualizar el clima en este momento.
                </p>

                <button
                  type="button"
                  onClick={refresh}
                  className="mt-6 inline-flex min-h-[3rem] items-center gap-2 rounded-full border border-white/60 px-6 text-[0.8125rem] font-semibold uppercase tracking-[0.16em] transition hover:bg-white hover:text-ink"
                >
                  <Refresh size={18} />

                  Reintentar
                </button>
              </div>
            )}

            {/* Clima correcto */}
            {status === 'ok' && data && info && (
              <>
                <p className="eyebrow text-white/70">
                  Villarrica ahora
                </p>

                <div className="mt-4 flex items-center gap-5 sm:gap-8">

                  {/* Icono clima */}
                  <span
                    className="text-[4.5rem] leading-none sm:text-[6rem]"
                    role="img"
                    aria-label={info.label}
                  >
                    {info.emoji}
                  </span>

                  {/* Temperatura principal */}
                  <div>
                    <p className="font-sans text-[clamp(4.5rem,13vw,8rem)] font-medium leading-[0.9] tabular-nums">
                      {Math.round(data.temperature)}°C
                    </p>

                    <p className="mt-2 text-xl text-white/90 sm:text-2xl">
                      {info.label}
                    </p>
                  </div>
                </div>

                {/* Datos secundarios */}
                <dl className="mt-9 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-white/15 pt-7 sm:grid-cols-4">

                  {/* Máxima */}
                  <div>
                    <dt className="text-sm text-white/70">
                      Máxima
                    </dt>

                    <dd className="mt-1 font-sans text-3xl tabular-nums">
                      {Math.round(data.max)}°
                    </dd>
                  </div>

                  {/* Mínima */}
                  <div>
                    <dt className="text-sm text-white/70">
                      Mínima
                    </dt>

                    <dd className="mt-1 font-sans text-3xl tabular-nums">
                      {Math.round(data.min)}°
                    </dd>
                  </div>

                  {/* Viento */}
                  <div>
                    <dt className="flex items-center gap-1.5 text-sm text-white/70">
                      <Wind size={16} />

                      Viento
                    </dt>

                    <dd className="mt-1 font-sans text-3xl tabular-nums">
                      {Math.round(data.windKmh)} km/h
                    </dd>
                  </div>

                  {/* Humedad */}
                  {data.humidity !== null && (
                    <div>
                      <dt className="flex items-center gap-1.5 text-sm text-white/70">
                        <Droplet size={16} />

                        Humedad
                      </dt>

                      <dd className="mt-1 font-sans text-3xl tabular-nums">
                        {Math.round(data.humidity)}%
                      </dd>
                    </div>
                  )}
                </dl>

                {/* Última actualización */}
                <p className="mt-7 text-sm text-white/70">
                  {agoText(Date.now() - data.fetchedAt)}

                  {refreshFailed &&
                    ' · No pudimos actualizar el clima en este momento.'}
                </p>
              </>
            )}
          </div>

          {/* Fuente */}
          <p className="mt-3 text-xs text-white/55">
            Datos meteorológicos:{' '}
            <a
              className="underline underline-offset-2"
              href="https://open-meteo.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open-Meteo
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  );
}