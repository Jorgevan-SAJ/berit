import RegistrarSW from './registrar-sw'
import "./globals.css";

export const metadata = {
  title: "Berit — Gestão Eclesiástica",
  description: "Plataforma de gestão eclesiástica e diretório de igrejas.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
    <body>
  <RegistrarSW />
  {children}
</body>
    </html>
  );
}
