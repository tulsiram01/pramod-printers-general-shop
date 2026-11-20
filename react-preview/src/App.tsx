import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, Route, Routes, useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "./lib/supabase";
import { CATEGORIES, imageUrl, normalizeCategory, type Design } from "./types";
import { ArrowRight, BadgeCheck, BookOpen, Camera, CheckCircle2, ChevronDown, FileText, Fingerprint, Heart, Menu, MessageCircle, Phone, Printer, ShieldCheck, Sparkles, X } from "lucide-react";

const phone = "919589445441";
const wa = (message: string) => `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
const logo = "/pramod-printers-general-shop/assets/logo.png";

function Header() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return <header className="site-header"><div className="nav-wrap">
    <Link className="brand" to="/" onClick={close}><img src={logo} alt="Pramod Printers" /><span>प्रमोद प्रिंटर्स<small>जनरल शॉप</small></span></Link>
    <button className="menu-toggle" onClick={() => setOpen(!open)} aria-label="Toggle navigation">{open ? <X/> : <Menu/>}</button>
    <nav className={open ? "nav-links open" : "nav-links"}>{[["सेवाएँ","#services"],["निमंत्रण कार्ड","#gallery"],["ऑनलाइन फॉर्म","#forms"],["हमारे बारे में","#about"],["संपर्क","#contact"]].map(([label,href]) => <a key={href} href={href} onClick={close}>{label}</a>)}<a className="nav-cta" href={wa("नमस्ते, मुझे आपकी सेवाओं की जानकारी चाहिए।")} target="_blank" rel="noreferrer"><MessageCircle size={16}/> WhatsApp</a></nav>
  </div></header>;
}

function Footer() {
  return <footer className="footer"><div className="footer-grid"><div><div className="footer-brand"><img src={logo} alt=""/><b>प्रमोद प्रिंटर्स</b></div><p>डिजिटल सेवाएँ, ऑनलाइन आवेदन और आकर्षक प्रिंटिंग समाधान — एक ही जगह।</p></div><div><h4>त्वरित लिंक</h4><a href="#services">हमारी सेवाएँ</a><a href="#gallery">निमंत्रण कार्ड</a><a href="#contact">संपर्क करें</a></div><div><h4>सहायता</h4><a href="#forms">ऑनलाइन फॉर्म</a><a href="#about">हमारे बारे में</a><Link to="/admin">Admin Login</Link></div><div><h4>संपर्क</h4><a href="tel:+919589445441"><Phone size={15}/> +91 95894 45441</a><a href={wa("नमस्ते, मुझे जानकारी चाहिए।")} target="_blank" rel="noreferrer"><MessageCircle size={15}/> WhatsApp सहायता</a></div></div><div className="copyright">© {new Date().getFullYear()} प्रमोद प्रिंटर्स – जनरल शॉप. सर्वाधिकार सुरक्षित।</div></footer>;
}

function Home() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [category, setCategory] = useState("सभी");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    async function load() {
      if (!supabase) { setLoading(false); return; }
      const { data, error } = await supabase.from("designs").select("id,title,category,image_url,description,is_published,created_at").eq("is_published", true).order("created_at", { ascending: false });
      if (active && !error) setDesigns((data ?? []) as Design[]);
      if (active) setLoading(false);
    }
    void load();
    return () => { active = false; };
  }, []);
  const visible = useMemo(() => designs.filter(d => category === "सभी" || normalizeCategory(d.category) === category), [designs, category]);
  const services = [
    {icon:FileText,title:"ऑनलाइन फॉर्म",desc:"सरकारी व निजी नौकरियों, छात्रवृत्ति और प्रवेश परीक्षाओं के आवेदन में सहायता।",href:"#forms"},
    {icon:Fingerprint,title:"AEPS / फिंगरप्रिंट",desc:"अधिकृत AEPS नेटवर्क के माध्यम से बैंकिंग सहायता।",href:"#aeps"},
    {icon:Heart,title:"शादी कार्ड",desc:"प्रीमियम विवाह निमंत्रण कार्ड डिजाइन और प्रिंटिंग।",href:"#gallery"},
    {icon:BookOpen,title:"भागवत कार्ड",desc:"धार्मिक आयोजनों के लिए सुंदर निमंत्रण पत्र।",href:"#gallery"},
    {icon:Printer,title:"प्रिंटिंग सेवाएँ",desc:"कलर प्रिंट, फोटोकॉपी, स्कैनिंग और स्टेशनरी।",href:"#contact"},
    {icon:Camera,title:"डिजिटल डिजाइन",desc:"आपकी जरूरत के अनुसार आकर्षक डिजाइन और क्रिएटिव कार्य।",href:"#contact"},
  ];
  return <><Header/><main>
    <section className="hero"><div className="hero-glow"/><div className="hero-content"><span className="eyebrow"><Sparkles size={15}/> आपका भरोसेमंद डिजिटल और प्रिंटिंग साथी</span><h1>आपके हर खास पल को दें <em>खूबसूरत पहचान</em></h1><p>प्रीमियम निमंत्रण कार्ड, डिजिटल सेवाएँ और प्रिंटिंग समाधान — भरोसे और गुणवत्ता के साथ।</p><div className="hero-actions"><a className="btn btn-gold" href="#gallery">डिजाइन देखें <ArrowRight size={17}/></a><a className="btn btn-outline" href={wa("नमस्ते, मुझे आपकी सेवाओं की जानकारी चाहिए।")} target="_blank" rel="noreferrer"><MessageCircle size={17}/> WhatsApp पर संपर्क</a></div><div className="trust-row"><span><BadgeCheck/> गुणवत्तापूर्ण प्रिंटिंग</span><span><ShieldCheck/> भरोसेमंद सेवा</span><span><CheckCircle2/> आसान सहायता</span></div></div><div className="hero-art"><div className="art-card art-card-back"><span>आपका खास दिन</span><b>Special Moments</b><small>Made memorable</small></div><div className="art-card art-card-front"><Sparkles/><span>Premium</span><strong>Invitation<br/>Collection</strong><small>Designed with care</small></div><div className="art-stamp">PRINT<br/>WITH LOVE</div></div></section>
    <section className="section" id="services"><div className="section-heading"><span className="eyebrow">WHAT WE DO</span><h2>हमारी प्रमुख सेवाएँ</h2><p>आपकी आवश्यकता के अनुसार सभी डिजिटल एवं प्रिंटिंग समाधान।</p></div><div className="service-grid">{services.map(({icon:Icon,...s}) => <a className="service-card" href={s.href} key={s.title}><span className="service-icon"><Icon/></span><h3>{s.title}</h3><p>{s.desc}</p><span className="learn-more">जानकारी लें <ArrowRight size={15}/></span></a>)}</div></section>
    <section className="section gallery-section" id="gallery"><div className="section-heading"><span className="eyebrow">OUR DESIGN COLLECTION</span><h2>निमंत्रण कार्ड गैलरी</h2><p>अपने खास अवसर के लिए डिजाइन चुनें और WhatsApp पर पूछताछ करें।</p></div><div className="filters">{CATEGORIES.map(c=><button key={c} className={category===c?"filter active":"filter"} onClick={()=>setCategory(c)}>{c}</button>)}</div>{loading ? <div className="empty">गैलरी लोड हो रही है…</div> : !isSupabaseConfigured ? <div className="empty">गैलरी कनेक्शन सेटअप नहीं है। कृपया WhatsApp पर संपर्क करें।</div> : visible.length===0 ? <div className="empty">इस श्रेणी में अभी कोई प्रकाशित डिजाइन उपलब्ध नहीं है।</div> : <div className="design-grid">{visible.map(d=><article className="design-card" key={d.id}><img src={imageUrl(d.image_url)} alt={d.title} loading="lazy"/><div><span>{normalizeCategory(d.category)}</span><h3>{d.title}</h3><p>{d.description}</p><a href={wa(`नमस्ते, मुझे ${d.title} डिजाइन के बारे में जानकारी चाहिए। Image: ${d.image_url}`)} target="_blank" rel="noreferrer">WhatsApp पर पूछें <ArrowRight size={15}/></a></div></article>)}</div>}</section>
    <section className="split-section" id="forms"><div><span className="eyebrow">DIGITAL HELP DESK</span><h2>ऑनलाइन फॉर्म और डिजिटल सेवाएँ</h2><p>सरकारी एवं निजी भर्ती, छात्रवृत्ति, प्रवेश परीक्षा, प्रमाण पत्र और विभिन्न ऑनलाइन आवेदन के लिए सहायता प्राप्त करें।</p><a className="btn btn-primary" href={wa("नमस्ते, मुझे ऑनलाइन फॉर्म भरवाना है।")} target="_blank" rel="noreferrer">फॉर्म के लिए पूछें <ArrowRight size={16}/></a></div><div className="help-list"><div><FileText/><span><b>परीक्षा एवं छात्रवृत्ति</b><small>स्कूल, कॉलेज और प्रतियोगी परीक्षाएँ</small></span></div><div><BadgeCheck/><span><b>सरकारी व निजी भर्ती</b><small>ऑनलाइन आवेदन में सहायता</small></span></div><div><ShieldCheck/><span><b>योजना एवं प्रमाण पत्र</b><small>विभिन्न डिजिटल सेवाएँ</small></span></div></div></section>
    <section className="section aeps-section" id="aeps"><div className="section-heading"><span className="eyebrow">BANKING ASSISTANCE</span><h2>AEPS / फिंगरप्रिंट बैंकिंग सहायता</h2><p>अधिकृत AEPS सेवा प्रदाता के माध्यम से उपलब्ध सेवाओं की जानकारी के लिए दुकान से संपर्क करें।</p></div><div className="aeps-pills"><span>नकद निकासी</span><span>बैलेंस पूछताछ</span><span>मिनी स्टेटमेंट</span><span>मनी ट्रांसफर सहायता</span></div><p className="disclaimer">यह वेबसाइट स्वयं biometric transaction process नहीं करती और न ही किसी प्रकार का बैंक/बायोमेट्रिक डेटा स्टोर करती है।</p></section>
    <section className="section about-section" id="about"><div className="section-heading"><span className="eyebrow">ABOUT OUR SHOP</span><h2>हमारे बारे में</h2><p><b>प्रमोद प्रिंटर्स – जनरल शॉप</b> आपकी स्थानीय डिजिटल और प्रिंटिंग सेवा है। हमारा उद्देश्य आपको त्वरित, सुगम और उचित मूल्य पर गुणवत्तापूर्ण सेवा देना है।</p></div><div className="value-grid"><div><Printer/><b>गुणवत्तापूर्ण प्रिंटिंग</b></div><div><Heart/><b>आकर्षक कार्ड डिजाइन</b></div><div><MessageCircle/><b>सीधी WhatsApp सहायता</b></div><div><CheckCircle2/><b>एक ही जगह अनेक सेवाएँ</b></div></div></section>
    <section className="contact-section" id="contact"><div><span className="eyebrow">GET IN TOUCH</span><h2>आइए, आपके काम को आसान बनाएं</h2><p>किसी भी सेवा, डिजाइन या प्रिंटिंग पूछताछ के लिए संपर्क करें।</p></div><div className="contact-card"><b>प्रमोद प्रिंटर्स – जनरल शॉप</b><a href="tel:+919589445441"><Phone/> +91 95894 45441</a><a href={wa("नमस्ते, मुझे जानकारी चाहिए।")} target="_blank" rel="noreferrer"><MessageCircle/> WhatsApp पर बात करें</a></div></section>
  </main><Footer/><a className="floating-wa" href={wa("नमस्ते, मुझे जानकारी चाहिए।")} target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle/></a></>;
}

function Admin() {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [email,setEmail]=useState(""); const [password,setPassword]=useState("");
  const [error,setError]=useState(""); const [message,setMessage]=useState("");
  const [designs,setDesigns]=useState<Design[]>([]);
  const [editing,setEditing]=useState<string|null>(null);
  const [title,setTitle]=useState(""); const [cat,setCat]=useState("शादी कार्ड");
  const [url,setUrl]=useState(""); const [desc,setDesc]=useState(""); const [published,setPublished]=useState(true);
  const [busy,setBusy]=useState(false);
  const refresh=async()=>{if(!supabase)return; const {data,error}=await supabase.from("designs").select("*").order("created_at",{ascending:false}); if(error)setError(error.message); else setDesigns((data??[]) as Design[]);};
  useEffect(()=>{if(!supabase){setChecking(false);return;} let mounted=true; supabase.auth.getSession().then(({data})=>{if(mounted){setSession(data.session);setChecking(false);}}); const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>{setSession(next);}); return()=>{mounted=false;subscription.unsubscribe();};},[]);
  useEffect(()=>{if(session)void refresh();},[session]);
  const login=async(e:FormEvent)=>{e.preventDefault();if(!supabase)return;setBusy(true);setError("");const {data,error}=await supabase.auth.signInWithPassword({email,password});if(error)setError(error.message);else {const {data:membership,error:membershipError}=await supabase.from("admin_users").select("user_id").eq("user_id",data.user.id).maybeSingle();if(membershipError||!membership){await supabase.auth.signOut();setError("इस खाते को Admin access नहीं मिला है।");}else setMessage("Login सफल रहा।");}setBusy(false);};
  const reset=()=>{setEditing(null);setTitle("");setCat("शादी कार्ड");setUrl("");setDesc("");setPublished(true);};
  const save=async(e:FormEvent)=>{e.preventDefault();if(!supabase)return;setBusy(true);setError("");const payload={title,category:cat,image_url:url,description:desc,is_published:published};const result=editing?await supabase.from("designs").update(payload).eq("id",editing):await supabase.from("designs").insert(payload);if(result.error)setError(result.error.message);else{setMessage("Design सुरक्षित कर दिया गया।");reset();await refresh();}setBusy(false);};
  const edit=(d:Design)=>{setEditing(d.id);setTitle(d.title);setCat(normalizeCategory(d.category));setUrl(d.image_url);setDesc(d.description??"");setPublished(d.is_published);window.scrollTo({top:0,behavior:"smooth"});};
  const remove=async(id:string)=>{if(!supabase||!window.confirm("क्या आप इस design को delete करना चाहते हैं?"))return;const {error}=await supabase.from("designs").delete().eq("id",id);if(error)setError(error.message);else{setMessage("Design delete कर दिया गया।");await refresh();}};
  if(checking)return <div className="admin-shell"><div className="admin-card">Session जाँच रहे हैं…</div></div>;
  if(!session)return <div className="admin-shell"><form className="admin-card" onSubmit={login}><Link to="/" className="back-link">← वेबसाइट पर वापस जाएँ</Link><img className="admin-logo" src={logo} alt="Pramod Printers"/><span className="eyebrow">PRAMOD PRINTERS</span><h1>Admin Login</h1><p>अपने designs को सुरक्षित रूप से manage करें।</p>{error&&<div className="alert error">{error}</div>}{!isSupabaseConfigured&&<div className="alert error">Supabase configuration उपलब्ध नहीं है।</div>}<label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></label><button className="btn btn-primary full" disabled={busy||!isSupabaseConfigured}>{busy?"Login हो रहा है…":"Login करें"}</button></form></div>;
  return <div className="admin-shell"><div className="admin-dashboard"><div className="admin-top"><div><Link to="/" className="back-link">← Website</Link><h1>Design Manager</h1><p>Supabase gallery records</p></div><button className="btn btn-outline-dark" onClick={async()=>{await supabase?.auth.signOut();navigate("/admin");}}>Logout</button></div>{error&&<div className="alert error">{error}</div>}{message&&<div className="alert success">{message}</div>}<div className="admin-stats"><div><small>Total Designs</small><b>{designs.length}</b></div><div><small>Published</small><b>{designs.filter(d=>d.is_published).length}</b></div><div><small>Hidden</small><b>{designs.filter(d=>!d.is_published).length}</b></div></div><form className="editor-card" onSubmit={save}><h2>{editing?"Design Edit करें":"नया Design जोड़ें"}</h2><div className="form-grid"><label>Category<select value={cat} onChange={e=>setCat(e.target.value)}>{CATEGORIES.filter(c=>c!=="सभी").map(c=><option key={c}>{c}</option>)}</select></label><label>Title<input value={title} onChange={e=>setTitle(e.target.value)} required/></label><label className="wide">Image URL<input type="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://..." required/></label><label className="wide">Description<textarea value={desc} onChange={e=>setDesc(e.target.value)} rows={3}/></label><label className="check-label"><input type="checkbox" checked={published} onChange={e=>setPublished(e.target.checked)}/> Published</label></div><div className="editor-actions"><button className="btn btn-primary" disabled={busy}>{busy?"Saving…":editing?"Update Design":"Save Design"}</button>{editing&&<button type="button" className="btn btn-outline-dark" onClick={reset}>Cancel Edit</button>}</div></form><section className="admin-list"><div className="list-heading"><h2>Gallery Designs</h2><button className="btn btn-outline-dark" onClick={()=>void refresh()}>Refresh</button></div>{designs.map(d=><article className="admin-design" key={d.id}><img src={imageUrl(d.image_url)} alt=""/><div className="admin-design-info"><b>{d.title}</b><small>{normalizeCategory(d.category)} · {d.is_published?"Published":"Hidden"}</small></div><button onClick={()=>edit(d)} className="small-action">Edit</button><button onClick={()=>void remove(d.id)} className="small-action danger">Delete</button></article>)}</section></div></div>;
}

export default function App() {
  return <Routes><Route path="/" element={<Home/>}/><Route path="/admin" element={<Admin/>}/><Route path="*" element={<Home/>}/></Routes>;
}
