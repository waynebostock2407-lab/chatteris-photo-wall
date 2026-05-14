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

const PHOTO_FADE_DURATION = 650;

export default function SlideshowPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);

  const [messages, setMessages] = useState<
    GuestbookMessage[]
  >([]);

  const [currentPhotoIndex, setCurrentPhotoIndex] =
    useState(0);

  const [currentMessageIndex, setCurrentMessageIndex] =
    useState(0);

  const [showMessages, setShowMessages] =
    useState(false);

  const [fade, setFade] = useState(true);

  const [flash, setFlash] = useState(false);

  const [isFullscreen, setIsFullscreen] =
    useState(false);

  const [showTitle, setShowTitle] =
    useState(true);

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

  useEffect(() => {
  const timer = setTimeout(() => {
    setShowTitle(false);
  }, 15000);

  return () => clearTimeout(timer);
}, []);

useEffect(() => {
  if (showTitle) return;

  const interval = setInterval(() => {
    setShowTitle(true);

    setTimeout(() => {
      setShowTitle(false);
    }, 15000);

  }, 1000 * 60 * 4);

  return () => clearInterval(interval);
}, [showTitle]);

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
      photos.length === 0) {
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

      if (Math.random() < 0.06) {
  setShowTitle(true);

  setTimeout(() => {
    setShowTitle(false);
  }, 15000);

  return;
}

      const shouldShowMessage =
        messages.length > 0 &&
        Math.random() < 0.28;

      if (fadeTimeoutRef.current) {
        clearTimeout(fadeTimeoutRef.current);
      }

      fadeTimeoutRef.current = setTimeout(() => {
        if (shouldShowMessage) {

          setShowMessages(true);

          setCurrentMessageIndex((prev) => {

            if (messages.length <= 1)
              return prev;

            let nextIndex = prev;

            while (nextIndex === prev) {
              nextIndex = Math.floor(
                Math.random() * messages.length
              );
            }

            return nextIndex;
          });

          setFade(true);

          return;
        }

        setShowMessages(false);

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
    }, showMessages
  ? Math.min(
      30000,
      Math.max(
        12000,
        currentMessage?.message.length * 85
      )
    )
  : Math.random() < 0.12
  ? 16000
  : 6500 + Math.random() * 5000
);

    return () => {
      if (photoIntervalRef.current) {
        clearInterval(photoIntervalRef.current);
      }
    };
  }, [
    photos,
    showMessages,
  ]);

const isHeroPhoto =
  currentPhotoIndex % 5 === 0;

const isMegaMoment =
  currentPhotoIndex % 11 === 0;

const isFullBleed =
  currentPhotoIndex % 17 === 0;

const isQuietMoment =
  currentPhotoIndex % 7 === 0;

  const currentPhoto =
    photos[currentPhotoIndex];

  const currentMessage =
    messages[currentMessageIndex];

  const polaroidStyle = useMemo(() => {
    const styles = [
  "rotate-[-1deg] translate-y-2 -translate-x-4",
  "rotate-[1deg] -translate-y-2 translate-x-3",
  "rotate-[-0.5deg] translate-y-3 -translate-x-2",
  "rotate-[1.5deg] translate-x-5",
  "rotate-[-1.5deg] -translate-x-5",
  "rotate-[0.5deg] translate-y-1 translate-x-2",
];

    return styles[
      currentPhotoIndex % styles.length
    ];
  }, [currentPhotoIndex]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black text-white">

      <div className="absolute inset-0 z-0 overflow-hidden">

  <div
    className="absolute inset-0"
    style={{
      backgroundImage: "url('/background.png')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      filter: "brightness(0.38) saturate(1.2)",
      transform: "scale(1.03)",
    }}
  />

  <div className="background-drift" />

  <div
    className="absolute inset-0"
    style={{
      background: `
        radial-gradient(
          circle at center,
          rgba(0,70,160,0.04) 0%,
          rgba(0,0,0,0.08) 52%,
          rgba(0,0,0,0.34) 100%
        )
      `,
    }}
  />

</div>

      <div className="edge-trail" />

      <div className="stage-haze" />

      <div
  className={`presentation-particles ${
    isQuietMoment
      ? "opacity-[0.04]"
      : ""
  }`}
/>

<div
  className={`confetti-burst ${
    flash &&
    (isMegaMoment || isHeroPhoto) &&
    !isQuietMoment
      ? "confetti-active"
      : ""
  }`}
/>

<div
  className={`liquid-lights ${
    isQuietMoment
      ? "opacity-[0.35]"
      : ""
  }`}
/>

      <div
          className={`absolute inset-0 z-30 pointer-events-none transition-opacity duration-700 ${
            flash ? "opacity-100" : "opacity-0"
          }`}
          style={{
            background:
              `radial-gradient(
                circle,
                rgba(70,140,220,${
                  currentPhotoIndex % 6 === 0 ? "1" : "0.65"
                }) 0%,
              rgba(255,255,255,0.45) 30%,
              rgba(0,0,0,0) 100%
              )`,
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

      {showTitle ? (

  <div className="title-screen">

  <div className="title-logo-wrap">

    <img
      src="/logo 7.png"
      className="title-logo"
    />

  </div>

  <div className="title-main">
    Chatteris Town FC
  </div>

  <div className="title-sub">
    Presentation Day
  </div>

</div>

) : (

      <div
  className={`absolute inset-0 flex items-center justify-center px-12 pb-40 z-20 transition-all duration-[1800ms]
  ${
    showTitle
      ? "opacity-0 scale-[1.02]"
      : "opacity-100 scale-100"
  }
  ${
    isMegaMoment
      ? "scale-[1.04]"
      : ""
  }`}
>

        {showMessages &&
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

            <div className="message-card relative overflow-hidden bg-white/10 border border-white/10 backdrop-blur-2xl rounded-[3rem] px-14 py-12 shadow-[0_0_80px_rgba(0,0,0,0.45)]">

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

          isFullBleed ? (

  <div
    key={currentPhoto.id}
    className={`absolute inset-0 transition-all duration-700 ${
      fade
        ? "opacity-100 scale-100"
        : "opacity-0 scale-[1.06]"
    }`}
  >

    <div className="fullbleed-backdrop" />

    <img
      src={currentPhoto.imageUrl}
      alt="Presentation photo"
      className="w-full h-full object-contain animate-fullBleedMove"
    />

    <div className="absolute inset-0 bg-black/35" />

  </div>

) : ( 

          <div
            key={currentPhoto.id}
            className={`${
              fade
                ? "animate-polaroidSlam opacity-100"
                : "opacity-0"
            }`}
          >

            <div
              className={`inline-flex flex-col items-center bg-white p-5 pb-16 rounded-[0.8rem]
              ${
                isMegaMoment
                  ? "scale-[1.18] rotate-[4deg] shadow-[0_40px_calc(180px*var(--audio-reactivity,1))_rgba(70,140,220,0.7)]"
                  : isHeroPhoto
                  ? "scale-[1.08] rotate-[2deg] shadow-[0_30px_calc(120px*var(--audio-reactivity,1))_rgba(70,140,220,0.45)]"
                  : "shadow-[0_18px_calc(70px*var(--audio-reactivity,1))_rgba(0,0,0,0.5)]"
              }
              ${polaroidStyle}`}
            >

              <div className="relative overflow-hidden bg-[#f5f5f5] max-w-[74vw] max-h-[58vh] rounded-[0.3rem]">

                <img
                  src={currentPhoto.imageUrl}
                  alt="Presentation photo"
                  className={`block max-w-[74vw] max-h-[58vh] object-contain rounded-[0.25rem]
${
  isQuietMoment
    ? ""
    : "animate-kenburns"
}`}
                />

              <div className="photo-finish" />

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

                )

        ) : null}
      </div>

)}

{!showTitle && (
<>
  <div className="corner-brand">

    <img
      src="/logo 8.png"
      alt="Club logo"
      className="corner-brand-logo"
    />

    <div className="corner-brand-text">

      <div className="corner-brand-main">
        CHATTERIS TOWN FC
      </div>

      <div className="corner-brand-sub">
        Presentation Day
      </div>

    </div>

  </div>

  <div className="absolute bottom-8 right-8 z-30">

        <div className="bg-white/78 backdrop-blur-xl rounded-[2rem] p-5 shadow-[0_10px_28px_rgba(0,0,0,0.22)] border border-white/40">

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
      </>
)}
      <style jsx>{`

        .title-screen {
  position: absolute;
  inset: 0;

  overflow: hidden;

  z-index: 50;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  gap: 1.5rem;

  background:
    radial-gradient(
      circle at center,
      rgba(10,30,60,0.45),
      rgba(0,0,0,0.82)
    );

  animation:
    titleFade 15s ease forwards;
}

.title-screen::before {
  content: "";

  position: absolute;

  width: 900px;
  height: 900px;

  border-radius: 999px;

  background:
    radial-gradient(
      circle,
      rgba(0,140,255,0.22) 0%,
      rgba(120,190,255,0.12) 30%,
      rgba(255,255,255,0.04) 48%,
      transparent 72%
    );

  filter: blur(40px);

  animation:
    titleAura 8s ease-in-out infinite;

  z-index: -1;
}

.title-logos {
  display: flex;
  align-items: center;
  justify-content: center;

  gap: 3rem;
}

.title-logo {
  width: min(950px, 82vw);

  object-fit: contain;

  filter:
    drop-shadow(
      0 0 25px rgba(255,255,255,0.12)
    )
    drop-shadow(
      0 0 60px rgba(70,140,220,0.18)
    );

  animation:
    titleFloat 7s ease-in-out infinite;
}

.title-main {
  font-size:
    clamp(3rem, 6vw, 6rem);

  font-weight: 900;

  letter-spacing: 0.08em;

  text-transform: uppercase;

  text-align: center;

  background:
  linear-gradient(
    180deg,
    #ffffff 0%,
    #fdfdfd 10%,
    #d6d6d6 18%,
    #7b7b7b 32%,
    #f8f8f8 46%,
    #ffffff 52%,
    #8e8e8e 66%,
    #dcdcdc 78%,
    #ffffff 100%
  );

  background-size: 100% 300%;

  background-clip: text;
  -webkit-background-clip: text;

  color: transparent;
  -webkit-text-fill-color: transparent;

  filter:
    drop-shadow(
      0 0 14px rgba(255,255,255,0.14)
    )
    drop-shadow(
      0 0 40px rgba(70,140,220,0.22)
    );

  animation:
    metallicShift 4.5s ease-in-out infinite;
}

.title-sub {
  font-family:
    var(--font-great-vibes);

  font-size:
    clamp(2.8rem, 4vw, 5rem);

  text-align: center;

  margin-top: -0.5rem;

  background:
    linear-gradient(
      180deg,
      #ffffff 0%,
      #fefefe 8%,
      #d9d9d9 18%,
      #7e7e7e 34%,
      #f8f8f8 48%,
      #ffffff 56%,
      #8f8f8f 70%,
      #d6d6d6 84%,
      #ffffff 100%
    );

  background-size: 100% 300%;

  background-clip: text;
  -webkit-background-clip: text;

  color: transparent;
  -webkit-text-fill-color: transparent;

  filter:
    drop-shadow(
      0 0 12px rgba(255,255,255,0.14)
    )
    drop-shadow(
      0 0 30px rgba(70,140,220,0.18)
    );

  animation:
    metallicShift 4.5s ease-in-out infinite;
}

.background-drift {
  position: absolute;
  inset: -5%;

  z-index: 1;

  background-image: url('/background.png');

  background-size: cover;
  background-position: center;

  opacity: 0.08;

  mix-blend-mode: screen;

  filter:
    blur(35px)
    saturate(1.4);

  animation:
    backgroundDrift 24s ease-in-out infinite alternate;

  pointer-events: none;
}

@keyframes backgroundDrift {

  0% {
    transform:
      scale(1.02)
      translateX(-12px)
      translateY(-8px);
  }

  100% {
    transform:
      scale(1.08)
      translateX(18px)
      translateY(10px);
  }
}

@keyframes titleAura {

  0% {
    transform:
      scale(1);
    opacity: 0.7;
  }

  50% {
    transform:
      scale(1.08);
    opacity: 1;
  }

  100% {
    transform:
      scale(1);
    opacity: 0.7;
  }
}

@keyframes titleFloat {

  0% {
    transform:
      translateY(0px);
  }

  50% {
    transform:
      translateY(-10px);
  }

  100% {
    transform:
      translateY(0px);
  }
}

@keyframes metallicShimmer {

  0% {
    filter:
      drop-shadow(
        0 0 18px rgba(255,255,255,0.08)
      )
      drop-shadow(
        0 0 35px rgba(70,140,220,0.18)
      );

    transform:
      translateY(0px);
  }

  50% {
    filter:
      drop-shadow(
        0 0 26px rgba(255,255,255,0.16)
      )
      drop-shadow(
        0 0 55px rgba(70,140,220,0.32)
      );

    transform:
      translateY(-2px);
  }

  100% {
    filter:
      drop-shadow(
        0 0 18px rgba(255,255,255,0.08)
      )
      drop-shadow(
        0 0 35px rgba(70,140,220,0.18)
      );

    transform:
      translateY(0px);
  }
}

@keyframes titleFade {

  0% {
    opacity: 0;
  }

  12% {
    opacity: 1;
  }

  88% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }
}

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
              rgba(70,140,220,0.15) 8%,
              rgba(70,140,220,1) 30%,
              rgba(255,255,255,1) 50%,
              rgba(70,140,220,1) 70%,
              transparent 100%
            );

          opacity: calc(
            0.7 +
            (
              var(--audio-reactivity, 1) - 1
            ) * 0.55
          );

          box-shadow:
            0 0 calc(18px * var(--audio-reactivity, 1)) rgba(70,140,220,1),
            0 0 calc(40px * var(--audio-reactivity, 1)) rgba(70,140,220,1),
            0 0 calc(90px * var(--audio-reactivity, 1)) rgba(255,255,255,0.95),
            0 0 calc(160px * var(--audio-reactivity, 1)) rgba(70,140,220,0.9);

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

.corner-brand {
  position: absolute;

  left: 2.5rem;
  bottom: 2rem;

  z-index: 35;

  display: flex;
  align-items: center;
  gap: 1.2rem;

  opacity: 0.92;
}

.corner-brand-logo {
  width: 82px;

  object-fit: contain;

  filter:
    drop-shadow(0 0 10px rgba(255,255,255,0.12))
    drop-shadow(0 0 26px rgba(70,140,220,0.22));
}

.corner-brand-main {
  font-size: 3rem;

  font-weight: 900;

  letter-spacing: 0.04em;

  line-height: 0.9;

  background:
    linear-gradient(
      180deg,
      #ffffff 0%,
      #f5f5f5 12%,
      #cfcfcf 26%,
      #8a8a8a 48%,
      #f8f8f8 68%,
      #7a7a7a 100%
    );

  background-size: 100% 220%;

  background-clip: text;
  -webkit-background-clip: text;

  color: transparent;
  -webkit-text-fill-color: transparent;

  filter:
    drop-shadow(
      0 0 12px rgba(255,255,255,0.08)
    )
    drop-shadow(
      0 0 28px rgba(70,140,220,0.16)
    );

  text-shadow:
    0 0 24px rgba(255,255,255,0.05);

  animation:
    metallicShift 7s linear infinite;
}

.corner-brand-sub {
  font-family:
    var(--font-great-vibes);

  font-size: 2.4rem;

  margin-top: -0.3rem;

  background:
    linear-gradient(
      180deg,
      #ffffff 0%,
      #d9d9d9 18%,
      #8d8d8d 52%,
      #ffffff 78%,
      #6f6f6f 100%
    );

  background-clip: text;
  -webkit-background-clip: text;

  color: transparent;
  -webkit-text-fill-color: transparent;

  filter:
    drop-shadow(
      0 0 10px rgba(255,255,255,0.08)
    )
    drop-shadow(
      0 0 22px rgba(70,140,220,0.14)
    );
}

.liquid-lights {
  position: absolute;
  inset: -20%;

  z-index: 5;

  background:

  radial-gradient(
    ellipse at 18% 28%,
    rgba(0,140,255,0.42),
    transparent 42%
  ),

  radial-gradient(
    ellipse at 82% 18%,
    rgba(120,190,255,0.18),
    transparent 38%
  ),

  radial-gradient(
    ellipse at 72% 82%,
    rgba(0,110,255,0.34),
    transparent 44%
  ),

  radial-gradient(
    ellipse at 28% 76%,
    rgba(50,150,255,0.22),
    transparent 40%
  );

  filter:
    blur(140px)
    saturate(1.35);

  opacity:
    calc(
      0.72 +
      (
        var(--audio-reactivity, 1) - 1
      ) * 1.5
    );

  mix-blend-mode: screen;

  animation:
    liquidFlow 20s ease-in-out infinite alternate;

  transform:
    scale(
      calc(
        1 +
        (
          var(--audio-reactivity, 1) - 1
        ) * 0.08
      )
    );

  pointer-events: none;
}

.presentation-glow {
  z-index: 1;
  position: absolute;

  inset: 0;

  background:
    radial-gradient(
      circle at center,
      rgba(70,140,220,0.12) 0%,
      rgba(0,0,0,0) 70%
    );

  filter: blur(90px);

  transform:
  scale(
    calc(
      1 +
      (
        var(--audio-reactivity, 1) - 1
      ) * 0.22
    )
  );

  animation:
    presentationPulse 10s ease-in-out infinite;

  pointer-events: none;
}

.photo-finish {
  position: absolute;
  inset: 0;

  pointer-events: none;

  background:
    linear-gradient(
      to bottom,
      rgba(255,255,255,0.03),
      rgba(0,0,0,0.08)
    );

  mix-blend-mode: soft-light;
}

.stage-haze {
  position: absolute;
  inset: 0;

  z-index: 10;

  background:
    radial-gradient(
      circle at 50% 70%,
      rgba(255,255,255,0.08),
      transparent 60%
    );

  mix-blend-mode: screen;

  filter: blur(60px);

  opacity: 0.8;

  pointer-events: none;
}

.presentation-particles {
  position: absolute;
  inset: 0;

  z-index: 2;

  background-image:

    radial-gradient(
      rgba(255,255,255,0.18) 1px,
      transparent 1px
    ),

    radial-gradient(
      rgba(70,140,220,0.12) 1px,
      transparent 1px
    );

  background-size:
    320px 320px,
    240px 240px;

  opacity: 0.12;

  mix-blend-mode: screen;

  animation:
    particlesFloat 28s linear infinite;

  pointer-events: none;
}

.confetti-burst {
  position: absolute;
  inset: 0;

  overflow: hidden;

  pointer-events: none;

  z-index: 12;

  opacity: 0;
}

.confetti-burst::before,
.confetti-burst::after {
  content: "";

  position: absolute;
  inset: -20%;

  background-image:

    radial-gradient(
      rgba(255,255,255,0.95) 2px,
      transparent 2px
    ),

    radial-gradient(
      rgba(120,190,255,0.9) 2px,
      transparent 2px
    ),

    radial-gradient(
      rgba(210,230,255,0.75) 1.5px,
      transparent 1.5px
    );

  background-size:
    140px 140px,
    180px 180px,
    110px 110px;

  mix-blend-mode: screen;

  opacity: 0;
}

.confetti-active::before {
  animation:
    confettiLeft 1400ms ease-out forwards;
}

.confetti-active::after {
  animation:
    confettiRight 1600ms ease-out forwards;
}

@keyframes confettiLeft {

  0% {
    opacity: 0;
    transform:
      translate(-8%, 12%)
      scale(0.8)
      rotate(0deg);
  }

  15% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform:
      translate(-26%, -18%)
      scale(1.18)
      rotate(-8deg);
  }
}

@keyframes confettiRight {

  0% {
    opacity: 0;
    transform:
      translate(8%, 10%)
      scale(0.85)
      rotate(0deg);
  }

  15% {
    opacity: 1;
  }

  100% {
    opacity: 0;
    transform:
      translate(24%, -22%)
      scale(1.22)
      rotate(10deg);
  }
}

.fullbleed-backdrop {
  position: absolute;
  inset: 0;

  background:
    radial-gradient(
      circle at center,
      rgba(255,255,255,0.06) 0%,
      rgba(0,70,160,0.12) 28%,
      rgba(0,0,0,0.82) 100%
    );

  backdrop-filter:
    blur(60px)
    brightness(0.65);

  transform: scale(1.12);
}

.message-card::before {
  content: "";
  position: absolute;
  inset: 0;

  background:
    linear-gradient(
      120deg,
      transparent 0%,
      rgba(255,255,255,0.08) 45%,
      transparent 100%
    );

  transform: translateX(-140%);

  animation:
    messageSweep 6s linear infinite;
}

.message-card::after {
  content: "";

  position: absolute;
  inset: 0;

  background:
    url("/logo 7.png")
    center center / 240px no-repeat;

  opacity: 0.015;

  pointer-events: none;

  filter:
    grayscale(1)
    brightness(2);

  mix-blend-mode: screen;
}

.photo-finish {
  position: absolute;
  inset: 0;

  pointer-events: none;

  background:

    radial-gradient(
      circle at center,
      rgba(255,255,255,0.04) 0%,
      rgba(255,255,255,0.015) 30%,
      rgba(0,0,0,0.18) 100%
    ),

    linear-gradient(
      to bottom,
      rgba(255,255,255,0.04) 0%,
      rgba(255,255,255,0) 20%,
      rgba(0,0,0,0.12) 100%
    );

  mix-blend-mode: soft-light;
}

@keyframes messageSweep {
  to {
    transform: translateX(140%);
  }
}

.ambient-drift {
  position: absolute;
  inset: -20%;

  z-index: 2;

  pointer-events: none;

  background:

    radial-gradient(
      circle at 20% 30%,
      rgba(70,140,220,0.12),
      transparent 28%
    ),

    radial-gradient(
      circle at 75% 25%,
      rgba(255,255,255,0.06),
      transparent 24%
    ),

    radial-gradient(
      circle at 60% 80%,
      rgba(28,110,190,0.1),
      transparent 30%
    );

  filter: blur(120px);

  mix-blend-mode: screen;

  opacity:
    calc(
      0.55 +
      (
        var(--audio-reactivity, 1) - 1
      ) * 0.9
    );

  animation:
    ambientDrift 28s ease-in-out infinite alternate;
}

.title-logo-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

@keyframes ambientDrift {

  0% {
    transform:
      translateX(-40px)
      translateY(-20px)
      scale(1);
  }

  100% {
    transform:
      translateX(50px)
      translateY(30px)
      scale(1.12);
  }
}

@keyframes liquidFlow {

  0% {
    transform:
      rotate(0deg)
      scale(1)
      translateX(0px)
      translateY(0px);
  }

  100% {
    transform:
      rotate(8deg)
      scale(1.15)
      translateX(-40px)
      translateY(-30px);
  }
}

@keyframes floatBlue {
  0% {
    transform:
      translate(0px, 0px)
      scale(1);
  }

  100% {
    transform:
      translate(80px, 40px)
      scale(1.18);
  }
}

@keyframes floatPink {
  0% {
    transform:
      translate(0px, 0px)
      scale(1);
  }

  100% {
    transform:
      translate(-60px, 80px)
      scale(1.12);
  }
}

@keyframes floatCyan {
  0% {
    transform:
      translate(0px, 0px)
      scale(1);
  }

  100% {
    transform:
      translate(-100px, -60px)
      scale(1.2);
  }
}

@keyframes floatPurple {
  0% {
    transform:
      translate(0px, 0px)
      scale(1);
  }

  100% {
    transform:
      translate(70px, -50px)
      scale(1.16);
  }
}

@keyframes presentationPulse {
  0% {
    transform: scale(1);
    opacity: 0.45;
  }

  50% {
    transform: scale(1.08);
    opacity: 1;
  }

  100% {
    transform: scale(1);
    opacity: 0.45;
  }
}

@keyframes particlesFloat {
  0% {
    transform: translateY(0px);
  }

  100% {
    transform: translateY(-120px);
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

        @keyframes fullBleedMove {

  0% {
    transform: scale(1);
  }

  100% {
    transform: scale(1.08);
  }
}

.animate-fullBleedMove {
  animation:
    fullBleedMove 14s ease-in-out forwards;
}

@keyframes metallicShift {

  0% {
    background-position: 0% 0%;
  }

  50% {
    background-position: 0% 100%;
  }

  100% {
    background-position: 0% 0%;
  }
}

        @keyframes polaroidSlam {

          0% {
            transform:
              translateY(-900px)
              rotate(-16deg)
              scale(1.4);

            opacity: 0;
          }

          45% {
            transform:
              translateY(40px)
              rotate(5deg)
              scale(0.92);

            opacity: 1;
          }

          65% {
            transform:
              translateY(-18px)
              rotate(-3deg)
              scale(1.03);
          }

          82% {
            transform:
              translateY(8px)
              rotate(1deg)
              scale(0.99);
          }

          100% {
            transform:
              translateY(0px)
              rotate(0deg)
              scale(1);
          }
        }
        
        @keyframes polaroidIdle {

  0% {
    transform:
      translateY(0px)
      rotate(-1deg)
      scale(1);
  }

  25% {
    transform:
      translateY(-8px)
      rotate(1deg)
      scale(1.01);
  }

  50% {
    transform:
      translateY(4px)
      rotate(-0.5deg)
      scale(1.015);
  }

  75% {
    transform:
      translateY(-6px)
      rotate(0.5deg)
      scale(1.005);
  }

  100% {
    transform:
      translateY(0px)
      rotate(-1deg)
      scale(1);
  }
}

        .animate-polaroidSlam {
          animation:
            polaroidSlam 950ms cubic-bezier(0.12, 0.85, 0.22, 1),
            polaroidIdle 7s ease-in-out infinite 1s;
        }

        .animate-kenburns {
          animation: kenburns 12s ease-in-out forwards;
        }

      `}</style>
    </main>
  );
}

