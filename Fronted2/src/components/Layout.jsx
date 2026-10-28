import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Menu, X, Mountain, ArrowUpRight, Instagram } from 'lucide-react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import Lenis from 'lenis'
import { business } from '../config/business'

function RollingLink({to,children,onClick,className=''}){
 const letters=Array.from(String(children))
 const glyphs='HOMKPLINQTRVEXWAZ'
 return <NavLink to={to} onClick={onClick} className={({isActive})=>`${className} ${isActive?'active':''}`.trim()}>
  <span className="rolling-link-window"><span className="rolling-link-track">{letters.map((letter,i)=>{
   const offset=(i*3+letters.length)%glyphs.length
   const scramble=Array.from({length:5},(_,j)=>glyphs[(offset+j*5+i)%glyphs.length])
   return <span key={`${letter}-${i}`} className="rolling-letter" style={{'--letter-delay':`${i*24}ms`}} aria-hidden="true"><span className="rolling-glyph-stack">{[letter,...scramble,letter].map((glyph,j)=><span key={j}>{glyph===' '?'\u00a0':glyph}</span>)}</span></span>
  })}</span></span><span className="sr-only">{children}</span>
 </NavLink>
}
function CustomCursor(){
 const [enabled,setEnabled]=useState(false);const [hover,setHover]=useState(false);const [visible,setVisible]=useState(false)
 const x=useMotionValue(-100),y=useMotionValue(-100);const sx=useSpring(x,{stiffness:170,damping:24,mass:.22});const sy=useSpring(y,{stiffness:170,damping:24,mass:.22})
 useEffect(()=>{
  const mq=window.matchMedia('(pointer:fine) and (min-width: 761px)');const update=()=>setEnabled(mq.matches);update();mq.addEventListener?.('change',update)
  const move=e=>{x.set(e.clientX);y.set(e.clientY);setVisible(true);setHover(!!e.target.closest('a,button,[role=button],input,select,textarea'))}
  const leave=()=>setVisible(false);if(mq.matches){window.addEventListener('pointermove',move,{passive:true});document.addEventListener('pointerleave',leave)}
  return()=>{mq.removeEventListener?.('change',update);window.removeEventListener('pointermove',move);document.removeEventListener('pointerleave',leave)}
 },[x,y])
 if(!enabled)return null
 return <>
  <motion.span className="custom-cursor-dot" style={{x,y}} animate={{opacity:visible?1:0}} transition={{duration:.12}} />
  <motion.span className="custom-cursor-ring" style={{x:sx,y:sy}} animate={{opacity:visible?1:0}} transition={{duration:.12}}><motion.span className="cursor-ring-shell" animate={{width:hover?44:30,height:hover?44:30,backgroundColor:hover?'rgba(12,39,33,.88)':'rgba(12,39,33,.12)',borderColor:hover?'rgba(219,174,102,.98)':'rgba(164,211,187,.88)',boxShadow:hover?'0 0 0 3px rgba(164,211,187,.07), 0 0 16px rgba(92,174,137,.20)':'0 0 0 0 rgba(164,211,187,0)'}} transition={{type:'spring',stiffness:260,damping:26,mass:.28}}><span className="cursor-ring-core"/><motion.span className="cursor-label" animate={{opacity:hover?1:0,scale:hover?1:.7}} transition={{duration:.16}}>VIEW</motion.span></motion.span></motion.span>
 </>
}
function ScrollProgress(){const [progress,setProgress]=useState(0);useEffect(()=>{const update=()=>{const max=document.documentElement.scrollHeight-window.innerHeight;setProgress(max>0?window.scrollY/max:0)};window.addEventListener('scroll',update,{passive:true});update();return()=>window.removeEventListener('scroll',update)},[]);return <div className="scroll-progress-track" aria-hidden="true"><motion.div className="scroll-progress-bar" style={{scaleX:progress,transformOrigin:'0% 50%'}}/></div>}
const nav = [
 ['Destinations','/destinations'],['Packages','/packages'],['Experiences','/experiences'],['Trip planner','/planner'],['Our story','/about']
]
export function Layout(){
 const [open,setOpen]=useState(false); const location=useLocation(); const isAdmin=location.pathname.startsWith('/admin'); useEffect(()=>{const lenis=new Lenis({duration:1.05,smoothWheel:true,autoRaf:true,anchors:true});return()=>lenis.destroy()},[])
 return <><ScrollProgress/><CustomCursor/>{!isAdmin&&<><header className="site-header"><div className="nav-shell">
  <Link to="/" className="brand" onClick={()=>setOpen(false)} aria-label="Himtrip home"><span className="brand-mark"><Mountain size={22}/></span><span>himtrip<small>FIND YOUR MOUNTAIN</small></span></Link>
  <nav className="desktop-nav" aria-label="Main navigation">{nav.map(([label,to])=><RollingLink key={to} to={to} className="nav-link">{label}</RollingLink>)}</nav>
  <div className="nav-account-actions"><Link className="nav-login" to="/login">Create account / Sign in</Link><Link className="nav-cta" to="/contact">Plan your trip <ArrowUpRight size={16}/></Link></div>
  <button className="mobile-toggle" onClick={()=>setOpen(!open)} aria-label={open?'Close menu':'Open menu'} aria-expanded={open}>{open?<X/>:<Menu/>}</button>
 </div>{open&&<nav className="mobile-nav">{nav.map(([label,to])=><NavLink key={to} to={to} onClick={()=>setOpen(false)}>{label}</NavLink>)}<Link to="/login" onClick={()=>setOpen(false)}>Customer login</Link><Link to="/login?mode=admin" onClick={()=>setOpen(false)}>Admin demo</Link><Link to="/contact" onClick={()=>setOpen(false)}>Plan your trip ↗</Link></nav>}</header></>}
 <main><Outlet/></main>
 {!isAdmin&&<footer className="footer"><div className="footer-top"><div className="footer-brand"><Link to="/" className="brand brand-light"><span className="brand-mark"><Mountain size={22}/></span><span>himtrip<small>FIND YOUR MOUNTAIN</small></span></Link><p>Thoughtful journeys into the mountains, made around the way you want to travel.</p><span className="footer-note">Travel across India</span></div><div><h4>Explore</h4><Link to="/destinations">Destinations</Link><Link to="/packages">Travel packages</Link><Link to="/experiences">Experiences</Link><Link to="/planner">Smart trip planner</Link></div><div><h4>Himtrip</h4><Link to="/about">Our story</Link><Link to="/guides">Travel journal</Link><Link to="/faqs">FAQs</Link><Link to="/contact">Contact</Link><Link to="/account">My account</Link></div><div><h4>Say hello</h4><a href={business.phoneLink}>{business.phone}</a><a href={business.emailLink}>{business.email}</a><a href={business.whatsapp} target="_blank" rel="noreferrer">WhatsApp us ↗</a><span className="footer-note">{business.address}</span><span className="footer-note">Hours: {business.hours}</span></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Himtrip</span><span>Sample travel information for planning inspiration.</span><div><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/cancellation">Cancellation</Link></div></div></footer>}
 </>
}
export function PageIntro({eyebrow,title,description}){return <section className="page-intro"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></section>}
