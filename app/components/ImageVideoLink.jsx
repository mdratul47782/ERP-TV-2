"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";

export default function MediaLinksEditor() {
  const { auth } = useAuth();
  const [editing, setEditing] = useState(false);
  const [imageSrc, setImageSrc] = useState("");
  const [videoSrc, setVideoSrc] = useState("");
  const [savedData, setSavedData] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch existing media links on mount
  useEffect(() => {
    if (!auth?.id) return;
    
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/media-links?userId=${auth.id}`);
        const json = await res.json();
        
        if (json.data) {
          setSavedData(json.data);
          setImageSrc(json.data.imageSrc || "");
          setVideoSrc(json.data.videoSrc || "");
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [auth?.id]);

  const isValidUrl = (u) => {
    if (!u) return true;
    try { new URL(u); return true; } catch { return false; }
  };

  const imageOk = isValidUrl(imageSrc);
  const videoOk = isValidUrl(videoSrc);

  const handleSave = async () => {
    setStatus(null);
    if (!imageOk || !videoOk) {
      setStatus({ type: "error", msg: "Please enter valid URLs" });
      return;
    }

    const payload = {
      userId: auth.id,
      userName: auth.user_name,
      imageSrc: imageSrc?.trim() || "",
      videoSrc: videoSrc?.trim() || "",
    };

    try {
      // Use POST if no saved data, PATCH if updating
      const method = savedData ? "PATCH" : "POST";
      const res = await fetch("/api/media-links", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Save failed");
      }

      setSavedData(json.data);
      setEditing(false);
      setStatus({ type: "ok", msg: "Saved successfully!" });
    } catch (error) {
      setStatus({ type: "error", msg: error.message });
    }
  };

  const handleCancel = () => {
    setStatus(null);
    if (savedData) {
      setImageSrc(savedData.imageSrc || "");
      setVideoSrc(savedData.videoSrc || "");
    } else {
      setImageSrc("");
      setVideoSrc("");
    }
    setEditing(false);
  };

  if (!auth) {
    return (
      <div className="text-center text-red-600 py-4">
        Please log in to manage media links.
      </div>
    );
  }

  if (loading) {
    return <div className="text-center text-slate-400 py-4">Loading...</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="rounded-lg bg-slate-900 p-4 shadow-lg border border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-100">Media Links</h2>
          {!editing ? (
            <button
              className="rounded px-3 py-1 text-xs bg-slate-700 text-slate-200 hover:bg-slate-600"
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                className="rounded px-3 py-1 text-xs bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                onClick={handleSave}
                disabled={!imageOk || !videoOk}
              >
                Save
              </button>
              <button
                className="rounded px-3 py-1 text-xs bg-slate-700 text-slate-200 hover:bg-slate-600"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Status Message */}
        {status && (
          <div
            className={`text-xs mb-2 ${
              status.type === "ok" ? "text-emerald-400" : "text-rose-400"
            }`}
          >
            {status.msg}
          </div>
        )}

        {/* Display Mode */}
        {!editing && (
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-slate-400 mb-1">Image URL</div>
              {imageSrc ? (
                <a
                  href={imageSrc}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-300 underline break-all"
                >
                  {imageSrc}
                </a>
              ) : (
                <span className="text-slate-500">—</span>
              )}
            </div>
            <div>
              <div className="text-slate-400 mb-1">Video URL</div>
              {videoSrc ? (
                <a
                  href={videoSrc}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-300 underline break-all"
                >
                  {videoSrc}
                </a>
              ) : (
                <span className="text-slate-500">—</span>
              )}
            </div>
          </div>
        )}

        {/* Edit Mode */}
        {editing && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-300 mb-1 block">
                Image URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageSrc}
                onChange={(e) => setImageSrc(e.target.value)}
                className={`w-full rounded border bg-slate-800 text-slate-100 px-3 py-1.5 text-sm outline-none ${
                  imageOk
                    ? "border-slate-700 focus:border-emerald-500"
                    : "border-rose-500"
                }`}
              />
            </div>
            <div>
              <label className="text-xs text-slate-300 mb-1 block">
                Video URL
              </label>
              <input
                type="url"
                placeholder="https://example.com/video.mp4"
                value={videoSrc}
                onChange={(e) => setVideoSrc(e.target.value)}
                className={`w-full rounded border bg-slate-800 text-slate-100 px-3 py-1.5 text-sm outline-none ${
                  videoOk
                    ? "border-slate-700 focus:border-emerald-500"
                    : "border-rose-500"
                }`}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}