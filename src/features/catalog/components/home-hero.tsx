import { Button } from '@/shared/ui/button'
import heroArtwork from '@/shared/assets/figma/hero-ape.webp'
import desktopBackground from '@/shared/assets/figma/hero-background.svg'
import desktopDots from '@/shared/assets/figma/hero-dots.svg'
import mobileBackground from '@/shared/assets/figma/mobile-hero-background.svg'
import mobileApe from '@/shared/assets/figma/mobile-ape.webp'
import mobileNomad from '@/shared/assets/figma/mobile-nomad.webp'
import mobileDots from '@/shared/assets/figma/mobile-hero-dots.svg'
import arrow from '@/shared/assets/figma/arrow-right.svg'
import './home-hero.css'

export function HomeHero() {
  return (
    <section aria-labelledby="hero-title" className="home-hero">
      <div aria-hidden="true" className="hero-background hero-background-desktop" style={{ backgroundImage: `url("${desktopBackground}")` }} />
      <div aria-hidden="true" className="hero-background hero-background-mobile" style={{ backgroundImage: `url("${mobileBackground}")` }} />
      <div className="hero-content">
        <div className="hero-copy">
          <p className="hero-eyebrow">Bem-vindo à Kurio</p>
          <h1 id="hero-title" className="hero-title"><span className="hidden lg:block">SEJA DONO DO FUTURO<br />DA ARTE DIGITAL</span><span className="lg:hidden">SEJA DONO DA<br />CULTURA DIGITAL</span></h1>
          <p className="hero-description"><span className="hidden lg:inline">Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.</span><span className="lg:hidden">Descubra NFTs selecionados de criadores do mundo todo.</span></p>
          <Button asChild className="hero-explore"><a href="#mercado">EXPLORAR<img src={arrow} alt="" className="-rotate-90 lg:hidden" /></a></Button>
        </div>
        <div className="hero-artwork-desktop"><img src={heroArtwork} alt="Emerald Ape: macaco com óculos e jaqueta verde" width="450" height="450" fetchPriority="high" /></div>
        <div className="hero-artwork-mobile">
          <img src={mobileApe} alt="Emerald Ape: macaco com óculos e jaqueta verde" width="138" height="138" fetchPriority="high" className="hero-mobile-main" />
          <img src={mobileNomad} alt="Sage Nomad: macaco com chapéu e moletom lilás" width="58" height="58" className="hero-mobile-secondary" />
        </div>
      </div>
      <img src={desktopDots} alt="" className="hero-dots-desktop" />
      <img src={mobileDots} alt="" className="hero-dots-mobile" />
    </section>
  )
}
