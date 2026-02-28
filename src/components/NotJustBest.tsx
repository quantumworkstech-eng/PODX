"use client";

import Image from "next/image";

const cards = [
  {
    label: "Podcasting",
    title: "Masterclasses",
    description: "Get a practical roadmap for setting your podcast up for success in our intensive bi-monthly workshops. Based on strategies used by top podcasters.",
    image: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600",
  },
  {
    label: "PodClub",
    title: "Community",
    description: "Join India's only podcaster community, powered by PodX. Get access to meet-ups, curated resources, collaborations, and grow alongside like-minded creators.",
    image: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=600",
  },
  {
    label: "PodX",
    title: "Consulting",
    description: "A-to-Z support for independent and branded podcasts. We assemble a dream team of podcasting specialists to run your entire podcast.",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=600",
  },
];

export function NotJustBest() {
  return (
    <section className="py-20 lg:py-28 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light italic text-white mb-4">
            Not just Mumbai's
            <br />
            <span className="font-bold not-italic">best podcast studio</span>
          </h2>
          <p className="text-white/60">
            We empower creators to succeed at every step of their journey.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl border border-white/10 hover:border-white/20 transition-colors"
            >
              {/* Labels */}
              <div className="mb-4">
                <span className="text-white/50 text-sm">{card.label}</span>
                <h3 className="text-xl font-semibold text-white">{card.title}</h3>
              </div>
              
              {/* Description */}
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                {card.description}
              </p>
              
              {/* Image */}
              <div className="relative aspect-video rounded-xl overflow-hidden">
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

