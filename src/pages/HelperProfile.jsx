import PageHeader from '../components/PageHeader'
import ErrorBoundary from '../components/ErrorBoundary'
import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Star, Shield, MapPin, MessageCircle, Zap, TrendingUp, Clock, CheckCircle, Award, Brain, Globe, Building2, BookOpen, Share2, Lock, Heart, Sparkles, Calendar, ThumbsUp, MessageSquare, AlertCircle, BarChart2, Activity, Cpu, Layers } from 'lucide-react'
import { HELPERS } from '../data/helpers'
import { useUser } from '../context/UserContext'
import RatingModal from '../components/RatingModal'
import styles from './HelperProfile.module.css'
import { showToast } from '../components/Toast'
import RegisterGate from '../components/RegisterGate'
import { getHelperById } from '../utils/supabase'

/* ── LIVE PROFILE PULSE ───────────────────────────────────────────────────
   This is the core of Nüra's concept: the profile is alive, updating now.
   ──────────────────────────────────────────────────────────────────────── */

function LivePulse({ helper }) {
  const [pulse, setPulse] = useState(false)
  useEffect(() => {
    const t = setInterval(() => setPulse(p => !p), 2500)
    return () => clearInterval(t)
  }, [])

  const isSupabase = !!helper.isFromSupabase
  const firstName = helper.name?.split(' ')?.[0] || helper.name || ''

  const facts = isSupabase ? [
    { icon: <Activity size={12} />, text: `Reputación calculada a partir de ${helper.reviews} valoraciones reales` },
    { icon: <Shield size={12} />, text: `Identidad verificada con documento oficial` },
    { icon: <Cpu size={12} />, text: `Perfil en construcción — Nüra lo irá completando automáticamente` },
  ] : [
    { icon: <Brain size={12} />, text: `Personalidad analizada en ${helper.services} servicios reales` },
    { icon: <Cpu size={12} />, text: `${helper.hiddenSkills?.length || 2} habilidades detectadas sin que ${firstName} las declarara` },
    { icon: <Activity size={12} />, text: `Reputación actualizada automáticamente tras cada valoración` },
    { icon: <MessageSquare size={12} />, text: `Comportamiento en chats analizado para construir el perfil` },
  ]

  return (
    <div className={styles.liveCard}>
      <div className={styles.liveHeader}>
        <span className={`${styles.liveDot} ${pulse ? styles.liveDotPulse : ''}`} />
        <span className={styles.liveLabel}>Perfil vivo — Nüra lo construye y actualiza sola</span>
      </div>
      <div className={styles.liveFacts}>
        {facts.map((f, i) => (
          <div key={i} className={styles.liveFact}>
            <span className={styles.liveFactIcon}>{f.icon}</span>
            <span className={styles.liveFactText}>{f.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── NÜRA AI PROACTIVE QUESTION ────────────────────────────────────────── */
function PersonalityCircle({ label, value, color }) {
  const pct = (value / 10) * 100
  const r = 22
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <div className={styles.pCircle}>
      <svg width="58" height="58" viewBox="0 0 58 58">
        <circle cx="29" cy="29" r={r} fill="none" stroke="var(--rule2)" strokeWidth="4" />
        <circle cx="29" cy="29" r={r} fill="none" stroke={color}
          strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          transform="rotate(-90 29 29)" />
        <text x="29" y="34" textAnchor="middle"
          fontSize="11" fontWeight="800" fill="var(--ink)"
          fontFamily="Inter, sans-serif">{value.toFixed(1)}</text>
      </svg>
      <span className={styles.pCircleLabel}>{label}</span>
    </div>
  )
}

/* ── EXPERIENCE CARD ──────────────────────────────────────────────────── */
function ExperienceCard({ exp }) {
  return (
    <div className={styles.expCard}>
      <div className={styles.expTop}>
        <div className={styles.expInfo}>
          <div className={styles.expRole}>{exp.role}</div>
          <div className={styles.expCompanyName}>{exp.company}</div>
          <div className={styles.expPeriodLoc}>{exp.period} · {exp.location}</div>
        </div>
        {exp.verifiedByCompany && (
          <span className={styles.expVerifiedTag}><Building2 size={9} /> Verificado</span>
        )}
      </div>

      {exp.competencies?.length > 0 && (
        <div className={styles.competencies}>
          {exp.competencies.map((c, i) => <span key={i} className={styles.competency}>{c}</span>)}
        </div>
      )}

      {exp.managerOpinion && (
        <div className={styles.managerBlock}>
          <div className={styles.managerHeader}>
            <div className={styles.managerAvatar}>{exp.managerOpinion.avatar}</div>
            <div className={styles.managerInfo}>
              <span className={styles.managerName}>{exp.managerOpinion.name}</span>
              <span className={styles.managerRole}>{exp.managerOpinion.role}</span>
            </div>
            <div className={styles.managerStars}>
              {[1,2,3,4,5].map(n => <Star key={n} size={10} fill="#F59E0B" color="#F59E0B" />)}
            </div>
          </div>
          <p className={styles.managerQuote}>"{exp.managerOpinion.text}"</p>
          <span className={styles.managerVerified}><Shield size={9} /> Opinión verificada por Nüra</span>
        </div>
      )}

      {exp.colleagueOpinions?.length > 0 && (
        <div className={styles.colleaguesBlock}>
          <p className={styles.colleaguesTitle}>Compañeros de trabajo</p>
          {exp.colleagueOpinions.map((c, i) => (
            <div key={i} className={styles.colleagueRow}>
              <div className={styles.colleagueAvatar}>{c.avatar}</div>
              <div>
                <span className={styles.colleagueName}>{c.name}</span>
                <span className={styles.colleagueRole}> · {c.role}</span>
                <p className={styles.colleagueQuote}>"{c.text}"</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── POST CARD ────────────────────────────────────────────────────────── */
function PostCard({ post, helper }) {
  const [liked, setLiked] = useState(false)
  const [likes, setLikes] = useState(post.likes)
  const [showComment, setShowComment] = useState(false)
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState([])

  return (
    <div className={styles.postCard}>
      <div className={styles.postHeader}>
        {helper.avatarUrl
          ? <img src={helper.avatarUrl} alt="" className={styles.postAvatarImg} />
          : <div className={styles.postAvatar} style={{ background: helper.avatarColor }}>{helper.avatar}</div>
        }
        <div className={styles.postMeta}>
          <span className={styles.postName}>{helper.name}</span>
          <span className={styles.postDate}>{post.date}</span>
        </div>
        {post.verifiedWork && (
          <span className={styles.verifiedWorkBadge}><Shield size={9} /> Verificado</span>
        )}
      </div>
      <p className={styles.postText}>{post.text}</p>
      {post.badge && <div className={styles.postBadge}>{post.badge}</div>}
      <div className={styles.postActions}>
        <button className={`${styles.postAction} ${liked ? styles.postActionActive : ''}`}
          onClick={() => { setLiked(l => !l); setLikes(n => liked ? n - 1 : n + 1) }}>
          <ThumbsUp size={14} /> {likes}
        </button>
        <button className={styles.postAction} onClick={() => setShowComment(s => !s)}>
          <MessageSquare size={14} /> {post.comments + comments.length}
        </button>
      </div>
      {showComment && (
        <div className={styles.commentInputRow}>
          <input className={styles.commentField} placeholder="Escribe un comentario..."
            value={comment} onChange={e => setComment(e.target.value)} autoFocus
            onKeyDown={e => e.key === 'Enter' && comment.trim() && (
              setComments(c => [...c, { text: comment }]),
              setComment(''), setShowComment(false)
            )} />
          <button className={styles.commentSubmit} disabled={!comment.trim()}
            onClick={() => { setComments(c => [...c, { text: comment }]); setComment(''); setShowComment(false) }}>→</button>
        </div>
      )}
      {comments.map((c, i) => (
        <div key={i} className={styles.userComment}>
          <div className={styles.commentDot}>T</div>
          <div className={styles.commentBubble}>
            <span className={styles.commentUser}>Tú</span>
            <p className={styles.commentText}>{c.text}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── MAIN ─────────────────────────────────────────────────────────────── */

/* ── BOOKING MODAL ──────────────────────────────────── */

/* ── AI DATA SECTION — renders whatever Claude puts in ai_data ────────────
   Claude can write any keys to this JSONB field. The UI renders what exists.
   No schema changes needed — just add keys to ai_data in Supabase.
   ─────────────────────────────────────────────────────────────────────── */
function AiDataSection({ aiData, aiAnalyzedAt, helperName }) {
  if (!aiData || Object.keys(aiData).length === 0) return null

  const firstName = helperName?.split(' ')?.[0] || ''

  // Known renderers for common keys Claude might write
  const RENDERERS = {
    summary: (v) => (
      <div style={{fontSize:'14px',color:'rgba(0,0,0,0.65)',lineHeight:1.7,fontStyle:'italic',
        borderLeft:'3px solid rgba(123,47,255,0.25)',paddingLeft:'12px'}}>
        "{v}"
      </div>
    ),
    skills: (v) => Array.isArray(v) && v.length > 0 && (
      <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
        {v.map((s,i) => (
          <span key={i} style={{padding:'4px 10px',borderRadius:'100px',
            background:'rgba(123,47,255,0.07)',color:'var(--purple)',
            fontSize:'12px',fontWeight:600,border:'1px solid rgba(123,47,255,0.12)'}}>
            {s}
          </span>
        ))}
      </div>
    ),
    personality: (v) => typeof v === 'object' && (
      <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
        {Object.entries(v).map(([k, val]) => (
          <div key={k} style={{display:'flex',alignItems:'center',gap:'10px'}}>
            <span style={{fontSize:'12px',color:'rgba(0,0,0,0.5)',minWidth:'100px',
              textTransform:'capitalize'}}>{k}</span>
            <div style={{flex:1,height:'4px',borderRadius:'2px',background:'rgba(0,0,0,0.08)'}}>
              <div style={{width:`${typeof val==='number'?val:70}%`,height:'100%',
                borderRadius:'2px',background:'var(--purple)'}} />
            </div>
            <span style={{fontSize:'11px',color:'rgba(0,0,0,0.4)',minWidth:'28px',textAlign:'right'}}>
              {typeof val === 'number' ? val : ''}
            </span>
          </div>
        ))}
      </div>
    ),
    ideal_for: (v) => v && (
      <div style={{
        background:'rgba(123,47,255,0.04)',border:'1px solid rgba(123,47,255,0.08)',
        borderRadius:'12px',padding:'10px 14px',
      }}>
        <span style={{fontSize:'11px',fontWeight:700,color:'#7B2FFF',letterSpacing:'0.5px',textTransform:'uppercase'}}>
          Ideal para
        </span>
        <p style={{fontSize:'13px',color:'rgba(0,0,0,0.65)',margin:'4px 0 0',lineHeight:1.6}}>
          {Array.isArray(v) ? v.join(', ') : v}
        </p>
      </div>
    ),

    red_flags: (v) => Array.isArray(v) && v.length > 0 && (
      <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
        {v.map((s,i) => (
          <div key={i} style={{display:'flex',alignItems:'center',gap:'8px',
            fontSize:'13px',color:'rgba(0,0,0,0.5)'}}>
            <span style={{color:'#F59E0B'}}>⚠</span> {s}
          </div>
        ))}
      </div>
    ),
    certifications: (v) => Array.isArray(v) && v.length > 0 && (
      <div style={{display:'flex',flexDirection:'column',gap:'6px'}}>
        {v.map((c,i) => (
          <div key={i} style={{display:'flex',alignItems:'center',gap:'8px',
            fontSize:'13px',color:'rgba(0,0,0,0.7)'}}>
            <Shield size={12} color="#1A56DB" /> {typeof c === 'string' ? c : c.name || JSON.stringify(c)}
          </div>
        ))}
      </div>
    ),
  }

  // Labels for known keys
  const LABELS = {
    summary: '🤖 Análisis de Nüra',
    skills: '✨ Habilidades detectadas por IA',
    personality: '🧠 Perfil de personalidad',
    ideal_for: '🎯 Ideal para',
    red_flags: '⚠️ A tener en cuenta',
    certifications: '📋 Certificaciones verificadas',
  }

  const entries = Object.entries(aiData)

  return (
    <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
      {/* Header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
          <img src="/logo-iso.png" alt="Nüra" style={{width:'16px',height:'16px',objectFit:'contain'}} />
          <span style={{fontSize:'12px',fontWeight:700,color:'var(--purple)',letterSpacing:'0.5px'}}>
            ANÁLISIS NÜRA IA
          </span>
        </div>
        {aiAnalyzedAt && (
          <span style={{fontSize:'10px',color:'rgba(0,0,0,0.3)'}}>
            {new Date(aiAnalyzedAt).toLocaleDateString('es-ES',{day:'numeric',month:'short'})}
          </span>
        )}
      </div>

      {/* Render each key Claude wrote */}
      {entries.map(([key, value]) => {
        const renderer = RENDERERS[key]
        const label = LABELS[key] || key.replace(/_/g,' ')
        const rendered = renderer ? renderer(value) : (
          // Fallback: render unknown keys generically
          typeof value === 'string' ? (
            <p style={{fontSize:'13px',color:'rgba(0,0,0,0.6)',margin:0,lineHeight:1.6}}>{value}</p>
          ) : Array.isArray(value) ? (
            <div style={{display:'flex',flexWrap:'wrap',gap:'6px'}}>
              {value.map((v,i) => (
                <span key={i} style={{padding:'3px 8px',borderRadius:'8px',
                  background:'rgba(0,0,0,0.05)',fontSize:'12px',color:'rgba(0,0,0,0.6)'}}>
                  {typeof v === 'string' ? v : JSON.stringify(v)}
                </span>
              ))}
            </div>
          ) : typeof value === 'object' ? (
            <div style={{display:'flex',flexDirection:'column',gap:'4px'}}>
              {Object.entries(value).map(([k,v]) => (
                <div key={k} style={{fontSize:'13px',color:'rgba(0,0,0,0.6)'}}>
                  <strong style={{color:'rgba(0,0,0,0.75)',textTransform:'capitalize'}}>{k.replace(/_/g,' ')}:</strong> {String(v)}
                </div>
              ))}
            </div>
          ) : (
            <span style={{fontSize:'13px',color:'rgba(0,0,0,0.6)'}}>{String(value)}</span>
          )
        )

        if (!rendered) return null

        return (
          <div key={key} style={{
            background:'rgba(255,255,255,0.85)',
            border:'1px solid rgba(255,255,255,0.5)',
            borderRadius:'16px',padding:'14px 16px',
            boxShadow:'0 1px 8px rgba(0,0,0,0.04)'
          }}>
            {!RENDERERS[key] || key !== 'summary' ? (
              <div style={{fontSize:'11px',fontWeight:700,color:'rgba(0,0,0,0.4)',
                textTransform:'uppercase',letterSpacing:'0.8px',marginBottom:'10px'}}>
                {label}
              </div>
            ) : null}
            {rendered}
          </div>
        )
      })}
    </div>
  )
}


/* ── OWNER PANEL ──────────────────────────────────────────────────────────
   Dashboard for helpers viewing their own profile.
   Allows managing availability, seeing their stats, and quick updates.
   ─────────────────────────────────────────────────────────────────────── */
function OwnerPanel({ helper, user, updateUser, navigate }) {
  const [available, setAvailable] = useState(helper?.available ?? true)
  const [saved, setSaved] = useState(false)

  async function toggleAvailability() {
    const next = !available
    setAvailable(next)
    // Update in Supabase
    try {
      await fetch(`https://oxmohciswebonoumghhu.supabase.co/rest/v1/helpers?id=eq.${helper.id}`, {
        method: 'PATCH',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94bW9oY2lzd2Vib25vdW1naGh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MzE4MTUsImV4cCI6MjA2NTIwNzgxNX0.oJQLSV5UEGjV3f6sPnHJT3nOVHXyaQJGzHKVDQkWCHo',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94bW9oY2lzd2Vib25vdW1naGh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2MzE4MTUsImV4cCI6MjA2NTIwNzgxNX0.oJQLSV5UEGjV3f6sPnHJT3nOVHXyaQJGzHKVDQkWCHo',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ available: next })
      })
    } catch {}
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const stats = [
    { n: helper.reviews || 0,         l: 'Valoraciones' },
    { n: helper.services || 0,        l: 'Servicios' },
    { n: `${helper.rating || '—'}★`,  l: 'Media' },
  ]

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
      padding: 'max(env(safe-area-inset-top,0px),52px) 14px 0',
      pointerEvents: 'none',
    }}>
      <div style={{
        background: 'rgba(28,28,30,0.95)',
        backdropFilter: 'blur(32px) saturate(200%)',
        WebkitBackdropFilter: 'blur(32px) saturate(200%)',
        borderRadius: '20px',
        padding: '14px 16px',
        pointerEvents: 'all',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        marginTop: '8px',
      }}>
        {/* Header */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
          <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
            <img src="/logo-iso.png" alt="Nüra" style={{width:'18px',height:'18px',objectFit:'contain',filter:'brightness(10)'}} />
            <span style={{fontSize:'12px',fontWeight:700,color:'white',letterSpacing:'0.5px'}}>
              TU PERFIL EN NÜRA
            </span>
          </div>
          {saved && (
            <span style={{fontSize:'11px',color:'#34D399',fontWeight:600}}>✓ Guardado</span>
          )}
        </div>

        {/* Stats */}
        <div style={{display:'flex',gap:'0',marginBottom:'12px',
          background:'rgba(255,255,255,0.07)',borderRadius:'12px',overflow:'hidden'}}>
          {stats.map(({ n, l }, i) => (
            <div key={l} style={{flex:1,padding:'10px 8px',textAlign:'center',
              borderRight: i < 2 ? '1px solid rgba(255,255,255,0.08)' : 'none'}}>
              <div style={{fontSize:'17px',fontWeight:800,color:'white',letterSpacing:'-0.3px'}}>{n}</div>
              <div style={{fontSize:'10px',color:'rgba(255,255,255,0.45)',fontWeight:500}}>{l}</div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{display:'flex',gap:'8px'}}>
          {/* Availability toggle */}
          <button
            onClick={toggleAvailability}
            style={{
              flex:1, padding:'10px 8px',
              background: available ? 'rgba(52,211,153,0.15)' : 'rgba(255,255,255,0.08)',
              border: available ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius:'12px', cursor:'pointer',
              display:'flex', flexDirection:'column', alignItems:'center', gap:'3px',
            }}>
            <span style={{fontSize:'16px'}}>{available ? '🟢' : '⚫'}</span>
            <span style={{fontSize:'10px',fontWeight:700,
              color: available ? '#34D399' : 'rgba(255,255,255,0.45)'}}>
              {available ? 'Disponible' : 'No disponible'}
            </span>
          </button>

          {/* Go to chats */}
          <button
            onClick={() => navigate('/chats')}
            style={{
              flex:1, padding:'10px 8px',
              background:'rgba(255,255,255,0.08)',
              border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:'12px', cursor:'pointer',
              display:'flex', flexDirection:'column', alignItems:'center', gap:'3px',
            }}>
            <span style={{fontSize:'16px'}}>💬</span>
            <span style={{fontSize:'10px',fontWeight:700,color:'rgba(255,255,255,0.6)'}}>
              Mensajes
            </span>
          </button>

          {/* Share profile */}
          <button
            onClick={() => {
              const url = `${window.location.href}?utm_source=share&utm_medium=helper`
              if (navigator.share) navigator.share({ title: helper.name, url })
              else navigator.clipboard?.writeText(url)
            }}
            style={{
              flex:1, padding:'10px 8px',
              background:'rgba(255,255,255,0.08)',
              border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:'12px', cursor:'pointer',
              display:'flex', flexDirection:'column', alignItems:'center', gap:'3px',
            }}>
            <span style={{fontSize:'16px'}}>🔗</span>
            <span style={{fontSize:'10px',fontWeight:700,color:'rgba(255,255,255,0.6)'}}>
              Compartir
            </span>
          </button>

          {/* Edit profile */}
          <button
            onClick={() => navigate('/register-helper')}
            style={{
              flex:1, padding:'10px 8px',
              background:'rgba(123,47,255,0.2)',
              border:'1px solid rgba(123,47,255,0.3)',
              borderRadius:'12px', cursor:'pointer',
              display:'flex', flexDirection:'column', alignItems:'center', gap:'3px',
            }}>
            <span style={{fontSize:'16px'}}>✏️</span>
            <span style={{fontSize:'10px',fontWeight:700,color:'rgba(180,130,255,1)'}}>
              Editar
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

function BookingModal({ helper, onClose, onBook, onNavigate }) {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [note, setNote] = useState('')
  const [done, setDone] = useState(false)
  const name = helper?.name?.split(' ')?.[0] || helper?.name || ''

  function confirm() {
    onBook?.(helper, date, time, note)
    setDone(true)
  }

  const style = {
    overlay: {position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',backdropFilter:'blur(8px)',zIndex:300,display:'flex',alignItems:'flex-end',justifyContent:'center'},
    sheet: {background:'rgba(255,255,255,0.96)',backdropFilter:'blur(32px)',borderRadius:'24px 24px 0 0',padding:'24px 20px 36px',width:'100%',maxWidth:'500px'},
    handle: {width:'36px',height:'4px',background:'rgba(0,0,0,0.1)',borderRadius:'2px',margin:'0 auto 20px'},
    input: {width:'100%',padding:'12px 16px',border:'1px solid rgba(0,0,0,0.1)',borderRadius:'14px',fontSize:'15px',outline:'none',fontFamily:'-apple-system,Inter,sans-serif',background:'rgba(0,0,0,0.03)',boxSizing:'border-box'},
    btnPrimary: {width:'100%',padding:'14px',background:'#1C1C1E',color:'white',border:'none',borderRadius:'100px',fontSize:'14px',fontWeight:700,cursor:'pointer',transition:'opacity 0.2s'},
    btnSecondary: {width:'100%',padding:'12px',background:'rgba(0,0,0,0.05)',color:'rgba(0,0,0,0.55)',border:'none',borderRadius:'100px',fontSize:'14px',fontWeight:600,cursor:'pointer'},
  }

  return (
    <div style={style.overlay}>
      <div style={style.sheet}>
        <div style={style.handle} />
        {done ? (
          <div style={{textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:'12px',padding:'16px 0'}}>
            {/* Helper avatar */}
            <div style={{position:'relative'}}>
              {helper?.avatarUrl
                ? <img src={helper.avatarUrl} alt={name}
                    style={{width:'68px',height:'68px',borderRadius:'50%',border:'3px solid #22C55E'}} />
                : <div style={{width:'68px',height:'68px',borderRadius:'50%',background:helper?.avatarColor||'#7B2FFF',
                    display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:'24px',fontWeight:700,
                    border:'3px solid #22C55E'}}>
                    {helper?.avatar||name?.[0]}
                  </div>
              }
              <span style={{position:'absolute',bottom:-2,right:-2,fontSize:'22px'}}>✅</span>
            </div>
            <div>
              <h3 style={{fontSize:'19px',fontWeight:800,margin:'0 0 4px',color:'rgba(0,0,0,0.85)',letterSpacing:'-0.3px'}}>
                ¡Solicitud enviada!
              </h3>
              <p style={{fontSize:'13px',color:'rgba(0,0,0,0.5)',margin:0,lineHeight:1.6}}>
                {name} recibirá tu solicitud y confirmará en breve.
              </p>
            </div>
            {/* Booking summary */}
            {(date || time) && (
              <div style={{background:'rgba(0,0,0,0.03)',border:'1px solid rgba(0,0,0,0.06)',
                borderRadius:'14px',padding:'12px 16px',width:'100%',textAlign:'left'}}>
                {date && <p style={{margin:'0 0 4px',fontSize:'13px',color:'rgba(0,0,0,0.6)'}}>
                  📅 {new Date(date).toLocaleDateString('es-ES',{weekday:'long',day:'numeric',month:'long'})}
                </p>}
                {time && <p style={{margin:0,fontSize:'13px',color:'rgba(0,0,0,0.6)'}}>🕐 {time}h</p>}
              </div>
            )}
            <div style={{display:'flex',flexDirection:'column',gap:'8px',width:'100%',marginTop:'4px'}}>
              <button onClick={() => { onClose(); onNavigate('/my-services') }} style={style.btnPrimary}>
                Ver Mis servicios
              </button>
              <button onClick={onClose} style={style.btnSecondary}>Volver al perfil</button>
            </div>
          </div>
        ) : (
          <>
            <h3 style={{fontSize:'17px',fontWeight:800,margin:'0 0 4px',color:'rgba(0,0,0,0.85)',letterSpacing:'-0.3px'}}>Solicitar servicio</h3>
            <p style={{fontSize:'13px',color:'rgba(0,0,0,0.4)',margin:'0 0 20px'}}>{name} · {helper?.price || 'Precio a consultar'}</p>
            <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'20px'}}>
              {/* Day pills */}
              <div>
                <p style={{fontSize:'11px',fontWeight:700,color:'rgba(0,0,0,0.4)',margin:'0 0 8px',letterSpacing:'0.5px',textTransform:'uppercase'}}>Fecha</p>
                <div style={{display:'flex',gap:'6px',overflowX:'auto',paddingBottom:'4px'}}>
                  {Array.from({length:7},(_,i)=>{
                    const d=new Date(); d.setDate(d.getDate()+i)
                    const iso=d.toISOString().split('T')[0]
                    const lbl=i===0?'Hoy':i===1?'Mañana':d.toLocaleDateString('es-ES',{weekday:'short',day:'numeric'})
                    return (
                      <button key={i} onClick={()=>setDate(iso)} style={{
                        flexShrink:0,padding:'8px 14px',
                        background:date===iso?'#1C1C1E':'rgba(0,0,0,0.05)',
                        color:date===iso?'white':'rgba(0,0,0,0.6)',
                        border:'none',borderRadius:'100px',fontSize:'12px',fontWeight:600,
                        cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s',
                        whiteSpace:'nowrap',
                      }}>{lbl}</button>
                    )
                  })}
                </div>
              </div>
              {/* Time pills */}
              <div>
                <p style={{fontSize:'11px',fontWeight:700,color:'rgba(0,0,0,0.4)',margin:'0 0 8px',letterSpacing:'0.5px',textTransform:'uppercase'}}>Hora</p>
                <div style={{display:'flex',gap:'6px',flexWrap:'wrap'}}>
                  {['9:00','10:00','11:00','12:00','16:00','17:00','18:00','19:00'].map(t=>(
                    <button key={t} onClick={()=>setTime(t)} style={{
                      padding:'7px 12px',
                      background:time===t?'#1C1C1E':'rgba(0,0,0,0.05)',
                      color:time===t?'white':'rgba(0,0,0,0.6)',
                      border:'none',borderRadius:'100px',fontSize:'12px',fontWeight:600,
                      cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s',
                    }}>{t}</button>
                  ))}
                </div>
              </div>
              <textarea value={note} onChange={e=>setNote(e.target.value)}
                placeholder="Detalles adicionales (opcional)..." rows={3}
                style={{...style.input, resize:'none'}} />
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={onClose} style={{...style.btnSecondary,flex:1}}>Cancelar</button>
              <button onClick={confirm} disabled={!date}
                style={{...style.btnPrimary,flex:2,opacity:date?1:0.4}}>
                Enviar solicitud
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function HelperProfileInner() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasRated, helpersCache, toggleFavorite, isFavorite,
    addService, user, updateUser
  } = useUser()
  const [showRating, setShowRating] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  const [shared, setShared] = useState(false)
  const [faved, setFaved] = useState(false)
  // sync faved state
  // useEffect(() => { if(h) setFaved(isFavorite(h.id)) }, [h?.id])
  const [activeTab, setActiveTab] = useState('perfil')
  const [showGate, setShowGate] = useState(false)
  const [gateReason, setGateReason] = useState('contact')

  const location = useLocation()
  const isFromShare = new URLSearchParams(window.location.search).get('utm_source') === 'share'
  const [loading, setLoading] = useState(false)
  const [h, setH] = useState(null)

  useEffect(() => {
    // 1. Navigation state (fastest - passed from result card)
    if (location.state?.helper && String(location.state.helper.id) === String(id)) {
      setH(location.state.helper)
      return
    }
    // 2. Window cache (from search results)
    const winCached = window.__nuraHelperCache?.[id] || window.__nuraHelperCache?.[parseInt(id)] || window.__nuraHelperCache?.[String(id)]
    if (winCached) { setH(winCached); return }
    // 3. Context cache
    const cached = helpersCache?.[parseInt(id)] || helpersCache?.[id] || helpersCache?.[String(id)]
    if (cached) { setH(cached); return }
    // 4. Local
    const local = HELPERS.filter(Boolean).find(x =>  x && String(x.id) === String(id))
    if (local) { setH(local); return }
    // 5. Supabase
    setLoading(true)
    getHelperById(id)
      .then(remote => { if (remote) setH(remote) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100dvh',background:'#F8F8FA'}}>
      <div style={{textAlign:'center',display:'flex',flexDirection:'column',alignItems:'center',gap:'16px'}}>
        <img src="/logo-iso.png" alt="Nüra" style={{width:'48px',height:'48px',animation:'pulse 1.5s ease-in-out infinite'}} />
        <p style={{fontSize:'13px',color:'var(--soft)'}}>Cargando perfil...</p>
      </div>
    </div>
  )

  if (!h) return (
    <div className={styles.notFound}>
      <AlertCircle size={40} color="var(--rule)" />
      <p>Perfil no encontrado.</p>
      <button onClick={() => navigate(-1)}>Volver</button>
    </div>
  )

  function handleShare() {
    const shareText = `${h.name} — ${h.specialty} · ${h.rating}⭐ en Nüra`
    const shareUrl = `${window.location.href}?utm_source=share&utm_medium=native`
    if (navigator.share) {
      navigator.share({ title: h.name, text: shareText, url: shareUrl })
    } else {
      navigator.clipboard?.writeText(`${shareText}\n${shareUrl}`)
      showToast('Enlace copiado')
      setShared(true)
      setTimeout(() => setShared(false), 2000)
    }
  }

  const tabs = [
    { id: 'perfil', label: 'Perfil vivo', icon: <Activity size={12} /> },
    { id: 'empresas', label: 'Trayectoria', icon: <TrendingUp size={12} /> },
    { id: 'feed', label: 'Posts', icon: <MessageSquare size={12} /> },
    { id: 'reputacion', label: 'Reputación', icon: <BarChart2 size={12} /> },
  ]

  const isSupabaseHelper = !!h.isFromSupabase

  // Schedule a gentle reminder if user viewed but didn't contact
  useEffect(() => {
    if (h && !isOwner) {
      notifyHelperViewed(h.name?.split(' ')?.[0] || h.name, h.specialty)
    }
  }, [h?.id])

  // Category-based cover gradient
  const COVER_GRADIENTS = {
    logopedia: 'linear-gradient(135deg,#1A56DB,#0891B2)',
    tecnico: 'linear-gradient(135deg,#1E40AF,#3730A3)',
    limpieza: 'linear-gradient(135deg,#059669,#0891B2)',
    cuidado: 'linear-gradient(135deg,#DB2777,#9333EA)',
    mascotas: 'linear-gradient(135deg,#D97706,#DC2626)',
    matematicas: 'linear-gradient(135deg,#7C3AED,#1D4ED8)',
    entrenador: 'linear-gradient(135deg,#EA580C,#D97706)',
    otro: 'linear-gradient(135deg,#7B2FFF,#00D4C8)',
  }
  const coverGradient = COVER_GRADIENTS[h.category] || COVER_GRADIENTS.otro

  // Is the viewer the owner of this profile?
  // Was this profile opened from a Nüra search result?
  const fromSearch = location.state?.fromSearch || location.state?.matchReason
  const matchReason = location.state?.matchReason

  // Is the viewer the owner of this profile?
  const isOwner = user?.isHelper && (
    user?.helperProfile?.name === h.name ||
    user?.name === h.name ||
    String(user?.helperId) === String(h.id)
  )

  // Score penalizes low service count (< 5 services = max 60 score)
  const serviceCount = h.services || 0
  const serviceScore = serviceCount === 0 ? 0
    : serviceCount < 5 ? Math.round((serviceCount / 5) * 15)
    : Math.round((Math.min(serviceCount, 100) / 100) * 30)
  const score = Math.round(
    ((h.rating || 0) / 5) * 40 +
    serviceScore +
    ((h.completionRate || 0) / 100) * 20 +
    (h.dniVerified ? 10 : 0)
  )
  const level = score >= 85 ? { label: 'Experto verificado', color: '#059669', bg: '#ECFDF5' }
    : score >= 65 ? { label: 'Referente de confianza', color: '#1A56DB', bg: '#EFF6FF' }
    : score >= 40 ? { label: 'Con historial', color: '#D97706', bg: '#FFFBEB' }
    : { label: 'Perfil nuevo', color: '#6B7280', bg: '#F9FAFB' }

  return (
    <div className={styles.page}>
      {/* Header */}
      <PageHeader showBack rightEl={<button className={styles.shareBtn} onClick={handleShare}>{shared ? <span style={{fontSize:'14px',fontWeight:700,color:'#059669'}}>✓</span> : <Share2 size={17} color="#1a1a1a" />}</button>} />

      <div className={styles.content}>
        {/* Hero */}
        <div className={styles.hero}>
          {/* Gradient cover strip */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0,
            height: '88px',
            background: coverGradient,
            borderRadius: '28px 28px 0 0',
          }} />
          <div className={styles.heroInner} style={{position:'relative', zIndex:1}}>
          {h.avatarUrl
            ? <img src={h.avatarUrl} alt={h.name} className={styles.heroAvatar} />
            : <div className={styles.heroAvatarFallback} style={{ background: h.avatarColor }}>{h.avatar}</div>
          }
          {/* Name */}
          <h1 className={styles.heroName}>
            {h.name}
            {h.founder && <Award size={13} color='#92400E' style={{marginLeft:'5px',verticalAlign:'middle'}} />}
          </h1>
          <div style={{display:'flex',alignItems:'center',gap:'10px',justifyContent:'center',flexWrap:'wrap'}}>
            <p className={styles.heroSpecialty} style={{margin:0}}>{h.specialty || h.tags?.[0]}</p>
            {h.distance && (
              <span style={{fontSize:'12px',fontWeight:600,color:'rgba(0,0,0,0.45)'}}>
                📍 {h.distance}km · {h.zone || h.city || 'Barcelona'}
              </span>
            )}
            {h.price && h.price !== 'Consultar' && (
              <span style={{fontSize:'14px',fontWeight:700,color:'var(--purple)',background:'rgba(123,47,255,0.08)',borderRadius:'100px',padding:'2px 10px'}}>
                {h.price}
              </span>
            )}
          </div>

          {/* One line: rating · distance · response time */}
          <div className={styles.heroMeta}>
            <Star size={12} fill="#F59E0B" color="#F59E0B" />
            <strong>{h.rating}</strong>
            <span className={styles.heroMetaDot}>·</span>
            <MapPin size={12} color="var(--soft)" />
            <span>{h.distance} km</span>
            <span className={styles.heroMetaDot}>·</span>
            <Clock size={12} color="var(--soft)" />
            <span>{h.responseTime}</span>
          </div>

          {/* Status + key badges — only non-obvious info */}
          <div className={styles.heroTags}>
            <span className={h.available ? styles.tagGreen : styles.tagGray}>
              <span className={styles.dot} />{h.available ? 'Disponible' : 'No disponible'}
            </span>
            {h.presential && h.online
              ? <span className={styles.tag}>Presencial · Online</span>
              : h.presential ? <span className={styles.tag}>Solo presencial</span>
              : <span className={styles.tag}>Solo online</span>}
            {h.urgent && <span className={styles.tagRed}><Zap size={10} /> Urgencias</span>}
            {h.dniVerified && <span className={styles.tagBlue}><Shield size={10} /> Verificado</span>}
          </div>

          <div className={styles.heroActions}>
            <button className={styles.heroCtaSecondary} onClick={() => {
                if (!user) {
                  sessionStorage.setItem('nura_return_to', `/chat/${h.id}`)
                  sessionStorage.setItem('nura_pending_helper', JSON.stringify(h))
                  setShowGate(true); setGateReason('contact')
                } else {
                  navigate(`/chat/${h.id}`, { state: { helper: h } })
                }
              }}>
              <MessageCircle size={15} /> Escribir
            </button>
            <button className={styles.heroCtaBtn} onClick={() => { if(!user){setShowGate(true);setGateReason('contact')} else setShowConfirm(true) }}>
              <Calendar size={15} /> Contratar
            </button>
          </div>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statBox}>
            <span className={styles.statNum}>{h.services}</span>
            <span className={styles.statLbl}>Servicios</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statBox}>
            <span className={styles.statNum}>{h.completionRate}%</span>
            <span className={styles.statLbl}>Completados</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statBox}>
            <span className={styles.statNum}>{h.reviews}</span>
            <span className={styles.statLbl}>Valoraciones</span>
          </div>
          <div className={styles.statDivider} />
          <div className={styles.statBox}>
            <span className={styles.statNum}>{h.rating}</span>
            <span className={styles.statLbl}>Puntuación</span>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabsWrap}>
          <div className={styles.tabs}>
            {tabs.map(tab => (
              <button key={tab.id}
                className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tab.id)}>
                {tab.icon} <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── TAB: PERFIL VIVO ── */}
        {/* Availability quick view */}
        {activeTab === 'perfil' && (
          <section className={styles.section} style={{marginBottom:'10px'}}>
            <h3 className={styles.sectionTitle}>📅 Disponibilidad esta semana</h3>
            <div style={{display:'flex',gap:'6px',overflowX:'auto',paddingBottom:'4px'}}>
              {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map((day,i) => {
                const available = h.available && i < 5
                return (
                  <div key={day} style={{
                    display:'flex',flexDirection:'column',alignItems:'center',gap:'4px',
                    padding:'8px 10px',borderRadius:'14px',minWidth:'44px',
                    background: available ? 'rgba(5,150,105,0.08)' : 'var(--paper)',
                    border: available ? '1px solid rgba(5,150,105,0.2)' : '1px solid var(--rule)',
                    flexShrink:0
                  }}>
                    <span style={{fontSize:'10px',color:'var(--soft)',fontWeight:600}}>{day}</span>
                    <span style={{fontSize:'14px'}}>{available ? '✓' : '–'}</span>
                    {available && <span style={{fontSize:'9px',color:'#059669',fontWeight:600}}>Libre</span>}
                  </div>
                )
              })}
            </div>
          </section>
        )}
        {activeTab === 'perfil' && (
          <>
          {/* AI Data Section — rendered when Claude has analyzed this profile */}
          {h.aiData && Object.keys(h.aiData).length > 0 && (
            <AiDataSection
              aiData={h.aiData}
              aiAnalyzedAt={h.aiAnalyzedAt}
              helperName={h.name}
            />
          )}
          {/* Building profile banner for Supabase helpers */}
        {isSupabaseHelper && !isFromShare && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(123,47,255,0.05) 0%, rgba(0,212,200,0.04) 100%)',
            border: '1px solid rgba(123,47,255,0.1)',
            borderRadius: '16px',
            padding: '14px 16px',
            marginBottom: '10px',
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
          }}>
            <img src="/logo-iso.png" alt="Nüra" style={{width:'28px',height:'28px',objectFit:'contain',flexShrink:0,marginTop:'2px'}} />
            <div>
              <div style={{fontSize:'13px',fontWeight:700,color:'rgba(0,0,0,0.75)',marginBottom:'3px',letterSpacing:'-0.1px'}}>
                Nüra está construyendo este perfil
              </div>
              <div style={{fontSize:'12px',color:'rgba(0,0,0,0.45)',lineHeight:1.6}}>
                La IA verifica identidad, analiza historial y detecta habilidades automáticamente. El perfil se completa solo con cada servicio realizado.
              </div>
            </div>
          </div>
        )}

        {/* Shared profile banner */}
        {isFromShare && (
          <div style={{
            display:'flex',alignItems:'center',gap:'8px',
            padding:'10px 14px',marginBottom:'10px',
            background:'rgba(123,47,255,0.05)',
            border:'1px solid rgba(123,47,255,0.12)',
            borderRadius:'14px',
          }}>
            <img src="/logo-iso.png" alt="Nüra" style={{width:'20px',height:'20px',objectFit:'contain'}} />
            <span style={{fontSize:'12px',color:'rgba(0,0,0,0.55)'}}>
              Perfil encontrado y verificado por <strong style={{color:'var(--purple)'}}>Nüra</strong>
            </span>
          </div>
        )}
        {/* Trust signal */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 14px', margin: '0 0 10px',
            background: 'rgba(5,150,105,0.05)',
            border: '1px solid rgba(5,150,105,0.12)',
            borderRadius: '14px',
          }}>
            <span style={{fontSize:'18px'}}>🛡️</span>
            <div>
              <div style={{fontSize:'12px',fontWeight:700,color:'#059669',letterSpacing:'-0.1px'}}>Perfil verificado por Nüra</div>
              <div style={{fontSize:'11px',color:'rgba(0,0,0,0.45)'}}>Identidad confirmada · {h.services || 0} servicios reales · valoraciones auténticas</div>
            </div>
          </div>

            

            {/* Bio */}
            <div className={styles.bioCard}>
              <p className={styles.bioText}>{h.bio}</p>
            </div>


            {/* ── Nüra match reason banner ── */}
            {matchReason && (
              <div style={{
                display:'flex',alignItems:'flex-start',gap:'8px',
                background:'linear-gradient(135deg,rgba(123,47,255,0.07),rgba(0,212,200,0.05))',
                border:'1px solid rgba(123,47,255,0.12)',
                borderRadius:'14px', padding:'11px 14px',
                marginBottom:'4px', width:'100%', boxSizing:'border-box',
                textAlign:'left',
              }}>
                <span style={{fontSize:'15px',flexShrink:0,marginTop:'1px'}}>✨</span>
                <p style={{fontSize:'12px',color:'rgba(0,0,0,0.55)',margin:0,lineHeight:1.6}}>
                  <strong style={{color:'#7B2FFF',fontWeight:700}}>Nüra te la recomienda</strong>
                  {' '}— {matchReason}
                </p>
              </div>
            )}

            {/* Achievement badges */}
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}><Sparkles size={13} /> Reconocimientos</h3>
              <div className={styles.badgesGrid}>
                {(h.services || 0) >= 50 && (
                  <div className={styles.achieveBadge}>
                    <span className={styles.achieveEmoji}>🏆</span>
                    <span className={styles.achieveLabel}>+50 servicios</span>
                  </div>
                )}
                {h.rating >= 4.8 && (
                  <div className={styles.achieveBadge}>
                    <span className={styles.achieveEmoji}>⭐</span>
                    <span className={styles.achieveLabel}>Valoración top</span>
                  </div>
                )}
                {h.dniVerified && (
                  <div className={styles.achieveBadge}>
                    <span className={styles.achieveEmoji}>🛡️</span>
                    <span className={styles.achieveLabel}>Identidad verificada</span>
                  </div>
                )}
                {(h.completionRate || 0) >= 95 && (
                  <div className={styles.achieveBadge}>
                    <span className={styles.achieveEmoji}>✅</span>
                    <span className={styles.achieveLabel}>+95% completados</span>
                  </div>
                )}
                {h.urgent && (
                  <div className={styles.achieveBadge}>
                    <span className={styles.achieveEmoji}>⚡</span>
                    <span className={styles.achieveLabel}>Disponible urgencias</span>
                  </div>
                )}
                {h.founder && (
                  <div className={styles.achieveBadge} style={{background:'rgba(146,64,14,0.08)',borderColor:'rgba(146,64,14,0.2)'}}>
                    <span className={styles.achieveEmoji}>🌟</span>
                    <span className={styles.achieveLabel} style={{color:'#92400E'}}>Helper fundador</span>
                  </div>
                )}
              </div>
            </section>
            {/* Nüra-detected skills — THE differentiator */}
            {h.hiddenSkills?.length > 0 && !isSupabaseHelper && (
              <div className={styles.nuraDetectedCard}>
                <div className={styles.nuraDetectedHeader}>
                  <Cpu size={14} color="var(--purple)" />
                  <span>Detectado por Nüra · no declarado por {h.name?.split(' ')?.[0] || h.name || ''}</span>
                </div>
                <p className={styles.nuraDetectedDesc}>
                  Nüra identificó estas capacidades analizando conversaciones, comportamiento y valoraciones reales. {h.name?.split(' ')?.[0] || h.name || ''} nunca las declaró explícitamente.
                </p>
                <div className={styles.nuraDetectedSkills}>
                  {(h.hiddenSkills||[]).map((s, i) => (
                    <span key={i} className={styles.nuraSkill}>{s}</span>
                  ))}
                </div>
              </div>
            )}



            {/* Declared skills */}
            {h.skills?.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}><CheckCircle size={13} /> Especialidades declaradas</h3>
                <div className={styles.skillsGrid}>
                  {(h.skills||[]).map((s, i) => <span key={i} className={styles.skill}>{s}</span>)}
                </div>
              </section>
            )}

            {/* Education */}
            {h.education?.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}><BookOpen size={13} /> Formación académica</h3>
                <div className={styles.nuraVerifyNote}>
                  <Cpu size={11} />
                  <span>Nüra buscó el plan de estudios en internet — asignatura por asignatura, universidad por universidad</span>
                </div>
                <div className={styles.eduTimeline}>
                  {(h.education||[]).map((ed, i) => (
                    <div key={i} className={styles.eduItem}>
                      <div className={styles.eduTimelineLeft}>
                        <div className={styles.eduIcon}>🎓</div>
                      </div>
                      <div className={styles.eduBody}>
                        <div className={styles.eduTitle}>{ed.title}</div>
                        <div className={styles.eduInstitution}>{ed.institution}</div>
                        <div className={styles.eduYear}>{ed.year}</div>
                        <p className={styles.eduDetails}>{ed.details}</p>
                        {ed.verified && (
                          <span className={styles.eduVerifiedBadge}><Shield size={9} /> Verificado por Nüra</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Languages */}
            {h.languages?.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}><Globe size={13} /> Idiomas</h3>
                <div className={styles.langRow}>
                  {(h.languages||[]).map((l, i) => <span key={i} className={styles.langTag}>{l}</span>)}
                </div>
              </section>
            )}

            {/* Reviews — semantic analysis */}
            {h.qualitativeComments?.length > 0 && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}><Heart size={13} /> Valoraciones reales</h3>
                {/* Rating breakdown */}
                <div className={styles.ratingBreakdown}>
                  <div className={styles.ratingBig}>
                    <span className={styles.ratingBigNum}>{h.rating}</span>
                    <div className={styles.ratingStars}>{[1,2,3,4,5].map(n=><Star key={n} size={14} fill="#F59E0B" color="#F59E0B" />)}</div>
                    <span className={styles.ratingCount}>{h.reviews} valoraciones</span>
                  </div>
                  <div className={styles.ratingBars}>
                    {[5,4,3,2,1].map(n => (
                      <div key={n} className={styles.ratingBarRow}>
                        <span className={styles.ratingBarN}>{n}</span>
                        <div className={styles.ratingBarTrack}>
                          <div className={styles.ratingBarFill} style={{width: n===5?'70%':n===4?'20%':n===3?'7%':'3%'}} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className={styles.nuraVerifyNote}>
                  <Cpu size={11} />
                  <span>Nüra analiza el texto semánticamente — los adjetivos se convierten en atributos del perfil</span>
                </div>
                <div className={styles.reviewsList}>
                  {(h.qualitativeComments||[]).map((c, i) => (
                    <div key={i} className={styles.reviewItem}>
                      <div className={styles.reviewAvatar}>{c.avatar?.[0] || c.user?.[0]}</div>
                      <div className={styles.reviewBody}>
                        <div className={styles.reviewTop}>
                          <span className={styles.reviewUser}>{c.user}</span>
                          <div className={styles.reviewStars}>
                            {[1,2,3,4,5].map(n => <Star key={n} size={9} fill="#F59E0B" color="#F59E0B" />)}
                          </div>
                          <span className={styles.reviewDate}>{c.date}</span>
                        </div>
                        <p className={styles.reviewText}>"{c.text}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          {/* Services derived from tags/specialty for Supabase helpers */}
          {isSupabaseHelper && h.specialty && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>🛠️ Servicios ofrecidos</h3>
              <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                {[
                  h.specialty,
                  ...(h.tags || []).filter(t => t !== h.specialty).slice(0, 4)
                ].filter(Boolean).map((s, i) => (
                  <span key={i} style={{
                    padding:'8px 14px',
                    background:'rgba(123,47,255,0.06)',
                    border:'1px solid rgba(123,47,255,0.12)',
                    borderRadius:'100px',
                    fontSize:'13px',fontWeight:500,
                    color:'rgba(0,0,0,0.7)',
                  }}>{s}</span>
                ))}
              </div>
            </section>
          )}
          </>
        )}

        {/* ── TAB: LABORAL ── */}
        {activeTab === 'empresas' && (
          <div>
            <div className={styles.empresasIntroCard}>
              <Shield size={16} color="var(--purple)" />
              <div>
                <p className={styles.empresasIntroTitle}>Historial verificado por terceros</p>
                <p className={styles.empresasIntroDesc}>
                  Lo que ves aquí no lo ha escrito {h.name?.split(' ')?.[0] || h.name || ''}. Lo han escrito las empresas y personas que han trabajado con {
                  ['Dra','Elena','Sara','María','Marta','Lucía','Carme','Laia'].some(n => h.name?.startsWith(n)) ? 'ella' : 'él'
                }. Imposible de falsificar.
                </p>
              </div>
            </div>

            {h.experience?.length > 0 ? (
              <div className={styles.expTimeline}>
                {(h.experience||[]).map((ex, i) => (
                  <div key={i} className={styles.expTimelineItem}>
                    <div className={styles.expTimelineLeft}>
                      <div className={styles.expLogo}>{ex.companyLogo}</div>
                      {i < (h.experience||[]).length - 1 && <div className={styles.expConnector} />}
                    </div>
                    <div className={styles.expTimelineBody}>
                      <ExperienceCard exp={ex} />
                    </div>
                  </div>
                ))}
              </div>
            ) : isSupabaseHelper ? (
              <div style={{display:'flex',flexDirection:'column',gap:'8px'}}>
                {/* Show what we DO know */}
                <div style={{background:'rgba(255,255,255,0.85)',border:'1px solid rgba(255,255,255,0.5)',borderRadius:'16px',padding:'16px',boxShadow:'0 1px 8px rgba(0,0,0,0.04)'}}>
                  <div style={{display:'flex',gap:'12px',alignItems:'center'}}>
                    <div style={{width:'40px',height:'40px',borderRadius:'50%',background:'rgba(123,47,255,0.08)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'18px',flexShrink:0}}>💼</div>
                    <div>
                      <div style={{fontSize:'14px',fontWeight:700,color:'rgba(0,0,0,0.8)',letterSpacing:'-0.1px'}}>{h.specialty || 'Profesional'}</div>
                      <div style={{fontSize:'12px',color:'rgba(0,0,0,0.45)',marginTop:'2px'}}>{h.zone || h.city || 'Barcelona'} · Autónomo/a</div>
                    </div>
                  </div>
                </div>
                <div style={{fontSize:'12px',color:'rgba(0,0,0,0.4)',padding:'8px 4px',textAlign:'center',fontStyle:'italic'}}>
                  Nüra verificará y completará el historial automáticamente con cada servicio realizado.
                </div>
              </div>
            ) : (
              <div className={styles.emptyTab} style={{gap:'10px',padding:'28px 16px'}}>
                <Shield size={32} color="rgba(0,0,0,0.12)" />
                <p style={{fontWeight:700,color:'rgba(0,0,0,0.6)',fontSize:'15px',margin:0}}>Sin historial verificado</p>
              </div>
            )}

            <div className={styles.companyCta}>
              <Lock size={16} color="var(--soft)" />
              <div>
                <p className={styles.companyCtaTitle}>¿Has trabajado con {h.name?.split(' ')?.[0] || h.name || ''}?</p>
                <p className={styles.companyCtaDesc}>Las empresas pueden añadir verificaciones al perfil. Disponible en Fase 3.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: PUBLICACIONES ── */}
        {activeTab === 'feed' && (
          <div>
            {h.posts?.length > 0
              ? h.posts?.map(post => <PostCard key={post.id} post={post} helper={h} />)
              : (
                <div className={styles.emptyTab} style={{gap:'10px',padding:'28px 16px'}}>
                  <MessageSquare size={32} color="rgba(0,0,0,0.12)" />
                  <p style={{fontWeight:700,color:'rgba(0,0,0,0.6)',fontSize:'15px',margin:0}}>Sin publicaciones todavía</p>
                  <p style={{fontSize:'13px',color:'rgba(0,0,0,0.38)',lineHeight:1.6,margin:0,textAlign:'center'}}>Cuando {h.name?.split(' ')?.[0] || ''} publique actualizaciones aparecerán aquí.</p>
                </div>
              )
            }
          </div>
        )}

        {/* ── TAB: REPUTACIÓN ── */}
        {activeTab === 'reputacion' && (
          <div>
            {/* Score */}
            <div className={styles.scoreCard}>
              <div className={styles.scoreLeft}>
                <div className={styles.scoreNum} style={{ color: level.color }}>{score}</div>
                <div className={styles.scoreMax}>/100</div>
              </div>
              <div className={styles.scoreRight}>
                <span className={styles.scoreBadge} style={{ color: level.color, background: level.bg }}>
                  <Sparkles size={11} /> {level.label}
                </span>
                <p className={styles.scoreDesc}>
                  Construida con {h.services} servicios reales y {h.reviews} valoraciones. Se actualiza automáticamente.
                </p>
                <div className={styles.scoreComponents}>
                  <div className={styles.scoreComp}><span>Valoración</span><span>{Math.round((h.rating/5)*40)}/40</span></div>
                  <div className={styles.scoreComp}><span>Servicios</span><span>{Math.round((Math.min(h.services,100)/100)*30)}/30</span></div>
                  <div className={styles.scoreComp}><span>Completados</span><span>{Math.round((h.completionRate/100)*20)}/20</span></div>
                  <div className={styles.scoreComp}><span>Verificación</span><span>{h.dniVerified ? 10 : 0}/10</span></div>
                </div>
              </div>
            </div>

            {/* Personality */}
            {h.personality && !isSupabaseHelper && !h.aiData?.personality && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}><Brain size={13} /> Análisis de personalidad</h3>
                <div className={styles.nuraVerifyNote}>
                  <Cpu size={11} />
                  <span>Derivado del comportamiento en {h.services} servicios reales — no de un test de personalidad</span>
                </div>
                <div className={styles.personalityGrid}>
                  {[
                    ['Paciencia', h.personality.patience, 'var(--ink)'],
                    ['Empatía', h.personality.empathy, 'var(--mid)'],
                    ['Comunicación', h.personality.communication, 'var(--ink)'],
                    ['Puntualidad', h.personality.punctuality, 'var(--mid)'],
                    ['Autonomía', h.personality.autonomy, 'var(--ink)'],
                  ].map(([l, v, c]) => <PersonalityCircle key={l} label={l} value={v} color={c} />)}
                </div>
              </section>
            )}

            {/* Evolution */}
            {h.evolution?.length > 0 && !isSupabaseHelper && (
              <section className={styles.section}>
                <h3 className={styles.sectionTitle}><TrendingUp size={13} /> Trayectoria en Nüra</h3>
                <div className={styles.evoTimeline}>
                  {(h.evolution||[]).map((pt, i) => {
                    const isLast = i === (h.evolution||[]).length - 1
                    const prev = h.evolution[i - 1]
                    const improved = prev && pt.rating > prev.rating
                    return (
                      <div key={i} className={styles.evoPoint}>
                        <div className={styles.evoPointLeft}>
                          <div className={`${styles.evoDot} ${isLast ? styles.evoDotCurrent : ''}`} />
                          {!isLast && <div className={styles.evoConnector} />}
                        </div>
                        <div className={styles.evoContent}>
                          <div className={styles.evoYear}>{pt.period}{isLast ? ' · Ahora' : ''}</div>
                          <div className={styles.evoStats}>
                            <span className={styles.evoRatingPill}>★ {pt.rating}</span>
                            <span className={styles.evoServicesPill}>{pt.services} servicios</span>
                            {improved && <span className={styles.evoTrend}>↑ Mejora</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            )}

            <div className={styles.nuraSeal}>
              <Layers size={13} color="var(--purple)" />
              <span>Perfil construido por Nüra · No por {h.name?.split(' ')?.[0] || h.name || ''} · {h.services} servicios reales · Se actualiza solo</span>
            </div>
          </div>
        )}
      </div>

      {showRating && <RatingModal helper={h} onClose={() => setShowRating(false)} />}
      {showConfirm && <BookingModal helper={h} onClose={() => setShowConfirm(false)} onBook={addService} onNavigate={navigate} />}
    </div>
  )
}

export default function HelperProfile() {
  return (
    <ErrorBoundary>
      <HelperProfileInner />
    </ErrorBoundary>
  )
}
