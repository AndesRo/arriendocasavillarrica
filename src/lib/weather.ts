/** Clima de Villarrica con Open-Meteo (gratuito, sin API key). https://open-meteo.com */

const LATITUDE = -39.2857;
const LONGITUDE = -72.2279;

export interface Weather {
  temperature: number;
  apparent: number;
  code: number;
  isDay: boolean;
  windKmh: number;
  humidity: number | null;
  max: number;
  min: number;
  fetchedAt: number;
}

const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export async function fetchWeather(signal?: AbortSignal): Promise<Weather> {
  const params = new URLSearchParams({
    latitude: String(LATITUDE),
    longitude: String(LONGITUDE),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m',
    daily: 'temperature_2m_max,temperature_2m_min',
    timezone: 'America/Santiago',
    forecast_days: '1',
    wind_speed_unit: 'kmh',
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal });
  if (!res.ok) throw new Error(`Open-Meteo respondió ${res.status}`);

  const data = await res.json();
  const c = data?.current;
  const d = data?.daily;

  if (!c || !d || !isNum(c.temperature_2m) || !isNum(c.weather_code) || !isNum(c.wind_speed_10m)) {
    throw new Error('Respuesta de clima inesperada');
  }

  const max = d.temperature_2m_max?.[0];
  const min = d.temperature_2m_min?.[0];
  if (!isNum(max) || !isNum(min)) throw new Error('Respuesta de clima incompleta');

  return {
    temperature: c.temperature_2m,
    apparent: isNum(c.apparent_temperature) ? c.apparent_temperature : c.temperature_2m,
    code: c.weather_code,
    isDay: c.is_day === 1,
    windKmh: c.wind_speed_10m,
    humidity: isNum(c.relative_humidity_2m) ? c.relative_humidity_2m : null,
    max,
    min,
    fetchedAt: Date.now(),
  };
}

/** Códigos WMO → descripción en español + emoji. */
export function describeWeather(code: number, isDay: boolean): { label: string; emoji: string } {
  switch (code) {
    case 0: return { label: 'Despejado', emoji: isDay ? '☀️' : '🌙' };
    case 1: return { label: 'Mayormente despejado', emoji: isDay ? '🌤️' : '🌙' };
    case 2: return { label: 'Parcialmente nublado', emoji: isDay ? '⛅' : '☁️' };
    case 3: return { label: 'Nublado', emoji: '☁️' };
    case 45:
    case 48: return { label: 'Niebla', emoji: '🌫️' };
    case 51:
    case 53:
    case 55: return { label: 'Llovizna', emoji: '🌦️' };
    case 56:
    case 57: return { label: 'Llovizna helada', emoji: '🌧️' };
    case 61: return { label: 'Lluvia débil', emoji: '🌧️' };
    case 63: return { label: 'Lluvia', emoji: '🌧️' };
    case 65: return { label: 'Lluvia intensa', emoji: '🌧️' };
    case 66:
    case 67: return { label: 'Lluvia helada', emoji: '🌧️' };
    case 71:
    case 73:
    case 75: return { label: 'Nevadas', emoji: '🌨️' };
    case 77: return { label: 'Granizo fino', emoji: '🌨️' };
    case 80:
    case 81:
    case 82: return { label: 'Chubascos', emoji: '🌦️' };
    case 85:
    case 86: return { label: 'Chubascos de nieve', emoji: '🌨️' };
    case 95: return { label: 'Tormenta eléctrica', emoji: '⛈️' };
    case 96:
    case 99: return { label: 'Tormenta con granizo', emoji: '⛈️' };
    default: return { label: 'Condición variable', emoji: '🌡️' };
  }
}
