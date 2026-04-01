import { NextResponse } from "next/server";
import type { LandingTemplate } from "@/types/landing";

const TEMPLATES: LandingTemplate[] = [
  {
    id: "minimal",
    name: "Minimal",
    description: "Clean, distraction-free layout focused on studio bookings",
    sections: [
      {
        type: "hero",
        order_index: 0,
        is_visible: true,
        content_json: {
          heading: "Book Your Studio Session",
          subheading: "Professional recording spaces for creators and podcasters",
          cta_primary_text: "Browse Studios",
          cta_secondary_text: "Learn More",
        },
      },
      {
        type: "studios",
        order_index: 1,
        is_visible: true,
        content_json: {
          heading: "Available Studios",
          columns: 3,
          show_price: true,
          show_capacity: true,
        },
      },
      {
        type: "contact",
        order_index: 2,
        is_visible: true,
        content_json: {
          heading: "Get in Touch",
          show_email: true,
          show_phone: true,
          show_address: true,
        },
      },
      {
        type: "footer",
        order_index: 3,
        is_visible: true,
        content_json: {
          show_social: true,
          show_nav: true,
        },
      },
    ],
  },
  {
    id: "bold",
    name: "Bold",
    description: "High-impact layout with hero video, features, and strong CTAs",
    sections: [
      {
        type: "hero",
        order_index: 0,
        is_visible: true,
        content_json: {
          heading: "Where Great Content Begins",
          subheading: "State-of-the-art recording studios for next-level creators",
          cta_primary_text: "Book Now",
          cta_secondary_text: "View Studios",
          overlay_opacity: 60,
        },
      },
      {
        type: "features",
        order_index: 1,
        is_visible: true,
        content_json: {
          heading: "Built for Creators",
          subheading: "Everything you need under one roof",
          items: [
            { icon: "Mic", title: "Pro Equipment", description: "Studio-grade gear for perfect recordings" },
            { icon: "Headphones", title: "Acoustic Rooms", description: "Soundproofed for crystal-clear audio" },
            { icon: "Camera", title: "Video Ready", description: "4K cameras and professional lighting" },
            { icon: "Zap", title: "Instant Booking", description: "Real-time availability, instant confirmation" },
            { icon: "Shield", title: "Secure Payments", description: "100% safe and encrypted transactions" },
            { icon: "Wifi", title: "High-Speed Internet", description: "Reliable connection for live streaming" },
          ],
        },
      },
      {
        type: "studios",
        order_index: 2,
        is_visible: true,
        content_json: {
          heading: "Our Studios",
          subheading: "Premium spaces tailored for your creative vision",
          columns: 3,
          show_price: true,
          show_capacity: true,
        },
      },
      {
        type: "reviews",
        order_index: 3,
        is_visible: true,
        content_json: {
          heading: "What Creators Say",
          subheading: "Loved by podcasters and content creators",
          show_dynamic: true,
          items: [],
        },
      },
      {
        type: "cta",
        order_index: 4,
        is_visible: true,
        content_json: {
          heading: "Ready to Record?",
          subheading: "Join thousands of creators who trust us for their content.",
          cta_text: "Book a Studio Now",
          background_style: "gradient",
        },
      },
      {
        type: "footer",
        order_index: 5,
        is_visible: true,
        content_json: {
          show_social: true,
          show_nav: true,
        },
      },
    ],
  },
  {
    id: "professional",
    name: "Professional",
    description: "Full-featured layout with about section, reviews, and detailed contact",
    sections: [
      {
        type: "hero",
        order_index: 0,
        is_visible: true,
        content_json: {
          heading: "Professional Recording Studios",
          subheading: "The gold standard for podcast and video production",
          cta_primary_text: "Book a Session",
          cta_secondary_text: "Contact Us",
        },
      },
      {
        type: "about",
        order_index: 1,
        is_visible: true,
        content_json: {
          heading: "Who We Are",
          description:
            "We are a premium studio network dedicated to helping creators produce world-class content. With state-of-the-art facilities and expert staff, we make every session exceptional.",
          image_position: "right",
        },
      },
      {
        type: "studios",
        order_index: 2,
        is_visible: true,
        content_json: {
          heading: "Our Spaces",
          subheading: "Each studio designed for a specific creative need",
          columns: 2,
          show_price: true,
          show_capacity: true,
        },
      },
      {
        type: "features",
        order_index: 3,
        is_visible: true,
        content_json: {
          heading: "Why Choose Us",
          items: [
            { icon: "Mic", title: "Premium Equipment", description: "Neumann mics, SSL consoles, and more" },
            { icon: "Users", title: "Expert Operators", description: "Trained engineers available on request" },
            { icon: "Zap", title: "Seamless Booking", description: "Online booking with instant confirmation" },
          ],
        },
      },
      {
        type: "reviews",
        order_index: 4,
        is_visible: true,
        content_json: {
          heading: "Client Testimonials",
          show_dynamic: true,
          items: [],
        },
      },
      {
        type: "contact",
        order_index: 5,
        is_visible: true,
        content_json: {
          heading: "Let's Talk",
          subheading: "Reach out to discuss your project or book a studio tour.",
          show_email: true,
          show_phone: true,
          show_address: true,
        },
      },
      {
        type: "footer",
        order_index: 6,
        is_visible: true,
        content_json: {
          show_social: true,
          show_nav: true,
        },
      },
    ],
  },
  {
    id: "creative",
    name: "Creative",
    description: "Vibrant, expressive layout with custom sections for unique brands",
    sections: [
      {
        type: "hero",
        order_index: 0,
        is_visible: true,
        content_json: {
          heading: "Create Without Limits",
          subheading: "A studio experience built for bold, creative minds",
          cta_primary_text: "Start Creating",
          cta_secondary_text: "Explore Studios",
        },
      },
      {
        type: "custom",
        order_index: 1,
        is_visible: true,
        content_json: {
          heading: "Our Story",
          blocks: [
            {
              id: "b1",
              type: "text",
              content:
                "Born from a passion for authentic storytelling, we built spaces where creativity thrives. Every detail — from the acoustics to the lighting — is designed to inspire.",
              align: "center",
              size: "lg",
            },
          ],
        },
      },
      {
        type: "studios",
        order_index: 2,
        is_visible: true,
        content_json: {
          heading: "The Studios",
          columns: 3,
          show_price: true,
          show_capacity: false,
        },
      },
      {
        type: "features",
        order_index: 3,
        is_visible: true,
        content_json: {
          heading: "Crafted for You",
          items: [
            { icon: "Mic", title: "Sound Design", description: "Acoustically treated rooms for perfect audio" },
            { icon: "Camera", title: "Visual Excellence", description: "Cinematic lighting and 4K camera setups" },
            { icon: "Headphones", title: "Mix & Master", description: "Full post-production available on request" },
          ],
        },
      },
      {
        type: "reviews",
        order_index: 4,
        is_visible: true,
        content_json: {
          heading: "Voices of Our Community",
          show_dynamic: true,
          items: [],
        },
      },
      {
        type: "cta",
        order_index: 5,
        is_visible: true,
        content_json: {
          heading: "Your Next Project Starts Here",
          subheading: "Book a studio and bring your vision to life.",
          cta_text: "Book Now",
          background_style: "gradient",
        },
      },
      {
        type: "footer",
        order_index: 6,
        is_visible: true,
        content_json: {
          show_social: true,
          show_nav: true,
        },
      },
    ],
  },
];

export async function GET() {
  return NextResponse.json({ templates: TEMPLATES });
}
