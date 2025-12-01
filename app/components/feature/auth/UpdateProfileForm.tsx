"use client";

import { useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { userApi } from "@/app/lib/api-client";

// ⬇️ shadcn/ui components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export default function UpdateProfileForm() {
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [image, setImage] = useState<string>("");
  const [mobileNumber, setMobileNumber] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [id, setId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messageTimeoutRef = useRef<number | null>(null);

  // const [origFile, setOrigFile] = useState<File | null>(null);
  const [origUrl, setOrigUrl] = useState<string | null>(null);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [outputSize, setOutputSize] = useState<number>(512);

  const [processing, setProcessing] = useState<boolean>(false);
  const [showCropModal, setShowCropModal] = useState<boolean>(false);
  const origImageRef = useRef<HTMLImageElement | null>(null);

  const handleFile = (file?: File | null) => {
    if (!file) return;
    if (origUrl) URL.revokeObjectURL(origUrl);

    const url = URL.createObjectURL(file);
    // setOrigFile(file);
    setOrigUrl(url);
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
    handleFile(e.dataTransfer.files?.[0] ?? null);
  };

  const onDragOver: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const onDragLeave: React.DragEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

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
      URL.revokeObjectURL(origUrl);
      setOrigUrl(null);
      // setOrigFile(null);
      setShowCropModal(false);
    } catch {
      setError("Failed to process image");
    } finally {
      setProcessing(false);
    }
  };

  const cancelCrop = () => {
    if (origUrl) URL.revokeObjectURL(origUrl);
    setOrigUrl(null);
    // setOrigFile(null);
    setShowCropModal(false);
  };

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        const data = await userApi.getProfile();
        const user = data?.user ?? data;

        if (!mounted) return;

        const parts = (user?.name ?? "").trim().split(/\s+/);
        setFirstName(parts.shift() || "");
        setLastName(parts.join(" "));
        setImage(user?.image || "");
        setRole(user?.role || null);
        setMobileNumber(user?.mobileNumber || "");
        setId(user?.id ?? null);
        setEmail(user?.email ?? null);
        setCreatedAt(
          user?.createdAt ? new Date(user.createdAt).toLocaleString() : null
        );
        setUpdatedAt(
          user?.updatedAt ? new Date(user.updatedAt).toLocaleString() : null
        );
      } catch {
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
      const payload: { name?: string; image?: string; mobileNumber?: string } =
        {};
      const fullName = `${firstName} ${lastName}`.trim();
      if (fullName) payload.name = fullName;
      if (image) payload.image = image;
      if (mobileNumber) payload.mobileNumber = mobileNumber;

      await userApi.updateProfile(payload);

      setMessage("Profile updated successfully.");
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);

      messageTimeoutRef.current = window.setTimeout(() => {
        setMessage(null);
      }, 5000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update profile");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto mt-6">
      <CardContent className="p-6">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-semibold">Edit Profile</h2>

          <div>
            {message && <p className="text-green-600">{message}</p>}
            {error && <p className="text-red-600">{error}</p>}
          </div>
        </div>

        {loading ? (
          <p className="text-gray-600">Loading profile…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar */}
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={onDrop}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  className={`cursor-pointer h-24 w-24 rounded-full overflow-hidden border ${
                    dragOver ? "ring-4 ring-indigo-300" : ""
                  }`}
                >
                  <input
                    data-testid="file-input"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={onFileChange}
                  />

                  {image ? (
                    <img
                      src={image}
                      alt="avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-100">
                      <span className="text-gray-400 text-sm">No image</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-center">{role}</p>
              </div>

              {/* Read-only fields */}
              <div className="grid grid-cols-1 gap-3 w-full">
                <div>
                  <Label>User ID</Label>
                  <div className="p-2 border rounded bg-gray-50 text-sm">
                    {id ?? "—"}
                  </div>
                </div>

                <div>
                  <Label>Email</Label>
                  <div className="p-2 border rounded bg-gray-50 text-sm">
                    {email ?? "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Editable fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="mobileNumber">Mobile number</Label>
                <Input
                  id="mobileNumber"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  placeholder="+91 0123456789"
                />
              </div>
            </div>

            {/* Crop Preview Panel */}
            {origUrl && (
              <div className="p-4 border rounded bg-gray-50">
                <div className="flex gap-6 items-start">
                  <img
                    src={origUrl}
                    alt="preview"
                    className="h-40 w-40 border rounded object-contain"
                    ref={origImageRef}
                  />
                  <div className="flex-1 text-sm text-gray-600">
                    Crop modal will open where you can adjust the image.
                  </div>
                  <div className="flex gap-2 ml-auto">
                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => setShowCropModal(true)}
                    >
                      Open Crop
                    </Button>
                    <Button
                      variant="outline"
                      type="button"
                      onClick={cancelCrop}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center">
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save changes"}
              </Button>
            </div>

            <div className="flex justify-between text-xs text-gray-500">
              <p>Created: {createdAt ?? "—"}</p>
              <p>Last updated: {updatedAt ?? "—"}</p>
            </div>
          </form>
        )}
      </CardContent>

      {/* Crop Modal */}
      <Dialog open={showCropModal} onOpenChange={setShowCropModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Crop your image</DialogTitle>
          </DialogHeader>

          {origUrl && (
            <div className="space-y-4">
              <div className="relative h-96 bg-gray-200 rounded overflow-hidden">
                <Cropper
                  image={origUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
                />
              </div>

              {/* Zoom Slider */}
              <div>
                <Label>Zoom</Label>
                <Slider
                  min={1}
                  max={3}
                  step={0.02}
                  value={[zoom]}
                  onValueChange={(v) => setZoom(v[0])}
                />
              </div>

              {/* Output Size */}
              <div>
                <Label>Output Size</Label>
                <Select
                  value={String(outputSize)}
                  onValueChange={(v) => setOutputSize(Number(v))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="128">128</SelectItem>
                    <SelectItem value="256">256</SelectItem>
                    <SelectItem value="512">512</SelectItem>
                    <SelectItem value="1024">1024</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={cancelCrop}>
                  Cancel
                </Button>
                <Button onClick={applyCrop} disabled={processing}>
                  {processing ? "Processing..." : "Apply Crop"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
