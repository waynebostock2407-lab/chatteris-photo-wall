"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
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

const INTRO_DURATION = 60000;
const INTRO_REPEAT_INTERVAL = 600000;

const PHOTO_DURATION = 8000;
const PHOTO_FADE_DURATION = 650;

export default function SlideshowPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);

  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  const [showIntro, setShowIntro] = useState(true);
  const [showMessages, setShowMessages] = useState(false);
  const [showPartyMode, setShowPartyMode] = useState(false);

  const [fade, setFade] = useState(true);
  const [flash, setFlash] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const audioLevelRef = useRef(1);

  /* FULLSCREEN */

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error(err);
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
          audioContext.createMediaStreamSource(stream);

        microphone.connect(analyser);

        const dataArray = new Uint8Array(
          analyser.frequencyBinCount
        );

        let smoothedLevel = 1;

        const updateAudio = () => {
          analyser.getByteFrequencyData(dataArray);

          const bass = dataArray.slice(0, 18);

          let bassSum = 0;

          for (let i = 0; i < bass.length; i++) {
            bassSum += bass[i];
          }

          const bassAverage = bassSum / bass.length;

          const targetLevel = Math.min(
            2,
            1 + bassAverage / 120
          );

          smoothedLevel =
            smoothedLevel * 0.82 +
            targetLevel * 0.18;

          audioLevelRef.current = smoothedLevel;

          document.documentElement.style.setProperty(
            "--audio-reactivity",
            `${smoothedLevel}`
          );

          requestAnimationFrame(updateAudio);
        };

        updateAudio();
      } catch (err) {
        console.error(err);
      }
    };

    setupAudio();
  }, []);

  /* INTRO */

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, INTRO_DURATION);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const introCycle = setInterval(() => {
      setShowIntro(true);

      setTimeout(() => {
        setShowIntro(false);
      }, 20000);
    }, INTRO_REPEAT_INTERVAL);

    return () => clearInterval(introCycle);
  }, []);

  /* PARTY MODE */

  useEffect(() => {
    const runPartySequence = () => {
      setShowIntro(true);

      setTimeout(() => {
        setShowIntro(false);

        setShowPartyMode(true);

        setTimeout(() => {
          setShowPartyMode(false);
        }, 60000);
      }, 20000);
    };

    const firstSequence = setTimeout(() => {
      setShowPartyMode(true);

      setTimeout(() => {
        setShowPartyMode(false);
      }, 60000);
    }, INTRO_DURATION);

    const partyInterval = setInterval(() => {
      runPartySequence();
    }, 600000);

    return () => {
      clearTimeout(firstSequence);
      clearInterval(partyInterval);
    };
  }, []);

  /* FIRESTORE */

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

  /* PHOTO LOOP */

  useEffect(() => {
    if (
      photos.length === 0 ||
      showIntro ||
      showMessages ||
      showPartyMode
    ) {
      return;
    }

    const interval = setInterval(() => {
      setFlash(true);

      setTimeout(() => {
        setFlash(false);
      }, 120);

      setFade(false);

      setTimeout(() => {
        setCurrentPhotoIndex((prev) => {
          if (photos.length <= 1) return prev;

          let next = prev;

          while (next === prev) {
            next = Math.floor(
              Math.random() * photos.length
            );
          }

          return next;
        });

        setFade(true);
      }, PHOTO_FADE_DURATION);
    }, PHOTO_DURATION);

    return () => clearInterval(interval);
  }, [
    photos,
    showIntro,
    showMessages,
    showPartyMode,
  ]);

  const currentPhoto = photos[currentPhotoIndex];
  const currentMessage = messages[currentMessageIndex];

  const polaroidStyle = useMemo(() => {
    const styles = [
      "rotate-[-2deg] translate-y-1",
      "rotate-[1.8deg] -translate-y-1",
      "rotate-[-1deg] translate-y-2",
      "rotate-[2.4deg]",
      "rotate-[-2.5deg]",
      "rotate-[1deg] translate-y-1",
    ];

    return styles[
      currentPhotoIndex % styles.length
    ];
  }, [currentPhotoIndex]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black text-white">

      {/* BACKGROUND */}

      {showIntro ? (
        <div
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{
            backgroundImage:
              "url('/presentation-stage.jpg')",
          }}
        />
      ) : (
        <div
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{
            backgroundImage:
              "url('/blank-presentation-stage.jpg')",
          }}
        />
      )}

      {/* TRAIL */}

      <div className="edge-trail" />

      {/* FLASH */}

      <div
        className={`absolute inset-0 z-30 pointer-events-none transition-opacity duration-150 ${
          flash ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.55) 35%, rgba(255,255,255,0) 100%)",
        }}
      />

      {/* FULLSCREEN */}

      {!isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="fixed top-6 right-6 z-[9999] bg-black/40 hover:bg-black/60 backdrop-blur-xl border border-white/20 text-white px-6 py-3 rounded-2xl text-lg font-bold tracking-wide transition-all duration-300"
        >
          ⛶ FULL SCREEN
        </button>
      )}

      {/* CONTENT */}

      <div className="absolute inset-0 flex items-center justify-center px-12 pb-40 z-20">

        {showIntro ? (
          <></>
        ) : showPartyMode ? (

          <div className="party-mode">

            <div className="equaliser">
              {[...Array(48)].map((_, i) => (
                <div
                  key={i}
                  className="eq-bar"
                  style={{
                    animationDelay: `${i * 0.04}s`,
                  }}
                />
              ))}
            </div>

            <div className="party-center">
              <img
                src="/logo.png"
                className="party-logo"
              />
            </div>

          </div>

        ) : currentPhoto ? (

          <div
            key={currentPhoto.id}
            className={`transition-all duration-[900ms] ease-out ${
              fade
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-[1.03] translate-y-4 blur-[2px]"
            }`}
          >

            <div
              className={`inline-flex flex-col items-center bg-white p-5 pb-16 rounded-[0.8rem] shadow-[0_18px_70px_rgba(0,0,0,0.5)] transition-transform duration-700 animate-polaroidFloat ${polaroidStyle}`}
            >

              <div className="relative overflow-hidden bg-[#f5f5f5] max-w-[74vw] max-h-[58vh] rounded-[0.3rem]">

                <img
                  src={currentPhoto.imageUrl}
                  alt="Presentation photo"
                  className="block max-w-[74vw] max-h-[58vh] object-contain rounded-[0.25rem] animate-kenburns"
                />

              </div>

            <div className="mt-7 flex items-center justify-center gap-5">

              <img
                src="/logo.png"
                alt="Club logo"
                className="w-14 h-14 object-contain opacity-90"
              />

              <div
                style={{
                  fontFamily:
                    "var(--font-great-vibes)",
                }}
                className="text-[#222] text-[3.2rem] leading-none"
              >
                Memories
              </div>

              <img
                src="/logo.png"
                alt="Club logo"
                className="w-14 h-14 object-contain opacity-90"
              />

            </div>
            </div>
          </div>

        ) : null}
      </div>

      {/* BRANDING */}

      {!showIntro && (
        <div className="absolute bottom-6 left-8 z-30 flex items-end gap-6">

          <img
            src="/logo.png"
            alt="Club logo"
            className="w-32 h-32 object-contain"
          />

          <div className="leading-none">

            <div
              className="text-white font-black uppercase tracking-wide"
              style={{
                fontSize:
                  "clamp(2rem, 3vw, 3.5rem)",
              }}
            >
              Chatteris Town FC
            </div>

            <div
              className="text-slate-100 mt-1"
              style={{
                  fontFamily:
                    "var(--font-great-vibes)",
                fontSize:
                  "clamp(2.3rem, 3vw, 4rem)",
              }}
            >
              Presentation Day
            </div>

          </div>
        </div>
      )}

      {/* QR */}

      <div className="absolute bottom-8 right-8 z-30">

        <div className="bg-white/92 backdrop-blur-xl rounded-[2rem] p-5 shadow-[0_10px_40px_rgba(0,0,0,0.35)] border border-white/40">

          <div className="text-center text-[#0A1E3D] font-black text-lg tracking-wide leading-tight mb-4">
            ADD PHOTOS
            <br />
            & MESSAGES
          </div>

          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://chatteris-photo-wall.vercel.app"
            alt="QR Code"
            className="rounded-xl w-[180px] h-[180px]"
          />

        </div>
      </div>

      <style jsx>{`

        .edge-trail {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 25;
        }

        .edge-trail::before {
          content: "";

          position: absolute;

          width: 24%;
          height: 8px;

          top: 0;
          left: -24%;

          border-radius: 999px;

          background:
            linear-gradient(
              90deg,
              transparent 0%,
            rgba(120,190,255,0.15) 8%,
            rgba(120,190,255,1) 30%,
            rgba(255,255,255,1) 50%,
            rgba(120,190,255,1) 70%,
              transparent 100%
            );

          opacity: calc(
            0.7 +
            (
              var(--audio-reactivity, 1) - 1
            ) * 0.55
          );

          box-shadow:
            0 0
              calc(
                18px *
                var(--audio-reactivity, 1)
              )
            rgba(120,190,255,1),

            0 0
              calc(
                40px *
                var(--audio-reactivity, 1)
              )
            rgba(120,190,255,1),

            0 0
              calc(
                90px *
                var(--audio-reactivity, 1)
              )
            rgba(255,255,255,0.95),

            0 0
              calc(
                160px *
                var(--audio-reactivity, 1)
              )
              rgba(120,190,255,0.9);

          transform:
            scale(
              calc(
                1 +
                (
                  var(--audio-reactivity, 1) - 1
                ) * 0.42
              )
            );

          filter:
            brightness(
              calc(
                1 +
                (
                  var(--audio-reactivity, 1) - 1
                ) * 1.6
              )
            );

          transition:
            transform 0.06s linear,
            filter 0.06s linear,
            opacity 0.06s linear,
            box-shadow 0.06s linear;

          animation:
            borderTrail 34s linear infinite;
        }

        .party-mode {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .party-center {
          position: relative;
          
          z-index: 40;
          
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .equaliser {
          position: absolute;
          inset: 0;

          display: flex;
          align-items: flex-end;
          justify-content: center;
          
          gap: 10px;
          
          padding-bottom: 120px;
          
          z-index: 30;
        }

        .eq-bar {
          width: 14px;

          min-height: 40px

          height: calc(
            40px +
            (
              var(--audio-reactivity, 1) * 55px
            )
          );
          
          border-radius: 999px;

          background:
            linear-gradient(
              to top,
            rgba(120,190,255,0.2),
            rgba(120,190,255,1),
            rgba(255,255,255,1)
          );

          opacity: 0.95;

          box-shadow:
            0 0 20px rgba(120,190,255,0.8),
            0 0 50px rgba(120,190,255,0.7),

          transition:
            height 0.04s linear,
            box-shadow 0.08s linear;
        }

        .party-logo {
          width: 240px;

          position: relative;
          z-index: 20;

          transform:
            scale(
              calc(
                1 +
                (
                  var(--audio-reactivity, 1) - 1
                ) * 0.22
              )
            );

          filter:
            drop-shadow(
              0 0 
              calc(
                35px *
                var(--audio-reactivity, 1)
              ) 
            rgba(120,190,255,1)
            )
            hue-rotate(
              calc(
                (
                  var(--audio-reactivity, 1) - 1
                ) * 160deg
              )
            );

          transition:
            transform 0.08s linear,
            filter 0.08s linear;
        }

        @keyframes borderTrail {
          0% {
            top: 0;
            left: -240px;
            width: 240px;
            height: 8px;
          }

          24% {
            top: 0;
            left: calc(100% + 240px);
            width: 240px;
            height: 8px;
          }

          25% {
            top: -240px;
            left: calc(100% - 8px);
            width: 8px;
            height: 240px;
          }

          49% {
            top: calc(100% + 240px);
            left: calc(100% - 8px);
            width: 8px;
            height: 240px;
          }

          50% {
            top: calc(100% - 8px);
            left: calc(100% + 240px);
            width: 240px;
            height: 8px;
          }

          74% {
            top: calc(100% - 8px);
            left: -240px;
            width: 240px;
            height: 8px;
          }

          75% {
            top: calc(100% + 240px);
            left: 0;
            width: 8px;
            height: 240px;
          }

          99% {
            top: -240px;
            left: 0;
            width: 8px;
            height: 240px;
          }

          100% {
            top: 0;
            left: -240px;
            width: 240px;
            height: 8px;
          }
        }

        @keyframes eqDance {
          from {
            transform: scaleY(0.35);
          }

          to {
            transform: scaleY(1);
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

        @keyframes polaroidFloat {
          0% {
            transform: translateY(0px);
          }

          50% {
            transform: translateY(-8px);
          }

          100% {
            transform: translateY(0px);
          }
        }

        .animate-kenburns {
          animation: kenburns 12s ease-in-out forwards;
        }

        .animate-polaroidFloat {
          animation: polaroidFloat 7s ease-in-out infinite;
        }

      `}</style>
    </main>
  );
}



