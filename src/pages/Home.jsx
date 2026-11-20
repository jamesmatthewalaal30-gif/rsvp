import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import AttireGuide from '../components/AttireGuide.jsx';
import Footer from '../components/Footer.jsx';
import Hero from '../components/Hero.jsx';
import Navbar from '../components/Navbar.jsx';
import RSVPSection from '../components/RSVPSection.jsx';
import Venue from '../components/Venue.jsx';

export default function Home() {
  const location = useLocation();
  useEffect(() => {
    if (location.hash) document.querySelector(location.hash)?.scrollIntoView();
  }, [location.hash]);
  return <>
    <Navbar />
    <main>
      <Hero />
      <Venue />
      <AttireGuide />
      <RSVPSection />
    </main>
    <Footer />
  </>;
}
