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

          let bassSum = 0;

          for (let i = 0; i < 18; i++) {
            bassSum += dataArray[i];
          }

          const bassAverage = bassSum / 18;

          const kickStrength = Math.max(
            0,
            bassAverage - 110
          );

          const targetLevel =
            1 + kickStrength / 4.5;

          smoothedLevel = Math.max(
            targetLevel,
            smoothedLevel * 0.88
          );

          smoothedLevel = Math.min(
            smoothedLevel,
            10
          );

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

  /* FIRESTORE PHOTOS */

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

  /* FIRESTORE MESSAGES */

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

  /* PRELOAD */

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

  const currentPhoto =
    photos[currentPhotoIndex];

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
      </div>

      {/* OVERLAY */}

      <div className="absolute inset-0 bg-[#02112B]/10 z-[4]" />

      {/* REACTIVE BORDER */}

      <div className="edge-glow absolute inset-0 z-[999]" />

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

      {/* CONTENT */}

      <div className="absolute inset-0 flex items-center justify-center px-12 pb-40 z-20">

        {showPartyMode ? (
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
            </div>
          </div>
        ) : null}

      </div>

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

        .edge-glow {
          position: absolute;
          inset: 0;

          pointer-events: none;

          overflow: hidden;
        }

        .edge-glow::after {
          content: "";

          position: absolute;
          inset: 0;

          box-shadow:
            inset 0 0
              calc(
                70px *
                var(--audio-reactivity, 1)
              )
              rgba(120,190,255,0.28),

            inset 0 0
              calc(
                180px *
                var(--audio-reactivity, 1)
              )
              rgba(255,255,255,0.12);

          transition:
            box-shadow 0.06s linear;
        }

        .edge-glow::before {
          content: "";

          position: absolute;

          width: 30%;
          height: 12px;

          top: 0;
          left: -30%;

          border-radius: 999px;

          background:
            linear-gradient(
              90deg,
              transparent 0%,
              rgba(120,190,255,0.25) 15%,
              rgba(120,190,255,1) 35%,
              rgba(255,255,255,1) 50%,
              rgba(120,190,255,1) 65%,
              transparent 100%
            );

          box-shadow:
            0 0 25px rgba(120,190,255,1),

            0 0
              calc(
                120px *
                var(--audio-reactivity, 1)
              )
              rgba(120,190,255,1),

            0 0
              calc(
                260px *
                var(--audio-reactivity, 1)
              )
              rgba(255,255,255,1);

          transform:
            scaleY(
              calc(
                1 +
                (
                  var(--audio-reactivity, 1) - 1
                ) * 2.5
              )
            );

          transition:
            transform 0.05s linear,
            box-shadow 0.05s linear;

          animation:
            borderTrail 34s linear infinite;
        }

        @keyframes borderTrail {

          0% {
            top: 0;
            left: -30%;
            width: 30%;
            height: 12px;
          }

          24% {
            top: 0;
            left: 100%;
            width: 30%;
            height: 12px;
          }

          25% {
            top: -30%;
            left: calc(100% - 12px);
            width: 12px;
            height: 30%;
          }

          49% {
            top: 100%;
            left: calc(100% - 12px);
            width: 12px;
            height: 30%;
          }

          50% {
            top: calc(100% - 12px);
            left: 100%;
            width: 30%;
            height: 12px;
          }

          74% {
            top: calc(100% - 12px);
            left: -30%;
            width: 30%;
            height: 12px;
          }

          75% {
            top: 100%;
            left: 0;
            width: 12px;
            height: 30%;
          }

          99% {
            top: -30%;
            left: 0;
            width: 12px;
            height: 30%;
          }

          100% {
            top: 0;
            left: -30%;
            width: 30%;
            height: 12px;
          }
        }

      `}</style>

    </main>
  );
}


