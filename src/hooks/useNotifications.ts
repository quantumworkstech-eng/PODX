"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

export interface Notification {
  id: string;
  type: string;
  title: string;
  content: string | null;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
  data?: Record<string, any>;
}

export function useNotifications(userEmail?: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const channelRef = useRef<any>(null);

  const fetchNotifications = useCallback(async () => {
    if (!userEmail) return;
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  const markAsRead = useCallback(async (ids?: string[]) => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ids ? { ids } : { markAll: true }),
      });
      if (ids) {
        setNotifications((prev) =>
          prev.map((n) => (ids.includes(n.id) ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - ids.length));
      } else {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch {
      // silently fail
    }
  }, []);

  const markOneAsRead = useCallback(async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silently fail
    }
  }, []);

  // Subscribe to real-time notifications via Supabase
  useEffect(() => {
    if (!userEmail || !supabase) return;
    const client = supabase;

    // Initial fetch
    fetchNotifications();

    // Set up real-time subscription
    const setupRealtime = async () => {
      // Get user id first
      const { data: user } = await client
        .from("users")
        .select("id")
        .eq("email", userEmail)
        .maybeSingle();

      if (!user?.id) return;

      channelRef.current = client
        .channel(`notifications:${user.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotif = payload.new as Notification;
            setNotifications((prev) => [newNotif, ...prev]);
            setUnreadCount((prev) => prev + 1);
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channelRef.current) {
        client.removeChannel(channelRef.current);
      }
    };
  }, [userEmail, fetchNotifications]);

  return { notifications, unreadCount, loading, fetchNotifications, markAsRead, markOneAsRead };
}
