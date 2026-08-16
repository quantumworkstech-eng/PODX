"use client";

import {
  ArrowRight, ArrowUpRight, BadgeCheck, BarChart3, Bell, BookOpen, Building2, Calendar,
  Check, CheckCircle2, Clock, CreditCard, Globe, Headphones, Heart, IndianRupee, Layers,
  Lock, Mail, MapPin, Mic, Package, Palette, Phone, PieChart, Play, Quote, Rocket, Settings,
  Shield, Sparkles, Star, TrendingUp, Users, Video, Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Icon names admins can type into an icon field. Unknown names fall back to a dot. */
export const CMS_ICONS: Record<string, LucideIcon> = {
  "arrow-right": ArrowRight,
  "arrow-up-right": ArrowUpRight,
  "badge-check": BadgeCheck,
  "bar-chart": BarChart3,
  bell: Bell,
  "book-open": BookOpen,
  building: Building2,
  calendar: Calendar,
  check: Check,
  "check-circle": CheckCircle2,
  clock: Clock,
  "credit-card": CreditCard,
  globe: Globe,
  headphones: Headphones,
  heart: Heart,
  "indian-rupee": IndianRupee,
  layers: Layers,
  lock: Lock,
  mail: Mail,
  "map-pin": MapPin,
  mic: Mic,
  package: Package,
  palette: Palette,
  phone: Phone,
  "pie-chart": PieChart,
  play: Play,
  quote: Quote,
  rocket: Rocket,
  settings: Settings,
  shield: Shield,
  sparkles: Sparkles,
  star: Star,
  "trending-up": TrendingUp,
  users: Users,
  video: Video,
  zap: Zap,
};

export const CMS_ICON_NAMES = Object.keys(CMS_ICONS);

export function CmsIcon({ name, className }: { name?: string; className?: string }) {
  const key = (name ?? "").trim().toLowerCase();
  const Icon = CMS_ICONS[key];
  if (!Icon) return <span className={`inline-block rounded-full bg-current ${className ?? ""}`} />;
  return <Icon className={className} />;
}
