import Link from "next/link"
import { Activity, ArrowRight, CalendarCheck, Clock3, HeartPulse, MapPin, ShieldCheck, Stethoscope, Users, Phone, Mail, Sparkles } from "lucide-react"

const services = [
  { icon: Stethoscope, title: "Konsultasi Dokter", text: "Konsultasi kesehatan dengan tenaga medis yang siap membantu kebutuhan Anda." },
  { icon: CalendarCheck, title: "Reservasi Praktis", text: "Ajukan jadwal kunjungan dengan alur yang mudah dan informasi yang jelas." },
  { icon: ShieldCheck, title: "Rekam Medis", text: "Informasi kunjungan dan catatan kesehatan dikelola dengan mengutamakan privasi." },
  { icon: HeartPulse, title: "Perawatan Berpusat pada Pasien", text: "Pelayanan yang ramah, nyaman, dan memperhatikan kebutuhan setiap pasien." },
]

export default function LandingPage() {
  return <main id="top" className="clinic-page">
    <header className="site-header"><div className="site-nav">
      <Link href="/" className="brand"><span className="brand-mark"><HeartPulse size={23}/></span><span>Zamheal<small>CLINIC & CARE</small></span></Link>
      <nav className="desktop-nav"><a href="#layanan">Layanan</a><a href="#tentang">Tentang Kami</a><a href="#kontak">Kontak</a></nav>
      <div className="nav-actions"><Link href="/login" className="nav-login">Masuk</Link><Link href="/register" className="nav-register">Daftar Pasien <ArrowRight size={16}/></Link></div>
    </div></header>

    <section className="hero-section"><div className="hero-copy"><div className="eyebrow"><Sparkles size={15}/> LAYANAN KESEHATAN YANG LEBIH DEKAT</div>
      <h1>Perawatan yang baik dimulai dari <em>rasa peduli.</em></h1>
      <p className="hero-description">Selamat datang di Zamheal Clinic. Kami membantu Anda mengelola kunjungan kesehatan dengan pelayanan yang ramah, informasi yang jelas, dan dukungan tenaga medis.</p>
      <div className="hero-actions"><Link href="/register" className="primary-action">Buat Janji Kunjungan <ArrowRight size={18}/></Link><a href="#layanan" className="secondary-action">Jelajahi layanan</a></div>
      <div className="hero-trust"><div className="trust-icon"><ShieldCheck size={20}/></div><div><strong>Nyaman, teratur, dan terpercaya</strong><span>Informasi layanan dalam satu tempat</span></div></div>
    </div><div className="hero-visual"><div className="hero-photo" role="img" aria-label="Dokter memberikan konsultasi kepada pasien"><div className="photo-overlay"></div></div><div className="floating-note"><span className="note-icon"><CalendarCheck size={19}/></span><span><strong>Atur kunjungan Anda</strong><small>Mulai dari pendaftaran pasien</small></span></div><div className="hero-stamp"><HeartPulse size={25}/><span>Care that<br/>starts with you</span></div></div></section>

    <section className="stats-strip"><div><span className="stat-icon"><Users size={20}/></span><span><strong>Berpusat pada pasien</strong><small>Pelayanan yang lebih personal</small></span></div><div><span className="stat-icon"><Activity size={20}/></span><span><strong>Informasi terorganisir</strong><small>Alur layanan lebih tertata</small></span></div><div><span className="stat-icon"><Clock3 size={20}/></span><span><strong>Lebih praktis</strong><small>Akses informasi kapan saja</small></span></div></section>

    <section className="services-section" id="layanan"><div className="section-heading"><span className="section-kicker">LAYANAN KAMI</span><h2>Dukungan kesehatan, dengan cara yang lebih mudah.</h2><p>Fitur layanan dirancang untuk membantu pasien dan tim klinik menjalankan proses kunjungan dengan lebih teratur.</p></div><div className="service-grid">{services.map(({icon: Icon,title,text},i)=><article className="service-card" key={title}><span className={`service-icon service-icon-${i}`}><Icon size={24}/></span><h3>{title}</h3><p>{text}</p><span className="service-number">0{i+1}</span></article>)}</div></section>

    <section className="about-section" id="tentang"><div className="about-image" role="img" aria-label="Suasana ruang konsultasi klinik"><div className="image-caption"><span className="caption-dot"></span> Mengutamakan kenyamanan Anda</div></div><div className="about-copy"><span className="section-kicker">TENTANG ZAMHEAL</span><h2>Lebih dari sekadar kunjungan. Kami peduli pada perjalanan sehat Anda.</h2><p>Zamheal Clinic menghadirkan pengalaman layanan yang mengutamakan keramahan, keteraturan, dan kemudahan akses informasi. Melalui sistem klinik, pasien dapat mendaftar dan melihat informasi kunjungan dalam satu tempat.</p><div className="about-points"><span><ShieldCheck size={18}/> Privasi pasien diperhatikan</span><span><CalendarCheck size={18}/> Informasi jadwal lebih tertata</span><span><HeartPulse size={18}/> Pendekatan yang humanis</span></div><Link href="/register" className="text-link">Mulai sebagai pasien <ArrowRight size={17}/></Link></div></section>

    <section className="contact-section" id="kontak"><div><span className="section-kicker">KUNJUNGI KAMI</span><h2>Kami siap membantu Anda.</h2><p>Hubungi klinik untuk informasi layanan dan jadwal kunjungan.</p></div><div className="contact-cards"><div className="contact-card"><MapPin size={21}/><span><strong>Alamat</strong><small>Jl. Kesehatan No. 123, Medan, Sumatera Utara</small></span></div><div className="contact-card"><Phone size={21}/><span><strong>Telepon</strong><small>Hubungi melalui kontak resmi klinik</small></span></div><div className="contact-card"><Mail size={21}/><span><strong>Email</strong><small>Informasi melalui kanal resmi klinik</small></span></div></div></section>
    <footer className="site-footer"><Link href="/" className="brand footer-brand"><span className="brand-mark"><HeartPulse size={21}/></span><span>Zamheal<small>CLINIC & CARE</small></span></Link><p>© {new Date().getFullYear()} Zamheal Clinic. Dibuat dengan kepedulian.</p><a href="#top">Kembali ke atas ↑</a></footer>
  </main>
}
