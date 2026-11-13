import { Link, useLocation } from '@tanstack/react-router'
import { defaultCatalogSearch } from '@/shared/contracts/catalog'
import './site-footer.css'

const benefits = [
  ['W', 'Segurança da carteira', 'Proteja sua carteira e colecione arte digital verificada com confiança.'],
  ['C', 'Criadores em destaque', 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.'],
  ['D', 'Alertas de lançamentos', 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.'],
]
const unavailable = (label: string) => <span key={label} aria-disabled="true" title="Conteúdo fora do escopo desta demonstração">{label}</span>
export function SiteFooter() {
  const { pathname } = useLocation()
  if (!(pathname === '/' || pathname === '/entrar' || pathname === '/cadastro' || pathname === '/carrinho' || pathname === '/pagamento' || pathname.startsWith('/nfts/'))) return null
  return <footer className="site-footer page-container">
    <div className="footer-benefits">{benefits.map(([mark, title, text]) => <section key={mark}><span className="footer-benefit-mark" aria-hidden="true">{mark}</span><h2>{title}</h2><p>{text}</p></section>)}<section className="footer-newsletter"><h2>Antecipe-se ao próximo lançamento</h2><div><input aria-label="E-mail para novidades" placeholder="Digite seu e-mail…" disabled /><button type="button" disabled title="Inscrição indisponível nesta demonstração">Enviar</button></div><p>Receba lançamentos selecionados, histórias de criadores e novidades do mercado.</p></section></div>
    <div className="footer-brand"><strong>KURIO</strong><p>Feita para colecionadores,<br />criadores e cultura</p><span>contato@email.com</span><span>+55 11 4002 8922</span></div>
    <div className="footer-links"><section><h2>Meu perfil</h2><Link to="/perfil">Meu perfil</Link>{unavailable('Minha coleção')}{unavailable('Atividade')}{unavailable('Estúdio do criador')}<Link to="/favoritos">Lista de interesse</Link></section><section><h2>Central de ajuda</h2>{['Central de ajuda', 'Como comprar NFTs', 'Carteira e segurança', 'Política do mercado', 'Denunciar item'].map(unavailable)}</section><section><h2>Coleções</h2>{([['Arte digital','digital-art'],['Fotografia','photography'],['Música','music'],['Arte 3D','3d-art'],['Utilidade','utility']] as const).map(([label,collection]) => <Link key={collection} to="/" search={{...defaultCatalogSearch, collections: [collection]}} hash="mercado">{label}</Link>)}</section><section><h2>Redes sociais</h2><div className="footer-socials">{['f','◎','𝕏','in','▶'].map(label => <span key={label} aria-hidden="true">{label}</span>)}</div><h2 className="footer-wallet-title">Carteiras compatíveis</h2><p className="footer-wallets">METAMASK · WALLETCONNECT · COINBASE</p></section></div>
    <p className="footer-copyright">© 2026 Kurio. Propriedade digital para todos.</p>
  </footer>
}
