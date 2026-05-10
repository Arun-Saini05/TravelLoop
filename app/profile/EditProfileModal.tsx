"use client";

import { useState } from "react";
import { updateProfile } from "@/app/actions/profile";
import styles from "./Profile.module.css";

type Props = {
  initialFirstName: string | null;
  initialLastName: string | null;
  initialEmail: string;
};

export function EditProfileModal({ initialFirstName, initialLastName, initialEmail }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [firstName, setFirstName] = useState(initialFirstName || "");
  const [lastName, setLastName] = useState(initialLastName || "");
  const [email, setEmail] = useState(initialEmail || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({ firstName, lastName, email });
      setIsOpen(false);
    } catch (error) {
      console.error(error);
      alert("Failed to update profile. Email might already be in use.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className={styles.actionBtnGhost}
        onClick={() => setIsOpen(true)}
      >
        Edit Details
      </button>

      {isOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Edit Profile Details</h3>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.modalField}>
                <label htmlFor="firstName" className={styles.modalLabel}>First Name</label>
                <input 
                  id="firstName"
                  type="text" 
                  autoFocus
                  required
                  placeholder="John" 
                  className={styles.modalInput}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div className={styles.modalField}>
                <label htmlFor="lastName" className={styles.modalLabel}>Last Name</label>
                <input 
                  id="lastName"
                  type="text" 
                  required
                  placeholder="Doe" 
                  className={styles.modalInput}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <div className={styles.modalField}>
                <label htmlFor="email" className={styles.modalLabel}>Email</label>
                <input 
                  id="email"
                  type="email" 
                  required
                  placeholder="you@example.com" 
                  className={styles.modalInput}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  className={`${styles.modalBtn} ${styles.modalBtnCancel}`}
                  onClick={() => setIsOpen(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={`${styles.modalBtn} ${styles.modalBtnSave}`}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
