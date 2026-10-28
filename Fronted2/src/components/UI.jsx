import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { ArrowUpRight, Clock3, MapPin, Heart, Mountain } from 'lucide-react'
import { SaveToggle } from '../pages/Stage2'

gsap.registerPlugin(ScrollTrigger)

export function Reveal({ children, className = '', delay = 0 }) {
  const elementRef = useRef(null)
  useEffect(() => {
    const element = elementRef.current
    if (!element) return undefined
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reducedMotion) {
      gsap.set(element, { clearProps: 'all' })
      return undefined
    }
    const context = gsap.context(() => {
      gsap.fromTo(element,
        { autoAlpha: 0, y: 26 },
        { autoAlpha: 1, y: 0, duration: 0.72, delay, ease: 'power3.out', clearProps: 'transform,opacity,visibility',
          scrollTrigger: { trigger: element, start: 'top 88%', once: true }
        }
      )
    }, element)
    return () => context.revert()
  }, [delay])
  return <div ref={elementRef} className={className}>{children}</div>
}

export function SectionHeading({eyebrow,title,description,link,to}){return <div className="section-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2>{description&&<p>{description}</p>}</div>{link&&<Link className="text-link" to={to}>{link}<ArrowUpRight size={17}/></Link>}</div>}
export function DestinationCard({item}){const packagesUrl=`/packages?destination=${encodeURIComponent(item.slug)}`;return <Reveal className="destination-card"><Link to={packagesUrl} className="image-link" aria-label={`Explore ${item.name} packages`}><img src={item.image} alt={`${item.name}, ${item.state}`} loading="lazy"/><span className="image-pill">{item.state}</span><span className="round-arrow"><ArrowUpRight size={18}/></span></Link><div className="destination-copy"><div className="stage-card-title-row"><span className="eyebrow">{item.tag}</span><SaveToggle type="destination" item={{...item,title:item.name}}/></div><h3><Link to={packagesUrl}>{item.name}</Link></h3><p>{item.description}</p><div className="card-meta"><span><Clock3 size={14}/>{item.days}</span><Link to={packagesUrl}>Explore packages <ArrowUpRight size={15}/></Link></div></div></Reveal>}
export function PackageCard({item}){return <Reveal className="package-card"><Link to={`/packages/${item.slug}`} className="package-image"><img src={item.image} alt={item.title} loading="lazy"/><span className="image-pill">{item.tag}</span></Link><div className="package-copy"><div className="stage-card-title-row"><span className="location-line"><MapPin size={14}/>{item.place}</span><SaveToggle type="package" item={item}/></div><h3><Link to={`/packages/${item.slug}`}>{item.title}</Link></h3><p>{item.summary}</p><div className="package-bottom"><span><strong>₹{item.price.toLocaleString('en-IN')}</strong><small> / person · indicative estimate</small></span><Link to={`/packages/${item.slug}`} aria-label={`View ${item.title}`} className="round-arrow static"><ArrowUpRight size={17}/></Link></div><p className="demo-note">Demonstration estimate; final details require discussion.</p></div></Reveal>}
export function InquiryNotice(){return <p className="inquiry-notice">Sending an inquiry is not a confirmed booking and requires no online payment.</p>}
export function SendInquiry({item='a trip'}){return <Link className="button button-primary" to={`/contact?trip=${encodeURIComponent(item)}`}>Send Inquiry <ArrowUpRight size={17}/></Link>}
export function FeatureIcon({name}){let Icon=name==='Mountain'?Mountain:name==='Heart'?Heart:name==='MapPin'?MapPin:Mountain;return <span className="feature-icon"><Icon size={22}/></span>}
