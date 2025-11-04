// src/pages/landing/LandingV2.jsx
import React from 'react';
import Navbar from '../../components/Landing/v2/Navbar';
import Hero from '../../components/Landing/v2/Hero';
import Features from '../../components/Landing/v2/Features';
import HowItWorks from '../../components/Landing/v2/HowItWorks';
import Benefits from '../../components/Landing/v2/Benefits';
import Testimonials from '../../components/Landing/v2/Testimonials';
import Pricing from '../../components/Landing/v2/Pricing';
import CTA from '../../components/Landing/v2/CTA';
import Footer from '../../components/Landing/v2/Footer';

const LandingV2 = () => {
  return (
    <div className="min-h-screen bg-cream-50">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Benefits />
        <Testimonials />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </div>
  );
};

export default LandingV2;
