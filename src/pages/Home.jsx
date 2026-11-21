import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AttireGuide from '../components/AttireGuide.jsx';
import Footer from '../components/Footer.jsx';
import Hero from '../components/Hero.jsx';
import InvitationEnvelope from '../components/InvitationEnvelope.jsx';
import Navbar from '../components/Navbar.jsx';
import RSVPSection from '../components/RSVPSection.jsx';
import WeddingDay from '../components/WeddingDay.jsx';
import Welcome from '../components/Welcome.jsx';

export default function Home() {
  const location = useLocation();
  const [invitationOpen, setInvitationOpen] = useState(false);
  const [homeRevealed, setHomeRevealed] = useState(false);
  const finishOpening = useCallback(() => setInvitationOpen(true), []);
  const beginOpening = useCallback(() => setHomeRevealed(true), []);

  useEffect(() => {
    if (invitationOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [invitationOpen]);

  useEffect(() => {
    if (invitationOpen && location.hash) document.querySelector(location.hash)?.scrollIntoView();
  }, [invitationOpen, location.hash]);

  return <>
    <div aria-hidden={!invitationOpen}>
      <Navbar />
      <main>
        <Hero isRevealed={homeRevealed} />
        <Welcome />
        <WeddingDay />
        <AttireGuide />
        <RSVPSection />
      </main>
      <Footer />
    </div>
    {!invitationOpen && <InvitationEnvelope onOpening={beginOpening} onOpen={finishOpening} />}
  </>;
}
