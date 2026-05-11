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
  const [loaded, setLoaded] = useState(true);

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

  /* INTRO */
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowIntro(false);
    }, 60000);

    return () => clearTimeout(timer);
  }, []);

  /* INTRO EVERY 10 MINS */
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

  /* PHOTOS */
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

  /* MESSAGES */
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

  /* PHOTO LOOP */
  useEffect(() => {
    if (photos.length === 0) return;

    let interval: NodeJS.Timeout;

    if (!showMessages && !showIntro) {

      interval = setInterval(() => {

        setFlash(true);

        setTimeout(() => {
          setFlash(false);
        }, 90);

        setLoaded(false);
        setFade(false);

        setTimeout(() => {

          const nextIndex =
            currentIndex === photos.length - 1
              ? 0
              : currentIndex + 1;

          const img = new Image();

          img.src = photos[nextIndex].imageUrl;

          img.onload = () => {

            setCurrentIndex(nextIndex);

            setTimeout(() => {
              setLoaded(true);
              setFade(true);
            }, 50);

          };

        }, 650);

      }, 6500);

    }

    return () => clearInterval(interval);

  }, [
    photos,
    showMessages,
    showIntro,
    currentIndex,
  ]);

  /* MESSAGE CYCLE */
  useEffect(() => {

    if (messages.length === 0) return;

    const cycle = setInterval(() => {

      setShowMessages(true);
      setMessageIndex(0);

    }, 300000);

    return () => clearInterval(cycle);

  }, [messages]);

  /* MESSAGE LOOP */
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

      {/* BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden">

        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url('/blank-presentation-stage.jpg')",
          }}
        />

        <div className="absolute inset-0 bg-[#02112B]/25" />

        {/* ORBS */}
        <div className="ambient-orbs slideshow-orbs z-10">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>

      </div>

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
          className="
            fixed
            top-6
            right-6
            z-[9999]
            bg-black/35
            hover:bg-black/55
            backdrop-blur-xl
            border
            border-white/20
            text-white
            px-6
            py-3
            rounded-2xl
            text-lg
            font-bold
            tracking-wide
            transition-all
            duration-300
            shadow-[0_0_30px_rgba(255,255,255,0.15)]
          "
        >
          ⛶ FULL SCREEN
        </button>
      )}

      {/* CONTENT */}
      <div className="absolute inset-0 flex items-center justify-center px-16 pb-44 z-20">

        {/* INTRO */}
        {showIntro ? (

          <div className="text-center">

            <div className="flex items-center justify-center gap-20 mb-14">

              <img
                src="/logo 5.png"
                alt="Young Lilies"
                className="hero-logo"
              />

              <img
                src="/logo 6.png"
                alt="The Lilies"
                className="hero-logo"
              />

            </div>

            <h1 className="hero-title">
              CHATTERIS TOWN FC
            </h1>

            <div className="hero-script">
              Presentation Day
            </div>

          </div>

        ) : showMessages && messages[messageIndex] ? (

          /* MESSAGES */
          <div className="w-full flex justify-center items-center px-12">

            <div className="w-full max-w-5xl text-center flex flex-col items-center">

              <div className="mb-6 flex-shrink-0">

                <div className="text-6xl font-extrabold text-white tracking-wide">
                  Messages for Vicky
                </div>

              </div>

              <div
                className="
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
                "
              >

                {/* MESSAGE */}
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

                {/* SIGNATURE */}
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

          /* PHOTOS */
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
                justify-center
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
                onLoad={() => setLoaded(true)}
                className={`
                  max-w-[74vw]
                  max-h-[58vh]
                  object-contain
                  transition-all
                  duration-700
                  ease-out
                  ${
                    loaded
                      ? "opacity-100 scale-100"
                      : "opacity-0 scale-[1.02]"
                  }
                `}
              />

              <div className="mt-7 flex items-center justify-center gap-5">

                <img
                  src="/logo 5.png"
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
                  src="/logo 6.png"
                  alt="The Lilies"
                  className="w-14 h-14 object-contain opacity-90"
                />

              </div>

            </div>

          </div>

        )}

      </div>

      <style jsx>{`
        .hero-title {
          font-size: 7rem;
          font-weight: 900;
          letter-spacing: 0.12em;
          line-height: 1;

          background:
            linear-gradient(
              to bottom,
              #ffffff 0%,
              #f3f7ff 18%,
              #c7d7ff 36%,
              #ffffff 52%,
              #9fb8f2 70%,
              #ffffff 100%
            );

          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;

          text-shadow:
            0 0 4px rgba(255,255,255,0.55),
            0 0 12px rgba(210,225,255,0.35),
            0 0 28px rgba(120,160,255,0.18);

          animation: silverPulse 5s ease-in-out infinite;
        }

        .hero-script {
          margin-top: 2rem;

          font-family: var(--font-great-vibes);
          font-size: 5rem;

          background:
            linear-gradient(
              to bottom,
              #ffffff,
              #dce7ff,
              #ffffff
            );

          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;

          text-shadow:
            0 0 4px rgba(255,255,255,0.45),
            0 0 10px rgba(200,220,255,0.18);
        }

        .hero-logo {
          width: 220px;
          height: 220px;
          object-fit: contain;

          filter:
            brightness(1.75)
            grayscale(1)
            saturate(0)
            contrast(1.25)
            drop-shadow(0 0 12px rgba(255,255,255,0.4))
            drop-shadow(0 0 24px rgba(180,210,255,0.18));

          animation: logoFloat 6s ease-in-out infinite;
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
              rgba(255,255,255,0.3) 0%,
              rgba(255,255,255,0.14) 45%,
              rgba(255,255,255,0) 78%
            );

          filter:
            blur(24px)
            drop-shadow(0 0 40px rgba(255,255,255,0.2));

          animation: floatOrb linear infinite;
        }

        .ambient-orbs span:nth-child(1) {
          width: 500px;
          height: 500px;
          left: -10%;
          top: 5%;
          animation-duration: 32s;
        }

        .ambient-orbs span:nth-child(2) {
          width: 320px;
          height: 320px;
          left: 12%;
          top: 68%;
          animation-duration: 26s;
        }

        .ambient-orbs span:nth-child(3) {
          width: 620px;
          height: 620px;
          right: -8%;
          top: 8%;
          animation-duration: 38s;
        }

        .ambient-orbs span:nth-child(4) {
          width: 260px;
          height: 260px;
          right: 12%;
          bottom: 10%;
          animation-duration: 24s;
        }

        .ambient-orbs span:nth-child(5) {
          width: 220px;
          height: 220px;
          left: 40%;
          top: -4%;
          animation-duration: 20s;
        }

        .ambient-orbs span:nth-child(6) {
          width: 420px;
          height: 420px;
          left: 45%;
          bottom: -14%;
          animation-duration: 34s;
        }

        @keyframes logoFloat {
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

        @keyframes silverPulse {
          0% {
            filter: brightness(1);
          }

          50% {
            filter: brightness(1.18);
          }

          100% {
            filter: brightness(1);
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
              translate3d(40px, -50px, 0)
              scale(1.1);
          }

          50% {
            transform:
              translate3d(-30px, -80px, 0)
              scale(0.96);
          }

          75% {
            transform:
              translate3d(50px, -20px, 0)
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