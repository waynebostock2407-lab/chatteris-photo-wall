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

  /* Initial intro */
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 12000);

    return () => clearTimeout(timer);
  }, []);

  /* Intro every 10 mins */
  useEffect(() => {
    const introCycle = setInterval(() => {

      setShowIntro(true);

      setTimeout(() => {
        setShowIntro(false);
      }, 12000);

    }, 600000);

    return () => clearInterval(introCycle);
  }, []);

  /* Polaroid styles */
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

  /* Photo loop */
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

  /* Trigger messages every 5 mins */
  useEffect(() => {

    if (messages.length === 0) return;

    const cycle = setInterval(() => {

      setShowMessages(true);
      setMessageIndex(0);

    }, 300000);

    return () => clearInterval(cycle);

  }, [messages]);

  /* Message loop */
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
    <main className="relative w-screen h-screen overflow-hidden text-white bg-sky-900">

      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">

        <div
          className="fabric-layer opacity-[0.45]"
          style={{
            backgroundImage: "url('/stripe-bg.jpg')",
          }}
        >

          <div className="absolute inset-0 bg-[#06142B]/35"></div>

          {/* Watermark */}
          <div className="absolute inset-0 flex items-center justify-center">

            <img
              src="/logo.png"
              alt="Background Logo"
              className="w-[780px] opacity-[0.16]"
            />

          </div>

        </div>

      </div>

      {/* Stadium Lighting */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">

        <div className="absolute top-[-300px] left-1/2 -translate-x-1/2 w-[1400px] h-[900px] bg-[#7EC3FF]/35 rounded-full blur-[170px]"></div>

        <div className="absolute bottom-[-350px] left-1/2 -translate-x-1/2 w-[1200px] h-[700px] bg-[#0A56C5]/30 rounded-full blur-[160px]"></div>

      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-[#06142B]/45"></div>

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
          className="absolute top-6 right-6 z-40 bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/10 text-white px-5 py-3 rounded-2xl text-lg font-semibold transition shadow-2xl"
        >
          ⛶ Full Screen
        </button>
      )}

      {/* Main Content */}
      <div className="absolute inset-0 flex items-center justify-center px-16 pb-52 z-20">

        {/* Intro Screen */}
        {showIntro ? (

          <div className="absolute inset-0 flex flex-col items-center justify-center">

            {/* Animated Rings */}
            <div className="absolute w-[900px] h-[900px] border border-white/10 rounded-full animate-ping opacity-20"></div>

            <div className="absolute w-[700px] h-[700px] border border-sky-200/20 rounded-full animate-pulse"></div>

            {/* Sparkles */}
            <div className="sparkle sparkle-1"></div>
            <div className="sparkle sparkle-2"></div>
            <div className="sparkle sparkle-3"></div>
            <div className="sparkle sparkle-4"></div>
            <div className="sparkle sparkle-5"></div>

            {/* Logos */}
            <div className="flex items-center gap-16 mb-12 z-10">

              <img
                src="/logo 4.png"
                alt="Young Lilies Logo"
                className="w-48 h-48 object-contain drop-shadow-[0_0_40px_rgba(255,255,255,0.25)]"
              />

              <img
                src="/logo.png"
                alt="The Lilies Logo"
                className="w-48 h-48 object-contain drop-shadow-[0_0_40px_rgba(255,255,255,0.25)]"
              />

            </div>

            {/* Title */}
            <div className="relative z-10 text-center px-10">

              <h1
                style={{
                  fontFamily: "'Playfair Display', serif",
                }}
                className="text-white text-[6rem] leading-none font-bold tracking-wide drop-shadow-[0_0_35px_rgba(255,255,255,0.3)]"
              >
                Chatteris Town FC
              </h1>

              <div
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                }}
                className="mt-6 text-sky-100 text-[4rem] italic tracking-[0.08em] drop-shadow-[0_0_20px_rgba(255,255,255,0.25)]"
              >
                Presentation Day
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

              <div className="relative overflow-hidden bg-gradient-to-br from-[#0A1936]/88 to-[#10254D]/88 border border-white/10 backdrop-blur-xl rounded-[3rem] px-20 py-16 shadow-[0_0_80px_rgba(0,0,0,0.45)] h-[58vh] flex flex-col justify-between">

                <div
                  style={{
                    fontFamily: "'Caveat', cursive",
                  }}
                  className={`
                    relative z-10
                    text-[#F8FBFF]
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

                    <div className="text-white/50 text-sm uppercase tracking-[0.35em] mb-2">
                      Shared by
                    </div>

                    <div
                      style={{
                        fontFamily: "'Caveat', cursive",
                      }}
                      className="text-[#D9F3FF] text-[2.7rem] font-bold"
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

              <div className="mt-6 flex items-center justify-center gap-6">

                <img
                  src="/logo 4.png"
                  alt="Logo Left"
                  className="w-14 h-14 object-contain"
                />

                <div className="text-center leading-tight">

                  <div
                    style={{
                      fontFamily: "'Playfair Display', serif",
                    }}
                    className="text-[#1A1A1A] text-[2rem] font-bold tracking-wide"
                  >
                    Chatteris Town Football Club
                  </div>

                  <div
                    style={{
                      fontFamily: "'Cormorant Garamond', serif",
                    }}
                    className="text-[#444] text-[2.1rem] italic mt-1"
                  >
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
        .fabric-layer {
          position: absolute;
          inset: -4%;
          background-size: cover;
          background-position: center;
          filter: saturate(1.05);
        }

        .sparkle {
          position: absolute;
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: rgba(255,255,255,0.9);
          box-shadow:
            0 0 20px rgba(255,255,255,0.9),
            0 0 40px rgba(125,211,252,0.8),
            0 0 60px rgba(255,255,255,0.6);
          animation: floatSparkle 6s infinite ease-in-out;
        }

        .sparkle-1 {
          top: 18%;
          left: 22%;
          animation-delay: 0s;
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
      `}</style>

    </main>
  );
}
