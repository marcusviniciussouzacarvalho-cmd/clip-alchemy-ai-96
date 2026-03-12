import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const Privacy = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="pt-32 pb-24">
      <div className="container max-w-2xl prose prose-sm">
        <h1 className="text-3xl font-bold mb-8">Política de Privacidade</h1>
        <p className="text-muted-foreground mb-4">Última atualização: Março 2026</p>
        <h2 className="text-lg font-semibold mt-6 mb-2">1. Dados Coletados</h2>
        <p className="text-muted-foreground text-sm mb-4">Coletamos nome, email e dados de uso para fornecer e melhorar o serviço.</p>
        <h2 className="text-lg font-semibold mt-6 mb-2">2. Uso dos Dados</h2>
        <p className="text-muted-foreground text-sm mb-4">Seus dados são usados exclusivamente para operar o VenusClip. Não vendemos dados a terceiros.</p>
        <h2 className="text-lg font-semibold mt-6 mb-2">3. Armazenamento de Vídeos</h2>
        <p className="text-muted-foreground text-sm mb-4">Seus vídeos são armazenados de forma segura e criptografada. Você pode excluí-los a qualquer momento.</p>
        <h2 className="text-lg font-semibold mt-6 mb-2">4. Seus Direitos</h2>
        <p className="text-muted-foreground text-sm mb-4">Você pode solicitar acesso, correção ou exclusão dos seus dados a qualquer momento.</p>
      </div>
    </div>
    <Footer />
  </div>
);

export default Privacy;
