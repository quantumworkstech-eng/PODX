"use client";

interface StepItem {
  step: string;
  title: string;
  description: string;
}

interface HowItWorksProps {
  data?: StepItem[];
}

const DEFAULT_STEPS: StepItem[] = [
  {
    step: "01",
    title: "Choose Your Studio",
    description:
      "Browse our curated studios across India. Filter by city, capacity, equipment, and price to find your perfect match.",
  },
  {
    step: "02",
    title: "Book Your Slot",
    description:
      "Pick a date and time that works for you. Instant confirmation with flexible cancellation up to 48 hours before.",
  },
  {
    step: "03",
    title: "Create Your Content",
    description:
      "Arrive and get started. Our trained operators handle all the technical setup so you can focus on creating.",
  },
  {
    step: "04",
    title: "Publish & Grow",
    description:
      "Receive your polished audio and video files. Add our editing and distribution services for full end-to-end delivery.",
  },
];

export function HowItWorks({ data }: HowItWorksProps) {
  const steps = data && data.length > 0 ? data : DEFAULT_STEPS;

  return (
    <section className="py-20 lg:py-28 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <p className="text-[#D9FC67] text-sm uppercase tracking-[0.2em] font-medium mb-3">
            Simple process
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
            How it works
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {/* Connecting line — desktop only */}
          <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-transparent via-[#D9FC67]/30 to-transparent" />

          {steps.map((step, index) => (
            <div
              key={index}
              className="relative bg-[#0d0d0d] border border-white/5 rounded-2xl p-6 hover:border-[#D9FC67]/20 transition-all duration-300 group"
            >
              {/* Step number — large background text */}
              <div className="mb-6">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#D9FC67]/10 border border-[#D9FC67]/20 text-[#D9FC67] font-mono text-lg font-bold group-hover:bg-[#D9FC67]/20 transition-colors">
                  {step.step}
                </span>
              </div>

              {/* Arrow connector — only between steps on large screens */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 -right-3 z-10">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18l6-6-6-6" stroke="#D9FC67" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}

              <h3 className="text-lg font-bold text-white mb-3 leading-snug">
                {step.title}
              </h3>
              <p className="text-white/50 text-sm leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
