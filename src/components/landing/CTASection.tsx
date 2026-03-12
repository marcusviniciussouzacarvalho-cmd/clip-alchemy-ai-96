import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const CTASection = () => (
  <section className="py-24 bg-surface">
    <div className="container max-w-3xl text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <h2 className="text-3xl md:text-5xl font-bold mb-6">
          Pronto para criar clips virais?
        </h2>
        <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
          Comece gratuitamente. Sem cartão de crédito.
        </p>
        <Button variant="hero" size="lg" asChild>
          <Link to="/signup">
            Começar agora
            <ArrowRight className="ml-1" size={18} />
          </Link>
        </Button>
      </motion.div>
    </div>
  </section>
);

export default CTASection;
