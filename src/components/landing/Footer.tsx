import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="py-12 border-t border-border">
    <div className="container max-w-5xl">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
        <div>
          <div className="font-display font-bold text-lg mb-4">VENUSCLIP</div>
          <p className="text-xs text-muted-foreground">Clips virais com IA.</p>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Produto</div>
          <div className="flex flex-col gap-2">
            <a href="#recursos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Planos</Link>
            <Link to="/demo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Demo</Link>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Empresa</div>
          <div className="flex flex-col gap-2">
            <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contato</Link>
            <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Termos</Link>
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Privacidade</Link>
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Conta</div>
          <div className="flex flex-col gap-2">
            <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Entrar</Link>
            <Link to="/signup" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Criar conta</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-border pt-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} VenusClip. Todos os direitos reservados.
      </div>
    </div>
  </footer>
);

export default Footer;
