CREATE TABLE IF NOT EXISTS landing_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL UNIQUE,
  content JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default content for all sections
INSERT INTO landing_content (section, content) VALUES
('hero', '{
  "headline": "Where Great Podcasts Begin",
  "subheadline": "Over 500 podcasters, creators, and brands produce their content with Yanisa Studio. Book world-class podcast studios with professional equipment and expert support.",
  "cta_primary_text": "Browse Studios",
  "cta_primary_url": "/studios",
  "cta_secondary_text": "Book a Session",
  "cta_secondary_url": "/book",
  "media_type": "image",
  "media_url": "",
  "overlay_opacity": 60
}'),
('stats', '[
  {"number": "500+", "label": "Creators"},
  {"number": "50+", "label": "Studios"},
  {"number": "10K+", "label": "Hours Recorded"},
  {"number": "#1", "label": "In India"}
]'),
('marquee', '[
  "Spotify", "YouTube", "Apple Podcasts", "Google Podcasts", "Amazon Music", "JioSaavn", "Gaana", "Audible", "iHeartRadio", "Pocket Casts"
]'),
('we_help_create', '[
  "Podcasts", "Viral Videos", "Masterclasses", "YouTube Videos", "Video Content", "Audio Dramas"
]'),
('services', '[
  {"title": "Hands-on Strategy Design", "description": "Expert podcast concept and strategy tailored to your brand. We help you define your niche, audience, and content calendar for maximum impact.", "image_url": "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=800&q=80"},
  {"title": "End-to-End Production", "description": "Record in our industry-leading studios with trained operators. Full post-production including editing, mixing, mastering, and show notes.", "image_url": "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800&q=80"},
  {"title": "Distribution & Promotion", "description": "Get your podcast on all major platforms. We handle distribution, create viral clips, and monitor your growth across channels.", "image_url": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80"}
]'),
('how_it_works', '[
  {"step": "01", "title": "Choose Your Studio", "description": "Browse our curated studios across India. Filter by city, capacity, equipment, and price to find your perfect match."},
  {"step": "02", "title": "Book Your Slot", "description": "Pick a date and time that works for you. Instant confirmation with flexible cancellation up to 48 hours before."},
  {"step": "03", "title": "Create Your Content", "description": "Arrive and get started. Our trained operators handle all the technical setup so you can focus on creating."},
  {"step": "04", "title": "Publish & Grow", "description": "Receive your polished audio and video files. Add our editing and distribution services for full end-to-end delivery."}
]'),
('testimonials', '[
  {"name": "Rahul Sharma", "role": "Content Creator, 250K followers", "quote": "Yanisa Studio completely transformed my podcast quality. The equipment is world-class and the operators know exactly what they''re doing.", "avatar_url": ""},
  {"name": "Priya Mehta", "role": "Founder, TechTalk Podcast", "quote": "I have been recording here for 6 months and every session is flawless. The team is professional, the studios are stunning.", "avatar_url": ""},
  {"name": "Arjun Kapoor", "role": "CEO, 1.2M YouTube subscribers", "quote": "Best podcast studio network in India. The booking process is seamless and the quality speaks for itself. Highly recommended.", "avatar_url": ""}
]'),
('bundles', '[
  {"name": "Starter", "price": "₹5,999", "billing": "per month", "description": "Perfect for beginners and solo podcasters", "features": ["2 studio sessions/month", "Basic editing", "RSS feed setup", "Email support"]},
  {"name": "Creator", "price": "₹12,999", "billing": "per month", "description": "For serious content creators scaling their brand", "features": ["6 studio sessions/month", "Full editing + mixing", "Social clips (3/episode)", "Distribution to all platforms", "Priority booking", "Dedicated account manager"]},
  {"name": "Studio Pro", "price": "₹29,999", "billing": "per month", "description": "Enterprise-grade for agencies and high-volume creators", "features": ["Unlimited sessions", "Full post-production suite", "12 social clips/episode", "Custom branding package", "White-label option", "24/7 priority support"]}
]'),
('faq', '[
  {"question": "What equipment is available in the studios?", "answer": "All studios are equipped with professional-grade microphones, headphones, audio interfaces, mixers, acoustic panels, and lighting. Video-enabled studios also include cameras and green screens."},
  {"question": "Do I need experience to book a studio?", "answer": "Not at all! Our trained operators are there to handle all technical aspects. You just need to show up and start recording."},
  {"question": "What is the cancellation policy?", "answer": "You can cancel for a full refund up to 48 hours before your session. Cancellations 24–48 hours before receive a 50% refund. No refund for cancellations under 24 hours."},
  {"question": "How do I get my recordings after the session?", "answer": "Your raw files are shared via a secure download link within 2 hours of your session. Edited files (if purchased) are delivered within 3–5 business days."},
  {"question": "Can I bring guests or co-hosts?", "answer": "Absolutely! Each studio has a capacity of 2–6 people. Check the studio listing for exact capacity and microphone count."},
  {"question": "Do you offer editing services?", "answer": "Yes! We offer full audio/video editing, mixing, mastering, transcript creation, show notes, and social media clip packages as add-ons."},
  {"question": "Is there a membership or bundle option?", "answer": "Yes, our bundle plans offer significant discounts for regular creators. Check our pricing section or contact us for custom enterprise plans."},
  {"question": "How do I find the right studio for my needs?", "answer": "Use our studio browser to filter by city, capacity, and equipment. Each listing shows photos, full equipment lists, and pricing. Contact our team if you need help choosing."}
]'),
('footer', '{
  "tagline": "India''s premier podcast studio network. Book world-class studios in your city.",
  "address": "Mumbai, Delhi, Bangalore, Hyderabad & more",
  "hours": "Monday – Saturday, 9:00 AM – 9:00 PM",
  "email": "support@yanisa.in",
  "phone": "+91 98765 43210",
  "instagram_url": "https://instagram.com",
  "linkedin_url": "https://linkedin.com",
  "youtube_url": "https://youtube.com"
}'),
('nav', '{
  "logo_text": "Yanisa Studio",
  "nav_links": [
    {"label": "Studios", "url": "/studios"},
    {"label": "Services", "url": "/services"},
    {"label": "Pricing", "url": "#pricing"},
    {"label": "Contact Us", "url": "/contact"}
  ]
}')
ON CONFLICT (section) DO NOTHING;
