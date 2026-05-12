"use client";

import Image from "next/image";
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

  /* -------------------------------------------------- */
  /* FULLSCREEN */
  /* -------------------------------------------------- */

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

  /* -------------------------------------------------- */
  /* WAKE LOCK */
  /* -------------------------------------------------- */

  useEffect(() => {
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLock = await (
            navigator as any
          ).wakeLock.request("screen");
        }
      } catch (err) {
        console.error("Wake lock failed:", err);
      }
    };

    requestWakeLock();

    return () => {
      wakeLock?.release?.();
    };
  }, []);

  /* -------------------------------------------------- */
  /* INTRO */
  /* -------------------------------------------------- */

  useEffect(() => {
    const initialIntroTimeout = setTimeout(() => {
      setShowIntro(false);
    }, INTRO_DURATION);

    const recurringIntroInterval = setInterval(() => {
      setShowIntro(true);

      setTimeout(() => {
        setShowIntro(false);
      }, 20000);
    }, INTRO_REPEAT_INTERVAL);

    return () => {
      clearTimeout(initialIntroTimeout);
      clearInterval(recurringIntroInterval);
    };
  }, []);

  /* -------------------------------------------------- */
  /* FIRESTORE - PHOTOS */
  /* -------------------------------------------------- */

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

  /* -------------------------------------------------- */
  /* FIRESTORE - MESSAGES */
  /* -------------------------------------------------- */

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

  /* -------------------------------------------------- */
  /* IMAGE PRELOAD */
  /* -------------------------------------------------- */

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

  /* -------------------------------------------------- */
  /* PHOTO SLIDESHOW */
  /* -------------------------------------------------- */

  useEffect(() => {
    if (
      photos.length === 0 ||
      showIntro ||
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
        setCurrentPhotoIndex((prev) =>
          prev === photos.length - 1
            ? 0
            : prev + 1
        );

        setFade(true);
      }, PHOTO_FADE_DURATION);
    }, PHOTO_DURATION);

    return () => {
      if (photoIntervalRef.current) {
        clearInterval(photoIntervalRef.current);
      }
    };
  }, [photos, showIntro, showMessages]);

  /* -------------------------------------------------- */
  /* MESSAGE MODE TRIGGER */
  /* -------------------------------------------------- */

  useEffect(() => {
    if (messages.length === 0) return;

    const interval = setInterval(() => {
      setCurrentMessageIndex(0);
      setShowMessages(true);
    }, 300000);

    return () => clearInterval(interval);
  }, [messages]);

  /* -------------------------------------------------- */
  /* MESSAGE LOOP */
  /* -------------------------------------------------- */

  useEffect(() => {
    if (
      !showMessages ||
      messages.length === 0
    ) {
      return;
    }

    const currentMessage =
      messages[currentMessageIndex];

    const duration = Math.min(
      Math.max(
        MESSAGE_MIN_DURATION,
        (currentMessage?.message?.length || 0) *
          60
      ),
      MESSAGE_MAX_DURATION
    );

    messageIntervalRef.current = setInterval(() => {
      setFade(false);

      setTimeout(() => {
        if (
          currentMessageIndex >=
          messages.length - 1
        ) {
          setCurrentMessageIndex(0);
          setShowMessages(false);
        } else {
          setCurrentMessageIndex(
            (prev) => prev + 1
          );
        }

        setFade(true);
      }, 350);
    }, duration);

    return () => {
      if (messageIntervalRef.current) {
        clearInterval(
          messageIntervalRef.current
        );
      }
    };
  }, [
    showMessages,
    currentMessageIndex,
    messages,
  ]);

  /* -------------------------------------------------- */
  /* CURRENT DATA */
  /* -------------------------------------------------- */

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

  /* -------------------------------------------------- */
  /* RENDER */
  /* -------------------------------------------------- */

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black text-white">

      {/* BACKGROUND */}
      <div
        className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-[2000ms]"
        style={{
          backgroundImage: showIntro
            ? "url('/presentation-stage.jpg')"
            : "url('/blank-presentation-stage.jpg')",
        }}
      />

      {/* ORBS */}
      <div className="ambient-orbs absolute inset-0 z-[2]">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      {/* EDGE GLOW */}
      <div className="edge-glow absolute inset-0 z-[3]" />

      {/* OVERLAY */}
      <div className="absolute inset-0 bg-[#02112B]/20 z-[4]" />

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

      {/* FULLSCREEN BUTTON */}
      {!isFullscreen && (
        <button
          aria-label="Enter fullscreen"
          onClick={toggleFullscreen}
          className="fixed top-6 right-6 z-[9999] bg-black/40 hover:bg-black/60 backdrop-blur-xl border border-white/20 text-white px-6 py-3 rounded-2xl text-lg font-bold tracking-wide transition-all duration-300"
        >
          ⛶ FULL SCREEN
        </button>
      )}

      {/* MAIN CONTENT */}
      <div className="absolute inset-0 flex items-center justify-center px-12 pb-40 z-20">

        {/* INTRO */}
        {showIntro ? (
          <div className="text-center animate-fadeIn">

            <div
              className="text-white font-black uppercase tracking-[0.12em]"
              style={{
                fontSize:
                  "clamp(3rem, 5vw, 6rem)",
              }}
            >
              Chatteris Town FC
            </div>

            <div
              className="text-white/90 mt-4"
              style={{
                fontFamily:
                  "var(--font-great-vibes)",
                fontSize:
                  "clamp(3rem, 5vw, 6rem)",
              }}
            >
              Presentation Day
            </div>
          </div>

        ) : showMessages &&
          currentMessage ? (

          /* MESSAGE VIEW */
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

          /* EMPTY */
          <div className="text-center">
            <div className="text-6xl font-black">
              Awaiting Photos
            </div>
          </div>

        ) : currentPhoto ? (

          /* PHOTO VIEW */
          <div
            key={currentPhoto.id}
            className={`transition-all duration-[900ms] ease-out ${
              fade
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-[1.03] translate-y-4 blur-[2px]"
            }`}
          >
            <div
              className={`inline-flex flex-col items-center bg-white p-5 pb-16 rounded-[0.8rem] shadow-[0_18px_70px_rgba(0,0,0,0.5)] transition-transform duration-700 ${polaroidStyle}`}
            >
              <div className="relative overflow-hidden bg-[#f5f5f5] max-w-[74vw] max-h-[58vh] rounded-[0.3rem]">

                <Image
                  src={currentPhoto.imageUrl}
                  alt="Presentation photo"
                  width={1600}
                  height={1200}
                  priority
                  className="block max-w-[74vw] max-h-[58vh] object-contain rounded-[0.25rem] animate-kenburns"
                />

              </div>

              <div className="mt-7 flex items-center justify-center gap-5">

                <Image
                  src="/logo.png"
                  alt=""
                  width={56}
                  height={56}
                  className="opacity-90"
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

                <Image
                  src="/logo.png"
                  alt=""
                  width={56}
                  height={56}
                  className="opacity-90"
                />

              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* BRANDING */}
      {!showIntro && (
        <div className="absolute bottom-6 left-8 z-30 flex items-end gap-6">

          <Image
            src="/logo.png"
            alt="Club logo"
            width={128}
            height={128}
            className="object-contain"
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
            <br />& MESSAGES
          </div>

          <Image
            src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://chatteris-photo-wall.vercel.app"
            alt="QR Code"
            width={180}
            height={180}
            className="rounded-xl"
          />

        </div>
      </div>

      {/* STYLES */}
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
              rgba(255, 255, 255, 0.95) 0%,
              rgba(180, 220, 255, 0.65) 18%,
              rgba(120, 180, 255, 0.22) 42%,
              rgba(255, 255, 255, 0) 72%
            );

          mix-blend-mode: screen;

          filter: blur(22px);

          opacity: 0.9;

          animation: floatOrb linear infinite;
        }

        .ambient-orbs span:nth-child(1) {
          width: 340px;
          height: 340px;
          left: -8%;
          top: 8%;
          animation-duration: 28s;
        }

        .ambient-orbs span:nth-child(2) {
          width: 340px;
          height: 340px;
          left: 16%;
          top: 72%;
          animation-duration: 34s;
        }

        .ambient-orbs span:nth-child(3) {
          width: 340px;
          height: 340px;
          right: 4%;
          top: 10%;
          animation-duration: 40s;
        }

        .ambient-orbs span:nth-child(4) {
          width: 340px;
          height: 340px;
          right: -6%;
          top: 60%;
          animation-duration: 30s;
        }

        .ambient-orbs span:nth-child(5) {
          width: 340px;
          height: 340px;
          left: 42%;
          top: 2%;
          animation-duration: 24s;
        }

        .ambient-orbs span:nth-child(6) {
          width: 340px;
          height: 340px;
          left: 46%;
          bottom: -10%;
          animation-duration: 38s;
        }

        .edge-glow {
          position: absolute;
          inset: -8%;

          background:
            radial-gradient(
              circle at top,
              rgba(120, 180, 255, 0.16),
              transparent 35%
            ),
            radial-gradient(
              circle at bottom,
              rgba(255, 255, 255, 0.08),
              transparent 40%
            ),
            radial-gradient(
              circle at left,
              rgba(90, 150, 255, 0.12),
              transparent 35%
            ),
            radial-gradient(
              circle at right,
              rgba(180, 220, 255, 0.1),
              transparent 35%
            );

          filter: blur(60px);

          animation:
            edgePulse 8s ease-in-out infinite;
        }

        @keyframes edgePulse {
          0% {
            opacity: 0.55;
            transform: scale(1);
          }

          50% {
            opacity: 0.9;
            transform: scale(1.02);
          }

          100% {
            opacity: 0.55;
            transform: scale(1);
          }
        }

        @keyframes floatOrb {
          0% {
            transform: translate3d(
                0px,
                0px,
                0
              )
              scale(1);
          }

          25% {
            transform: translate3d(
                30px,
                -40px,
                0
              )
              scale(1.08);
          }

          50% {
            transform: translate3d(
                -20px,
                -70px,
                0
              )
              scale(0.96);
          }

          75% {
            transform: translate3d(
                40px,
                -30px,
                0
              )
              scale(1.04);
          }

          100% {
            transform: translate3d(
                0px,
                0px,
                0
              )
              scale(1);
          }
        }

        @keyframes kenburns {
          0% {
            transform: scale(1)
              translate(0, 0);
          }

          50% {
            transform: scale(1.04)
              translate(-0.5%, -0.5%);
          }

          100% {
            transform: scale(1.08)
              translate(0.5%, 0.5%);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 1.2s ease;
        }

        .animate-kenburns {
          animation:
            kenburns 12s ease-in-out forwards;
        }
      `}</style>
    </main>
  );
}