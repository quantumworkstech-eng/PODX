"use client";

import {
  BarChart3, Bell, Building2, Calendar, Globe, IndianRupee, Mic, PieChart, Settings, TrendingUp, Users,
} from "lucide-react";

/**
 * Pre-designed product visuals from the original partner landing page.
 * Sections reference them through the "Showcase visual" field, so admins can
 * keep them, swap in an uploaded image, or drop the visual entirely.
 */

export function DashboardMockup() {
  return (
    <div className="relative mt-16 w-full max-w-5xl mx-auto">
      <div className="relative rounded-2xl border border-white/10 bg-[#0A0A0A] overflow-hidden shadow-[0_40px_100px_#D9FC6715]">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 bg-[#111111]">
          <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
          <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
          <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
          <div className="ml-4 flex-1 bg-white/5 rounded-lg h-6 max-w-xs" />
        </div>

        <div className="flex">
          <div className="hidden sm:flex flex-col w-52 border-r border-white/8 bg-[#0D0D0D] py-6 px-3 gap-1">
            {[
              { icon: BarChart3, label: "Dashboard", active: true },
              { icon: Building2, label: "My Studios", active: false },
              { icon: Calendar, label: "Bookings", active: false },
              { icon: Users, label: "Clients", active: false },
              { icon: PieChart, label: "Analytics", active: false },
              { icon: IndianRupee, label: "Earnings", active: false },
              { icon: Globe, label: "White-Label", active: false },
              { icon: Settings, label: "Settings", active: false },
            ].map(({ icon: Icon, label, active }) => (
              <div
                key={label}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  active ? "bg-[#D9FC67]/15 text-[#D9FC67]" : "text-white/40"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </div>
            ))}
          </div>

          <div className="flex-1 p-5 bg-[#080808] min-h-[400px]">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-xs text-white/40 mb-0.5">Good morning,</p>
                <p className="text-sm font-semibold text-white">Mumbai Podcast Studio</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center">
                  <Bell className="w-3.5 h-3.5 text-white/40" />
                </div>
                <div className="w-7 h-7 rounded-full bg-[#D9FC67] flex items-center justify-center text-black text-xs font-bold">
                  MS
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              {[
                { label: "This Month", value: "₹82,500", change: "+23%", icon: IndianRupee, green: true },
                { label: "Bookings", value: "47", change: "+12", icon: Calendar, green: true },
                { label: "Clients", value: "34", change: "+8", icon: Users, green: false },
                { label: "Occupancy", value: "78%", change: "↑ 5%", icon: TrendingUp, green: true },
              ].map(({ label, value, change, icon: Icon, green }) => (
                <div key={label} className="bg-[#111111] border border-white/6 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-white/40 text-[10px]">{label}</p>
                    <Icon className="w-3 h-3 text-white/20" />
                  </div>
                  <p className="text-white text-sm font-bold">{value}</p>
                  <p className={`text-[10px] mt-0.5 ${green ? "text-[#D9FC67]" : "text-white/40"}`}>{change}</p>
                </div>
              ))}
            </div>

            <div className="bg-[#111111] border border-white/6 rounded-xl p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-white/70 text-xs font-medium">Bookings this week</p>
                <span className="text-[#D9FC67] text-xs">View All →</span>
              </div>
              <div className="flex items-end gap-2 h-16">
                {[40, 65, 50, 80, 95, 70, 88].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-md"
                    style={{
                      height: `${h}%`,
                      background:
                        i === 4 ? "#D9FC67" : i === 6 ? "rgba(217,252,103,0.6)" : "rgba(217,252,103,0.15)",
                    }}
                  />
                ))}
              </div>
              <div className="flex justify-between mt-1">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <span key={d} className="flex-1 text-center text-[9px] text-white/25">
                    {d}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-[#111111] border border-white/6 rounded-xl p-3">
              <p className="text-white/70 text-xs font-medium mb-3">Upcoming Sessions</p>
              <div className="space-y-2">
                {[
                  { name: "Rohit Anand", time: "Today, 2:00 PM", amt: "₹1,500", status: "confirmed" },
                  { name: "Creative Media Co.", time: "Today, 5:30 PM", amt: "₹3,000", status: "confirmed" },
                  { name: "Meera Podcast", time: "Tomorrow, 11 AM", amt: "₹2,000", status: "pending" },
                ].map((b) => (
                  <div
                    key={b.name}
                    className="flex items-center justify-between py-1.5 border-b border-white/4 last:border-0"
                  >
                    <div>
                      <p className="text-white/80 text-[10px] font-medium">{b.name}</p>
                      <p className="text-white/30 text-[9px]">{b.time}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[#D9FC67] text-[10px] font-semibold">{b.amt}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                          b.status === "confirmed"
                            ? "bg-[#D9FC67]/15 text-[#D9FC67]"
                            : "bg-white/8 text-white/40"
                        }`}
                      >
                        {b.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-4 -right-2 sm:right-8 bg-[#D9FC67] text-black px-4 py-2 rounded-xl text-xs font-bold shadow-lg">
        ₹82,500 earned this month 🎉
      </div>
    </div>
  );
}

export function BrowserMockup() {
  return (
    <div>
      <div className="rounded-2xl border border-[#D9FC67]/15 bg-[#0A0A0A] overflow-hidden shadow-[0_0_60px_#D9FC6710]">
        <div className="bg-[#111] border-b border-white/8 px-4 py-3 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/15" />
          </div>
          <div className="flex-1 bg-white/6 rounded-lg h-6 flex items-center px-3">
            <span className="text-white/30 text-[10px]">🔒 yourstudio.yanisastudios.com</span>
          </div>
        </div>

        <div className="p-5 bg-gradient-to-br from-[#0f0f0f] to-[#161616]">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                <Mic className="w-4 h-4 text-white" />
              </div>
              <span className="text-white text-sm font-bold">Mumbai Podcast Studio</span>
            </div>
            <span className="text-[10px] bg-purple-500 text-white px-3 py-1 rounded-lg font-medium">Book Now</span>
          </div>

          <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 rounded-xl p-5 border border-purple-500/15 mb-4">
            <p className="text-white/40 text-[10px] mb-1">Professional Podcast Studio · Mumbai</p>
            <h3 className="text-white font-bold text-sm mb-3">Record Your Story in Style</h3>
            <div className="flex gap-2">
              <span className="text-[10px] bg-purple-500 text-white px-3 py-1.5 rounded-lg">Book a Session</span>
              <span className="text-[10px] border border-white/15 text-white/70 px-3 py-1.5 rounded-lg">
                View Studios
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {["Studio A", "Studio B", "Studio C"].map((s, i) => (
              <div key={s} className="rounded-xl bg-white/4 border border-white/6 p-2.5">
                <div
                  className="w-full h-10 rounded-lg mb-1.5"
                  style={{
                    background: `linear-gradient(135deg, ${
                      i === 0 ? "#7c3aed, #4f46e5" : i === 1 ? "#be185d, #9333ea" : "#0891b2, #4f46e5"
                    })`,
                  }}
                />
                <p className="text-white/70 text-[9px] font-medium">{s}</p>
                <p className="text-purple-400 text-[9px]">₹800/hr</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {["yourstudio.yanisastudios.com", "yourstudio.com (custom domain)"].map((d) => (
          <div
            key={d}
            className="flex items-center gap-1.5 bg-[#D9FC67]/8 border border-[#D9FC67]/15 rounded-lg px-3 py-1.5 text-[#D9FC67] text-xs"
          >
            <Globe className="w-3 h-3" />
            {d}
          </div>
        ))}
      </div>
    </div>
  );
}
