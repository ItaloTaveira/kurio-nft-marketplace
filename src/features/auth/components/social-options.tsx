import type { SocialProvider } from '@/shared/contracts/auth'
import desktopLine from '@/shared/assets/figma/auth-desktop-imgLine7.svg'
import desktopLineRight from '@/shared/assets/figma/auth-desktop-imgLine8.svg'
import vector from '@/shared/assets/figma/auth-imgVector.svg'
import vector1 from '@/shared/assets/figma/auth-imgVector1.svg'
import group from '@/shared/assets/figma/auth-imgGroup.svg'
import vector2 from '@/shared/assets/figma/auth-imgVector2.svg'
import vector3 from '@/shared/assets/figma/auth-imgVector3.svg'
import vector4 from '@/shared/assets/figma/auth-imgVector4.svg'
import vector5 from '@/shared/assets/figma/auth-imgVector5.svg'
import facebook from '@/shared/assets/figma/auth-imgFacebook1.svg'
import line from '@/shared/assets/figma/auth-imgLine7.svg'

export function SocialOptions({ onSelect, disabled }: { onSelect: (provider: SocialProvider) => void; disabled: boolean }) {
  if (import.meta.env.VITE_ENABLE_MOCKS === 'false') return null
  return <div className="auth-social"><div className="auth-divider"><span><picture><source media="(min-width: 1024px)" srcSet={desktopLine} /><img src={line} alt="" /></picture></span><p>Ou continue com</p><span><picture><source media="(min-width: 1024px)" srcSet={desktopLineRight} /><img src={line} alt="" /></picture></span></div><div className="auth-social-buttons"><button type="button" disabled={disabled} onClick={() => onSelect('google')} aria-describedby="social-demo-note"><span className="auth-google" aria-hidden="true"><img src={vector} alt="" /><img src={vector1} alt="" /><img src={group} alt="" /><img src={vector2} alt="" /><img src={vector3} alt="" /><img src={vector4} alt="" /><img src={vector5} alt="" /></span>Continuar com Google</button><button type="button" disabled={disabled} onClick={() => onSelect('facebook')} aria-describedby="social-demo-note"><img src={facebook} alt="" />Continuar com Facebook</button></div><p id="social-demo-note" className="auth-social-note">Simulação: você informa dados fictícios. Não conectamos sua conta real do Google ou Facebook.</p></div>
}
