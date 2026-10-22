import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Patients from './pages/Patients'
import PatientDetail from './pages/PatientDetail'
import ConsultationNew from './pages/ConsultationNew'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])
  if (loading) return <div className="p-6">Chargement…</div>
  if (!session) return <Login />
  return <Layout>
    <Routes>
      <Route path="/" element={<Navigate to="/patients" />} />
      <Route path="/patients" element={<Patients />} />
      <Route path="/patients/:id" element={<PatientDetail />} />
      <Route path="/patients/:id/consultation" element={<ConsultationNew />} />
      <Route path="*" element={<Navigate to="/patients" />} />
    </Routes>
  </Layout>
}

function Layout({ children }) {
  const loc = useLocation()
  return (
    <div className="min-h-screen pb-20 md:pb-4">
      <header className="bg-white border-b px-4 py-3 flex justify-between items-center max-w-4xl mx-auto">
        <Link to="/patients" className="font-bold text-lg">🏥 Registre Médical</Link>
        <button onClick={() => supabase.auth.signOut()} className="text-sm text-red-600">Déconnexion</button>
      </header>
      <main className="max-w-4xl mx-auto p-4">{children}</main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around md:hidden py-2">
        <Link to="/patients" className={`text-xs flex flex-col items-center ${loc.pathname.startsWith('/patients') ? 'text-blue-600' : 'text-gray-600'}`}>
          <span className="text-xl">👥</span>Patients
        </Link>
      </nav>
    </div>
  )
}
