'use client';

import { useState, useRef } from 'react';
import { uploadProfilePhoto } from '@/app/actions/profile';
import styles from './Profile.module.css';

interface PhotoUploadProps {
  currentPhotoUrl?: string | null;
  displayName: string;
  avatarInitial: string;
}

export function PhotoUpload({ currentPhotoUrl, displayName, avatarInitial }: PhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Optional: add client-side file size validation here as well
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const result = await uploadProfilePhoto(formData);
      if (!result.success) {
        alert(result.error || 'Failed to upload photo');
      }
    } catch (err) {
      console.error(err);
      alert('An unexpected error occurred during upload.');
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAvatarClick = () => {
    if (!isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={styles.avatarWrap} onClick={handleAvatarClick} style={{ cursor: isUploading ? 'wait' : 'pointer', position: 'relative' }}>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={isUploading}
      />
      {currentPhotoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={currentPhotoUrl}
          alt={`${displayName} profile photo`}
          className={styles.avatarImage}
          style={{ opacity: isUploading ? 0.5 : 1 }}
        />
      ) : (
        <span className={styles.avatarFallback} aria-hidden='true' style={{ opacity: isUploading ? 0.5 : 1 }}>
          {avatarInitial}
        </span>
      )}
      {isUploading && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.3)', color: 'white' }}>
          <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
      <div 
        className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 hover:opacity-100 transition-opacity"
        style={{ display: isUploading ? 'none' : 'flex' }}
      >
        <span className="text-white text-xs font-medium">Upload</span>
      </div>
    </div>
  );
}
