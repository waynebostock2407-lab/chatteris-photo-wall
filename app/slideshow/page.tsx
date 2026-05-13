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

  const [showPresentationIntro, setShowPresentationIntro] =
    useState(false);

  const [showMessages, setShowMessages] =
    useState(false);

  const [fade, setFade] = useState(true);

  const [flash, setFlash] = useState(false);

  const [isFullscreen, setIsFullscreen] =
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

  /* INTRO */

  useEffect(() => {
    const introTimer = setTimeout(() => {

      setShowIntro(false);

      setShowPresentationIntro(true);

      setTimeout(() => {
        setShowPresentationIntro(false);
      }, 30000);

    }, INTRO_DURATION);

    return () => clearTimeout(introTimer);

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
      showPresentationIntro ||
      showMessages
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
    showPresentationIntro,
    showMessages,
  ]);

  /* MESSAGE LOOP */

  useEffect(() => {
    if (messages.length === 0) return;

    const cycle = setInterval(() => {
      setShowMessages(true);
      setCurrentMessageIndex(0);
    }, 300000);

    return () => clearInterval(cycle);
  }, [messages]);

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

      <div className="edge-trail" />

      <div className="absolute inset-0 bg-[#02112B]/4 z-[4]" />

      <div
        className={`absolute inset-0 z-30 pointer-events-none transition-opacity duration-150 ${
          flash ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.55) 35%, rgba(255,255,255,0) 100%)",
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

      <div className="absolute inset-0 flex items-center justify-center px-12 pb-40 z-20">

        {showIntro ? (
          <></>

        ) : showPresentationIntro ? (

          <div className="presentation-intro">

            <div className="presentation-lights" />

            <div className="presentation-glow" />

            <img
              src="/logo.png"
              className="presentation-logo"
            />

            <div className="presentation-title">
              CELEBRATING THE 25/26 SEASON
            </div>

            <div className="presentation-subtitle">
              ONE CLUB • ONE FAMILY • THE LILIES
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
          width: 240px;
          height: 8px;
          top: 0;
          left: -240px;
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
            0 0 calc(18px * var(--audio-reactivity, 1)) rgba(120,190,255,1),
            0 0 calc(40px * var(--audio-reactivity, 1)) rgba(120,190,255,1),
            0 0 calc(90px * var(--audio-reactivity, 1)) rgba(255,255,255,0.95),
            0 0 calc(160px * var(--audio-reactivity, 1)) rgba(120,190,255,0.9);

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

        .presentation-intro {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 20;
          text-align: center;
          padding-bottom: 120px;
        }

        .presentation-lights {
          position: absolute;
          inset: -20%;

          background:
            conic-gradient(
              from 0deg at 50% 100%,
              transparent 0deg,
              rgba(120,190,255,0.14) 18deg,
              transparent 36deg,
              rgba(255,255,255,0.08) 52deg,
              transparent 70deg,
              rgba(120,190,255,0.12) 90deg,
              transparent 120deg,
              rgba(120,190,255,0.14) 150deg,
              transparent 180deg,
              rgba(255,255,255,0.08) 220deg,
              transparent 260deg,
              rgba(120,190,255,0.12) 300deg,
              transparent 360deg
            );

          filter: blur(12px);

          opacity: 0.9;

          animation:
            lightSweep 18s linear infinite;
        }

        .presentation-glow {
          position: absolute;
          width: 900px;
          height: 900px;
          border-radius: 999px;
          background:
            radial-gradient(
              circle,
              rgba(120,190,255,0.22) 0%,
              transparent 70%
            );
          filter: blur(80px);
          animation:
            presentationPulse 5s ease-in-out infinite;
        }

        .presentation-logo {
          width: 420px;

          position: relative;
          z-index: 10;

          tranform-style: preserve-3d;

          animation:
            logoSpin360 18s linear infinite;

          filter:
            drop-shadow(
              0 0 30px rgba(120,190,255,0.95)
            )
            drop-shadow(
              0 0 80px rgba(120,190,255,0.7)
            )
            drop-shadow(
              0 0 160px rgba(120,190,255,0.45)
            );
        }

        .presentation-title {
          margin-top: 55px;
          font-size: clamp(3rem, 5vw, 6rem);
          font-weight: 900;
          letter-spacing: 0.04em;
          line-height: 1;
          color: white;
          text-shadow:
            0 0 30px rgba(120,190,255,0.9);
          animation:
            fadeUp 1.5s ease forwards;
        }

        .presentation-subtitle {
          margin-top: 40px;

          font-size: clamp(2.2rem, 3.4vw, 4.8rem);

          font-weight: 900;

          letter-spacing: 0.18em;

          line-height: 1.3;

          text-transform: uppercase;

          color: rgba(255,255,255,0.98);

          text-shadow:
            0 0 10px rgba(120,190,255,0.65);
            0 0 40px rgba(120,190,255,0.35);

          animation:
            fadeUp 2s ease forwards;
        }

        .presentation-script {
          margin-top: 42px;
      
          font-size:
            clamp(3rem, 5vw, 6rem);
          line-height: 1;
          color: white;
          opacity: 0.96;
          text-shadow:
            0 0 35px rgba(255,255,255,0.4);
          animation:
            fadeUp 2.5s ease forwards;
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

        @keyframes presentationPulse {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }

          50% {
            transform: scale(1.08);
            opacity: 1;
          }

          100% {
            transform: scale(1);
            opacity: 0.5;
          }
        }

        @keyframes logoFloat {
          0% {
            transform: translateY(0px);
          }

          50% {
            transform: translateY(-12px);
          }

          100% {
            transform: translateY(0px);
          }
        }

        @keyframes logoSpin360 {
          0% {
            transform:
              perspective(1800px)
              rotateY(0deg)
              rotateX(8deg)
              translateY(0px)
              scale(1);
          }

          25% {
            transform:
              perspective(1800px)
              rotateY(90deg)
              rotateX(-2deg)
              translateY(-10px)
              scale(1.04);
          }

          50% {
            transform:
              perspective(1800px)
              rotateY(180deg)
              rotateX(8deg)
              translateY(0px)
              scale(1);
          }

          75% {
            transform:
              perspective(1800px)
              rotateY(270deg)
              rotateX(-2deg)
              translateY(-10px)
              scale(1.04);
          }

          100% {
            transform:
              perspective(1800px)
              rotateY(360deg)
              rotateX(8deg)
              translateY(0px)
              scale(1);
          }
        }

          50% {
            transform:
              perspective(1200px)
              rotateY(8deg)
              rotateX(-2deg);
          }

          100% {
            transform:
              perspective(1200px)
              rotateY(-8deg)
              rotateX(2deg);
          }
        }

        @keyframes lightSweep {
          0% {
            transform: rotate(0deg) scale(1.1);
          }

          100% {
            transform: rotate(360deg) scale(1.1);
          }
        }

        @keyframes fadeUp {
          0% {
            opacity: 0;
            transform: translateY(25px);
          }

          100% {
            opacity: 1;
            transform: translateY(0px);
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
