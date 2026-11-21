import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AttireGuide from '../components/AttireGuide.jsx';
import Footer from '../components/Footer.jsx';
import Hero from '../components/Hero.jsx';
import InvitationEnvelope from '../components/InvitationEnvelope.jsx';
import Navbar from '../components/Navbar.jsx';
import RSVPSection from '../components/RSVPSection.jsx';
import WeddingDay from '../components/WeddingDay.jsx';
import WeddingQA from '../components/WeddingQA.jsx';
import Welcome from '../components/Welcome.jsx';
import { Volume2, VolumeX } from 'lucide-react';

const musicUrl = '/You%20To%20Me%20Are%20Everything%20-%20Chelsey%20Johnson%20(Official%20Lyric%20Video).mp3';

export default function Home() {
  const location = useLocation();
  const [invitationOpen, setInvitationOpen] = useState(false);
  const [homeRevealed, setHomeRevealed] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const finishOpening = useCallback(() => setInvitationOpen(true), []);
  const beginOpening = useCallback(() => setHomeRevealed(true), []);

  useEffect(() => {
    const audio = document.getElementById('wedding-music');
    if (!audio) return undefined;

    function playMusic() {
      audio.volume = 0.5;
      audio.muted = false;
      audio.play()
        .then(() => setMusicPlaying(true))
        .catch(() => setMusicPlaying(false));
    }

    window.addEventListener('wedding:play-music', playMusic);
    audio.muted = true;
    audio.volume = 0.5;
    audio.play().catch(() => {});

    return () => window.removeEventListener('wedding:play-music', playMusic);
  }, []);

  function toggleMusic() {
    const audio = document.getElementById('wedding-music');
    if (!audio) return;
    if (audio.paused) {
      audio.muted = false;
      audio.volume = 0.5;
      audio.play()
        .then(() => setMusicPlaying(true))
        .catch(() => setMusicPlaying(false));
    } else {
      audio.pause();
      setMusicPlaying(false);
    }
  }

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
    <audio id="wedding-music" src={musicUrl} loop preload="auto" />
    <button
      type="button"
      className="fixed bottom-4 right-4 z-[60] flex h-11 w-11 items-center justify-center rounded-full border border-[#c5a15b]/60 bg-[#fff8ef] text-[#800020] shadow-[0_8px_24px_rgba(87,11,25,.18)]"
      onClick={toggleMusic}
      aria-label={musicPlaying ? 'Pause wedding music' : 'Play wedding music'}
      title={musicPlaying ? 'Pause music' : 'Play music'}
    >
      {musicPlaying ? <Volume2 size={18} /> : <VolumeX size={18} />}
    </button>
    <div aria-hidden={!invitationOpen}>
      <Navbar />
      <main>
        <Hero isRevealed={homeRevealed} />
        <Welcome />
        <WeddingDay />
        <AttireGuide />
        <WeddingQA />
        <RSVPSection />
      </main>
      <Footer />
    </div>
    {!invitationOpen && <InvitationEnvelope onOpening={beginOpening} onOpen={finishOpening} />}
  </>;
}
