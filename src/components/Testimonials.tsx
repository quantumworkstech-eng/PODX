"use client";

interface TestimonialItem {
  name: string;
  role: string;
  quote: string;
  avatar_url?: string;
}

interface TestimonialsProps {
  data?: TestimonialItem[];
}

const DEFAULT_TESTIMONIALS: TestimonialItem[] = [
  {
    name: "Rahul Sharma",
    role: "Content Creator, 250K followers",
    quote:
      "Yanisa Studio completely transformed my podcast quality. The equipment is world-class and the operators know exactly what they're doing.",
    avatar_url: "",
  },
  {
    name: "Priya Mehta",
    role: "Founder, TechTalk Podcast",
    quote:
      "I have been recording here for 6 months and every session is flawless. The team is professional, the studios are stunning.",
    avatar_url: "",
  },
  {
    name: "Arjun Kapoor",
    role: "CEO, 1.2M YouTube subscribers",
    quote:
      "Best podcast studio network in India. The booking process is seamless and the quality speaks for itself. Highly recommended.",
    avatar_url: "",
  },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Testimonials({ data }: TestimonialsProps) {
  const testimonials =
    data && data.length > 0 ? data : DEFAULT_TESTIMONIALS;

  return (
    <section className="py-20 lg:py-28 bg-[#09090b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-14">
          <p className="text-[#D9FC67] text-sm uppercase tracking-[0.2em] font-medium mb-3">
            What creators say
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
            Trusted by India&apos;s top creators
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((item, index) => (
            <div
              key={index}
              className="bg-[#0d0d0d] border border-white/5 rounded-2xl p-7 flex flex-col hover:border-white/10 transition-all duration-300 group"
            >
              {/* Quote mark */}
              <div className="text-[#D9FC67] text-5xl font-serif leading-none mb-4 select-none">
                &ldquo;
              </div>

              {/* Quote text */}
              <p className="text-white/70 text-base leading-relaxed flex-1 mb-6">
                {item.quote}
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-5 border-t border-white/5">
                {item.avatar_url ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={item.avatar_url}
                    alt={item.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#D9FC67]/10 border border-[#D9FC67]/20 flex items-center justify-center text-[#D9FC67] text-sm font-bold flex-shrink-0">
                    {getInitials(item.name)}
                  </div>
                )}
                <div>
                  <div className="text-white font-semibold text-sm">{item.name}</div>
                  <div className="text-white/40 text-xs">{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
