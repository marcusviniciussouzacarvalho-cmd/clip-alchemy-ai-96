import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Play, ArrowRight } from "lucide-react";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px)] bg-[size:64px_64px] opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />

      <div className="container relative z-10 text-center max-w-4xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-surface text-xs font-medium text-muted-foreground mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-foreground animate-pulse-subtle" />
          Powered by AI
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
        >
          Transforme vídeos longos em{" "}
          <span className="text-gradient">clips virais</span>{" "}
          com inteligência artificial
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          Crie conteúdo curto para redes sociais em minutos. Upload, AI clipping, legendas automáticas e exportação.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button variant="hero" size="lg" asChild>
            <Link to="/signup">
              Começar gratuitamente
              <ArrowRight className="ml-1" size={18} />
            </Link>
          </Button>
          <Button variant="hero-outline" size="lg" asChild>
            <Link to="/demo">
              <Play size={18} />
              Ver demonstração
            </Link>
          </Button>
        </motion.div>

        {/* Mock UI preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 rounded-xl venus-border overflow-hidden venus-glow"
        >
          <div className="bg-surface p-1">
            <div className="flex items-center gap-1.5 px-3 py-2">
              <div className="w-2.5 h-2.5 rounded-full bg-muted" />
              <div className="w-2.5 h-2.5 rounded-full bg-muted" />
              <div className="w-2.5 h-2.5 rounded-full bg-muted" />
              <span className="ml-3 text-xs text-muted-foreground font-body">venusclip.app/dashboard</span>
            </div>
          </div>
          <div className="bg-background aspect-video flex items-center justify-center border-t border-border">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center mx-auto mb-4">
                <Play size={24} className="text-foreground ml-1" />
              </div>
              <p className="text-sm text-muted-foreground">Dashboard Preview</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
