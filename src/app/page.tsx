"use client";

import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { WeHelpCreate } from "@/components/WeHelpCreate";
import { Services } from "@/components/Services";
import { SocialProof } from "@/components/SocialProof";
import { ReadyToStart } from "@/components/ReadyToStart";
import { CreatedInStudios } from "@/components/CreatedInStudios";
import { Bundles } from "@/components/Bundles";
import { BookStudioBanner } from "@/components/BookStudioBanner";
import { StudioSection } from "@/components/StudioSection";
import { NotJustBest } from "@/components/NotJustBest";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />

      <main className="bg-background">
        {/* Hero Section - Full-width background image */}
        <Hero />
        
        {/* We help you create - Animated text */}
        <WeHelpCreate />
        
        {/* Services - 3 cards with images */}
        <Services />
        
        {/* Social Proof - Brands + Influencers */}
        <SocialProof />
        
        {/* Ready to get started */}
        <ReadyToStart />
        
        {/* Created in our studios - Large carousel */}
        <CreatedInStudios />
        
        {/* Bundles + Limited Time Offers */}
        <Bundles />
        
        {/* Book a studio banner - White bg with photos */}
        <BookStudioBanner />
        
        {/* Studios Section - Tab navigation carousel */}
        <StudioSection />
        
        {/* Not just best studio - 3 cards */}
        <NotJustBest />
        
        {/* FAQ Section */}
        <FAQ />

        {/* Footer with map background */}
        <Footer />
      </main>
    </>
  );
}
