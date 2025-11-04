// src/pages/landing/components/HeroSection.jsx - Versión para Cafeterías
import React from "react";
import { Button } from "@/components/ui/button";

import { Coffee, QrCode, Smartphone, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "../../../assets/hero-cafe.jpg"; // Asegúrate de tener esta imagen en la ruta correcta

const HeroSection = () => {
  const navigate = useNavigate();

  // const handleGetStarted = () => {
  //   navigate("/register");
  // };

  const handleDemo = () => {
    document.getElementById("demo-section")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Clientes ordenando desde tablets en cafetería moderna"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/85 to-primary/70" />
      </div>
      <div className="container relative z-10 mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-primary-foreground animate-fade-in">
            <div className="inline-flex items-center gap-2 bg-accent/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Coffee className="w-4 h-4" />
              <span className="text-sm font-medium">
                Revoluciona tu Cafetería
              </span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Tus Clientes Ordenan
              <span className="block bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
                Desde su Mesa
              </span>
            </h1>
            <p className="text-xl mb-8 text-primary-foreground/90 leading-relaxed">
              Sistema de pedidos digital que moderniza tu cafetería. Sin meseros corriendo, sin esperas largas. 
              Solo café delicioso y clientes felices.
            </p>
            <div className="flex flex-wrap gap-4 mb-10">
              <Button variant="hero" size="lg" className="group">
                Prueba Gratis 14 Días
                <TrendingUp className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg" className="bg-background/10 backdrop-blur-sm border-primary-foreground/30 text-primary-foreground hover:bg-background/20">
                Ver Demo
              </Button>
            </div>


          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
