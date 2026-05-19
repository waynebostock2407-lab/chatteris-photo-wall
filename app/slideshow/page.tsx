"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

interface Photo {
  id: string;
  imageUrl: string;
  approved: boolean;
  createdAt?: any;
}

interface GuestbookMessage {
  id: string;
  name: string;
  message: string;
  approved: boolean;
  createdAt?: any;
}

const PHOTO_FADE_DURATION = 650;

export default function SlideshowPage() {

  const [chairTeam, setChairTeam] =
  useState<string[]>([]);

const [viceChairTeam, setViceChairTeam] =
  useState<string[]>([]);

const [showCupDraw, setShowCupDraw] =
  useState(false);

const [remainingCoaches, setRemainingCoaches] =
  useState<string[]>([]);

const [currentReveal, setCurrentReveal] =
  useState("");

 const [isRevealAnimating, setIsRevealAnimating] =
  useState(false); 

  const [photos, setPhotos] = useState<Photo[]>([]);

  const [messages, setMessages] = useState<
    GuestbookMessage[]
  >([]);

  const [currentPhotoIndex, setCurrentPhotoIndex] =
    useState(0);

  const [currentMessageIndex, setCurrentMessageIndex] =
    useState(0);

  const [showMessages, setShowMessages] =
    useState(false);

  const [fade, setFade] = useState(true);

  const [flash, setFlash] = useState(false);

  const [isFullscreen, setIsFullscreen] =
    useState(false);

  const [showTitle, setShowTitle] =
    useState(true);

  const [calmMode, setCalmMode] =
    useState(false);

  const [showThankYou, setShowThankYou] =
    useState(false);

  const loadedImages = useRef(new Set<string>());

  const photoIntervalRef =
    useRef<NodeJS.Timeout | null>(null);

  const flashTimeoutRef =
    useRef<NodeJS.Timeout | null>(null);

  const fadeTimeoutRef =
    useRef<NodeJS.Timeout | null>(null);

  /* FULLSCREEN */

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Fullscreen failed:", err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
    };
  }, []);

  useEffect(() => {
  const timer = setTimeout(() => {
    setShowTitle(false);
  }, 15000);

  return () => clearTimeout(timer);
}, []);

useEffect(() => {
  if (showTitle) return;

  const interval = setInterval(() => {
    setShowTitle(true);

    setTimeout(() => {
      setShowTitle(false);
    }, 15000);

  }, 1000 * 60 * 4);

  return () => clearInterval(interval);
}, [showTitle]);

  /* KEYBOARD CONTROLS */

useEffect(() => {

  const handleKeyDown = (
    e: KeyboardEvent
  ) => {

    if (e.key.toLowerCase() === "f") {
      toggleFullscreen();
    }

    if (e.key.toLowerCase() === "c") {
      setCalmMode((prev) => !prev);
    }

    if (e.key.toLowerCase() === "t") {

  setShowThankYou(true);

  setTimeout(() => {
    setShowThankYou(false);
  }, 9000);

}

if (e.key.toLowerCase() === "d") {
  setShowCupDraw((prev) => !prev);
}

  };

  window.addEventListener(
    "keydown",
    handleKeyDown
  );

  return () => {
    window.removeEventListener(
      "keydown",
      handleKeyDown
    );
  };

}, []);

  /* AUDIO REACTIVITY */

  useEffect(() => {
    let audioContext: AudioContext;
    let analyser: AnalyserNode;
    let microphone: MediaStreamAudioSourceNode;

    const setupAudio = async () => {
      try {
        const stream =
          await navigator.mediaDevices.getUserMedia({
            audio: true,
          });

        audioContext = new AudioContext();

        analyser = audioContext.createAnalyser();

        analyser.fftSize = 256;

        microphone =
          audioContext.createMediaStreamSource(
            stream
          );

        microphone.connect(analyser);

        const dataArray = new Uint8Array(
          analyser.frequencyBinCount
        );

        let smoothedLevel = 1;

        const updateAudio = () => {
          analyser.getByteFrequencyData(dataArray);

          const bassFrequencies =
            dataArray.slice(0, 18);

          let bassSum = 0;

          for (
            let i = 0;
            i < bassFrequencies.length;
            i++
          ) {
            bassSum += bassFrequencies[i];
          }

          const bassAverage =
            bassSum / bassFrequencies.length;

          const normalizedBass =
            Math.max(0, bassAverage - 70);

          const targetLevel = Math.min(
            1.18,
            1 + normalizedBass / 520
          );

          smoothedLevel =
            smoothedLevel * 0.97 +
            targetLevel * 0.03;

          document.documentElement.style.setProperty(
            "--audio-reactivity",
            `${smoothedLevel}`
          );

          requestAnimationFrame(updateAudio);
        };

        updateAudio();
      } catch (err) {
        console.error(
          "Microphone access failed:",
          err
        );
      }
    };

    setupAudio();
  }, []);

  /* FIRESTORE - PHOTOS */

  useEffect(() => {
    const q = query(
      collection(db, "photos"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPhotos = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Photo, "id">),
        }))
        .filter((photo) => photo.approved);

      setPhotos(fetchedPhotos);
    });

    return () => unsubscribe();
  }, []);

  /* FIRESTORE - MESSAGES */

  useEffect(() => {
    const q = query(
      collection(db, "guestbook"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedMessages = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<
            GuestbookMessage,
            "id"
          >),
        }))
        .filter((message) => message.approved);

      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, []);

 /* FIRESTORE - CUP DRAW */

useEffect(() => {

  const unsubscribeDraw =
    onSnapshot(
      doc(db, "eventControl", "cupDraw"),
      (snapshot) => {

        if (snapshot.exists()) {

          const data = snapshot.data();

          setChairTeam(
            data.chairTeam || []
          );

          setViceChairTeam(
            data.viceChairTeam || []
          );

          setRemainingCoaches(
            data.remainingCoaches || []
          );

          const revealName =
  data.currentReveal || "";

if (
  revealName &&
  revealName !== currentReveal
) {

  setIsRevealAnimating(true);

  setTimeout(() => {
    setIsRevealAnimating(false);
  }, 850);

}

setCurrentReveal(revealName);

        }

      }
    );

  return () => unsubscribeDraw();

}, []);

  /* PRELOAD IMAGES */

  useEffect(() => {
    photos.forEach((photo) => {
      if (
        loadedImages.current.has(photo.imageUrl)
      ) {
        return;
      }

      const img = new window.Image();

      img.src = photo.imageUrl;

      img.onload = () => {
        loadedImages.current.add(photo.imageUrl);
      };
    });
  }, [photos]);

  /* PHOTO LOOP */

  useEffect(() => {
    if (
      photos.length === 0) {
      return;
    }

    photoIntervalRef.current = setInterval(() => {
      setFlash(true);

      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }

      flashTimeoutRef.current = setTimeout(() => {
        setFlash(false);
      }, 140);

      setFade(false);

      if (Math.random() < 0.06) {
  setShowTitle(true);

  setTimeout(() => {
    setShowTitle(false);
  }, 15000);

  return;
}

      const shouldShowMessage =
        !calmMode &&
        messages.length > 0 &&
        Math.random() < 0.28;

      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }

      fadeTimeoutRef.current = setTimeout(() => {
        if (shouldShowMessage) {

          setShowMessages(true);

          setCurrentMessageIndex((prev) => {

            if (messages.length <= 1)
              return prev;

            let nextIndex = prev;

            while (nextIndex === prev) {
              nextIndex = Math.floor(
                Math.random() * messages.length
              );
            }

            return nextIndex;
          });

          setFade(true);

          return;
        }

        setShowMessages(false);

        setCurrentPhotoIndex((prev) => {
          if (photos.length <= 1)
            return prev;

          let nextIndex = prev;

          while (nextIndex === prev) {
            nextIndex = Math.floor(
              Math.random() * photos.length
            );
          }

          return nextIndex;
        });

        setFade(true);
      }, PHOTO_FADE_DURATION);
    }, showMessages
  ? Math.min(
      30000,
      Math.max(
        12000,
        currentMessage?.message.length * 85
      )
    )
  : Math.random() < 0.12
  ? 16000
  : 6500 + Math.random() * 5000
);

    return () => {
      if (photoIntervalRef.current) {
        clearInterval(photoIntervalRef.current);
      }
    };
  }, [
    photos,
    showMessages,
  ]);

const isHeroPhoto =
  currentPhotoIndex % 3 === 0;

const isMegaMoment =
  currentPhotoIndex % 7 === 0;

const isFullBleed =
  currentPhotoIndex % 17 === 0;

const isQuietMoment =
  currentPhotoIndex % 7 === 0;

  const currentPhoto =
    photos[currentPhotoIndex];

  const currentMessage =
    messages[currentMessageIndex];

  const memoryCount =
    photos.length + messages.length;

  const showMilestone =
    memoryCount > 0 &&
    memoryCount % 25 === 0;

  const polaroidStyle = useMemo(() => {
    const styles = [
  "rotate-[-1deg] translate-y-2 -translate-x-4",
  "rotate-[1deg] -translate-y-2 translate-x-3",
  "rotate-[-0.5deg] translate-y-3 -translate-x-2",
  "rotate-[1.5deg] translate-x-5",
  "rotate-[-1.5deg] -translate-x-5",
  "rotate-[0.5deg] translate-y-1 translate-x-2",
];

    return styles[
      currentPhotoIndex % styles.length
    ];
  }, [currentPhotoIndex]);

if (showCupDraw) {

  return (

    <main className="cup-draw-screen">

      <img
  src="/logo.png"
  className="cup-logo-left"
  alt="Logo Left"
/>

<img
  src="/logo 4.png"
  className="cup-logo-right"
  alt="Logo Right"
/>

      <div className="cup-background-glow" />

      <div className="cup-particles" />

      <div className="cup-header">

        <div className="cup-main-title">
          CHAIR vs VICE CHAIR

          {currentReveal && (

  <div className="cup-header-reveal">

    {isRevealAnimating && (

      <div className="cup-ball-stage">

        <img
          src="/logo 2.png"
          className="cup-ball-left"
        />

        <img
          src="/logo 3.png"
          className="cup-ball-right"
        />

      </div>

    )}

    <div className="cup-reveal-name">
  {currentReveal}
</div>

  </div>

)}
        </div>

      </div>

      <div className="cup-layout">

        <div className="cup-team-panel">

          <div className="cup-team-heading">
            CHAIR
          </div>

          <div className="cup-player-list">

            {chairTeam.map((coach) => (

              <div
                key={coach}
                className="cup-player-card"
              >
                {coach}
              </div>

            ))}

          </div>

        </div>

        <div className="cup-centre">

          <div className="cup-vs">
            VS
          </div>

        </div>

        <div className="cup-team-panel">

          <div className="cup-team-heading">
            VICE CHAIR
          </div>

          <div className="cup-player-list">

            {viceChairTeam.map((coach) => (

              <div
                key={coach}
                className="cup-player-card"
              >
                {coach}
              </div>

            ))}

          </div>

        </div>

      </div>

      <style jsx>{`

        .cup-header-reveal {

  position: relative;

  height: 110px;

  display: flex;
  align-items: center;
  justify-content: center;

  margin-top: 1rem;
}

        .cup-draw-screen {

          background-blend-mode: screen;

          box-shadow:
            inset 0 0 180px rgba(255,255,255,0.12)

          position: fixed;
          inset: 0;

          overflow: hidden;

          background:
            radial-gradient(
              circle at top,
              rgba(120,200,255,0.65),
              #3c82d6 35%,
              #5ca8ff 70%,
              #7fc4ff 100%
            );

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          z-index: 999;
        }

        .cup-background-glow {

          position: absolute;

          width: 1200px;
          height: 1200px;

          border-radius: 999px;

          background:
            radial-gradient(
              circle,
              rgba(180,230,255,0.42),
              transparent 70%
            );

          filter: blur(80px);

          animation:
            cupPulse 8s ease-in-out infinite;
        }

        .cup-logo-left,
.cup-logo-right {

  position: absolute;

  top: 2rem;

  width: 140px;

  opacity: 0.42;

  filter:

    drop-shadow(
      0 0 18px rgba(255,255,255,0.35)
    )

    drop-shadow(
      0 0 45px rgba(120,220,255,0.28)
    );

  z-index: 1;
}

.cup-logo-left {

  left: 2rem;
}

.cup-logo-right {

  right: 2rem;
}

        .cup-particles {

          position: absolute;
          inset: 0;

          background-image:
            radial-gradient(
              rgba(255,255,255,0.12) 1px,
              transparent 1px
            );

          background-size:
            60px 60px;

          opacity: 0.14;

          animation:
            particleMove 40s linear infinite;
        }

        .cup-header {

          position: relative;

          text-align: center;

          margin-bottom: 1.5rem;

          z-index: 2;

          transform: translateY(-25px);
        }

        .cup-main-title {

          font-size:
            clamp(2.8rem, 5vw, 4.5rem);

          font-weight: 900;

          line-height: 0.95;

          color: white;

          text-shadow:
            0 0 30px rgba(0,120,255,0.35);
        }

        .cup-date {

          margin-top: 1.5rem;

          font-size: 1rem;

          letter-spacing: 0.25em;

          color:
            rgba(255,255,255,0.65);
        }

        .cup-layout {

  position: relative;

  display: flex;

  align-items: flex-start;

  justify-content: center;

  gap: 1.5rem;

  transform:
    translateY(-30px);

  z-index: 2;
}

        .cup-team-panel {

          width: 520px;

          height: 520px;

          border-radius: 2.5rem;

          background:
            linear-gradient(
              180deg,
              rgba(255,255,255,0.24),
              rgba(255,255,255,0.14)
            );

          border:
            1px solid rgba(120,190,255,0.32);

          backdrop-filter:
  blur(18px)
  saturate(1.4);

          box-shadow:
            0 0 50px rgba(0,0,0,0.28);

          padding: 2.2rem;
        }

        .cup-team-heading {

          text-align: center;

          font-size: 1.6rem;

          font-weight: 900;

          margin-bottom: 2rem;

          color: white;
        }

        .cup-player-list {

        max-height: 420px;

        overflow: hidden;

  display: grid;

  grid-template-columns:
    repeat(2, 1fr);

  gap: 0.7rem;
}

        .cup-player-card {

          padding: 0.7rem 0.9rem;

          border-radius: 1.2rem;

          background:
            rgba(255,255,255,0.22);

          box-shadow:
            0 0 12px rgba(255,255,255,0.08);

          border:
            1px solid rgba(255,255,255,0.06);

          text-align: center;

          font-size: 1rem;

          font-weight: 800;

          min-height: 44px;
display: flex;
align-items: center;
justify-content: center;

          animation:
            playerReveal 0.5s ease;
        }

        .cup-centre {

          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;

          gap: 1.5rem;

          padding-top: 0rem;
        }

        .cup-vs {

        background:
  radial-gradient(
    circle,
    rgba(0,140,255,0.25),
    transparent 70%
  );

padding: 2rem;

border-radius: 999px;

          font-size: 6rem;

          font-weight: 900;

          color: white;

          text-shadow:
            0 0 40px rgba(0,120,255,0.5);

          animation:
            vsPulse 3s ease-in-out infinite;
        }

        .cup-live-pill {

          padding:
            0.8rem 1.4rem;

          border-radius: 999px;

          background:
            rgba(0,120,255,0.18);

          border:
            1px solid rgba(120,190,255,0.22);

          letter-spacing: 0.25em;

          font-size: 0.85rem;

          font-weight: 800;
        }

.cup-reveal-label {

  letter-spacing: 0.35em;

  color:
    rgba(255,255,255,0.5);

  margin-bottom: 1rem;
}

.cup-reveal-name {

  font-size:
    clamp(2.2rem, 4vw, 4rem);

  font-weight: 900;

  line-height: 0.9;

  color: white;

  text-shadow:
    0 0 30px rgba(255,255,255,0.28),
    0 0 60px rgba(120,220,255,0.45);

  animation: revealNamepop 0.45s ease;
}

.cup-remaining-side {

  width: 360px;

  margin-left: 2rem;

  display: flex;
  flex-direction: column;

  align-items: center;

  transform: translateY(-40px);
}

.cup-remaining-column {

  display: grid;

  grid-template-columns:
    repeat(2, 1fr);

  gap: 0.6rem;

  width: 100%;

  max-height: 420px;

  overflow: hidden;
}

.cup-remaining-title {

  margin-bottom: 1.5rem;

  letter-spacing: 0.3em;

  color:
    rgba(255,255,255,0.55);
}

.cup-remaining-list {

  display: flex;

  flex-wrap: wrap;

  justify-content: center;

  gap: 1rem;

  max-width: 1200px;
}

.cup-remaining-pill {

  min-height: 42px;

  padding:
    0.55rem 0.8rem;

  border-radius: 999px;

  background:
    rgba(255,255,255,0.12);

  border:
    1px solid rgba(255,255,255,0.14);

  font-size: 0.72rem;

  font-weight: 700;

  text-align: center;

  font-size: 0.95rem;
}

.cup-ball-stage {

  position: absolute;

  left: 50%;

  transform: translateX(-50%);

  width: 180px;
  height: 80px;

  margin: 0 auto 1.5rem auto;
}

.cup-ball-left,
.cup-ball-right {

  position: absolute;

  width: 70px;
  height: 70px;

  object-fit: contain;

  top: 5px;

  opacity: 0;

  filter:
    drop-shadow(
      0 0 12px rgba(0,120,255,0.25)
    );
}

.cup-ball-left {

  left: 0;

  animation:
    leftBallReveal 0.9s ease forwards;
}

.cup-ball-right {

  right: 0;

  animation:
    rightBallReveal 0.9s ease forwards;
}

@keyframes leftBallReveal {

  0% {

    opacity: 0;

    transform:
      translateX(-80px)
      rotate(-360deg)
      scale(0.4);
  }

  30% {

    opacity: 1;
  }

  55% {

    transform:
      translateX(42px)
      rotate(0deg)
      scale(1);
  }

  100% {

    opacity: 0;

    transform:
      translateX(15px)
      scale(0.92);
  }
}

@keyframes rightBallReveal {

  0% {

    opacity: 0;

    transform:
      translateX(80px)
      rotate(360deg)
      scale(0.4);
  }

  30% {

    opacity: 1;
  }

  55% {

    transform:
      translateX(-42px)
      rotate(0deg)
      scale(1);
  }

  100% {

    opacity: 0;

    transform:
      translateX(-15px)
      scale(0.92);
  }
}

@keyframes revealNamePop {

  0% {

    opacity: 0;

    transform:
      scale(0.75)
      translateY(24px);
  }

  100% {

    opacity: 1;

    transform:
      scale(1)
      translateY(0);
  }
}

@keyframes revealPulse {

  0% {
    opacity: 0;
    transform:
      scale(0.8);
  }

  100% {
    opacity: 1;
    transform:
      scale(1);
  }
}

        @keyframes playerReveal {

          0% {
            opacity: 0;
            transform:
              translateY(20px)
              scale(0.92);
          }

          100% {
            opacity: 1;
            transform:
              translateY(0)
              scale(1);
          }
        }

        @keyframes cupPulse {

          0% {
            transform: scale(1);
            opacity: 0.7;
          }

          50% {
            transform: scale(1.08);
            opacity: 1;
          }

          100% {
            transform: scale(1);
            opacity: 0.7;
          }
        }

        @keyframes vsPulse {

          0% {
            transform: scale(1);
          }

          50% {
            transform: scale(1.08);
          }

          100% {
            transform: scale(1);
          }
        }

        @keyframes particleMove {

          from {
            transform: translateY(0px);
          }

          to {
            transform: translateY(-120px);
          }
        }

      `}</style>

    </main>

  );
}

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black text-white">

      <div className="absolute inset-0 z-0 overflow-hidden">

  <div
    className="absolute inset-0"
    style={{
      backgroundImage: "url('/background.png')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      filter: "brightness(0.38) saturate(1.2)",
      transform: "scale(1.03)",
    }}
  />

  <div className="background-drift" />

  <div
    className="absolute inset-0"
    style={{
      background: `
        radial-gradient(
          circle at center,
          rgba(0,120,255,0.09) 0%,
          rgba(0,0,0,0.08) 52%,
          rgba(0,0,0,0.52) 100%
        )
      `,
    }}
  />

</div>

      <div className="edge-trail" />

      <div className="stage-haze" />

      <div className="floating-crests">

  <img
    src="/logo 8.png"
    className="crest crest-1"
  />

  <img
    src="/logo9.png"
    className="crest crest-2"
  />

  <img
    src="/logo 8.png"
    className="crest crest-3"
  />

  <img
    src="/logo9.png"
    className="crest crest-4"
  />

  <img
    src="/logo 8.png"
    className="crest crest-5"
  />

</div>

<div
  className={`confetti-burst ${
    calmMode
      ? ""
      : flash &&
        (isMegaMoment || isHeroPhoto) &&
        !isQuietMoment
      ? "confetti-active"
      : ""
  }`}
/>

<div
  className={`liquid-lights ${
    calmMode
      ? "opacity-[0.12]"
      :
    isQuietMoment
      ? "opacity-[0.35]"
      : ""
  }`}
/>

      <div
          className={`absolute inset-0 z-30 pointer-events-none transition-opacity duration-700 ${
            flash ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background:
              `radial-gradient(
                circle,
                rgba(70,140,220,${
                  currentPhotoIndex % 6 === 0 ? "1" : "0.65"
                }) 0%,
              rgba(255,255,255,0.45) 30%,
              rgba(0,0,0,0) 100%
              )`,
          }}
      />

      {!isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="fixed top-6 right-6 z-[9999] bg-black/40 hover:bg-black/60 backdrop-blur-xl border border-white/20 text-white px-6 py-3 rounded-2xl text-lg font-bold tracking-wide transition-all duration-300"
        >
          ⛶ FULL SCREEN
        </button>
      )}

      {showTitle ? (

  <div className="title-screen">

  <div className="title-logo-wrap">

    <img
      src="/logo7.png"
      className="title-logo"
    />

  </div>

  <div className="title-main">
    Chatteris Town FC
  </div>

  <div className="title-sub">
    Presentation Day
  </div>

</div>

) : (

      <div
  className={`absolute inset-0 flex items-center justify-center px-12 pb-40 z-20 transition-all duration-[1800ms]
  ${
    showTitle
      ? "opacity-0 scale-[1.02]"
      : "opacity-100 scale-100"
  }
  ${
    isMegaMoment
      ? "scale-[1.04]"
      : ""
  }`}
>

        {showMessages &&
        currentMessage ? (
          <div
            className={`w-full max-w-5xl transition-all duration-500 ${
              fade
                ? "opacity-100 scale-100"
                : "opacity-0 scale-[0.98]"
            }`}
          >
            <div className="mb-8 text-center">
              <div className="text-6xl font-black">
                Messages for Vicky
              </div>
            </div>

            <div className="message-card relative overflow-hidden bg-white/10 border border-white/10 backdrop-blur-2xl rounded-[3rem] px-14 py-12 shadow-[0_0_80px_rgba(0,0,0,0.45)]">

              <div
                style={{
                  fontFamily:
                    "'Caveat', cursive",
                }}
                className={`leading-[1.25] whitespace-pre-wrap break-words ${
                  currentMessage.message.length <
                  120
                    ? "text-[3rem]"
                    : currentMessage.message
                        .length < 240
                    ? "text-[2.3rem]"
                    : currentMessage.message
                        .length < 420
                    ? "text-[1.9rem]"
                    : "text-[1.4rem]"
                }`}
              >
                {currentMessage.message}
              </div>

              <div className="mt-10 text-right">
                <div className="text-white/50 uppercase text-sm tracking-[0.3em] mb-2">
                  Shared by
                </div>

                <div
                  style={{
                    fontFamily:
                      "'Caveat', cursive",
                  }}
                  className="text-[2.3rem] font-bold"
                >
                  {currentMessage.name}
                </div>
              </div>

            </div>
          </div>

        ) : photos.length === 0 ? (

          <div className="text-center">
            <div className="text-6xl font-black">
              Awaiting Photos
            </div>
          </div>

        ) : currentPhoto ? (

  isFullBleed ? (

    <div
      key={currentPhoto.id}
      className={`absolute inset-0 transition-all duration-700 ${
        fade
          ? "opacity-100 scale-100"
          : "opacity-0 scale-[1.06]"
      }`}
    >

      <div className="fullbleed-backdrop" />

      <img
        src={currentPhoto.imageUrl}
        alt="Presentation photo"
        className="w-full h-full object-contain animate-fullBleedMove"
      />

      <div className="absolute inset-0 bg-black/35" />

    </div>

  ) : (

    <div
      key={currentPhoto.id}
      className={`${
        fade
          ? "animate-polaroidSlam opacity-100"
          : "opacity-0"
      }`}
    >

      <div
        className={`
          relative
          inline-flex
          flex-col
          items-center
          rounded-[2.2rem]
          border
          border-white/10
          bg-white/8
          backdrop-blur-2xl
          shadow-[0_0_80px_rgba(0,0,0,0.45)]
          ${
            isMegaMoment
              ? "scale-[1.16] rotate-[2deg]"
              : isHeroPhoto
              ? "scale-[1.06] rotate-[1deg]"
              : ""
          }
          ${polaroidStyle}
          ${
            fade
              ? "animate-polaroidSlam opacity-100"
              : "opacity-0"
          }
        `}
      >

        <div className="glass-frame-glow" />

        <div className="relative overflow-hidden rounded-t-[1.7rem]">

          <img
            src={currentPhoto.imageUrl}
            alt="Presentation photo"
            className={`
              block
              max-w-[78vw]
              max-h-[72vh]
              object-contain
              ${
                isQuietMoment
                  ? ""
                  : "animate-kenburns"
              }
            `}
          />

          <div className="photo-finish" />

        </div>

        <div className="glass-footer">

          <img
            src="/logo 8.png"
            alt="Club logo"
            className="glass-footer-logo"
          />

          <div className="glass-footer-text pl-3">
            Memories
          </div>

          <img
            src="/logo9.png"
            alt="Club logo"
            className="glass-footer-logo"
          />

        </div>

      </div>

    </div>

  )

) : null}
      </div>

)}

{showThankYou && (

  <div className="thank-you-overlay">

    <div className="thank-you-inner">

      <div className="thank-you-title">
        THANK YOU
      </div>

      <div className="thank-you-text">
        Coaches · Volunteers · Parents
        <br />
        Players · Supporters
      </div>

    </div>

  </div>

)}

{showMilestone && !showMessages && (

  <div className="milestone-popup">

    <div className="milestone-number">
      {memoryCount}
    </div>
  
    <div className="milestone-text">
      MEMORIES SHARED 💙 
    </div>

  </div>

)}

{!showTitle && (
<>
  <div className="corner-brand">

    <img
      src="/logo 8.png"
      alt="Club logo"
      className="corner-brand-logo"
    />

    <div className="corner-brand-text">

      <div className="corner-brand-main">
        CHATTERIS TOWN FC
      </div>

      <div className="corner-brand-sub">
        Presentation Day
      </div>

    </div>

  </div>

  <div className="absolute bottom-8 right-8 z-30">

        <div className="bg-[#0b1630]/72 backdrop-blur-2xl rounded-[2rem] p-5 shadow-[0_10px_28px_rgba(0,0,0,0.22)] border border-[#5eb6ff]/25">

          <div className="live-indicator">

          <div className="live-dot" />

          LIVE PHOTOS & MESSAGES

</div>

          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://chatteris-photo-wall.vercel.app"
            alt="QR Code"
            className="rounded-xl w-[180px] h-[180px] border border-white/10 shadow-[0_0_24px_rgba(255,255,255,0.08)]"
          />

        </div>
      </div>
      </>
)}
      <style jsx>{`

        .title-screen {
  position: absolute;
  inset: 0;

  overflow: hidden;

  z-index: 50;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  gap: 0.7rem;
  padding-bottom: 4vh;

  background:
    radial-gradient(
      circle at center,
      rgba(10,30,60,0.45),
      rgba(0,0,0,0.82)
    );

  animation:
    titleFade 15s ease forwards;
}

.title-screen::before {
  content: "";

  position: absolute;

  width: 900px;
  height: 900px;

  border-radius: 999px;

  background:
    radial-gradient(
      circle,
      rgba(0,140,255,0.22) 0%,
      rgba(120,190,255,0.12) 30%,
      rgba(255,255,255,0.04) 48%,
      transparent 72%
    );

  filter: blur(40px);

  animation:
    titleAura 8s ease-in-out infinite;

  z-index: -1;
}

.glass-frame-glow {
  position: absolute;
  inset: 0;

  border-radius: inherit;

  background:
    linear-gradient(
      135deg,
      rgba(255,255,255,0.12),
      rgba(255,255,255,0.02)
    );

  pointer-events: none;

  mix-blend-mode: screen;
}

.glass-footer {

  width: 100%;

  overflow: visible;

  display: flex;
  align-items: center;
  justify-content: center;

  gap: 1.2rem;

  padding:
    1.2rem
    1.5rem;

  background:
    linear-gradient(
      to top,
      rgba(8,16,32,0.88),
      rgba(8,16,32,0.42)
    );

  border-top:
    1px solid rgba(255,255,255,0.08);

  backdrop-filter: blur(20px);
}

.glass-footer-logo {

  width: 54px;
  height: 54px;

  object-fit: contain;

  filter:
    drop-shadow(
      0 0 12px rgba(0,120,255,0.24)
    );
}

.glass-footer-text {

  display: inline-block;

  contain: paint;

  will-change: transform;

  backface-visibility: hidden;

  transform:
    translateX(2px)
    translateY(0);

  font-family:
    var(--font-great-vibes);

  font-size: 2.4rem;

  line-height: 1.15;

  padding-left: 0.6rem;
  padding-right: 0.2rem;

  background:
    linear-gradient(
      180deg,
      #ffffff 0%,
      #d9d9d9 30%,
      #8f8f8f 100%
    );

  background-clip: text;
  -webkit-background-clip: text;

  color: transparent;
  -webkit-text-fill-color: transparent;

  filter:
    drop-shadow(
      0 0 12px rgba(255,255,255,0.08)
    )
    drop-shadow(
      0 0 22px rgba(70,140,220,0.16)
    );
}

.floating-crests {
  position: absolute;
  inset: 0;

  overflow: hidden;

  z-index: 14;

  pointer-events: none;
}

@keyframes revealNamePop {

  0% {

    opacity: 0;

    transform:
      scale(0.75)
      translateY(24px);
  }

  100% {

    opacity: 1;

    transform:
      scale(1)
      translateY(0);
  }
}

@keyframes revealNamePop {

  0% {

    opacity: 0;

    transform:
      scale(0.7)
      translateY(25px);
  }

  100% {

    opacity: 1;

    transform:
      scale(1)
      translateY(0);
  }
}

.crest {
  position: absolute;

  object-fit: contain;

  opacity: 0.42;

  mix-blend-mode: plus-lighter;

  filter:
  hue-rotate(-12deg)
  saturate(2.2)
  brightness(1.35)

  drop-shadow(
    0 0 10px rgba(60,170,255,0.95)
  )

  drop-shadow(
    0 0 26px rgba(40,140,255,0.88)
  )

  drop-shadow(
    0 0 60px rgba(0,120,255,0.65)
  )

  drop-shadow(
    0 0 110px rgba(0,120,255,0.35)
  );
}

.crest-1 {
  width: 170px;

  top: 8%;
  left: -10%;

  animation:
    driftOne 42s linear infinite;
}

.crest-2 {
  width: 130px;

  top: 72%;
  left: -12%;

  animation:
    driftTwo 42s linear infinite;
}

.crest-3 {
  width: 210px;

  top: 38%;
  left: 105%;

  animation:
    driftThree 42s linear infinite;
}

.crest-4 {
  width: 150px;

  top: 82%;
  left: 108%;

  animation:
    driftFour 42s linear infinite;
}

.crest-5 {
  width: 120px;

  top: 18%;
  left: 50%;

  animation:
    driftFive 42s linear infinite;
}

@keyframes driftOne {

  0% {
    transform:
      translate(0px, 0px)
      rotate(0deg)
      scale(1);
  }

  100% {
    transform:
      translate(72vw, 12vh)
      rotate(12deg)
      scale(1.12);
  }
}

@keyframes driftTwo {

  0% {
    transform:
      translate(0px, 0px)
      rotate(0deg)
      scale(1);
  }

  100% {
    transform:
      translate(88vw, -22vh)
      rotate(-16deg)
      scale(1.06);
  }
}

@keyframes driftThree {

  0% {
    transform:
      translate(0px, 0px)
      rotate(0deg)
      scale(1);
  }

  100% {
    transform:
      translate(-92vw, 16vh)
      rotate(18deg)
      scale(1.14);
  }
}

@keyframes driftFour {

  0% {
    transform:
      translate(0px, 0px)
      rotate(0deg)
      scale(1);
  }

  100% {
    transform:
      translate(-74vw, -28vh)
      rotate(-12deg)
      scale(1.1);
  }
}

@keyframes driftFive {

  0% {
    transform:
      translate(0px, 0px)
      rotate(0deg)
      scale(1);
  }

  100% {
    transform:
      translate(-32vw, 42vh)
      rotate(10deg)
      scale(1.08);
  }
}

.title-logos {
  display: flex;
  align-items: center;
  justify-content: center;

  gap: 3rem;
}

.title-logo {
  width: min(760px, 68vw);

  object-fit: contain;

  filter:
    drop-shadow(
      0 0 25px rgba(255,255,255,0.12)
    )
    drop-shadow(
      0 0 60px rgba(70,140,220,0.18)
    );

  animation:
    titleFloat 7s ease-in-out infinite;
}

.title-main {

  font-size:
    clamp(2.8rem, 5.2vw, 5.6rem);

  font-family: "Varsity", sans-serif;

  font-weight: normal;

  letter-spacing: 0.05em;

  text-transform: uppercase;

  text-align: center;

  line-height: 0.95;

  background:
  linear-gradient(
    180deg,
    #ffffff 0%,
    #f8f8f8 10%,
    #cfcfcf 22%,
    #7e7e7e 38%,
    #f5f5f5 52%,
    #ffffff 60%,
    #8a8a8a 78%,
    #dcdcdc 90%,
    #ffffff 100%
  );

background-size: 100% 240%;

background-clip: text;
-webkit-background-clip: text;

color: transparent;
-webkit-text-fill-color: transparent;

  text-shadow:
  0 3px 0 rgba(0,0,0,0.35),
  0 0 16px rgba(255,255,255,0.12),
  0 0 40px rgba(0,120,255,0.22);

  filter:
    drop-shadow(
      0 0 24px rgba(0,120,255,0.16)
    );

  animation:
    titleFloat 7s ease-in-out infinite;
}

.title-sub {
  font-family:
    var(--font-great-vibes);

  font-size:
    clamp(2.6rem, 4vw, 4.8rem);

  text-align: center;

  margin-top: -0.2rem;

  background:
    linear-gradient(
      180deg,
      #ffffff 0%,
      #fefefe 8%,
      #d9d9d9 18%,
      #7e7e7e 34%,
      #f8f8f8 48%,
      #ffffff 56%,
      #8f8f8f 70%,
      #d6d6d6 84%,
      #ffffff 100%
    );

  background-size: 100% 300%;

  background-clip: text;
  -webkit-background-clip: text;

  color: transparent;
  -webkit-text-fill-color: transparent;

  filter:
    drop-shadow(
      0 0 12px rgba(255,255,255,0.14)
    )
    drop-shadow(
      0 0 30px rgba(70,140,220,0.18)
    );

  animation:
    metallicShift 4.5s ease-in-out infinite;
}

.background-drift {
  position: absolute;
  inset: -12%;

  z-index: 1;

  background-image: url('/background.png');

  background-size: cover;
  background-position: center;

  opacity: 0.08;

  mix-blend-mode: screen;

  filter:
    blur(35px)
    saturate(1.4);

  animation:
    backgroundDrift 24s ease-in-out infinite alternate;

  pointer-events: none;
}

@keyframes backgroundDrift {

  0% {
    transform:
      scale(1.02)
      translateX(-12px)
      translateY(-8px);
  }

  100% {
    transform:
      scale(1.08)
      translateX(18px)
      translateY(10px);
  }
}

@keyframes titleAura {

  0% {
    transform:
      scale(1);
    opacity: 0.7;
  }

  50% {
    transform:
      scale(1.08);
    opacity: 1;
  }

  100% {
    transform:
      scale(1);
    opacity: 0.7;
  }
}

@keyframes titleFloat {

  0% {
    transform:
      translateY(0px);
  }

  50% {
    transform:
      translateY(-10px);
  }

  100% {
    transform:
      translateY(0px);
  }
}

@keyframes metallicShimmer {

  0% {
    filter:
      drop-shadow(
        0 0 18px rgba(255,255,255,0.08)
      )
      drop-shadow(
        0 0 35px rgba(70,140,220,0.18)
      );

    transform:
      translateY(0px);
  }

  50% {
    filter:
      drop-shadow(
        0 0 26px rgba(255,255,255,0.16)
      )
      drop-shadow(
        0 0 55px rgba(70,140,220,0.32)
      );

    transform:
      translateY(-2px);
  }

  100% {
    filter:
      drop-shadow(
        0 0 18px rgba(255,255,255,0.08)
      )
      drop-shadow(
        0 0 35px rgba(70,140,220,0.18)
      );

    transform:
      translateY(0px);
  }
}

@keyframes titleFade {

  0% {
    opacity: 0;
  }

  12% {
    opacity: 1;
  }

  88% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}

        .edge-trail {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 25;
        }

        .edge-trail::before {
          content: "";
          position: absolute;
          width: 240px;
          height: 8px;
          top: 0;
          left: -240px;
          border-radius: 999px;
          background:
            linear-gradient(
              90deg,
              transparent 0%,
              rgba(70,140,220,0.15) 8%,
              rgba(70,140,220,1) 30%,
              rgba(255,255,255,1) 50%,
              rgba(70,140,220,1) 70%,
              transparent 100%
            );

          opacity: calc(
            0.7 +
            (
              var(--audio-reactivity, 1) - 1
            ) * 0.55
          );

          box-shadow:
            0 0 calc(18px * var(--audio-reactivity, 1)) rgba(70,140,220,1),
            0 0 calc(40px * var(--audio-reactivity, 1)) rgba(70,140,220,1),
            0 0 calc(90px * var(--audio-reactivity, 1)) rgba(255,255,255,0.95),
            0 0 calc(160px * var(--audio-reactivity, 1)) rgba(70,140,220,0.9);

          transform:
            scale(
              calc(
                1 +
                (
                  var(--audio-reactivity, 1) - 1
                ) * 0.42
              )
            );

          animation:
            borderTrail 34s linear infinite;
        }

.corner-brand {
  position: absolute;

  left: 2.5rem;
  bottom: 2rem;

  z-index: 35;

  display: flex;
  align-items: center;
  gap: 1.2rem;

  opacity: 0.92;
}

.corner-brand-logo {
  width: 112px;

  height: 112px;

  object-fit: contain;

  filter:
    drop-shadow(0 0 12px rgba(255,255,255,0.12))
    drop-shadow(0 0 34px rgba(70,140,220,0.24));
}

.corner-brand-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.corner-brand-main {

  font-family: "Varsity", sans-serif;

  font-size: 2.2rem;

  font-weight: normal;

  letter-spacing: 0.04em;

  line-height: 0.92;

  text-transform: uppercase;

   background:
    linear-gradient(
      180deg,
      #ffffff 0%,
      #f8f8f8 10%,
      #cfcfcf 22%,
      #7e7e7e 38%,
      #f5f5f5 52%,
      #ffffff 60%,
      #8a8a8a 78%,
      #dcdcdc 90%,
      #ffffff 100%
    );

  background-size: 100% 240%;

  background-clip: text;
  -webkit-background-clip: text;

  color: transparent;
  -webkit-text-fill-color: transparent;

  text-shadow:
    0 2px 0 rgba(0,0,0,0.35),
    0 0 12px rgba(255,255,255,0.08),
    0 0 26px rgba(0,120,255,0.14);

  filter:
    drop-shadow(
      0 0 18px rgba(0,120,255,0.12)
    );
}

.corner-brand-sub {

  font-family:
    var(--font-great-vibes);

  font-size: 2.1rem;

  margin-top: -0.1rem;

  background:
    linear-gradient(
      180deg,
      #ffffff 0%,
      #fefefe 8%,
      #d9d9d9 18%,
      #7e7e7e 34%,
      #f8f8f8 48%,
      #ffffff 56%,
      #8f8f8f 70%,
      #d6d6d6 84%,
      #ffffff 100%
    );

  background-size: 100% 300%;

  background-clip: text;
  -webkit-background-clip: text;

  color: transparent;
  -webkit-text-fill-color: transparent;

  filter:
    drop-shadow(
      0 0 10px rgba(255,255,255,0.08)
    )
    drop-shadow(
      0 0 22px rgba(70,140,220,0.14)
    );
}

.liquid-lights {
  position: absolute;
  inset: -20%;

  z-index: 5;

  background:

  radial-gradient(
    ellipse at 18% 28%,
    rgba(0,140,255,0.42),
    transparent 42%
  ),

  radial-gradient(
    ellipse at 82% 18%,
    rgba(120,190,255,0.18),
    transparent 38%
  ),

  radial-gradient(
    ellipse at 72% 82%,
    rgba(0,110,255,0.18),
    transparent 44%
  ),

  radial-gradient(
    ellipse at 28% 76%,
    rgba(50,150,255,0.22),
    transparent 40%
  );

  filter:
    blur(140px)
    saturate(1.35);

  opacity:
    calc(
      0.72 +
      (
        var(--audio-reactivity, 1) - 1
      ) * 1.5
    );

  mix-blend-mode: screen;

  animation:
    liquidFlow 20s ease-in-out infinite alternate;

  transform:
    scale(
      calc(
        1 +
        (
          var(--audio-reactivity, 1) - 1
        ) * 0.08
      )
    );

  pointer-events: none;
}

.presentation-glow {
  z-index: 1;
  position: absolute;

  inset: 0;

  background:
    radial-gradient(
      circle at center,
      rgba(70,140,220,0.12) 0%,
      rgba(0,0,0,0) 70%
    );

  filter: blur(90px);

  transform:
  scale(
    calc(
      1 +
      (
        var(--audio-reactivity, 1) - 1
      ) * 0.22
    )
  );

  animation:
    presentationPulse 10s ease-in-out infinite;

  pointer-events: none;
}

.photo-finish {
  position: absolute;
  inset: 0;

  pointer-events: none;

  background:
    linear-gradient(
      to bottom,
      rgba(255,255,255,0.03),
      rgba(0,0,0,0.08)
    );

  mix-blend-mode: soft-light;
}

.stage-haze {
  position: absolute;
  inset: 0;

  z-index: 10;

  background:
    radial-gradient(
      circle at 50% 70%,
      rgba(255,255,255,0.08),
      transparent 60%
    );

  mix-blend-mode: screen;

  filter: blur(60px);

  opacity: 0.42;

  pointer-events: none;
}

.confetti-burst {
  position: absolute;
  inset: 0;

  overflow: hidden;

  pointer-events: none;

  z-index: 12;

  opacity: 0;
}

.confetti-burst::before,
.confetti-burst::after {
  content: "";

  position: absolute;
  inset: -20%;

  background-image:

    radial-gradient(
      rgba(255,255,255,1) 5px,
      transparent 5px
    ),

    radial-gradient(
      rgba(120,190,255,1) 6px,
      transparent 6px
    ),

    radial-gradient(
      rgba(210,230,255,0.95) 4px,
      transparent 4px
    );

  background-size:
    80px 80px,
    110px 110px,
    65px 65px;

  mix-blend-mode: screen;

  opacity: 0;
}

.live-indicator {

  display: flex;
  align-items: center;
  justify-content: center;

  gap: 0.7rem;

  margin-bottom: 1rem;

  font-size: 0.9rem;

  font-weight: 800;

  letter-spacing: 0.18em;

  color:
    rgba(255,255,255,0.85);
}

.live-dot {

  width: 12px;
  height: 12px;

  border-radius: 999px;

  background: #42a5ff;

  box-shadow:
    0 0 14px rgba(0,120,255,0.9);

  animation:
    livePulse 1.6s ease-in-out infinite;
}

@keyframes livePulse {

  0% {
    transform: scale(1);
    opacity: 1;
  }

  50% {
    transform: scale(1.35);
    opacity: 0.6;
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

.confetti-active::before {
  animation:
    confettiLeft 1400ms ease-out forwards;
}

.confetti-active::after {
  animation:
    confettiRight 1600ms ease-out forwards;
}

@keyframes confettiLeft {

  0% {
    opacity: 0;
    transform:
      translate(-8%, 12%)
      scale(0.8)
      rotate(0deg);
  }

  15% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform:
      translate(-26%, -18%)
      scale(1.18)
      rotate(-8deg);
  }
}

@keyframes confettiRight {

  0% {
    opacity: 0;
    transform:
      translate(8%, 10%)
      scale(0.85)
      rotate(0deg);
  }

  15% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform:
      translate(24%, -22%)
      scale(1.22)
      rotate(10deg);
  }
}

.fullbleed-backdrop {
  position: absolute;
  inset: 0;

  background:
    radial-gradient(
      circle at center,
      rgba(255,255,255,0.06) 0%,
      rgba(0,70,160,0.12) 28%,
      rgba(0,0,0,0.82) 100%
    );

  backdrop-filter:
    blur(60px)
    brightness(0.65);

  transform: scale(1.12);
}

.message-card::before {
  content: "";
  position: absolute;
  inset: 0;

  background:
    linear-gradient(
      120deg,
      transparent 0%,
      rgba(255,255,255,0.08) 45%,
      transparent 100%
    );

  transform: translateX(-140%);

  animation:
    messageSweep 6s linear infinite;
}

.message-card::after {
  content: "";

  position: absolute;
  inset: 0;

  background:
    url("/logo7.png")
    center center / 240px no-repeat;

  opacity: 0.015;

  pointer-events: none;

  filter:
    grayscale(1)
    brightness(2);

  mix-blend-mode: screen;
}

.photo-finish {
  position: absolute;
  inset: 0;

  pointer-events: none;

  background:

    radial-gradient(
      circle at center,
      rgba(255,255,255,0.04) 0%,
      rgba(255,255,255,0.015) 30%,
      rgba(0,0,0,0.18) 100%
    ),

    linear-gradient(
      to bottom,
      rgba(255,255,255,0.04) 0%,
      rgba(255,255,255,0) 20%,
      rgba(0,0,0,0.12) 100%
    );

  mix-blend-mode: soft-light;
}

@keyframes messageSweep {
  to {
    transform: translateX(140%);
  }
}

.ambient-drift {
  position: absolute;
  inset: -20%;

  z-index: 2;

  pointer-events: none;

  background:

    radial-gradient(
      circle at 20% 30%,
      rgba(70,140,220,0.12),
      transparent 28%
    ),

    radial-gradient(
      circle at 75% 25%,
      rgba(255,255,255,0.06),
      transparent 24%
    ),

    radial-gradient(
      circle at 60% 80%,
      rgba(28,110,190,0.1),
      transparent 30%
    );

  filter: blur(120px);

  mix-blend-mode: screen;

  opacity:
    calc(
      0.55 +
      (
        var(--audio-reactivity, 1) - 1
      ) * 0.9
    );

  animation:
    ambientDrift 28s ease-in-out infinite alternate;
}

.title-logo-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

.milestone-popup {

  position: absolute;
  
  top: 2.5rem;
  left: 50%;
  
  transform: translateX(-50%);
  
  z-index: 80;
  
  padding:
    1rem 2rem;
    
  border-radius: 999px;
  
  background:
    rgba(8, 16,32,0.72);
    
  backdrop-filter: blur(20px);
  
  border:
    1px solid rgba(120,190,255,0.22)
    
  box-shadow:
    0 0 40px rgba(0,120,255,0.18)
    
  animation:
    milestoneFloat 4s ease-in-out infinite;
}

.milestone-number {

  font-size: 2.4rem;

  font-weight: 900;

  line-height: 1;

  text-align: center;

  color: white;
}

.milestone-text {

  margin-top: 0.25rem;

  font-size: 0.9rem;

  letter-spacing: 0.22em;

  text-align: center;

  color:
    rgba(255,255,255,0.7);
}

@keyframes milestoneFloat {

  0% {
    transform:
      translateX(-50%)
      translateY(0px);
  }

  50% {
    transform:
      translateX(-50%)
      translateY(-4px);
  }

  100% {
    transform:
      translateX(-50%)
      translateY(0px);
  }
}

@keyframes ambientDrift {

  0% {
    transform:
      translateX(-40px)
      translateY(-20px)
      scale(1);
  }

  100% {
    transform:
      translateX(50px)
      translateY(30px)
      scale(1.12);
  }
}

@keyframes liquidFlow {

  0% {
    transform:
      rotate(0deg)
      scale(1)
      translateX(0px)
      translateY(0px);
  }

  100% {
    transform:
      rotate(8deg)
      scale(1.15)
      translateX(-40px)
      translateY(-30px);
  }
}

@keyframes floatBlue {
  0% {
    transform:
      translate(0px, 0px)
      scale(1);
  }

  100% {
    transform:
      translate(80px, 40px)
      scale(1.18);
  }
}

@keyframes floatPink {
  0% {
    transform:
      translate(0px, 0px)
      scale(1);
  }

  100% {
    transform:
      translate(-60px, 80px)
      scale(1.12);
  }
}

@keyframes floatCyan {
  0% {
    transform:
      translate(0px, 0px)
      scale(1);
  }

  100% {
    transform:
      translate(-100px, -60px)
      scale(1.2);
  }
}

@keyframes floatPurple {
  0% {
    transform:
      translate(0px, 0px)
      scale(1);
  }

  100% {
    transform:
      translate(70px, -50px)
      scale(1.16);
  }
}

@keyframes presentationPulse {
  0% {
    transform: scale(1);
    opacity: 0.45;
  }

  50% {
    transform: scale(1.08);
    opacity: 1;
  }

  100% {
    transform: scale(1);
    opacity: 0.45;
  }
}

@keyframes kenburns {
          0% {
            transform: scale(1);
          }

          100% {
            transform: scale(1.06);
          }
        }

        @keyframes fullBleedMove {

  0% {
    transform: scale(1);
  }

  100% {
    transform: scale(1.08);
  }
}

.animate-fullBleedMove {
  animation:
    fullBleedMove 14s ease-in-out forwards;
}

@keyframes metallicShift {

  0% {
    background-position: 0% 0%;
  }

  50% {
    background-position: 0% 100%;
  }

  100% {
    background-position: 0% 0%;
  }
}

        @keyframes polaroidSlam {

          0% {
            transform:
              translateY(-900px)
              rotate(-16deg)
              scale(1.4);

            opacity: 0;
          }

          45% {
            transform:
              translateY(40px)
              rotate(5deg)
              scale(0.92);

            opacity: 1;
          }

          65% {
            transform:
              translateY(-18px)
              rotate(-3deg)
              scale(1.03);
          }

          82% {
            transform:
              translateY(8px)
              rotate(1deg)
              scale(0.99);
          }

          100% {
            transform:
              translateY(0px)
              rotate(0deg)
              scale(1);
          }
        }
        
        @keyframes polaroidIdle {

  0% {
    transform:
      translateY(0px)
      rotate(-1deg)
      scale(1);
  }

  25% {
    transform:
      translateY(-8px)
      rotate(1deg)
      scale(1.01);
  }

  50% {
    transform:
      translateY(4px)
      rotate(-0.5deg)
      scale(1.015);
  }

  75% {
    transform:
      translateY(-6px)
      rotate(0.5deg)
      scale(1.005);
  }

  100% {
    transform:
      translateY(0px)
      rotate(-1deg)
      scale(1);
  }
}

        .animate-polaroidSlam {
          animation:
            polaroidSlam 950ms cubic-bezier(0.12, 0.85, 0.22, 1),
            polaroidIdle 7s ease-in-out infinite 1s;
        }

        .animate-kenburns {
          animation: kenburns 12s ease-in-out forwards;
        }

      .thank-you-overlay {

  position: absolute;
  inset: 0;

  z-index: 120;

  display: flex;
  align-items: center;
  justify-content: center;

  background:
    radial-gradient(
      circle at center,
      rgba(0,80,180,0.18),
      rgba(0,0,0,0.82)
    );

  backdrop-filter: blur(20px);
  
  animation:
    thankYouFade 9s ease forwards;
}

.thank-you-inner {
  text-align: center;
}

.thank-you-title {

  font-family: "Varsity", sans-serif;

  font-size:
    clamp(4rem, 9vw, 8rem);

  letter-spacing: 0.08em;

  background:
    linear-gradient(
      180deg,
      #ffffff 0%,
      #9ed6ff 45%,
      #ffffff 100%
    );

  background-clip: text;
  -webkit-background-clip: text;

  color: transparent;
  -webkit-text-fill-color: transparent;

  filter:
    drop-shadow(
      0 0 28px rgba(0,120,255,0.35)
    );
}

.thank-you-text {

margin-top: 2rem;

  font-size:
    clamp(1.5rem, 3vw, 2.6rem);

  line-height: 1.6;

  color:
    rgba(255,255,255,0.92);

  text-shadow:
    0 0 20px rgba(255,255,255,0.12);
}

@keyframes thankYouFade {

  0% {
    opacity: 0;
  }

   12% {
    opacity: 1;
  }

  88% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}

      `}</style>
    </main>
  );
}

