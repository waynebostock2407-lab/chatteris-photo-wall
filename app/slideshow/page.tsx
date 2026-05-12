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

const MESSAGE_MIN_DURATION = 9000;
const MESSAGE_MAX_DURATION = 30000;

export default function SlideshowPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);

  const [messages, setMessages] = useState<
    GuestbookMessage[]
  >([]);

  const [currentPhotoIndex, setCurrentPhotoIndex] =
    useState(0);

  const [currentMessageIndex, setCurrentMessageIndex] =
    useState(0);

  const [showIntro, setShowIntro] = useState(true);

  const [showMessages, setShowMessages] =
    useState(false);

  const [showPartyMode, setShowPartyMode] =
    useState(false);

  const [fade, setFade] = useState(true);

  const [flash, setFlash] = useState(false);

  const [isFullscreen, setIsFullscreen] =
    useState(false);

  const loadedImages = useRef(new Set<string>());

  const photoIntervalRef =
    useRef<NodeJS.Timeout | null>(null);

  const messageIntervalRef =
    useRef<NodeJS.Timeout | null>(null);

  const flashTimeoutRef =
    useRef<NodeJS.Timeout | null>(null);

  const fadeTimeoutRef =
    useRef<NodeJS.Timeout | null>(null);

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

          let sum = 0;

          for (
            let i = 0;
            i < dataArray.length;
            i++
          ) {
            sum += dataArray[i];
          }

          const average =
            sum / dataArray.length;

          const bassFrequencies = dataArray.slice(0, 18);

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

          const targetLevel = Math.min(
            3.2,
            1 + bassAverage / 55
          );

          smoothedLevel =
            smoothedLevel * 0.82 +
            targetLevel * 0.18;

          audioLevelRef.current =
            smoothedLevel;

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
    const partyInterval = setInterval(() => {
      setShowPartyMode(true);

      setTimeout(() => {
        setShowPartyMode(false);
      }, 60000);
    }, 600000);

    return () => clearInterval(partyInterval);
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
      photos.length === 0 ||
      showIntro ||
      showMessages ||
      showPartyMode
    ) {
      return;
    }

    photoIntervalRef.current = setInterval(() => {
      setFlash(true);

      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }

      flashTimeoutRef.current = setTimeout(() => {
        setFlash(false);
      }, 100);

      setFade(false);

      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }

      fadeTimeoutRef.current = setTimeout(() => {
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
    }, PHOTO_DURATION);

    return () => {
      if (photoIntervalRef.current) {
        clearInterval(photoIntervalRef.current);
      }
    };
  }, [
    photos,
    showIntro,
    showMessages,
    showPartyMode,
  ]);

  /* MESSAGE LOOP */

  useEffect(() => {
    if (messages.length === 0) return;

    const cycle = setInterval(() => {
      if (!showPartyMode) {
        setShowMessages(true);
        setCurrentMessageIndex(0);
      }
    }, 300000);

    return () => clearInterval(cycle);
  }, [messages, showPartyMode]);

  useEffect(() => {
    if (
      !showMessages ||
      messages.length === 0
    ) {
      return;
    }

    const interval = setInterval(() => {
      setFade(false);

      setTimeout(() => {
        if (
          currentMessageIndex >=
          messages.length - 1
        ) {
          setShowMessages(false);
          setCurrentMessageIndex(0);
        } else {
          setCurrentMessageIndex(
            (prev) => prev + 1
          );
        }

        setFade(true);
      }, 350);
    }, Math.min(
      Math.max(
        MESSAGE_MIN_DURATION,
        messages[currentMessageIndex]
          ?.message.length * 60
      ),
      MESSAGE_MAX_DURATION
    ));

    return () => clearInterval(interval);
  }, [
    showMessages,
    currentMessageIndex,
    messages,
  ]);

  const currentPhoto =
    photos[currentPhotoIndex];

  const currentMessage =
    messages[currentMessageIndex];

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

      {/* ORBS */}
      <div className="ambient-orbs absolute inset-0 z-[2]">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      {/* GLOW */}
      <div className="edge-glow absolute inset-0 z-[3]" />

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-[#02112B]/4 z-[4]" />

      {/* FLASH */}
      <div
        className={`absolute inset-0 z-30 pointer-events-none transition-opacity duration-150 ${
          flash
            ? "opacity-100"
            : "opacity-0"
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

      {/* MAIN CONTENT */}
      <div className="absolute inset-0 flex items-center justify-center px-12 pb-40 z-20">

        {showIntro ? (
          <></>
        ) : showPartyMode ? (

          <div className="party-mode">

            <div className="party-bg-pulse" />

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

              <div className="party-title">
                END OF SEASON
              </div>

              <div className="party-subtitle">
                PRESENTATION DAY
              </div>

            </div>

          </div>

        ) : showMessages &&
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

            <div className="relative overflow-hidden bg-white/10 border border-white/10 backdrop-blur-2xl rounded-[3rem] px-14 py-12 shadow-[0_0_80px_rgba(0,0,0,0.45)]">

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

          <div
            key={currentPhoto.id}
            className={`transition-all duration-[900ms] ease-out ${
              fade
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-[1.03] translate-y-4 blur-[2px]"
            }`}
          >
            <div className="photo-shadow" />

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
                  alt=""
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
                  alt=""
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
        .ambient-orbs {
          overflow: hidden;
          pointer-events: none;
        }

        .ambient-orbs span {
          position: absolute;
          border-radius: 999px;

          background:
            radial-gradient(
              circle,
              rgba(120,190,255,0.45) 0%,
              rgba(120,190,255,0.16) 28%,
              rgba(120,190,255,0) 70%
            );

          mix-blend-mode: screen;

          filter: blur(90px);

          opacity: 0.45;

          animation: floatOrb linear infinite;
        }

        .ambient-orbs span:nth-child(1) {
          width: 900px;
          height: 900px;
          left: -28%;
          top: -18%;
          animation-duration: 32s;
        }

        .ambient-orbs span:nth-child(2) {
          width: 800px;
          height: 800px;
          left: -22%;
          bottom: -30%;
          animation-duration: 38s;
        }

        .ambient-orbs span:nth-child(3) {
          width: 900px;
          height: 900px;
          right: -28%;
          top: -14%;
          animation-duration: 42s;
        }

        .ambient-orbs span:nth-child(4) {
          width: 850px;
          height: 850px;
          right: -24%;
          bottom: -24%;
          animation-duration: 34s;
        }

        .ambient-orbs span:nth-child(5) {
          width: 600px;
          height: 600px;
          left: 38%;
          top: -40%;
          animation-duration: 28s;
        }

        .ambient-orbs span:nth-child(6) {
          width: 700px;
          height: 700px;
          left: 42%;
          bottom: -45%;
          animation-duration: 36s;
        }

        .edge-glow {
          position: absolute;
          inset: 0;

          z-index: 15;

          pointer-events: none;
        }

        .edge-glow::before {
          content: "";

          position: absolute;

          width: 26%;
          height: 6px;

          top: 0;
          left: -26%;

          border-radius: 999px;

          background:
            linear-gradient(
              90deg,
              transparent 0%,
              rgba(120,190,255,0.2) 10%,
              rgba(120,190,255,1) 35%,
              rgba(255,255,255,1) 50%,
              rgba(120,190,255,1) 65%,
              transparent 100%
            );

          box-shadow:
            0 0 18px rgba(120,190,255,1),

            0 0
              calc(
                40px *
                var(--audio-reactivity, 1)
              )
              rgba(120,190,255,1),

            0 0
              calc(
                100px *
                var(--audio-reactivity, 1)
              )
              rgba(255,255,255,0.7);

          transform:
            scaleY(
              calc(
                1 +
                (
                  var(--audio-reactivity, 1) - 1
                ) * 0.4
              )
            );

          animation:
            borderTrail 34s linear infinite;
        }

        .photo-shadow {
          position: absolute;

          width: 70%;
          height: 40px;

          bottom: -22px;
          left: 50%;

          transform: translateX(-50%);

          background:
            radial-gradient(
              ellipse,
              rgba(0,0,0,0.38) 0%,
              rgba(0,0,0,0) 72%
            );

          filter: blur(18px);

          z-index: -1;
        }

        .party-mode {
          position: absolute;
          inset: 0;

          display: flex;
          align-items: center;
          justify-content: center;

          overflow: hidden;
        }

        .party-bg-pulse {
          position: absolute;
          inset: 0;

          background:
            radial-gradient(
              circle,
              rgba(120,190,255,0.18),
              transparent 70%
            );

          animation:
            partyPulse 3s ease-in-out infinite;
        }

        .equaliser {
          position: absolute;
          inset: 0;

          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 10px;

          padding: 0 120px 220px;

          opacity: 0.82;
        }

        .eq-bar {
          width: 18px;

          height: 110px;

          border-radius: 999px;

          background:
            linear-gradient(
              to top,
              rgba(120,190,255,0.2),
              rgba(120,190,255,1),
              rgba(255,255,255,1)
            );

          animation:
            eqDance 0.45s ease-in-out infinite alternate;

          box-shadow:
            0 0 20px rgba(120,190,255,0.7);
        }

        .party-center {
          position: relative;
          z-index: 20;

          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .party-logo {
          width: 240px;

          transform:
            scale(
              calc(
                1 +
                (
                  var(--audio-reactivity, 1) - 1
                ) * 0.18
              )
            );

          filter:
            drop-shadow(
              0 0
              calc(
                18px *
                var(--audio-reactivity, 1)
              )
              rgba(120,190,255,1)
            )
            hue-rotate(
              calc(
                (
                  var(--audio-reactivity, 1) - 1
                ) * 120deg
              )
            );

          transition:
            transform 0.08s linear,
            filter 0.08s linear;
        }

        .party-title {
          margin-top: 34px;

          font-size: 5rem;
          font-weight: 900;

          letter-spacing: 0.08em;
        }

        .party-subtitle {
          margin-top: 16px;

          font-size: 2rem;

          opacity: 0.78;

          letter-spacing: 0.3em;
        }

        @keyframes borderTrail {
          0% {
            top: 0;
            left: -25%;
            width: 22%;
            height: 4px;
          }

          24% {
            top: 0;
            left: 100%;
            width: 22%;
            height: 4px;
          }

          25% {
            top: -25%;
            left: calc(100% - 4px);
            width: 4px;
            height: 22%;
          }

          49% {
            top: 100%;
            left: calc(100% - 4px);
            width: 4px;
            height: 22%;
          }

          50% {
            top: calc(100% - 4px);
            left: 100%;
            width: 22%;
            height: 4px;
          }

          74% {
            top: calc(100% - 4px);
            left: -25%;
            width: 22%;
            height: 4px;
          }

          75% {
            top: 100%;
            left: 0;
            width: 4px;
            height: 22%;
          }

          99% {
            top: -25%;
            left: 0;
            width: 4px;
            height: 22%;
          }

          100% {
            top: 0;
            left: -25%;
            width: 22%;
            height: 4px;
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

        @keyframes logoPulse {
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

        @keyframes partyPulse {
          0% {
            opacity: 0.4;
            transform: scale(1);
          }

          50% {
            opacity: 1;
            transform: scale(1.06);
          }

          100% {
            opacity: 0.4;
            transform: scale(1);
          }
        }

        @keyframes floatOrb {
          0% {
            transform:
              translate3d(0px, 0px, 0)
              scale(1);
          }

          25% {
            transform:
              translate3d(
                30px,
                -40px,
                0
              )
              scale(1.08);
          }

          50% {
            transform:
              translate3d(
                -20px,
                -70px,
                0
              )
              scale(0.96);
          }

          75% {
            transform:
              translate3d(
                40px,
                -30px,
                0
              )
              scale(1.04);
          }

          100% {
            transform:
              translate3d(0px, 0px, 0)
              scale(1);
          }
        }

        @keyframes kenburns {
          0% {
            transform:
              scale(1)
              translate(0, 0);
          }

          50% {
            transform:
              scale(1.04)
              translate(-0.5%, -0.5%);
          }

          100% {
            transform:
              scale(1.08)
              translate(0.5%, 0.5%);
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

        @keyframes backgroundDrift {
          0% {
            transform:
              scale(1)
              translateX(0px);
          }

          50% {
            transform:
              scale(1.03)
              translateX(-8px);
          }

          100% {
            transform:
              scale(1)
              translateX(0px);
          }
        }

        .animate-kenburns {
          animation:
            kenburns 12s ease-in-out forwards;
        }

        .animate-polaroidFloat {
          animation:
            polaroidFloat 7s ease-in-out infinite;
        }

        .animate-backgroundDrift {
          animation:
            backgroundDrift 30s ease-in-out infinite;
        }
      `}</style>
    </main>
  );
}
