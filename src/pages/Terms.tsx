import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const Terms = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-32 pb-24">
      <div className="container max-w-2xl prose prose-sm">
        <h1 className="text-3xl font-bold mb-8">Termos de Uso</h1>
        <p className="text-muted-foreground mb-4">Última atualização: Março 2026</p>
        <h2 className="text-lg font-semibold mt-6 mb-2">1. Aceitação dos Termos</h2>
        <p className="text-muted-foreground text-sm mb-4">Ao acessar ou usar o VenusClip, você concorda com estes termos. Se não concordar, não use o serviço.</p>
        <h2 className="text-lg font-semibold mt-6 mb-2">2. Uso do Serviço</h2>
        <p className="text-muted-foreground text-sm mb-4">O VenusClip é uma plataforma de criação de clips com IA. Você é responsável pelo conteúdo que envia.</p>
        <h2 className="text-lg font-semibold mt-6 mb-2">3. Propriedade Intelectual</h2>
        <p className="text-muted-foreground text-sm mb-4">Você mantém todos os direitos sobre seus vídeos e clips gerados. O VenusClip não reclama propriedade sobre seu conteúdo.</p>
        <h2 className="text-lg font-semibold mt-6 mb-2">4. Pagamentos e Cancelamentos</h2>
        <p className="text-muted-foreground text-sm mb-4">As assinaturas são cobradas mensalmente. Você pode cancelar a qualquer momento sem taxas adicionais.</p>
      </div>
    </div>
    <Footer />
  </div>
);

export default Terms;
