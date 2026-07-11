"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, X, CheckCheck, ExternalLink, Info, Calendar, DollarSign, Star, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useNotifications, type Notification } from "@/hooks/useNotifications";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, any> = {
  booking_confirmed: Calendar,
  booking_cancelled: X,
  refund_processed: DollarSign,
  studio_rescheduled: Calendar,
  new_booking: Calendar,
  cancellation_request: AlertTriangle,
  reschedule_request: Calendar,
  new_review: Star,
  studio_approved: CheckCheck,
  studio_rejected: X,
  default: Info,
};

const typeColors: Record<string, string> = {
  booking_confirmed: "text-green-400 bg-green-500/10",
  booking_cancelled: "text-red-400 bg-red-500/10",
  refund_processed: "text-blue-400 bg-blue-500/10",
  studio_rescheduled: "text-yellow-400 bg-yellow-500/10",
  new_booking: "text-[#D9FC67] bg-[#D9FC67]/10",
  cancellation_request: "text-orange-400 bg-orange-500/10",
  reschedule_request: "text-yellow-400 bg-yellow-500/10",
  new_review: "text-purple-400 bg-purple-500/10",
  studio_approved: "text-green-400 bg-green-500/10",
  studio_rejected: "text-red-400 bg-red-500/10",
  default: "text-white/50 bg-white/5",
};

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function NotifItem({
  notif,
  onRead,
}: {
  notif: Notification;
  onRead: (id: string) => void;
}) {
  const Icon = typeIcons[notif.type] || typeIcons.default;
  const colorClass = typeColors[notif.type] || typeColors.default;

  const handleClick = () => {
    if (!notif.is_read) onRead(notif.id);
  };

  const inner = (
    <div
      onClick={handleClick}
      className={cn(
        "flex gap-3 px-4 py-3 hover:bg-white/[0.03] cursor-pointer transition-colors border-b border-white/5 last:border-0",
        !notif.is_read && "bg-white/[0.02]"
      )}
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${colorClass}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm font-medium leading-tight", notif.is_read ? "text-white/60" : "text-white")}>
            {notif.title}
          </p>
          {!notif.is_read && (
            <div className="w-2 h-2 rounded-full bg-[#D9FC67] mt-1 shrink-0" />
          )}
        </div>
        {notif.content && (
          <p className="text-white/40 text-xs mt-0.5 line-clamp-2">{notif.content}</p>
        )}
        <p className="text-white/20 text-xs mt-1">{timeAgo(notif.created_at)}</p>
      </div>
      {notif.action_url && (
        <ExternalLink className="w-3.5 h-3.5 text-white/20 mt-1 shrink-0" />
      )}
    </div>
  );

  if (notif.action_url) {
    return <Link href={notif.action_url}>{inner}</Link>;
  }
  return inner;
}

interface NotificationBellProps {
  userEmail?: string | null;
}

export function NotificationBell({ userEmail }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, loading, markAsRead, markOneAsRead } = useNotifications(userEmail);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] bg-[#D9FC67] text-black text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-white/60" />
              <h3 className="text-white font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs bg-[#D9FC67]/10 text-[#D9FC67] px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAsRead()}
                className="text-xs text-white/40 hover:text-[#D9FC67] transition-colors flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="py-10 text-center">
                <div className="w-5 h-5 border-2 border-[#D9FC67] border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-10 h-10 text-white/10 mx-auto mb-3" />
                <p className="text-white/30 text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <NotifItem
                  key={notif.id}
                  notif={notif}
                  onRead={markOneAsRead}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
