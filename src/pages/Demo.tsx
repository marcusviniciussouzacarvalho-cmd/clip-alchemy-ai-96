import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Play } from "lucide-react";

const Demo = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-32 pb-24">
      <div className="container max-w-4xl text-center">
        <h1 className="text-3xl md:text-5xl font-bold mb-6">Veja o VenusClip em ação</h1>
        <p className="text-muted-foreground text-lg mb-12 max-w-xl mx-auto">
          Assista como transformamos um vídeo longo em clips otimizados em minutos
        </p>
        <div className="aspect-video rounded-xl venus-border bg-surface flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-foreground flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
            <Play size={32} className="text-background ml-1" />
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </div>
);

export default Demo;
