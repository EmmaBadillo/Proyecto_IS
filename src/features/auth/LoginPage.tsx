import { useState } from 'react'
import type { FormEvent } from 'react'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { Eye, EyeOff, LoaderCircle, LockKeyhole, LogIn, ShieldCheck, UserRound } from 'lucide-react'
import type { AuthFormState, SyncStatus } from '../../types/techstore'

type Props = {
  auth: AuthFormState
  syncStatus: SyncStatus
  syncMessage: string
  onAuthChange: (next: Partial<AuthFormState>) => void
  onLogin: (event: FormEvent<HTMLFormElement>) => void
}

const easeOut = [0.16, 1, 0.3, 1] as const

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.38, ease: easeOut } },
}

const formReveal: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 + index * 0.06, duration: 0.3, ease: easeOut },
  }),
}

export function LoginPage({
  auth,
  syncStatus,
  syncMessage,
  onAuthChange,
  onLogin,
}: Props) {
  const [showPassword, setShowPassword] = useState(false)
  const isLoading = syncStatus === 'loading'
  const showStatus = syncStatus === 'loading' || syncStatus === 'error'

  return (
    <main className="auth-page">
      <motion.div className="auth-layout" initial="hidden" animate="visible" variants={fadeUp}>
        <section className="auth-visual" aria-label="TechStore 360">
          <div className="auth-brand">
            <span className="auth-brand-mark">T</span>
            <span>TechStore 360</span>
          </div>

          <div className="auth-visual-copy">
            <h1>Dashboard comercial</h1>
            <p>Acceso privado para ventas, stock y clientes.</p>
          </div>

          <div className="auth-preview" aria-hidden="true">
            <div className="preview-topline">
              <span />
              <span />
              <span />
            </div>
            <div className="preview-grid">
              <span />
              <span />
              <span />
            </div>
            <div className="preview-chart">
              <span className="bar-1" />
              <span className="bar-2" />
              <span className="bar-3" />
              <span className="bar-4" />
              <span className="bar-5" />
            </div>
          </div>
        </section>

        <section className="auth-card auth-card-large">
          <div className="auth-head">
            <div>
              <div className="section-title">Bienvenido</div>
              <div className="panel-copy">Ingresa para continuar.</div>
            </div>
            <div className="auth-icon">
              <LogIn size={18} />
            </div>
          </div>

          <form className="auth-form" onSubmit={onLogin}>
            <motion.label className="field-group" variants={formReveal} custom={0}>
              <span className="field-label">Usuario</span>
              <div className="field-shell">
                <span className="field-prefix">
                  <UserRound size={16} />
                </span>
                <input
                  className="input input-inline"
                  value={auth.username}
                  onChange={(event) => onAuthChange({ username: event.target.value })}
                  placeholder="usuario"
                  autoComplete="username"
                  disabled={isLoading}
                />
              </div>
            </motion.label>

            <motion.label className="field-group" variants={formReveal} custom={1}>
              <span className="field-label">Contraseña</span>
              <div className="field-shell">
                <span className="field-prefix">
                  <LockKeyhole size={16} />
                </span>
                <input
                  className="input input-inline"
                  type={showPassword ? 'text' : 'password'}
                  value={auth.password}
                  onChange={(event) => onAuthChange({ password: event.target.value })}
                  placeholder="contraseña"
                  autoComplete="current-password"
                  disabled={isLoading}
                />
                <button
                  className="field-action"
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </motion.label>

            {showStatus ? (
              <motion.div
                className={`auth-alert ${syncStatus === 'error' ? 'error' : ''}`}
                variants={formReveal}
                custom={2}
                role={syncStatus === 'error' ? 'alert' : 'status'}
              >
                {isLoading ? <LoaderCircle className="spin-icon" size={16} /> : <ShieldCheck size={16} />}
                <span>{syncMessage}</span>
              </motion.div>
            ) : null}

            <motion.button
              className="button button-large"
              type="submit"
              variants={formReveal}
              custom={3}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
            >
              {isLoading ? <LoaderCircle className="spin-icon" size={18} /> : <LogIn size={18} />}
              {isLoading ? 'Validando...' : 'Entrar'}
            </motion.button>
          </form>
        </section>
      </motion.div>
    </main>
  )
}
