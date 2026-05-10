"use client";

import { useMemo, useState, useTransition } from "react";
import {
  addChecklistCategory,
  addChecklistItem,
  deleteChecklistCategory,
  deleteChecklistItem,
  resetChecklist,
  toggleChecklistItem,
} from "@/app/actions/checklist";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  IconButton,
  Input,
  PageContainer,
} from "@/components/ui";

type Item = {
  id: string;
  label: string;
  isPacked: boolean;
};

type Category = {
  id: string;
  name: string;
  items: Item[];
};

type Props = {
  tripId: string;
  tripName: string;
  categories: Category[];
  uncategorized: Item[];
};

export function ChecklistClient({
  tripId,
  tripName,
  categories: initialCategories,
  uncategorized: initialUncategorized,
}: Props) {
  const [categories, setCategories] = useState(initialCategories);
  const [uncategorized, setUncategorized] = useState(initialUncategorized);
  const [error, setError] = useState<string | null>(null);

  const [newItemDrafts, setNewItemDrafts] = useState<Record<string, string>>({});
  const [newCategoryName, setNewCategoryName] = useState("");

  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingDeleteCategoryId, setPendingDeleteCategoryId] = useState<string | null>(null);
  const [pendingAddCategoryKey, setPendingAddCategoryKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const allItems = useMemo(() => {
    const list: Item[] = [];
    for (const c of categories) list.push(...c.items);
    list.push(...uncategorized);
    return list;
  }, [categories, uncategorized]);

  const totalItems = allItems.length;
  const packedItems = allItems.filter((i) => i.isPacked).length;
  const progressPct = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;

  function setItemPacked(itemId: string, isPacked: boolean) {
    setCategories((prev) =>
      prev.map((c) => ({
        ...c,
        items: c.items.map((i) => (i.id === itemId ? { ...i, isPacked } : i)),
      }))
    );
    setUncategorized((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, isPacked } : i))
    );
  }

  function handleToggle(item: Item) {
    setError(null);
    setPendingItemId(item.id);
    const target = !item.isPacked;
    setItemPacked(item.id, target);
    const fd = new FormData();
    fd.set("itemId", item.id);
    fd.set("isPacked", target ? "true" : "false");
    startTransition(async () => {
      const res = await toggleChecklistItem({}, fd);
      setPendingItemId(null);
      if (res.error) {
        setError(res.error);
        setItemPacked(item.id, !target);
      }
    });
  }

  function handleDelete(item: Item) {
    if (!window.confirm(`Remove "${item.label}"?`)) return;
    setError(null);
    setPendingDeleteId(item.id);
    const fd = new FormData();
    fd.set("itemId", item.id);
    startTransition(async () => {
      const res = await deleteChecklistItem({}, fd);
      setPendingDeleteId(null);
      if (res.error) {
        setError(res.error);
        return;
      }
      setCategories((prev) =>
        prev.map((c) => ({ ...c, items: c.items.filter((i) => i.id !== item.id) }))
      );
      setUncategorized((prev) => prev.filter((i) => i.id !== item.id));
    });
  }

  function handleAddItem(categoryKey: string, categoryId: string | null) {
    const label = (newItemDrafts[categoryKey] ?? "").trim();
    if (!label) return;
    setError(null);
    setPendingAddCategoryKey(categoryKey);
    const fd = new FormData();
    fd.set("tripId", tripId);
    fd.set("label", label);
    fd.set("categoryId", categoryId ?? "none");
    startTransition(async () => {
      const res = await addChecklistItem({}, fd);
      setPendingAddCategoryKey(null);
      if (res.error) {
        setError(res.error);
        return;
      }
      window.location.reload();
    });
  }

  function handleAddCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    setError(null);
    const fd = new FormData();
    fd.set("tripId", tripId);
    fd.set("name", name);
    startTransition(async () => {
      const res = await addChecklistCategory({}, fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      window.location.reload();
    });
  }

  function handleDeleteCategory(catId: string) {
    if (!window.confirm("Remove this category? Items inside it will become Uncategorized.")) return;
    setError(null);
    setPendingDeleteCategoryId(catId);
    const fd = new FormData();
    fd.set("categoryId", catId);
    startTransition(async () => {
      const res = await deleteChecklistCategory({}, fd);
      setPendingDeleteCategoryId(null);
      if (res.error) {
        setError(res.error);
        return;
      }
      window.location.reload();
    });
  }

  function handleReset() {
    if (!window.confirm("Reset all items to unpacked?")) return;
    setError(null);
    const fd = new FormData();
    fd.set("tripId", tripId);
    startTransition(async () => {
      const res = await resetChecklist({}, fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      setCategories((prev) =>
        prev.map((c) => ({
          ...c,
          items: c.items.map((i) => ({ ...i, isPacked: false })),
        }))
      );
      setUncategorized((prev) => prev.map((i) => ({ ...i, isPacked: false })));
    });
  }

  return (
    <PageContainer width="narrow">
      <Card padded className="mb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-700">
              Packing checklist
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">
              {tripName}
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              Tick items off as you pack. Saved across devices.
            </p>
          </div>
          {totalItems > 0 && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleReset}
            >
              Reset all
            </Button>
          )}
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-xs font-semibold text-zinc-700">
              Progress: {packedItems}/{totalItems} packed
            </span>
            <span className="text-xs text-zinc-500">{progressPct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </Card>

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="space-y-4">
        {categories.length === 0 && uncategorized.length === 0 && (
          <EmptyState
            icon="🎒"
            title="No items yet"
            description="Add a category or just start typing items below."
          />
        )}

        {categories.map((cat) => {
          const packed = cat.items.filter((i) => i.isPacked).length;
          const total = cat.items.length;
          return (
            <Card padded key={cat.id}>
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold tracking-tight text-zinc-900">
                    {cat.name}
                  </h2>
                  <Badge tone="neutral" size="xs">
                    {packed}/{total}
                  </Badge>
                </div>
                <IconButton
                  aria-label={`Delete category ${cat.name}`}
                  tone="danger"
                  size="sm"
                  onClick={() => handleDeleteCategory(cat.id)}
                  disabled={pendingDeleteCategoryId === cat.id}
                  title="Delete category"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  </svg>
                </IconButton>
              </div>

              <ul className="space-y-1.5">
                {cat.items.map((item) => (
                  <ChecklistRow
                    key={item.id}
                    item={item}
                    pending={pendingItemId === item.id}
                    deleting={pendingDeleteId === item.id}
                    onToggle={() => handleToggle(item)}
                    onDelete={() => handleDelete(item)}
                  />
                ))}
              </ul>

              <div className="mt-3 flex items-center gap-2">
                <Input
                  type="text"
                  size="sm"
                  value={newItemDrafts[cat.id] ?? ""}
                  onChange={(e) =>
                    setNewItemDrafts((prev) => ({ ...prev, [cat.id]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddItem(cat.id, cat.id);
                  }}
                  placeholder={`Add an item to ${cat.name}…`}
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => handleAddItem(cat.id, cat.id)}
                  disabled={
                    pendingAddCategoryKey === cat.id ||
                    !(newItemDrafts[cat.id] ?? "").trim()
                  }
                >
                  +
                </Button>
              </div>
            </Card>
          );
        })}

        {uncategorized.length > 0 && (
          <Card padded>
            <h2 className="mb-3 text-sm font-semibold tracking-tight text-zinc-900">
              Other items
            </h2>
            <ul className="space-y-1.5">
              {uncategorized.map((item) => (
                <ChecklistRow
                  key={item.id}
                  item={item}
                  pending={pendingItemId === item.id}
                  deleting={pendingDeleteId === item.id}
                  onToggle={() => handleToggle(item)}
                  onDelete={() => handleDelete(item)}
                />
              ))}
            </ul>
          </Card>
        )}

        <Card variant="dashed" padded>
          <h2 className="text-sm font-semibold tracking-tight text-zinc-900">
            Quick add
          </h2>

          <div className="mt-2 flex items-center gap-2">
            <Input
              type="text"
              size="sm"
              value={newItemDrafts["__uncat"] ?? ""}
              onChange={(e) =>
                setNewItemDrafts((prev) => ({ ...prev, __uncat: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddItem("__uncat", null);
              }}
              placeholder="Add an item to Other items…"
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => handleAddItem("__uncat", null)}
              disabled={
                pendingAddCategoryKey === "__uncat" ||
                !(newItemDrafts["__uncat"] ?? "").trim()
              }
            >
              + Item
            </Button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Input
              type="text"
              size="sm"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddCategory();
              }}
              placeholder="New category (e.g. Documents, Electronics)"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddCategory}
              disabled={!newCategoryName.trim()}
            >
              + Category
            </Button>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}

function ChecklistRow({
  item,
  pending,
  deleting,
  onToggle,
  onDelete,
}: {
  item: Item;
  pending: boolean;
  deleting: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition hover:bg-zinc-50">
      <input
        type="checkbox"
        checked={item.isPacked}
        onChange={onToggle}
        disabled={pending}
        className="h-4 w-4 shrink-0 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
      />
      <span
        className={`flex-1 text-sm transition ${
          item.isPacked ? "text-zinc-400 line-through" : "text-zinc-800"
        }`}
      >
        {item.label}
      </span>
      <IconButton
        aria-label={`Remove ${item.label}`}
        tone="danger"
        size="sm"
        onClick={onDelete}
        disabled={deleting}
        title="Remove"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </IconButton>
    </li>
  );
}
