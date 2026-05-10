"use client";

import { useState, useTransition } from "react";
import {
  createShareLink,
  revokeShareLink,
  updateTripVisibility,
} from "@/app/actions/share";
import type { TripVisibility } from "@/app/generated/prisma";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  PageContainer,
} from "@/components/ui";

type ShareLink = {
  id: string;
  slug: string;
  isPublic: boolean;
  allowCopy: boolean;
  visitCount: number;
  createdAt: string;
};

type Props = {
  tripId: string;
  tripName: string;
  isOwner: boolean;
  visibility: TripVisibility;
  shareLinks: ShareLink[];
};

const VISIBILITY_META: Record<
  TripVisibility,
  { label: string; description: string; emoji: string }
> = {
  PRIVATE: {
    emoji: "🔒",
    label: "Private",
    description: "Only you and trip collaborators can see this trip.",
  },
  FRIENDS: {
    emoji: "👥",
    label: "Friends",
    description: "Anyone with the share link can view, but it isn't listed publicly.",
  },
  PUBLIC: {
    emoji: "🌎",
    label: "Public",
    description: "Anyone with the link can view; visible to the community feed.",
  },
};

export function ShareTripClient({
  tripId,
  tripName,
  isOwner,
  visibility: initialVisibility,
  shareLinks: initialLinks,
}: Props) {
  const [visibility, setVisibility] = useState<TripVisibility>(initialVisibility);
  const [links, setLinks] = useState<ShareLink[]>(initialLinks);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pendingVis, startVisTransition] = useTransition();
  const [pendingCreate, startCreateTransition] = useTransition();
  const [pendingRevokeId, setPendingRevokeId] = useState<string | null>(null);
  const [allowCopyDraft, setAllowCopyDraft] = useState(true);

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "";

  function shareUrl(slug: string): string {
    return `${baseUrl}/share/${slug}`;
  }

  function changeVisibility(next: TripVisibility) {
    if (!isOwner || pendingVis || next === visibility) return;
    setError(null);
    const previous = visibility;
    setVisibility(next);
    const fd = new FormData();
    fd.set("tripId", tripId);
    fd.set("visibility", next);
    startVisTransition(async () => {
      const res = await updateTripVisibility({}, fd);
      if (res.error) {
        setError(res.error);
        setVisibility(previous);
      }
    });
  }

  function createLink() {
    if (!isOwner || pendingCreate) return;
    setError(null);
    const fd = new FormData();
    fd.set("tripId", tripId);
    fd.set("allowCopy", allowCopyDraft ? "true" : "false");
    startCreateTransition(async () => {
      const res = await createShareLink({}, fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      window.location.reload();
    });
  }

  function revokeLink(linkId: string) {
    if (!isOwner) return;
    if (!window.confirm("Revoke this link? Anyone using it will lose access.")) return;
    setError(null);
    setPendingRevokeId(linkId);
    const fd = new FormData();
    fd.set("linkId", linkId);
    startCreateTransition(async () => {
      const res = await revokeShareLink({}, fd);
      setPendingRevokeId(null);
      if (res.error) {
        setError(res.error);
        return;
      }
      setLinks((prev) => prev.filter((l) => l.id !== linkId));
    });
  }

  async function copyLink(link: ShareLink) {
    try {
      await navigator.clipboard.writeText(shareUrl(link.slug));
      setCopiedId(link.id);
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      setError("Couldn't copy to clipboard.");
    }
  }

  return (
    <PageContainer width="narrow">
      <Card padded className="mb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-700">
          Share trip
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-zinc-900">
          {tripName}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Send your itinerary to friends, or publish it so anyone with the link can view it.
        </p>
      </Card>

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <Card padded className="mb-5">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-900">
          Who can see this trip?
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          {isOwner
            ? "Only the trip owner can change this."
            : "Only the trip owner can change this — you're a collaborator."}
        </p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {(Object.keys(VISIBILITY_META) as TripVisibility[]).map((key) => {
            const meta = VISIBILITY_META[key];
            const active = visibility === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                disabled={!isOwner || pendingVis}
                onClick={() => changeVisibility(key)}
                className={`flex flex-col items-start gap-1 rounded-2xl border p-3 text-left transition ${
                  active
                    ? "border-teal-600 bg-teal-50/40 ring-2 ring-teal-500/30"
                    : "border-zinc-200 bg-white hover:border-teal-500"
                } ${!isOwner || pendingVis ? "cursor-not-allowed opacity-70" : ""}`}
              >
                <div className="flex w-full items-center gap-2">
                  <span className="text-base" aria-hidden>
                    {meta.emoji}
                  </span>
                  <span className="text-sm font-semibold text-zinc-900">
                    {meta.label}
                  </span>
                  {active && (
                    <Badge tone="brand" size="xs" className="ml-auto">
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-zinc-500">{meta.description}</p>
              </button>
            );
          })}
        </div>
      </Card>

      <Card padded>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-zinc-900">
              Share links
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              Anyone with a link can view this itinerary.{" "}
              {visibility === "PRIVATE" &&
                "Switch visibility above to enable shared viewing."}
            </p>
          </div>
          {isOwner && (
            <div className="flex shrink-0 items-center gap-2">
              <label className="flex items-center gap-1 text-[11px] text-zinc-600">
                <input
                  type="checkbox"
                  checked={allowCopyDraft}
                  onChange={(e) => setAllowCopyDraft(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-zinc-300"
                />
                Allow copy
              </label>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={createLink}
                disabled={visibility === "PRIVATE"}
                loading={pendingCreate}
                title={
                  visibility === "PRIVATE"
                    ? "Set visibility to Friends or Public first"
                    : "Generate a new share link"
                }
              >
                {pendingCreate ? "Creating…" : "+ New link"}
              </Button>
            </div>
          )}
        </div>

        {links.length === 0 ? (
          <EmptyState
            icon="🔗"
            title="No share links yet"
            description={
              isOwner
                ? "Click ‘+ New link’ to generate one."
                : "Ask the trip owner to create a share link."
            }
          />
        ) : (
          <ul className="space-y-2">
            {links.map((link) => {
              const url = shareUrl(link.slug);
              return (
                <li
                  key={link.id}
                  className="rounded-xl border border-zinc-200 bg-zinc-50 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <code className="truncate rounded-md bg-white px-2 py-1 text-[11px] text-zinc-700 ring-1 ring-zinc-200">
                      {url}
                    </code>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => copyLink(link)}
                      >
                        {copiedId === link.id ? "Copied!" : "Copy"}
                      </Button>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-8 items-center justify-center rounded-lg border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                      >
                        Open ↗
                      </a>
                      {isOwner && (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => revokeLink(link.id)}
                          disabled={pendingRevokeId === link.id}
                        >
                          {pendingRevokeId === link.id ? "…" : "Revoke"}
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-zinc-500">
                    <Badge tone={link.allowCopy ? "success" : "neutral"} size="xs">
                      {link.allowCopy ? "Copy enabled" : "View-only"}
                    </Badge>
                    <span>
                      {link.visitCount} visit{link.visitCount === 1 ? "" : "s"}
                    </span>
                    <span className="text-zinc-300">·</span>
                    <span>
                      Created{" "}
                      {new Date(link.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </PageContainer>
  );
}
