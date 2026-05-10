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

export default function ChecklistClient({ trips }: { trips: { id: string; name: string }[] }) {
  const [categories, setCategories] = useState<ChecklistCategory[]>(INITIAL_DATA);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState("");
  // We'll safely fallback to the first category if categories array is not empty
  const [newItemCategory, setNewItemCategory] = useState(INITIAL_DATA[0]?.id || "");

  // Category addition state
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Trip selection state
  const [selectedTripId, setSelectedTripId] = useState(trips.length > 0 ? trips[0].id : "");
  
  const currentTripName = trips.find(t => t.id === selectedTripId)?.name || "Paris & Rome Adventure";

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

  // Remove item
  const handleRemoveItem = (categoryId: string, itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCategories(prev => prev.map(cat => {
      if (cat.id !== categoryId) return cat;
      return {
        ...cat,
        items: cat.items.filter(item => item.id !== itemId)
      };
    }));
  };

  // Remove category
  const handleRemoveCategory = (categoryId: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
  };

  // Add new item
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemLabel.trim() || !newItemCategory) return;

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

  // Add new category
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    const newCatId = `cat-${Date.now()}`;
    setCategories(prev => [
      ...prev,
      {
        id: newCatId,
        name: newCategoryName.trim(),
        items: []
      }
    ]);
    
    // Auto-select the newly created category if user wants to add an item next
    setNewItemCategory(newCatId);
    setNewCategoryName("");
    setShowAddCategoryModal(false);
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
          <div style={{ position: "relative", display: "inline-block", marginBottom: "24px" }}>
            <select 
              className={styles.tripSelector}
              value={selectedTripId}
              onChange={(e) => setSelectedTripId(e.target.value)}
              style={{ appearance: "none", paddingRight: "36px" }}
            >
              {trips.length > 0 ? (
                trips.map(trip => (
                  <option key={trip.id} value={trip.id}>
                    Trip: {trip.name}
                  </option>
                ))
              ) : (
                <option value="">Trip: Paris & Rome Adventure</option>
              )}
            </select>
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>

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
                  <div className={styles.categoryActions}>
                    <span className={styles.categoryCount}>{catPacked}/{catTotal}</span>
                    <button 
                      className={styles.deleteCategoryBtn}
                      onClick={() => handleRemoveCategory(cat.id)}
                      title="Remove category"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
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
                      <button 
                        className={styles.deleteItemBtn}
                        onClick={(e) => handleRemoveItem(cat.id, item.id, e)}
                        title="Remove item"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    </label>
                  ))}
                  {cat.items.length === 0 && (
                    <div style={{ padding: "8px", color: "var(--tl-text-muted)", fontSize: "0.9rem", fontStyle: "italic" }}>
                      No items in this category.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          <div className={styles.addCategoryContainer}>
            <button 
              className={styles.addCategoryBtn}
              onClick={() => setShowAddCategoryModal(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add New Category
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionGroup}>
          <button 
            className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
            onClick={() => {
              if (categories.length === 0) {
                alert("Please add a category first.");
                return;
              }
              setNewItemCategory(categories[0].id);
              setShowAddModal(true);
            }}
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
                  required
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

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add New Category</h3>
            </div>
            
            <form onSubmit={handleAddCategory} className={styles.modalForm}>
              <div className={styles.modalField}>
                <label htmlFor="categoryName" className={styles.modalLabel}>Category Name</label>
                <input 
                  id="categoryName"
                  type="text" 
                  autoFocus
                  required
                  placeholder="e.g., Toiletries, Snacks..." 
                  className={styles.modalInput}
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              </div>

              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  className={`${styles.modalBtn} ${styles.modalBtnCancel}`}
                  onClick={() => setShowAddCategoryModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className={`${styles.modalBtn} ${styles.modalBtnAdd}`}
                >
                  Create Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
