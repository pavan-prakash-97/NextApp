"use client";

import { useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { userApi } from "@/app/lib/api-client";
import { motion, AnimatePresence } from "framer-motion";

export default function UpdateProfileForm() {
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [image, setImage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // read-only fields from Prisma User model
  const [id, setId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messageTimeoutRef = useRef<number | null>(null);
  // For cropping/resizing workflow
  const [origFile, setOrigFile] = useState<File | null>(null);
  const [origUrl, setOrigUrl] = useState<string | null>(null);
  // react-easy-crop states
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [outputSize, setOutputSize] = useState<number>(512); // px square output
  const [processing, setProcessing] = useState<boolean>(false);
  const [showCropModal, setShowCropModal] = useState<boolean>(false);
  const origImageRef = useRef<HTMLImageElement | null>(null);

  const handleFile = (file?: File | null) => {
    if (!file) return;
    // Prepare cropping workflow: keep original file and object URL for preview
    if (origUrl) {
      URL.revokeObjectURL(origUrl);
    }
    const url = URL.createObjectURL(file);
    setOrigFile(file);
    setOrigUrl(url);
    // reset preview / crop settings and open modal
    setProcessing(false);
    setShowCropModal(true);
  };

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0] ?? null;
    handleFile(file);
  };

  const onDrop: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0] ?? null;
    handleFile(file);
  };

  const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  // Helpers for interactive crop (react-easy-crop)
  const createImage = (url: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.addEventListener("load", () => resolve(img));
      img.addEventListener("error", (err) => reject(err));
      img.setAttribute("crossOrigin", "anonymous");
      img.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: Area,
    outputSizePx: number
  ) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    canvas.width = outputSizePx;
    canvas.height = outputSizePx;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not get canvas context");

    // draw the cropped area from the source image to the canvas, scaling to output size
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      outputSizePx,
      outputSizePx
    );

    return canvas.toDataURL("image/jpeg", 0.92);
  };

  const applyCrop = async () => {
    if (!origUrl || !croppedAreaPixels) return;
    setProcessing(true);
    try {
      const dataUrl = await getCroppedImg(
        origUrl,
        croppedAreaPixels,
        Math.max(64, Math.min(2048, outputSize))
      );
      setImage(dataUrl);
      // cleanup
      if (origUrl) URL.revokeObjectURL(origUrl);
      setOrigUrl(null);
      setOrigFile(null);
      setShowCropModal(false);
    } catch (err) {
      console.error("Apply crop failed", err);
      setError("Failed to process image");
    } finally {
      setProcessing(false);
    }
  };

  const cancelCrop = () => {
    if (origUrl) URL.revokeObjectURL(origUrl);
    setOrigUrl(null);
    setOrigFile(null);
    setShowCropModal(false);
  };

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        const data = await userApi.getProfile();
        // API returns { user: { ... } }
        const user = data?.user ?? data;
        console.log("user>>>>", user);
        if (!mounted) return;
        const fullName = user?.name ?? "";
        const parts = fullName.trim() ? fullName.trim().split(/\s+/) : [];
        const first = parts.length ? parts.shift() || "" : "";
        const last = parts.length ? parts.join(" ") : "";
        setFirstName(first);
        setLastName(last);
        setImage(user?.image || "");
        setRole(user?.role || null);

        // Populate read-only fields when available
        setId(user?.id ?? null);
        setEmail(user?.email ?? null);
        // emailVerified removed from UI per request
        setCreatedAt(
          user?.createdAt ? new Date(user.createdAt).toLocaleString() : null
        );
        setUpdatedAt(
          user?.updatedAt ? new Date(user.updatedAt).toLocaleString() : null
        );
      } catch (err) {
        console.error("Failed to load profile", err);
        if (!mounted) return;
        setError("Failed to load profile");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    setSubmitting(true);

    try {
      // Only send fields the server accepts (name and image url/string)
      const payload: { name?: string; image?: string } = {};
      const combinedName = `${firstName || ""}${
        lastName ? ` ${lastName}` : ""
      }`.trim();
      if (combinedName) payload.name = combinedName;
      if (image !== undefined && image !== "") payload.image = image;

      const res = await userApi.updateProfile(payload);
      console.log("updateProfile response", res);
      setMessage("Profile updated successfully.");
      // clear any existing timeout
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
      // hide the message after 5 seconds
      messageTimeoutRef.current = window.setTimeout(() => {
        setMessage(null);
        messageTimeoutRef.current = null;
      }, 5000);
    } catch (err) {
      console.error("Profile update failed", err);
      setError((err as Error)?.message || "Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  };

  // cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  // Revoke object URL when it changes or when component unmounts
  useEffect(() => {
    return () => {
      if (origUrl) URL.revokeObjectURL(origUrl);
    };
  }, [origUrl]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="mt-6 p-6 bg-white text-gray-900 rounded-xl max-w-2xl shadow-md border border-gray-100 backdrop-blur-sm"
    >
      <div className="flex justify-between">
        <h2 className="text-xl font-semibold mb-4">Edit Profile</h2>
        <div>
          {message && <p className="text-green-600">{message}</p>}
          {error && <p className="text-red-600">{error}</p>}
        </div>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading profile…</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Top: avatar + read-only metadata */}
          <div className="flex items-center gap-6">
            <div className="flex flex-col gap-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className={`flex-shrink-0 cursor-pointer transition-all duration-200 ${
                  dragOver
                    ? "ring-4 ring-indigo-300 rounded-full shadow-lg"
                    : ""
                }`}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  className="hidden"
                />
                {image ? (
                  <img
                    src={image}
                    alt="Avatar"
                    className="h-24 w-24 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                    {/* simple user SVG icon */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="40"
                      height="40"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-gray-400"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-3-3.87"></path>
                      <path d="M4 21v-2a4 4 0 0 1 3-3.87"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                )}
              </motion.div>
              <div className="text-center text-xs">
                {role?.toLocaleUpperCase()}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 w-full">
              <div>
                <label className="block text-sm font-medium text-gray-600">
                  User ID
                </label>

                <div
                  className="
                    mt-1 
                    w-full 
                    rounded-md 
                    border 
                    border-gray-200 
                    px-3 
                    py-2 
                    bg-gray-50 
                    text-gray-700 
                    text-sm
                  "
                >
                  {id ?? "—"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600">
                  Email
                </label>

                <div
                  className="
                    mt-1 
                    w-full 
                    rounded-md 
                    border 
                    border-gray-200 
                    px-3 
                    py-2 
                    bg-gray-50 
                    text-gray-700 
                    text-sm
                  "
                >
                  {email ?? "—"}
                </div>
              </div>
            </div>
          </div>

          {/* Editable fields: first & last name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First name
              </label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-200 px-3 py-2 bg-white text-gray-900 transition-all duration-200 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                placeholder="First name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last name
              </label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-200 px-3 py-2 bg-white text-gray-900 transition-all duration-200 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400"
                placeholder="Last name"
              />
            </div>
          </div>

          {/* Image crop / preview panel (shows when a file has been selected) */}
          {origUrl ? (
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <div className="md:flex md:items-start md:gap-6">
                <div className="flex-shrink-0">
                  <img
                    src={origUrl}
                    alt="Original"
                    ref={origImageRef}
                    className="h-40 w-40 object-contain rounded-md border"
                  />
                </div>

                <div className="mt-3 md:mt-0 md:flex-1">
                  <div className="flex items-start gap-3">
                    <div className="text-sm text-gray-600">
                      A crop modal will open so you can select and move the crop
                      area.
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCropModal(true)}
                        className="rounded bg-gray-200 px-3 py-1 text-sm"
                      >
                        Open Crop
                      </button>
                      <button
                        type="button"
                        onClick={cancelCrop}
                        className="rounded bg-white border px-3 py-1 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="flex items-center gap-3">
            <div className="flex w-full justify-center mt-6">
              <motion.button
                whileTap={{ scale: 0.97 }}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                type="submit"
                disabled={loading}
                className="
          w-fit bg-gray-800 text-white py-3 px-8 mt-3 rounded-full shadow-md 
          hover:bg-indigo-700 transition disabled:opacity-60
        "
              >
                {submitting ? "Saving..." : "Save changes"}
              </motion.button>
            </div>
          </div>
          {/* Created / Updated timestamps at bottom */}
          <div className="mt-4 text-xs text-gray-500 flex gap-4 justify-between">
            <div>Created: {createdAt ?? "—"}</div>
            <div>Last updated: {updatedAt ?? "—"}</div>
          </div>
        </form>
      )}
      {/* Crop modal overlay */}
      <AnimatePresence>
        {showCropModal && origUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-3xl bg-white rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="p-5">
                <h3 className="text-xl font-semibold mb-4">Crop your image</h3>

                <div className="relative h-96 bg-gray-200 rounded-lg overflow-hidden shadow-inner">
                  <Cropper
                    image={origUrl}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={(c) => setCrop(c)}
                    onZoomChange={(z) => setZoom(z)}
                    onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                  />
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-gray-700">
                      Zoom
                    </label>
                    <input
                      type="range"
                      min={1}
                      max={3}
                      step={0.02}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-full accent-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Output size (px)
                    </label>
                    <select
                      value={outputSize}
                      onChange={(e) => setOutputSize(Number(e.target.value))}
                      className="mt-1 w-full rounded-md border px-2 py-1"
                    >
                      <option value={128}>128</option>
                      <option value={256}>256</option>
                      <option value={512}>512</option>
                      <option value={1024}>1024</option>
                    </select>
                  </div>
                </div>

                <div className="mt-5 flex justify-end gap-3">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={cancelCrop}
                    className="px-4 py-2 rounded-md border bg-white hover:bg-gray-100 transition"
                  >
                    Cancel
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={applyCrop}
                    disabled={processing}
                    className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 shadow disabled:opacity-60"
                  >
                    {processing ? "Processing..." : "Apply Crop"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
