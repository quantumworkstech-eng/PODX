"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQProps {
  data?: FAQItem[];
}

const DEFAULT_FAQS: FAQItem[] = [
  {
    question: "What equipment is available in the studios?",
    answer:
      "All studios are equipped with professional-grade microphones, headphones, audio interfaces, mixers, acoustic panels, and lighting. Video-enabled studios also include cameras and green screens.",
  },
  {
    question: "Do I need experience to book a studio?",
    answer:
      "Not at all! Our trained operators are there to handle all technical aspects. You just need to show up and start recording.",
  },
  {
    question: "What is the cancellation policy?",
    answer:
      "You can cancel for a full refund up to 48 hours before your session. Cancellations 24–48 hours before receive a 50% refund. No refund for cancellations under 24 hours.",
  },
  {
    question: "How do I get my recordings after the session?",
    answer:
      "Your raw files are shared via a secure download link within 2 hours of your session. Edited files (if purchased) are delivered within 3–5 business days.",
  },
  {
    question: "Can I bring guests or co-hosts?",
    answer:
      "Absolutely! Each studio has a capacity of 2–6 people. Check the studio listing for exact capacity and microphone count.",
  },
  {
    question: "Do you offer editing services?",
    answer:
      "Yes! We offer full audio/video editing, mixing, mastering, transcript creation, show notes, and social media clip packages as add-ons.",
  },
  {
    question: "Is there a membership or bundle option?",
    answer:
      "Yes, our bundle plans offer significant discounts for regular creators. Check our pricing section or contact us for custom enterprise plans.",
  },
  {
    question: "How do I find the right studio for my needs?",
    answer:
      "Use our studio browser to filter by city, capacity, and equipment. Each listing shows photos, full equipment lists, and pricing. Contact our team if you need help choosing.",
  },
];

export function FAQ({ data }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const faqs = data && data.length > 0 ? data : DEFAULT_FAQS;

  return (
    <section id="faq" className="py-20 lg:py-28 bg-black">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-14">
          <p className="text-[#D9FC67] text-sm uppercase tracking-[0.2em] font-medium mb-3">
            Got questions?
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
            Frequently asked questions
          </h2>
          <p className="text-white/40 mt-4">
            Haven&apos;t found what you&apos;re looking for?{" "}
            <a href="/contact" className="text-[#D9FC67] hover:underline">
              We&apos;re here to help.
            </a>
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-0 divide-y divide-white/5">
          {faqs.map((faq, index) => (
            <div key={index} className="faq-item">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-start justify-between py-5 px-2 text-left gap-4"
              >
                <span className="text-base font-medium text-white leading-snug">
                  {faq.question}
                </span>
                <span className="flex-shrink-0 mt-0.5">
                  {openIndex === index ? (
                    <div className="w-6 h-6 rounded-full bg-[#D9FC67]/10 flex items-center justify-center">
                      <Minus className="w-3.5 h-3.5 text-[#D9FC67]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center">
                      <Plus className="w-3.5 h-3.5 text-white/50" />
                    </div>
                  )}
                </span>
              </button>
              {openIndex === index && (
                <div className="px-2 pb-5 animate-fade-in">
                  <p className="text-white/50 leading-relaxed text-sm">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
