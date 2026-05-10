"use client";

import { useState, useRef, useEffect } from "react";
import styles from "./Profile.module.css";

type Props = {
  initialPhotoUrl?: string | null;
  avatarInitial: string;
  displayName: string;
};

export function ProfileAvatarClient({ initialPhotoUrl, avatarInitial, displayName }: Props) {
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialPhotoUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if there is a locally saved avatar on this device
    const localAvatar = localStorage.getItem("traveloop_local_avatar");
    if (localAvatar) {
      setPhotoPreview(localAvatar);
    }
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Use FileReader to convert the image to a base64 string
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPhotoPreview(base64String);
        // Save to current device only (localStorage)
        localStorage.setItem("traveloop_local_avatar", base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className={styles.avatarContainer}>
      <div 
        className={styles.avatarWrap} 
        onClick={() => fileInputRef.current?.click()} 
        style={{ cursor: "pointer" }}
        title="Change profile photo"
      >
        {photoPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoPreview}
            alt={`${displayName} profile photo`}
            className={styles.avatarImage}
          />
        ) : (
          <span className={styles.avatarFallback} aria-hidden='true'>
            {avatarInitial}
          </span>
        )}
      </div>
      <button 
        type="button" 
        className={styles.addPhotoBtn}
        onClick={() => fileInputRef.current?.click()}
      >
        Add a photo
      </button>
      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef} 
        style={{ display: "none" }} 
        onChange={handlePhotoChange}
      />
    </div>
  );
}
