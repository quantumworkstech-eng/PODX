"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  {
    question: "What is Yanisa Studio and who uses your podcast studios?",
    answer: "Yanisa Studio is India's premier podcast studio network. We offer fully equipped podcast and video recording studios that you can rent by the hour. Our spaces are used by independent podcasters, content creators, founders, small business owners, entrepreneurs, agencies, and large corporate brands. Every studio is plug-and-play, and every session includes a trained studio operator who handles all the technical work for you."
  },
  {
    question: "Where are Yanisa Studio studios located?",
    answer: "We operate multiple studios across major Indian cities including Mumbai (Andheri, BKC), Delhi (Connaught Place), Bangalore (Koramangala, Indiranagar), Hyderabad (Jubilee Hills), Chennai, Pune, and Kolkata. All locations are easy for guests to find, with Google Maps links sent to you before your session."
  },
  {
    question: "How much does it cost to record at Yanisa Studio?",
    answer: "Our studio rates start from ₹1,800 per hour depending on the location. This includes all gear, microphones, cameras, lighting, a studio operator, and your raw audio and video files. Premium studios with advanced equipment may have higher rates."
  },
  {
    question: "What is included in a standard recording session?",
    answer: "A standard session includes: Full access to the studio of your choice, professional cameras and microphones, lighting setup, a trained studio operator, setup and monitoring throughout your recording, raw audio and video files, and seating for 2-6 people depending on the studio."
  },
  {
    question: "What microphones, cameras, and equipment do you use?",
    answer: "We use professional-grade production equipment including Shure SM7B and SM7dB microphones, Sony FX3 and A7 series cameras with cinema lenses, RØDECaster Pro audio mixers, and professional LED lighting systems. All equipment is included in every booking."
  },
  {
    question: "Is a studio operator included in every booking?",
    answer: "Yes. A studio operator is included in every recording session at no extra cost. They prepare the studio, run technical checks, monitor cameras and audio, adjust settings during recording, and offer guidance if you need help."
  },
  {
    question: "Can I cancel or reschedule my podcast recording session?",
    answer: "Yes. You can cancel or reschedule directly from your online dashboard. 100% refund if you cancel 48+ hours before your session, 50% credit if you cancel within 48 hours, and no refund if you cancel less than 8 hours before your session."
  },
  {
    question: "Do you offer podcast editing services?",
    answer: "Yes. Professional editing is available starting from ₹2,500 per episode. This includes audio cleanup, video editing, color grading, and export in multiple formats. Turnaround time is typically 3-5 business days for the first cut."
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 lg:py-28 bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Frequently asked questions
          </h2>
          <p className="text-muted-foreground">
            Haven&apos;t found what you&apos;re looking for? We&apos;re here to help.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-0">
          {faqs.map((faq, index) => (
            <div key={index} className="faq-item">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between py-5 px-4 text-left"
              >
                <span className="text-base font-medium text-foreground pr-8">
                  {faq.question}
                </span>
                <span className="flex-shrink-0 text-muted-foreground">
                  {openIndex === index ? (
                    <Minus className="w-5 h-5" />
                  ) : (
                    <Plus className="w-5 h-5" />
                  )}
                </span>
              </button>
              {openIndex === index && (
                <div className="px-4 pb-5 animate-fade-in">
                  <p className="text-muted-foreground leading-relaxed">
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

