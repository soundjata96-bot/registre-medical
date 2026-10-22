import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault(); setError(''); setBusy(true)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({
          email, password, options: { data: { full_name: name } }
        })
        if (error) throw error
        alert('Compte créé. Connectez-vous maintenant.')
        setMode('login')
      }
    } catch (e) { setError(e.message) } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={submit} className="bg-white p-6 rounded-lg shadow w-full max-w-sm space-y-3">
        <h1 className="text-xl font-bold text-center">🏥 Registre Médical</h1>
        {mode === 'signup' && (
          <input className="input" placeholder="Nom complet du médecin" value={name} onChange={e => setName(e.target.value)} required />
        )}
        <input className="input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
        <input className="input" type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button disabled={busy} className="btn w-full">{busy ? '…' : (mode === 'login' ? 'Se connecter' : "Créer mon compte")}</button>
        <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-sm text-blue-600 w-full">
          {mode === 'login' ? 'Créer un compte médecin' : "J'ai déjà un compte"}
        </button>
      </form>
    </div>
  )
}
