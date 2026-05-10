"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./Checklist.module.css";

type ChecklistItem = {
  id: string;
  label: string;
  isPacked: boolean;
};

type ChecklistCategory = {
  id: string;
  name: string;
  items: ChecklistItem[];
};

const INITIAL_DATA: ChecklistCategory[] = [
  {
    id: "cat-1",
    name: "Documents",
    items: [
      { id: "doc-1", label: "Passport", isPacked: true },
      { id: "doc-2", label: "Flight Tickets (printed)", isPacked: true },
      { id: "doc-3", label: "Travel insurance", isPacked: true },
      { id: "doc-4", label: "hotel booking confirmation", isPacked: false },
    ],
  },
  {
    id: "cat-2",
    name: "Clothing",
    items: [
      { id: "clo-1", label: "Casual Shirts", isPacked: true },
      { id: "clo-2", label: "Trousers / jeans", isPacked: false },
      { id: "clo-3", label: "Comfortable walking shoes", isPacked: false },
      { id: "clo-4", label: "light jacket / windbreaker", isPacked: false },
    ],
  },
  {
    id: "cat-3",
    name: "Electronics",
    items: [
      { id: "ele-1", label: "Phone charger", isPacked: true },
      { id: "ele-2", label: "Universal power adapter", isPacked: false },
      { id: "ele-3", label: "Earphone / headphones", isPacked: false },
      { id: "ele-4", label: "Power bank", isPacked: false }, // Added to make total 12
    ],
  },
];

export default function ChecklistPage() {
  const [categories, setCategories] = useState<ChecklistCategory[]>(INITIAL_DATA);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState("");
  const [newItemCategory, setNewItemCategory] = useState(INITIAL_DATA[0].id);

  // Toggle item packed status
  const toggleItem = (categoryId: string, itemId: string) => {
    setCategories(prev => prev.map(cat => {
      if (cat.id !== categoryId) return cat;
      return {
        ...cat,
        items: cat.items.map(item => 
          item.id === itemId ? { ...item, isPacked: !item.isPacked } : item
        )
      };
    }));
  };

  // Add new item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemLabel.trim()) return;

    setCategories(prev => prev.map(cat => {
      if (cat.id !== newItemCategory) return cat;
      return {
        ...cat,
        items: [
          ...cat.items,
          {
            id: `item-${Date.now()}`,
            label: newItemLabel.trim(),
            isPacked: false,
          }
        ]
      };
    }));
    
    setNewItemLabel("");
    setShowAddModal(false);
  };

  // Reset all items
  const resetAll = () => {
    setCategories(prev => prev.map(cat => ({
      ...cat,
      items: cat.items.map(item => ({ ...item, isPacked: false }))
    })));
  };

  // Calculate totals
  const totalItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);
  const totalPacked = categories.reduce((sum, cat) => sum + cat.items.filter(i => i.isPacked).length, 0);
  const progressPercent = Math.round((totalPacked / totalItems) * 100) || 0;

  return (
    <div className={styles.page}>
      {/* Top Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <svg className={styles.logoIcon} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="14" fill="url(#chkLogoGrad)" />
            <path d="M10 16C10 12.686 12.686 10 16 10C19.314 10 22 12.686 22 16" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <path d="M8 16H24" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M16 8V24" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <ellipse cx="16" cy="16" rx="4" ry="8" stroke="white" strokeWidth="1.5" />
            <defs>
              <linearGradient id="chkLogoGrad" x1="0" y1="0" x2="32" y2="32">
                <stop stopColor="#14b8a6" />
                <stop offset="1" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
          <span className={styles.logoText}>Traveloop</span>
        </div>
        <div className={styles.profileCircle}>T</div>
      </nav>

      <main className={styles.container}>
        {/* Controls Bar */}
        <div className={styles.controlsBar}>
          <div className={styles.searchContainer}>
            <input 
              type="text" 
              placeholder="Search bar ......" 
              className={styles.searchInput}
            />
          </div>
          <div className={styles.controlBtns}>
            <button className={styles.controlBtn}>Group by</button>
            <button className={styles.controlBtn}>Filter</button>
            <button className={styles.controlBtn}>Sort by...</button>
          </div>
        </div>

        {/* Header & Progress */}
        <div className={styles.headerSection}>
          <p className={styles.pageSubtitle}>Packing checklist</p>
          <button className={styles.tripSelector}>
            Trip: Paris &amp; Rome Adventure
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          <div className={styles.progressContainer}>
            <span className={styles.progressText}>Progress: {totalPacked}/{totalItems} items packed</span>
            <div className={styles.progressBarTrack}>
              <div 
                className={styles.progressBarFill} 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className={styles.checklistContainer}>
          {categories.map(cat => {
            const catTotal = cat.items.length;
            const catPacked = cat.items.filter(i => i.isPacked).length;

            return (
              <div key={cat.id} className={styles.categoryBlock}>
                <div className={styles.categoryHeader}>
                  <h3 className={styles.categoryTitle}>{cat.name}</h3>
                  <span className={styles.categoryCount}>{catPacked}/{catTotal}</span>
                </div>
                
                <div className={styles.itemList}>
                  {cat.items.map(item => (
                    <label 
                      key={item.id} 
                      className={`${styles.itemRow} ${item.isPacked ? styles.packed : ""}`}
                    >
                      <input 
                        type="checkbox" 
                        className={styles.itemCheckbox}
                        checked={item.isPacked}
                        onChange={() => toggleItem(cat.id, item.id)}
                      />
                      <span className={styles.itemLabel}>{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className={styles.actionGroup}>
          <button 
            className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
            onClick={() => setShowAddModal(true)}
          >
            + add item to checklist
          </button>
          <button 
            className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
            onClick={resetAll}
          >
            Reset all
          </button>
          <button className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}>
            Share Checklist
          </button>
        </div>
      </main>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add Checklist Item</h3>
            </div>
            
            <form onSubmit={handleAddItem} className={styles.modalForm}>
              <div className={styles.modalField}>
                <label htmlFor="itemName" className={styles.modalLabel}>Item Name</label>
                <input 
                  id="itemName"
                  type="text" 
                  autoFocus
                  required
                  placeholder="e.g., Camera, Sunglasses..." 
                  className={styles.modalInput}
                  value={newItemLabel}
                  onChange={(e) => setNewItemLabel(e.target.value)}
                />
              </div>

              <div className={styles.modalField}>
                <label htmlFor="itemCategory" className={styles.modalLabel}>Category</label>
                <select 
                  id="itemCategory"
                  className={styles.modalSelect}
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  className={`${styles.modalBtn} ${styles.modalBtnCancel}`}
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={`${styles.modalBtn} ${styles.modalBtnAdd}`}
                >
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
