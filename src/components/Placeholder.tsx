interface PlaceholderProps {
  /** Texto principal, por defecto "Agregar fotografía". */
  label?: string;
  /** Ruta esperada del archivo, para que sepas dónde colocarlo. */
  path?: string;
  tone?: 'light' | 'dark';
  className?: string;
}

/** Recuadro elegante que ocupa el lugar de una fotografía aún no cargada. */
export default function Placeholder({
  label = 'Agregar fotografía',
  path,
  tone = 'light',
  className = '',
}: PlaceholderProps) {
  const dark = tone === 'dark';
  return (
    <div
      role="img"
      aria-label={label}
      className={`relative flex h-full w-full items-center justify-center overflow-hidden ${
        dark ? 'bg-forest-dark text-white' : 'bg-[#E7E0D0] text-forest'
      } ${className}`}
    >
      {/* Silueta abstracta de volcán y lago (ilustración, no una fotografía) */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.16]"
        viewBox="0 0 400 300"
        preserveAspectRatio="xMidYMax slice"
        aria-hidden="true"
      >
        <path d="M0 300V232l70-26 52 16 78-128 24-12 28 14 70 112 78 24v68Z" fill="currentColor" />
        <path d="M0 300v-36q100-24 200 0t200-4v40Z" fill="currentColor" opacity="0.7" />
      </svg>
      <div className="relative px-4 text-center">
        <p className="font-serif text-xl italic sm:text-2xl">{label}</p>
        {path && (
          <p className={`mt-1 break-all text-[0.75rem] tracking-wide ${dark ? 'text-white/70' : 'text-forest/70'}`}>
            {path}
          </p>
        )}
      </div>
    </div>
  );
}
