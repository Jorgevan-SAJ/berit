import './globals.css'
import Navbar from '../components/Navbar'

export const metadata = {
  title: 'Berit — Gestão simples para igrejas',
  description: 'Plataforma de gestão eclesiástica e diretório de igrejas.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  )
}
