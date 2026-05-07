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

  const deleteMessage = async (id: string) => {
    try {
      await deleteDoc(doc(db, "guestbook", id));
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  return (
    <main className="min-h-screen bg-[#081226] text-white p-8">

      <div className="max-w-7xl mx-auto">

        {/* Header */}
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

      </div>

    </main>
  );
}