import { useCallback, useState } from 'react';
import AboutHouse from './components/AboutHouse';
import Amenities from './components/Amenities';
import AvailabilityCalendar from './components/AvailabilityCalendar';
import BookingForm, { type Prefill } from './components/BookingForm';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Gallery from './components/Gallery';
import Hero from './components/Hero';
import Navbar from './components/Navbar';
import NearbyPlaces from './components/NearbyPlaces';
import PropertyHighlights from './components/PropertyHighlights';
import WeatherWidget from './components/WeatherWidget';
import WhatsAppButton from './components/WhatsAppButton';

export default function App() {
  const [prefill, setPrefill] = useState<Prefill | null>(null);

  // El calendario envía las fechas elegidas al formulario y baja hasta él.
  const handleConsult = useCallback((start: string, end: string) => {
    setPrefill({ start, end, id: Date.now() });
    requestAnimationFrame(() => {
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      document.getElementById('contacto')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  }, []);

  return (
    <>
      <a
        href="#contenido"
        className="sr-only z-[70] rounded-full bg-white px-5 py-3 font-semibold text-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Saltar al contenido
      </a>
      <Navbar />
      <main id="contenido">
        <Hero />
        <PropertyHighlights />
        <AboutHouse />
        <Gallery />
        <Amenities />
        <AvailabilityCalendar onConsult={handleConsult} />
        <WeatherWidget />
        <NearbyPlaces />
        <BookingForm prefill={prefill} />
        <Contact />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
