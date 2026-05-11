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

  /* Fullscreen */
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  /* Detect fullscreen */
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

  /* Initial Intro - 60 Seconds */
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 60000);

    return () => clearTimeout(timer);
  }, []);

  /* Intro Every 10 Minutes - 20 Seconds */
  useEffect(() => {
    const introCycle = setInterval(() => {

      setShowIntro(true);

      setTimeout(() => {
        setShowIntro(false);
      }, 20000);

    }, 600000);

    return () => clearInterval(introCycle);
  }, []);

  /* Polaroid Styles */
  const polaroidStyles = [
    "rotate-[-2deg] translate-y-1",
    "rotate-[1.8deg] -translate-y-1",
    "rotate-[-1deg] translate-y-2",
    "rotate-[2.4deg]",
    "rotate-[-2.5deg]",
    "rotate-[1deg] translate-y-1",
  ];

  /* Photos */
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

  /* Messages */
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

  /* Photo Loop */
  useEffect(() => {
    if (photos.length === 0) return;

    let interval: NodeJS.Timeout;

    if (!showMessages && !showIntro) {

      interval = setInterval(() => {

        setFlash(true);

        setTimeout(() => {
          setFlash(false);
        }, 180);

        setFade(false);

        setTimeout(() => {

          setCurrentIndex((prev) =>
            prev === photos.length - 1 ? 0 : prev + 1
          );

          setFade(true);

        }, 450);

      }, 6500);

    }

    return () => clearInterval(interval);

  }, [photos, showMessages, showIntro]);

  /* Trigger Messages Every 5 Minutes */
  useEffect(() => {

    if (messages.length === 0) return;

    const cycle = setInterval(() => {

      setShowMessages(true);
      setMessageIndex(0);

    }, 300000);

    return () => clearInterval(cycle);

  }, [messages]);

  /* Message Loop */
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

      {/* SKY BLUE BACKGROUND */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#63B8FF] via-[#2F7FD8] to-[#0A3F91]"></div>

      {/* Animated Glow */}
      <div className="absolute inset-0 overflow-hidden">

        <div className="absolute top-[-300px] left-1/2 -translate-x-1/2 w-[1400px] h-[900px] bg-white/20 rounded-full blur-[180px] animate-pulse"></div>

        <div className="absolute bottom-[-350px] left-1/2 -translate-x-1/2 w-[1200px] h-[700px] bg-sky-300/20 rounded-full blur-[160px] animate-pulse"></div>

      </div>

      {/* Floating Particles */}
      <div className="particles"></div>

      {/* Camera Flash */}
      <div
        className={`absolute inset-0 z-30 pointer-events-none transition-opacity duration-200 ${
          flash ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.75) 35%, rgba(255,255,255,0) 100%)",
        }}
      ></div>

      {/* Fullscreen Button */}
      {!isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="absolute top-6 right-6 z-40 bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/10 text-white px-5 py-3 rounded-2xl text-lg font-semibold transition shadow-2xl"
        >
          ⛶ Full Screen
        </button>
      )}

      {/* MAIN CONTENT */}
      <div className="absolute inset-0 flex items-center justify-center px-16 pb-44 z-20">

        {/* INTRO SCREEN */}
        {showIntro ? (

          <div className="absolute inset-0 flex flex-col items-center justify-center animate-[slowZoom_20s_ease-in-out_infinite]">

            {/* Spotlight Beams */}
            <div className="spotlight spotlight-left"></div>
            <div className="spotlight spotlight-right"></div>

            {/* Silver Rings */}
            <div className="absolute w-[900px] h-[900px] border border-white/10 rounded-full animate-ping opacity-20"></div>

            <div className="absolute w-[700px] h-[700px] border border-sky-100/20 rounded-full animate-pulse"></div>

            {/* Sparkles */}
            <div className="sparkle sparkle-1"></div>
            <div className="sparkle sparkle-2"></div>
            <div className="sparkle sparkle-3"></div>
            <div className="sparkle sparkle-4"></div>
            <div className="sparkle sparkle-5"></div>

            {/* Logos */}
            <div className="flex items-center gap-20 mb-16 z-10">

              <img
                src="/logo 4.png"
                alt="Young Lilies"
                className="w-56 h-56 object-contain animate-pulse drop-shadow-[0_0_60px_rgba(255,255,255,0.35)]"
              />

              <img
                src="/logo.png"
                alt="The Lilies"
                className="w-56 h-56 object-contain animate-pulse drop-shadow-[0_0_60px_rgba(255,255,255,0.35)]"
              />

            </div>

            {/* Main Title */}
            <div className="relative z-10 text-center">

              <h1
                className="
                  text-[7rem]
                  font-black
                  uppercase
                  tracking-[0.08em]
                  leading-none
                  bg-gradient-to-b
                  from-white
                  via-[#E5E7EB]
                  to-[#AEB7C2]
                  bg-clip-text
                  text-transparent
                  drop-shadow-[0_0_35px_rgba(255,255,255,0.35)]
                  animate-[silverShine_6s_linear_infinite]
                "
              >
                Chatteris Town FC
              </h1>

              <div
                style={{
                  fontFamily: "var(--font-great-vibes)",
                }}
                className="
                  mt-8
                  text-[5rem]
                  text-white
                  drop-shadow-[0_0_25px_rgba(255,255,255,0.35)]
                "
              >
                Presentation Day
              </div>

            </div>

          </div>

        ) : showMessages && messages[messageIndex] ? (

          /* Guestbook */
          <div className="w-full flex justify-center items-center px-20">

            <div className="w-full max-w-5xl text-center flex flex-col items-center">

              <div className="mb-8 flex-shrink-0">

                <div className="text-7xl font-extrabold text-white tracking-wide">
                  Messages for Vicky
                </div>

              </div>

              <div className="relative overflow-hidden bg-white/10 border border-white/10 backdrop-blur-xl rounded-[3rem] px-20 py-16 shadow-[0_0_80px_rgba(0,0,0,0.35)] h-[58vh] flex flex-col justify-between">

                <div
                  style={{
                    fontFamily: "'Caveat', cursive",
                  }}
                  className={`
                    relative z-10
                    text-white
                    font-semibold
                    tracking-[0.01em]
                    text-left
                    whitespace-pre-wrap
                    break-words
                    leading-[1.4]
                    flex-1
                    flex
                    items-center

                    ${
                      messages[messageIndex].message.length < 180
                        ? "text-[3.2rem]"
                        : messages[messageIndex].message.length < 320
                        ? "text-[2.5rem]"
                        : messages[messageIndex].message.length < 500
                        ? "text-[2rem]"
                        : messages[messageIndex].message.length < 700
                        ? "text-[1.6rem]"
                        : "text-[1.35rem]"
                    }
                  `}
                >
                  {messages[messageIndex].message}
                </div>

                <div className="relative z-10 mt-10 flex items-center justify-end flex-shrink-0">

                  <div className="text-right">

                    <div className="text-white/60 text-sm uppercase tracking-[0.35em] mb-2">
                      Shared by
                    </div>

                    <div
                      style={{
                        fontFamily: "'Caveat', cursive",
                      }}
                      className="text-white text-[2.7rem] font-bold"
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

          /* Photos */
          <div
            key={photos[currentIndex]?.id}
            className={`transition-all duration-700 ease-out ${
              fade
                ? "opacity-100 scale-100 translate-y-0"
                : "opacity-0 scale-[0.97] translate-y-2"
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

              <img
                src={photos[currentIndex].imageUrl}
                alt="Slideshow"
                className="max-w-[74vw] max-h-[58vh] object-contain"
              />

              <div className="mt-6 flex items-center justify-center gap-6">

                <img
                  src="/logo 4.png"
                  alt="Logo Left"
                  className="w-14 h-14 object-contain"
                />

                <div className="text-center leading-tight">

                  <div className="text-[#1A1A1A] text-[2rem] font-bold tracking-wide">
                    Chatteris Town Football Club
                  </div>

                  <div className="text-[#444] text-[2.1rem] italic mt-1">
                    Memories
                  </div>

                </div>

                <img
                  src="/logo.png"
                  alt="Logo Right"
                  className="w-14 h-14 object-contain"
                />

              </div>

            </div>

          </div>

        )}

      </div>

      <style jsx>{`
        .sparkle {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: rgba(255,255,255,0.9);
          box-shadow:
            0 0 20px rgba(255,255,255,0.9),
            0 0 40px rgba(255,255,255,0.8),
            0 0 60px rgba(255,255,255,0.6);
          animation: floatSparkle 6s infinite ease-in-out;
        }

        .sparkle-1 {
          top: 18%;
          left: 22%;
        }

        .sparkle-2 {
          top: 28%;
          right: 18%;
          animation-delay: 1s;
        }

        .sparkle-3 {
          bottom: 22%;
          left: 28%;
          animation-delay: 2s;
        }

        .sparkle-4 {
          bottom: 18%;
          right: 24%;
          animation-delay: 3s;
        }

        .sparkle-5 {
          top: 50%;
          left: 50%;
          animation-delay: 1.5s;
        }

        .spotlight {
          position: absolute;
          width: 700px;
          height: 1400px;
          background: linear-gradient(
            to bottom,
            rgba(255,255,255,0.22),
            rgba(255,255,255,0)
          );
          filter: blur(40px);
          opacity: 0.35;
        }

        .spotlight-left {
          left: 18%;
          top: -25%;
          transform: rotate(-18deg);
          animation: moveLeft 8s ease-in-out infinite;
        }

        .spotlight-right {
          right: 18%;
          top: -25%;
          transform: rotate(18deg);
          animation: moveRight 8s ease-in-out infinite;
        }

        .particles {
          position: absolute;
          inset: 0;
          background-image:
            radial-gradient(white 1px, transparent 1px);
          background-size: 80px 80px;
          opacity: 0.15;
          animation: drift 25s linear infinite;
        }

        @keyframes floatSparkle {
          0% {
            transform: translateY(0px) scale(1);
            opacity: 0.2;
          }

          50% {
            transform: translateY(-25px) scale(1.6);
            opacity: 1;
          }

          100% {
            transform: translateY(0px) scale(1);
            opacity: 0.2;
          }
        }

        @keyframes moveLeft {
          0% {
            transform: rotate(-18deg) translateX(0);
          }

          50% {
            transform: rotate(-10deg) translateX(40px);
          }

          100% {
            transform: rotate(-18deg) translateX(0);
          }
        }

        @keyframes moveRight {
          0% {
            transform: rotate(18deg) translateX(0);
          }

          50% {
            transform: rotate(10deg) translateX(-40px);
          }

          100% {
            transform: rotate(18deg) translateX(0);
          }
        }

        @keyframes drift {
          from {
            transform: translateY(0);
          }

          to {
            transform: translateY(-120px);
          }
        }

        @keyframes slowZoom {
          0% {
            transform: scale(1);
          }

          100% {
            transform: scale(1.03);
          }
        }

        @keyframes silverShine {
          0% {
            filter: brightness(1);
          }

          50% {
            filter: brightness(1.3);
          }

          100% {
            filter: brightness(1);
          }
        }
      `}</style>

    </main>
  );
}