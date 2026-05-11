"use client";

import { useEffect, useState } from "react";
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
}

interface GuestbookMessage {
  id: string;
  name: string;
  message: string;
  approved: boolean;
}

export default function SlideshowPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [messageIndex, setMessageIndex] = useState(0);

  const [fade, setFade] = useState(true);
  const [flash, setFlash] = useState(false);

  const [showMessages, setShowMessages] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
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
      setShowIntro(false);
    }, 60000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const introCycle = setInterval(() => {
      setShowIntro(true);

      setTimeout(() => {
        setShowIntro(false);
      }, 20000);
    }, 600000);

    return () => clearInterval(introCycle);
  }, []);

  const polaroidStyles = [
    "rotate-[-2deg] translate-y-1",
    "rotate-[1.8deg] -translate-y-1",
    "rotate-[-1deg] translate-y-2",
    "rotate-[2.4deg]",
    "rotate-[-2.5deg]",
    "rotate-[1deg] translate-y-1",
  ];

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
        .filter((photo: any) => photo.approved);

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
          ...(doc.data() as Omit<GuestbookMessage, "id">),
        }))
        .filter((message: any) => message.approved);

      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (photos.length === 0) return;

    let interval: NodeJS.Timeout;

    if (!showMessages && !showIntro) {
      interval = setInterval(() => {
        setFlash(true);

        setTimeout(() => {
          setFlash(false);
        }, 90);

        setFade(false);

        setTimeout(() => {
          setCurrentIndex((prev) =>
            prev === photos.length - 1 ? 0 : prev + 1
          );

          setFade(true);
        }, 650);
      }, 6500);
    }

    return () => clearInterval(interval);
  }, [photos, showMessages, showIntro]);

  useEffect(() => {
    if (messages.length === 0) return;

    const cycle = setInterval(() => {
      setShowMessages(true);
      setMessageIndex(0);
    }, 300000);

    return () => clearInterval(cycle);
  }, [messages]);

  useEffect(() => {
    if (!showMessages) return;

    const interval = setInterval(() => {
      setFade(false);

      setTimeout(() => {
        if (messageIndex >= messages.length - 1) {
          setShowMessages(false);
          setMessageIndex(0);
        } else {
          setMessageIndex((prev) => prev + 1);
        }

        setFade(true);
      }, 350);
    }, Math.min(
      Math.max(
        9000,
        messages[messageIndex]?.message.length * 60
      ),
      30000
    ));

    return () => clearInterval(interval);
  }, [showMessages, messageIndex, messages]);

  return (
    <main className="relative w-screen h-screen overflow-hidden text-white">

      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/blank-presentation-stage.jpg')",
        }}
      />

      <div className="absolute inset-0 bg-[#02112B]/35" />

      <div className="ambient-orbs slideshow-orbs z-10">
        <span />
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

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

      <div className="absolute inset-0 flex items-center justify-center px-16 pb-44 z-20">

        {showIntro ? (

          <div className="text-center">

            <div className="flex items-center justify-center gap-16 mb-12 flex-wrap">

              <img
                src="/logo 5.png"
                alt="Young Lilies"
                className="silver-logo w-[18vw] max-w-[220px] min-w-[120px] h-auto object-contain"
              />

              <img
                src="/logo 6.png"
                alt="The Lilies"
                className="silver-logo w-[18vw] max-w-[220px] min-w-[120px] h-auto object-contain"
              />

            </div>

            <h1 className="silver-title text-center">
              CHATTERIS TOWN FC
            </h1>

            <div
              style={{
                fontFamily: "var(--font-great-vibes)",
              }}
              className="silver-script"
            >
              Presentation Day
            </div>

          </div>

        ) : showMessages && messages[messageIndex] ? (

          <div className="w-full flex justify-center items-center px-12">

            <div className="w-full max-w-5xl text-center flex flex-col items-center">

              <div className="mb-6 flex-shrink-0">
                <div className="text-6xl font-extrabold text-white tracking-wide">
                  Messages for Vicky
                </div>
              </div>

              <div
                className={`
                  relative
                  overflow-hidden
                  bg-white/10
                  border
                  border-white/10
                  backdrop-blur-xl
                  rounded-[3rem]
                  px-16
                  py-12
                  shadow-[0_0_80px_rgba(0,0,0,0.35)]
                  w-full
                  max-w-5xl
                  min-h-[42vh]
                  max-h-[70vh]
                  flex
                  flex-col
                  justify-between
                `}
              >

                <div
                  style={{
                    fontFamily: "'Caveat', cursive",
                  }}
                  className={`
                    relative
                    z-10
                    text-white
                    font-semibold
                    tracking-[0.01em]
                    text-left
                    whitespace-pre-wrap
                    break-words
                    leading-[1.28]
                    flex-1
                    flex
                    items-center

                    ${
                      messages[messageIndex].message.length < 120
                        ? "text-[3rem]"
                        : messages[messageIndex].message.length < 220
                        ? "text-[2.45rem]"
                        : messages[messageIndex].message.length < 350
                        ? "text-[2rem]"
                        : messages[messageIndex].message.length < 500
                        ? "text-[1.65rem]"
                        : messages[messageIndex].message.length < 700
                        ? "text-[1.35rem]"
                        : "text-[1.1rem]"
                    }
                  `}
                >
                  {messages[messageIndex].message}
                </div>

                <div className="relative z-10 mt-8 flex justify-end">
                  <div className="text-right">
                    <div className="text-white/60 text-sm uppercase tracking-[0.35em] mb-1">
                      Shared by
                    </div>

                    <div
                      style={{
                        fontFamily: "'Caveat', cursive",
                      }}
                      className="text-white font-bold leading-none text-[2.2rem]"
                    >
                      {messages[messageIndex].name}
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>

        ) : photos.length === 0 ? (

          <div className="text-center">
            <div className="text-6xl font-bold text-white mb-6">
              Awaiting Photos
            </div>
          </div>

        ) : (

          <div
            key={photos[currentIndex]?.id}
            className={`transition-all duration-[1400ms] ease-out ${
              fade
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-[1.03] translate-y-4 blur-[2px]"
            }`}
          >

            <div
              className={`
                inline-flex
                flex-col
                items-center
                bg-white
                p-5
                pb-16
                rounded-[0.6rem]
                shadow-[0_18px_50px_rgba(0,0,0,0.38)]
                max-w-[82vw]
                transition-transform
                duration-700
                ${
                  polaroidStyles[
                    currentIndex % polaroidStyles.length
                  ]
                }
              `}
            >

              <div className="
                flex
                items-center
                justify-center
                overflow-hidden
                bg-[#f4f4f4]
                max-w-[74vw]
                max-h-[58vh]
              ">

                <img
                  src={photos[currentIndex].imageUrl}
                  alt="Slideshow"
                  className="
                    block
                    max-w-[74vw]
                    max-h-[58vh]
                    object-contain
                    rounded-[0.25rem]
                  "
                />

              </div>

              <div className="mt-7 flex items-center justify-center gap-5">

                <img
                  src="/logo.png"
                  alt="Young Lilies"
                  className="w-14 h-14 object-contain opacity-90"
                />

                <div
                  style={{
                    fontFamily: "var(--font-great-vibes)",
                  }}
                  className="text-[#222] text-[3.2rem] leading-none"
                >
                  Memories
                </div>

                <img
                  src="/logo.png"
                  alt="The Lilies"
                  className="w-14 h-14 object-contain opacity-90"
                />

              </div>

            </div>

          </div>

        )}

      </div>

      {!showIntro && (
        <div className="absolute bottom-6 left-8 z-30 flex items-end gap-6">

          <img
            src="/logo.png"
            alt="Club Logo"
            className="w-32 h-32 object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.25)]"
          />

          <div className="leading-none">

            <div
              className="text-white font-black tracking-wide uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.15)]"
              style={{
                fontSize: "clamp(2rem, 3vw, 3.4rem)",
              }}
            >
              Chatteris Town FC
            </div>

            <div
              className="text-slate-100 mt-1 drop-shadow-[0_0_10px_rgba(255,255,255,0.15)]"
              style={{
                fontFamily: "var(--font-great-vibes)",
                fontSize: "clamp(2.3rem, 3vw, 4rem)",
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

        .silver-title {
          font-size: clamp(3.5rem, 8vw, 7rem);
          font-weight: 900;
          letter-spacing: 0.08em;
          line-height: 1;
          text-transform: uppercase;

          background:
            linear-gradient(
              to bottom,
              #ffffff 0%,
              #f8fafc 18%,
              #d1d5db 38%,
              #ffffff 52%,
              #9ca3af 72%,
              #f8fafc 100%
            );

          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;

          text-shadow:
            0 0 12px rgba(255,255,255,0.35),
            0 0 28px rgba(255,255,255,0.18);
        }

        .silver-script {
          margin-top: 2rem;
          font-size: clamp(2.5rem, 6vw, 5.2rem);
          color: white;

          text-shadow:
            0 0 10px rgba(255,255,255,0.35),
            0 0 22px rgba(255,255,255,0.18);
        }

        .silver-logo {
          filter:
            brightness(1.05)
            contrast(1.08)
            saturate(0.9)
            drop-shadow(0 0 8px rgba(255,255,255,0.22));

          opacity: 0.96;

          animation: logoPulse 6s ease-in-out infinite;
        }

        .ambient-orbs {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        .ambient-orbs span {
          position: absolute;
          border-radius: 999px;
          background:
            radial-gradient(
              circle,
              rgba(255,255,255,0.28) 0%,
              rgba(255,255,255,0.12) 45%,
              rgba(255,255,255,0) 75%
            );

          filter: blur(18px);
          animation: floatOrb linear infinite;
        }

        .ambient-orbs span:nth-child(1) {
          width: 420px;
          height: 420px;
          left: -8%;
          top: 8%;
          animation-duration: 28s;
        }

        .ambient-orbs span:nth-child(2) {
          width: 260px;
          height: 260px;
          left: 16%;
          top: 72%;
          animation-duration: 34s;
        }

        .ambient-orbs span:nth-child(3) {
          width: 520px;
          height: 520px;
          right: 4%;
          top: 10%;
          animation-duration: 40s;
        }

        .ambient-orbs span:nth-child(4) {
          width: 320px;
          height: 320px;
          right: -6%;
          top: 60%;
          animation-duration: 30s;
        }

        .ambient-orbs span:nth-child(5) {
          width: 220px;
          height: 220px;
          left: 42%;
          top: 2%;
          animation-duration: 24s;
        }

        .ambient-orbs span:nth-child(6) {
          width: 420px;
          height: 420px;
          left: 46%;
          bottom: -10%;
          animation-duration: 38s;
        }

        @keyframes logoPulse {
          0% {
            transform: scale(1);
          }

          50% {
            transform: scale(1.03);
          }

          100% {
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
              translate3d(30px, -40px, 0)
              scale(1.08);
          }

          50% {
            transform:
              translate3d(-20px, -70px, 0)
              scale(0.96);
          }

          75% {
            transform:
              translate3d(40px, -30px, 0)
              scale(1.04);
          }

          100% {
            transform:
              translate3d(0px, 0px, 0)
              scale(1);
          }
        }

      `}</style>

    </main>
  );
}
