"use client";

import { useEffect, useState } from "react";

import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
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

export default function AdminPage() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");
  const [editedMessage, setEditedMessage] = useState("");

  useEffect(() => {
    const q = query(
      collection(db, "photos"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPhotos = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<Photo, "id">),
      }));

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
      const fetchedMessages = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<GuestbookMessage, "id">),
      }));

      setMessages(fetchedMessages);
    });

    return () => unsubscribe();
  }, []);

  const approvePhoto = async (id: string) => {
    try {
      await updateDoc(doc(db, "photos", id), {
        approved: true,
      });
    } catch (error) {
      console.error("Error approving photo:", error);
    }
  };

  const deletePhoto = async (id: string) => {
    try {
      await deleteDoc(doc(db, "photos", id));
    } catch (error) {
      console.error("Error deleting photo:", error);
    }
  };

  const togglePhotoSelection = (id: string) => {
    setSelectedPhotos((prev) =>
      prev.includes(id)
        ? prev.filter((photoId) => photoId !== id)
        : [...prev, id]
    );
  };

  const approveSelectedPhotos = async () => {
    try {
      await Promise.all(
        selectedPhotos.map((id) =>
          updateDoc(doc(db, "photos", id), {
            approved: true,
          })
        )
      );

      setSelectedPhotos([]);

    } catch (error) {
      console.error("Error approving photos:", error);
    }
  };

  const deleteSelectedPhotos = async () => {
    try {
      await Promise.all(
        selectedPhotos.map((id) =>
          deleteDoc(doc(db, "photos", id))
        )
      );

      setSelectedPhotos([]);

    } catch (error) {
      console.error("Error deleting photos:", error);
    }
  };

  const selectAllPending = () => {
    const pendingIds = photos
      .filter((photo) => !photo.approved)
      .map((photo) => photo.id);

    setSelectedPhotos(pendingIds);
  };

  const selectAllApproved = () => {
    const approvedIds = photos
      .filter((photo) => photo.approved)
      .map((photo) => photo.id);

    setSelectedPhotos(approvedIds);
  };

  const clearSelection = () => {
    setSelectedPhotos([]);
  };

  const downloadSelectedPhotos = async () => {
    try {
      const selected = photos.filter((photo) =>
        selectedPhotos.includes(photo.id)
      );

      if (selected.length === 0) return;

      const response = await fetch(
        "/api/download-photos",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            photos: selected.map(
              (photo) => photo.imageUrl
            ),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to download");
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download =
        "presentation-day-photos.zip";

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error(
        "Error downloading photos:",
        error
      );
    }
  };

  const downloadMessages = () => {
    try {
      const approvedMessages = messages.filter(
        (message) => message.approved
      );

      const content = approvedMessages
        .map(
          (message) =>
            `Name: ${message.name}\n\n${message.message}\n\n------------------------\n`
        )
        .join("\n");

      const blob = new Blob([content], {
        type: "text/plain;charset=utf-8",
      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = "vicky-messages.txt";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Error downloading messages:", error);
    }
  };

  const approveMessage = async (id: string) => {
    try {
      await updateDoc(doc(db, "guestbook", id), {
        approved: true,
      });
    } catch (error) {
      console.error("Error approving message:", error);
    }
  };

  const saveMessageEdit = async (id: string) => {

    try {

      await updateDoc(doc(db, "guestbook", id), {
        name: editedName,
        message: editedMessage,
      });

      setEditingId(null);

    } catch (error) {

      console.error(
        "Error editing message:",
        error
      );

    }

  };

  const deleteMessage = async (id: string) => {
    try {
      await deleteDoc(doc(db, "guestbook", id));
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };


  const triggerCupDraw = async () => {

  await updateDoc(
    doc(db, "eventControl", "live"),
    {
      showCupDraw: true,
      drawTrigger: Date.now()
    }
  );

};

const closeCupDraw = async () => {

  await updateDoc(
    doc(db, "eventControl", "live"),
    {
      showCupDraw: false
    }
  );

};

const triggerThankYou = async () => {

  await updateDoc(
    doc(db, "eventControl", "live"),
    {
      thankYouTrigger: Date.now()
    }
  );

};

const togglePause = async (
  current: boolean
) => {

  await updateDoc(
    doc(db, "eventControl", "live"),
    {
      pauseSlideshow: !current
    }
  );

};

const toggleCalmMode = async (
  current: boolean
) => {

  await updateDoc(
    doc(db, "eventControl", "live"),
    {
      calmMode: !current
    }
  );

};
  return (
    <main className="min-h-screen bg-[#081226] text-white p-8">

      <div className="max-w-7xl mx-auto">

        <div className="flex items-center justify-between mb-10 flex-wrap gap-6">

          <div>
            <h1 className="text-5xl font-bold mb-2">
              Admin Dashboard
            </h1>

            <p className="text-white/70 text-lg">
              Moderate uploaded photos and messages
            </p>
          </div>

          <div className="flex gap-4 flex-wrap">

            <button
              onClick={selectAllPending}
              className="bg-white text-black px-5 py-3 rounded-xl font-semibold hover:bg-gray-200 transition"
            >
              Select All Pending
            </button>

            <button
              onClick={selectAllApproved}
              className="bg-blue-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-blue-500 transition"
            >
              Select All Approved
            </button>

            <button
              onClick={clearSelection}
              className="bg-gray-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-gray-500 transition"
            >
              Clear Selection
            </button>

            <button
              onClick={approveSelectedPhotos}
              disabled={selectedPhotos.length === 0}
              className="bg-green-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-green-500 transition disabled:opacity-40"
            >
              Approve Selected ({selectedPhotos.length})
            </button>

            <button
              onClick={deleteSelectedPhotos}
              disabled={selectedPhotos.length === 0}
              className="bg-red-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-red-500 transition disabled:opacity-40"
            >
              Delete Selected ({selectedPhotos.length})
            </button>

            <button
              onClick={downloadSelectedPhotos}
              disabled={selectedPhotos.length === 0}
              className="bg-purple-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-purple-500 transition disabled:opacity-40"
            >
              Download Selected ({selectedPhotos.length})
            </button>

            <button
              onClick={downloadMessages}
              className="bg-pink-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-pink-500 transition"
            >
              Download Messages
            </button>

          </div>

        </div>

        <div>

          <h2 className="text-4xl font-bold mb-8">
            Pending Photos
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-20">

            {photos
              .filter((photo) => !photo.approved)
              .map((photo) => (

                <div
                  key={photo.id}
                  className="relative bg-white rounded-2xl overflow-hidden shadow-2xl"
                >

                  <div className="absolute top-3 left-3 z-20">

                    <input
                      type="checkbox"
                      checked={selectedPhotos.includes(photo.id)}
                      onChange={() => togglePhotoSelection(photo.id)}
                      className="w-6 h-6 accent-green-500 cursor-pointer"
                    />

                  </div>

                  <div className="absolute top-3 right-3 z-20 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                    Pending
                  </div>

                  <img
                    src={photo.imageUrl}
                    alt="Uploaded"
                    className="w-full h-72 object-cover"
                  />

                  <div className="p-5 flex gap-3">

                    <button
                      onClick={() => approvePhoto(photo.id)}
                      className="flex-1 bg-green-600 hover:bg-green-500 text-white font-semibold py-3 rounded-xl transition"
                    >
                      Approve
                    </button>

                    <button
                      onClick={() => deletePhoto(photo.id)}
                      className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-3 rounded-xl transition"
                    >
                      Delete
                    </button>

                  </div>

                </div>

              ))}

          </div>

        </div>

        <div className="mb-24">

          <h2 className="text-3xl font-bold mb-6 text-white/80">
            Approved Photos
          </h2>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4">

            {photos
              .filter((photo) => photo.approved)
              .map((photo) => (

                <div
                  key={photo.id}
                  className="relative group"
                >

                  <input
                    type="checkbox"
                    checked={selectedPhotos.includes(photo.id)}
                    onChange={() => togglePhotoSelection(photo.id)}
                    className="absolute top-2 left-2 z-20 w-5 h-5 accent-red-500 cursor-pointer"
                  />

                  <img
                    src={photo.imageUrl}
                    alt="Approved"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                    className="w-full aspect-square object-cover rounded-xl border border-white/10"
                  />

                  <button
                    onClick={() => deletePhoto(photo.id)}
                    className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-sm font-bold rounded-xl"
                  >
                    Delete
                  </button>

                </div>

              ))}

          </div>

        </div>

        {/* LIVE EVENT CONTROLS */}

<div className="mb-16">

  <h2 className="text-4xl font-bold mb-6">
    Live Controls
  </h2>

  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">

    <button
      onClick={triggerCupDraw}
      className="bg-blue-600 text-white p-4 rounded-2xl font-bold"
    >
      START DRAW
    </button>

    <button
      onClick={closeCupDraw}
      className="bg-zinc-800 text-white p-4 rounded-2xl font-bold"
    >
      CLOSE DRAW
    </button>

    <button
      onClick={triggerThankYou}
      className="bg-yellow-500 text-black p-4 rounded-2xl font-bold"
    >
      THANK YOU
    </button>

    <button
      onClick={() => togglePause(false)}
      className="bg-red-600 text-white p-4 rounded-2xl font-bold"
    >
      PAUSE
    </button>

  </div>

</div>

        <div className="mt-24">

          <h2 className="text-4xl font-bold mb-8">
            Guestbook Messages
          </h2>

          <div className="grid gap-6">

            {messages.map((message) => (

              <div
                key={message.id}
                className="bg-white/10 border border-white/10 rounded-3xl p-6 backdrop-blur-md"
              >

                <div className="flex justify-between items-start gap-6 flex-wrap">

                  <div className="flex-1">

                    {editingId === message.id ? (

                      <div className="space-y-4">

                        <input
                          value={editedName}
                          onChange={(e) =>
                            setEditedName(e.target.value)
                          }
                          className="w-full rounded-xl bg-white text-black p-4 text-xl font-semibold"
                        />

                        <textarea
                          value={editedMessage}
                          onChange={(e) =>
                            setEditedMessage(e.target.value)
                          }
                          rows={6}
                          className="w-full rounded-2xl bg-white text-black p-4 text-lg"
                        />

                        <div className="flex gap-3">

                          <button
                            onClick={() =>
                              saveMessageEdit(message.id)
                            }
                            className="bg-green-600 hover:bg-green-500 px-5 py-3 rounded-xl font-semibold transition"
                          >
                            Save Changes
                          </button>

                          <button
                            onClick={() =>
                              setEditingId(null)
                            }
                            className="bg-gray-600 hover:bg-gray-500 px-5 py-3 rounded-xl font-semibold transition"
                          >
                            Cancel
                          </button>

                        </div>

                      </div>

                    ) : (

                      <>

                        <p className="text-2xl font-bold mb-3 text-[#D9F3FF]">
                          {message.name}
                        </p>

                        <p className="text-white/80 text-lg leading-relaxed whitespace-pre-wrap">
                          {message.message}
                        </p>

                      </>

                    )}

                  </div>

                  <div className="flex gap-3 flex-wrap">

                    <button
                      onClick={() => {

                        setEditingId(message.id);

                        setEditedName(message.name);

                        setEditedMessage(message.message);

                      }}
                      className="bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-xl font-semibold transition"
                    >
                      Edit
                    </button>

                    {!message.approved && (

                      <button
                        onClick={() => approveMessage(message.id)}
                        className="bg-green-600 hover:bg-green-500 px-5 py-3 rounded-xl font-semibold transition"
                      >
                        Approve
                      </button>

                    )}

                    <button
                      onClick={() => deleteMessage(message.id)}
                      className="bg-red-600 hover:bg-red-500 px-5 py-3 rounded-xl font-semibold transition"
                    >
                      Delete
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

        </div>

      </div>

    </main>
  );
}
