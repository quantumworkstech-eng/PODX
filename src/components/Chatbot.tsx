"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Phone, MessageSquare, ChevronDown } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/919876543210";
const CALL_URL = "tel:+919876543210";

type Message = {
  role: "bot" | "user";
  text: string;
};

// Simple FAQ knowledge base
const FAQ_PAIRS: { patterns: string[]; answer: string }[] = [
  {
    patterns: ["book", "booking", "reserve", "reservation", "schedule"],
    answer:
      "You can book a studio directly from our website by clicking 'Book Now'. Choose your city, pick a date & time, select a studio and package — it takes under 2 minutes! Need help? I'm here.",
  },
  {
    patterns: ["price", "pricing", "cost", "rate", "charge", "fee", "how much"],
    answer:
      "Studio rates start from ₹2,500/hr. Prices vary by studio and package. You can view exact pricing on the Studios page or during booking. We also have bundle packages for regular creators.",
  },
  {
    patterns: ["cancel", "cancellation", "refund"],
    answer:
      "Our cancellation policy:\n• 48+ hours before: Full refund\n• 24–48 hours before: 50% refund\n• Under 24 hours: No refund\nYou can reschedule once for free with 24+ hours notice.",
  },
  {
    patterns: ["location", "address", "where", "studio location", "andheri", "bandra", "mumbai"],
    answer:
      "We have studios across Mumbai — including Andheri West and Bandra West. More locations are coming soon! Check the Studios page for details and maps.",
  },
  {
    patterns: ["equipment", "gear", "mic", "microphone", "camera", "what's included", "what is included"],
    answer:
      "Every booking includes professional microphones, audio interface, monitoring headphones, basic lighting, and an on-site host. You can also add cameras, a sound engineer, or video crew as add-ons.",
  },
  {
    patterns: ["hour", "hours", "timing", "open", "availability", "when"],
    answer:
      "Our studios are open Sunday to Friday 10:00 AM – 10:00 PM. Saturday sessions are available upon request. Book in advance to secure your preferred slot!",
  },
  {
    patterns: ["package", "bundle", "offer", "discount", "deal"],
    answer:
      "Yes! We have creator bundles and limited-time offers that give you significant savings for regular bookings. Check the Bundles section on our homepage or ask our team for current deals.",
  },
  {
    patterns: ["parking", "park"],
    answer:
      "Parking availability varies by studio. Our Andheri and Bandra locations have dedicated parking. Details are on each studio's page.",
  },
  {
    patterns: ["tour", "visit", "see studio"],
    answer:
      "We offer free 15-minute studio tours on weekdays! Book a tour slot via the contact form or WhatsApp us directly.",
  },
  {
    patterns: ["partner", "list", "own", "register studio"],
    answer:
      "Interested in listing your studio on Yanisa Studio? Head to the Partner section and apply. Our team will reach out within 24 hours.",
  },
  {
    patterns: ["help", "support", "contact", "talk", "human", "agent", "person"],
    answer:
      "I'll connect you with our team right away! You can reach us via WhatsApp for the fastest response (usually under 15 minutes), or give us a call.",
  },
  {
    patterns: ["hello", "hi", "hey", "hola", "namaste"],
    answer:
      "Hey there! 👋 Welcome to Yanisa Studio. I'm here to help with any questions about our podcast studios, bookings, pricing, or anything else. What can I help you with?",
  },
];

const FALLBACK_ANSWER =
  "I don't have a specific answer for that, but our team can help! Connect with us via WhatsApp or call — we typically respond within 15 minutes.";

function findAnswer(input: string): string {
  const lower = input.toLowerCase();
  for (const faq of FAQ_PAIRS) {
    if (faq.patterns.some((p) => lower.includes(p))) {
      return faq.answer;
    }
  }
  return FALLBACK_ANSWER;
}

const GREETING: Message = {
  role: "bot",
  text: "Hi! I'm the Yanisa Studio assistant 👋 Ask me anything about studios, bookings, pricing, or availability!",
};

export function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([GREETING]);
  const [input, setInput] = useState("");
  const [showEscalation, setShowEscalation] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: Message = { role: "user", text: trimmed };
    const answer = findAnswer(trimmed);
    const botMsg: Message = { role: "bot", text: answer };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");

    // Show escalation options if fallback was used
    if (answer === FALLBACK_ANSWER) {
      setShowEscalation(true);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#D9FC67] hover:bg-[#E8FF8A] text-black shadow-lg shadow-[#D9FC67]/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        aria-label="Open chat"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[340px] sm:w-[380px] rounded-2xl border border-white/10 bg-[#09090b] shadow-2xl shadow-black/60 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#111111] border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#D9FC67]/20 border border-[#D9FC67]/40 flex items-center justify-center">
                <span className="text-[#D9FC67] font-bold text-sm">YS</span>
              </div>
              <div>
                <div className="text-white text-sm font-semibold">Yanisa Studio Assistant</div>
                <div className="flex items-center gap-1.5 text-xs text-white/50">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Online · replies in &lt;15 min
                </div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white transition-colors">
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 max-h-[380px]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-[#D9FC67] text-black rounded-br-sm"
                      : "bg-white/8 text-white/90 border border-white/10 rounded-bl-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Escalation prompt */}
            {showEscalation && (
              <div className="flex flex-col gap-2 pt-1">
                <p className="text-white/50 text-xs text-center">Connect with our team directly:</p>
                <div className="flex gap-2">
                  <a
                    href={WHATSAPP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#25D366]/15 border border-[#25D366]/30 text-[#25D366] text-xs font-medium hover:bg-[#25D366]/25 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    WhatsApp
                  </a>
                  <a
                    href={CALL_URL}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-medium hover:bg-blue-500/25 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Call Us
                  </a>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions (shown when only greeting visible) */}
          {messages.length === 1 && (
            <div className="px-4 pb-2 flex flex-wrap gap-1.5">
              {["How do I book?", "Pricing?", "Locations?", "Talk to team"].map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q);
                    // Slight delay so input updates before send
                    setTimeout(() => {
                      const answer = findAnswer(q);
                      setMessages((prev) => [
                        ...prev,
                        { role: "user", text: q },
                        { role: "bot", text: answer },
                      ]);
                      setInput("");
                      if (answer === FALLBACK_ANSWER) setShowEscalation(true);
                    }, 50);
                  }}
                  className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-xs hover:bg-white/10 hover:text-white transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-4 py-3 border-t border-white/10 flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything…"
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/20"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="w-10 h-10 rounded-xl bg-[#D9FC67] hover:bg-[#E8FF8A] text-black flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
