import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useUser } from '../context/UserContext'
import styles from './RegisterHelper.module.css'

const CATEGORIES = [
  { id: 'logopedia', icon: '🗣️', label: 'Logopedia' },
  { id: 'tecnico', icon: '🔧', label: 'Técnico / Reparaciones' },
  { id: 'limpieza', icon: '🧹', label: 'Limpieza del hogar' },
  { id: 'cuidado', icon: '👴', label: 'Cuidado de personas' },
  { id: 'mascotas', icon: '🐕', label: 'Mascotas' },
  { id: 'matematicas', icon: '📐', label: 'Clases particulares' },
  { id: 'entrenador', icon: '💪', label: 'Entrenador personal' },
  { id: 'otro', icon: '✨', label: 'Otro servicio' },
]

const ZONES = ['Eixample', 'Gràcia', 'Sant Martí', 'Les Corts', 'Sarrià', 'Sants', 'Horta', 'Sant Andreu', 'Nou Barris', 'Ciudad Vella']

export default function RegisterHelper() {
  const navigate = useNavigate()
  const { user, login } = useUser()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    category: '', bio: '', price: '', zone: '',
    presential: true, online: false,
    skills: '', education: '', experience: '',
  })

  const steps = ['Servicio', 'Sobre ti', 'Zona y precio', 'Listo']

  function next() { if (step < steps.length - 1) setStep(s => s + 1) }
  function back() { if (step > 0) setStep(s => s - 1) }

  function finish() {
    const helperData = { ...user, isHelper: true, helperProfile: form, helperSince: new Date().toISOString() }
    login(helperData)
    navigate('/profile')
  }

  const cat = CATEGORIES.find(c => c.id === form.category)

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.back} onClick={() => step === 0 ? navigate(-1) : back()}>
          <ArrowLeft size={18} />
        </button>
        <span className={styles.headerTitle}>Ser Helper</span>
        <div style={{width:36}} />
      </header>

      {/* Progress */}
      <div className={styles.progress}>
        {steps.map((s, i) => (
          <div key={i} className={`${styles.progressStep} ${i <= step ? styles.progressDone : ''}`}>
            <div className={styles.progressDot}>
              {i < step ? <Check size={10} /> : <span>{i+1}</span>}
            </div>
            <span className={styles.progressLabel}>{s}</span>
          </div>
        ))}
      </div>

      <div className={styles.content}>
        {/* Step 0: Category */}
        {step === 0 && (
          <div className={styles.stepWrap}>
            <h2 className={styles.stepTitle}>¿Qué servicio ofreces?</h2>
            <p className={styles.stepDesc}>Puedes añadir más servicios después.</p>
            <div className={styles.catGrid}>
              {CATEGORIES.map(c => (
                <button key={c.id}
                  className={`${styles.catBtn} ${form.category === c.id ? styles.catActive : ''}`}
                  onClick={() => setForm(f => ({...f, category: c.id}))}>
                  <span className={styles.catIcon}>{c.icon}</span>
                  <span className={styles.catLabel}>{c.label}</span>
                  {form.category === c.id && <div className={styles.catCheck}><Check size={10} /></div>}
                </button>
              ))}
            </div>
            <button className={styles.btn} onClick={next} disabled={!form.category}>
              Siguiente <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 1: Bio + skills */}
        {step === 1 && (
          <div className={styles.stepWrap}>
            <h2 className={styles.stepTitle}>Cuéntanos sobre ti</h2>
            <p className={styles.stepDesc}>Esta información construirá tu perfil vivo en Nüra.</p>

            <label className={styles.label}>Descripción breve</label>
            <textarea className={styles.textarea}
              placeholder={`Ej: ${cat?.icon || '✨'} Soy ${cat?.label || 'profesional'} con X años de experiencia en Barcelona...`}
              value={form.bio} onChange={e => setForm(f => ({...f, bio: e.target.value}))}
              rows={3} />

            <label className={styles.label}>Formación / titulación</label>
            <input className={styles.input} placeholder="Ej: Grado en Logopedia, UB 2018"
              value={form.education} onChange={e => setForm(f => ({...f, education: e.target.value}))} />

            <label className={styles.label}>Experiencia laboral</label>
            <input className={styles.input} placeholder="Ej: 3 años en Clínica Sant Pau"
              value={form.experience} onChange={e => setForm(f => ({...f, experience: e.target.value}))} />

            <label className={styles.label}>Habilidades principales (separadas por comas)</label>
            <input className={styles.input} placeholder="Ej: logopedia infantil, dislalia, domicilio"
              value={form.skills} onChange={e => setForm(f => ({...f, skills: e.target.value}))} />

            <div className={styles.modalRow}>
              <button className={`${styles.modalBtn} ${form.presential ? styles.modalActive : ''}`}
                onClick={() => setForm(f => ({...f, presential: !f.presential}))}>
                📍 Presencial
              </button>
              <button className={`${styles.modalBtn} ${form.online ? styles.modalActive : ''}`}
                onClick={() => setForm(f => ({...f, online: !f.online}))}>
                💻 Online
              </button>
            </div>

            <button className={styles.btn} onClick={next} disabled={!form.bio.trim()}>
              Siguiente <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 2: Zone + price */}
        {step === 2 && (
          <div className={styles.stepWrap}>
            <h2 className={styles.stepTitle}>Zona y precio</h2>
            <p className={styles.stepDesc}>¿Dónde operas y cuánto cobras?</p>

            <label className={styles.label}>Zona principal en Barcelona</label>
            <div className={styles.zoneGrid}>
              {ZONES.map(z => (
                <button key={z}
                  className={`${styles.zoneBtn} ${form.zone === z ? styles.zoneActive : ''}`}
                  onClick={() => setForm(f => ({...f, zone: z}))}>
                  {z}
                </button>
              ))}
            </div>

            <label className={styles.label}>Precio aproximado</label>
            <div className={styles.priceRow}>
              {['10€/hora', '15€/hora', '20€/hora', '25€/hora', '30€/hora', '40€/sesión', '50€/sesión', '60€/hora'].map(p => (
                <button key={p}
                  className={`${styles.priceBtn} ${form.price === p ? styles.priceActive : ''}`}
                  onClick={() => setForm(f => ({...f, price: p}))}>
                  {p}
                </button>
              ))}
            </div>
            <input className={styles.input} placeholder="O escribe tu precio personalizado..."
              value={form.price} onChange={e => setForm(f => ({...f, price: e.target.value}))} />

            <button className={styles.btn} onClick={next} disabled={!form.zone || !form.price}>
              Siguiente <ArrowRight size={16} />
            </button>
          </div>
        )}

        {/* Step 3: Done */}
        {step === 3 && (
          <div className={styles.doneWrap}>
            <div className={styles.doneIcon}>🎉</div>
            <h2 className={styles.stepTitle}>¡Ya eres Helper de Nüra!</h2>
            <p className={styles.stepDesc}>Tu perfil está activo. Nüra lo irá enriqueciendo automáticamente con cada servicio que completes.</p>

            <div className={styles.founderBox}>
              <div className={styles.founderIcon}>⭐</div>
              <div>
                <div className={styles.founderTitle}>Helper Fundador</div>
                <div className={styles.founderDesc}>Al unirte ahora, recibes la insignia exclusiva de Fundador, posicionamiento prioritario permanente y visibilidad premium gratis durante 12 meses.</div>
              </div>
            </div>

            <div className={styles.profilePreview}>
              <div className={styles.previewAvatar} style={{background: 'var(--grad-main)'}}>
                {user?.name?.[0] || 'H'}
              </div>
              <div>
                <div className={styles.previewName}>{user?.name || 'Tu nombre'}</div>
                <div className={styles.previewCat}>{cat?.icon} {cat?.label} · {form.zone}</div>
                <div className={styles.previewPrice}>{form.price}</div>
              </div>
            </div>

            <button className={styles.btn} onClick={finish}>
              Ver mi perfil <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
