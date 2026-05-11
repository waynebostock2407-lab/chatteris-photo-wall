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

  /* Initial Intro */
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 60000);

    return () => clearTimeout(timer);
  }, []);

  /* Intro Every 10 Minutes */
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

  /* Messages Every 5 Minutes */
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

      {/* Dynamic Background */}
      {showIntro ? (

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#5FAEEB_0%,#1E5FB8_40%,#071D4D_100%)]"></div>

      ) : (

        <div className="absolute inset-0 overflow-hidden">

          <div
            className="fabric-layer opacity-[0.45]"
            style={{
              backgroundImage: "url('/stripe-bg.jpg')",
            }}
          >

            <div className="absolute inset-0 bg-[#06142B]/45"></div>

            <div className="absolute inset-0 flex items-center justify-center">

              <img
                src="/logo.png"
                alt="Background Logo"
                className="w-[780px] opacity-[0.16]"
              />

            </div>

          </div>

        </div>

      )}

      {/* Flash */}
      <div
        className={`absolute inset-0 z-30 pointer-events-none transition-opacity duration-200 ${
          flash ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.75) 35%, rgba(255,255,255,0) 100%)",
        }}
      ></div>

      {/* Fullscreen */}
      {!isFullscreen && (
        <button
          onClick={toggleFullscreen}
          className="absolute top-6 right-6 z-40 bg-black/30 hover:bg-black/50 backdrop-blur-md border border-white/10 text-white px-5 py-3 rounded-2xl text-lg font-semibold transition shadow-2xl"
        >
          ⛶ Full Screen
        </button>
      )}

      {/* Main Content */}
      <div className="absolute inset-0 flex items-center justify-center px-16 pb-44 z-20">

        {/* Intro */}
        {showIntro ? (

          <div className="absolute inset-0 overflow-hidden flex flex-col items-center justify-center">

            {/* Cinematic Haze */}
            <div className="cinema-haze"></div>

            {/* Stage Glow */}
            <div className="absolute bottom-[-18%] left-1/2 -translate-x-1/2 w-[1100px] h-[320px] rounded-full bg-white/10 blur-[90px]"></div>

            {/* Floor Light Beams */}
            <div className="floor-beams"></div>

            {/* Side Glow */}
            <div className="side-glow left-glow"></div>
            <div className="side-glow right-glow"></div>

            {/* Main Spotlights */}
            <div className="main-spotlight spotlight-1"></div>
            <div className="main-spotlight spotlight-2"></div>
            <div className="main-spotlight spotlight-3"></div>
            <div className="main-spotlight spotlight-4"></div>

            {/* Floating Particles */}
            <div className="particles"></div>

            {/* Logos */}
            <div className="relative z-20 flex items-center gap-20 mb-14">

              <img
                src="/logo 4.png"
                alt="Young Lilies"
                className="silver-logo w-56 h-56 object-contain"
              />

              <img
                src="/logo.png"
                alt="The Lilies"
                className="silver-logo w-56 h-56 object-contain"
              />

            </div>

            {/* Title */}
            <div className="relative z-20 text-center px-10">

              <h1 className="silver-title">
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

              <div className="flex items-center justify-center mt-10">

                <div className="w-44 h-[1px] bg-white/50"></div>

                <div className="mx-4 text-white text-3xl">
                  ✧
                </div>

                <div className="w-44 h-[1px] bg-white/50"></div>

              </div>

            </div>

          </div>

        ) : showMessages && messages[messageIndex] ? (

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

              <div className="mt-7 flex items-center justify-center gap-5">

                <img
                  src="/logo 4.png"
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

      {/* Branding */}
      {!showIntro && (
        <div className="absolute bottom-6 left-8 z-20 flex items-end gap-8">

          <img
            src="/logo.png"
            alt="Club Logo"
            className="w-40 h-40 object-contain drop-shadow-2xl"
          />

          <div className="flex flex-col justify-end">

            <h1 className="leading-none">

              <span className="text-white text-5xl font-extrabold tracking-wide">
                Chatteris Town Football Club
              </span>

              <br />

              <span
                style={{
                  fontFamily: "var(--font-great-vibes)",
                }}
                className="text-sky-100 text-[4rem]"
              >
                Presentation Day
              </span>

            </h1>

          </div>

        </div>
      )}

      {/* QR */}
      {!showIntro && (
        <div className="absolute bottom-8 right-8 z-20 bg-white/95 rounded-3xl p-5 shadow-2xl">

          <div className="text-center text-[#0A1E3D] font-bold text-lg leading-tight mb-3">
            UPLOAD PHOTOS
            <br />
            & MESSAGES
          </div>

          <img
            src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://chatteris-photo-wall.vercel.app"
            alt="QR"
            className="rounded-xl"
          />

        </div>
      )}

      <style jsx>{`
        .fabric-layer {
          position: absolute;
          inset: -4%;
          background-size: cover;
          background-position: center;
        }

        .silver-title {
          font-size: 7rem;
          font-weight: 900;
          letter-spacing: 0.08em;
          line-height: 1;
          text-transform: uppercase;

          background:
            linear-gradient(
              to bottom,
              #ffffff 0%,
              #f1f5f9 18%,
              #d1d5db 38%,
              #ffffff 52%,
              #9ca3af 72%,
              #f8fafc 100%
            );

          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;

          text-shadow:
            0 0 14px rgba(255,255,255,0.5),
            0 0 40px rgba(255,255,255,0.35);

          animation:
            silverShimmer 5s linear infinite;
        }

        .silver-script {
          margin-top: 2rem;
          font-size: 5.2rem;
          color: white;

          text-shadow:
            0 0 15px rgba(255,255,255,0.6),
            0 0 35px rgba(255,255,255,0.3);
        }

        .silver-logo {
          filter:
            brightness(1.35)
            grayscale(1)
            contrast(1.15)
            drop-shadow(0 0 25px rgba(255,255,255,0.45));

          animation:
            logoPulse 5s ease-in-out infinite;
        }

        .cinema-haze {
          position: absolute;
          inset: 0;

          background:
            radial-gradient(
              circle at center,
              rgba(255,255,255,0.16) 0%,
              rgba(255,255,255,0.08) 25%,
              rgba(0,0,0,0.18) 72%,
              rgba(0,0,0,0.45) 100%
            );

          mix-blend-mode: screen;
        }

        .floor-beams {
          position: absolute;
          bottom: -18%;
          left: 50%;
          transform: translateX(-50%);

          width: 1800px;
          height: 900px;

          background:
            repeating-linear-gradient(
              to right,
              rgba(255,255,255,0.16) 0px,
              rgba(255,255,255,0.16) 3px,
              transparent 3px,
              transparent 42px
            );

          clip-path: polygon(
            0% 100%,
            100% 100%,
            60% 0%,
            40% 0%
          );

          opacity: 0.5;

          filter:
            blur(1px)
            drop-shadow(0 0 12px rgba(255,255,255,0.35));

          animation: floorSweep 16s linear infinite;
        }

        .side-glow {
          position: absolute;
          top: -10%;
          width: 700px;
          height: 1400px;

          background:
            radial-gradient(
              ellipse at center,
              rgba(255,255,255,0.14),
              rgba(255,255,255,0)
            );

          filter: blur(80px);

          opacity: 0.6;
        }

        .left-glow {
          left: -20%;
          transform: rotate(-18deg);
        }

        .right-glow {
          right: -20%;
          transform: rotate(18deg);
        }

        .main-spotlight {
          position: absolute;
          top: -40%;
          width: 500px;
          height: 1600px;

          background:
            linear-gradient(
              to bottom,
              rgba(255,255,255,0.32),
              rgba(255,255,255,0)
            );

          filter: blur(35px);

          opacity: 0.75;
        }

        .spotlight-1 {
          left: 8%;
          transform: rotate(-25deg);
          animation: moveLight1 8s ease-in-out infinite;
        }

        .spotlight-2 {
          left: 28%;
          transform: rotate(-10deg);
          animation: moveLight2 7s ease-in-out infinite;
        }

        .spotlight-3 {
          right: 28%;
          transform: rotate(10deg);
          animation: moveLight3 7s ease-in-out infinite;
        }

        .spotlight-4 {
          right: 8%;
          transform: rotate(25deg);
          animation: moveLight4 8s ease-in-out infinite;
        }

        .particles {
          position: absolute;
          inset: 0;

          background-image:
            radial-gradient(white 1px, transparent 1px);

          background-size: 90px 90px;

          opacity: 0.18;

          animation: drift 30s linear infinite;
        }

        @keyframes silverShimmer {
          0% {
            filter: brightness(1);
          }

          50% {
            filter: brightness(1.45);
          }

          100% {
            filter: brightness(1);
          }
        }

        @keyframes logoPulse {
          0% {
            transform: scale(1);
          }

          50% {
            transform: scale(1.04);
          }

          100% {
            transform: scale(1);
          }
        }

        @keyframes floorSweep {
          0% {
            transform: translateX(-50%) translateY(0);
          }

          50% {
            transform: translateX(-50%) translateY(35px);
          }

          100% {
            transform: translateX(-50%) translateY(0);
          }
        }

        @keyframes moveLight1 {
          0% {
            transform: rotate(-25deg);
          }

          50% {
            transform: rotate(-14deg);
          }

          100% {
            transform: rotate(-25deg);
          }
        }

        @keyframes moveLight2 {
          0% {
            transform: rotate(-10deg);
          }

          50% {
            transform: rotate(-2deg);
          }

          100% {
            transform: rotate(-10deg);
          }
        }

        @keyframes moveLight3 {
          0% {
            transform: rotate(10deg);
          }

          50% {
            transform: rotate(2deg);
          }

          100% {
            transform: rotate(10deg);
          }
        }

        @keyframes moveLight4 {
          0% {
            transform: rotate(25deg);
          }

          50% {
            transform: rotate(14deg);
          }

          100% {
            transform: rotate(25deg);
          }
        }

        @keyframes drift {
          from {
            transform: translateY(0);
          }

          to {
            transform: translateY(-160px);
          }
        }
      `}</style>

    </main>
  );
}