import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Patients() {
  const [list, setList] = useState([])
  const [q, setQ] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({})

  async function load() {
    let req = supabase.from('patients').select('*').order('nom')
    if (q) req = req.or(`nom.ilike.%${q}%,prenom.ilike.%${q}%,telephone.ilike.%${q}%`)
    const { data } = await req
    setList(data || [])
  }
  useEffect(() => { load() }, [q])

  async function create(e) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    const numero = 'P' + Date.now().toString().slice(-8)
    const { error } = await supabase.from('patients').insert({ ...form, doctor_id: user.id, numero_dossier: numero })
    if (error) { alert(error.message); return }
    setShowForm(false); setForm({}); load()
  }

  const fields = [
    ['nom','Nom',true],['prenom','Prénom',true],['telephone','Téléphone',false],
    ['email','Email',false],['adresse','Adresse',false]
  ]

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input className="input" placeholder="🔍 Rechercher nom, prénom, téléphone…" value={q} onChange={e => setQ(e.target.value)} />
        <button className="btn whitespace-nowrap" onClick={() => setShowForm(!showForm)}>+ Patient</button>
      </div>

      {showForm && (
        <form onSubmit={create} className="card space-y-2">
          <h2 className="font-bold">Nouveau patient</h2>
          {fields.map(([k,l,req]) => (
            <input key={k} className="input" placeholder={l} value={form[k]||''} onChange={e => setForm({...form, [k]: e.target.value})} required={req} />
          ))}
          <label className="text-sm text-gray-600">Date de naissance</label>
          <input className="input" type="date" value={form.date_naissance||''} onChange={e => setForm({...form, date_naissance: e.target.value})} required />
          <select className="input" value={form.sexe||''} onChange={e => setForm({...form, sexe: e.target.value})} required>
            <option value="">Sexe</option><option value="M">Masculin</option><option value="F">Féminin</option><option value="Autre">Autre</option>
          </select>
          <textarea className="input" placeholder="Notes médicales générales" value={form.notes||''} onChange={e => setForm({...form, notes: e.target.value})} />
          <div className="flex gap-2">
            <button className="btn" type="submit">Enregistrer</button>
            <button className="btn bg-gray-400 hover:bg-gray-500" type="button" onClick={() => setShowForm(false)}>Annuler</button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        {list.map(p => (
          <Link key={p.id} to={`/patients/${p.id}`} className="card block hover:bg-blue-50">
            <div className="font-bold">{p.nom} {p.prenom}</div>
            <div className="text-sm text-gray-600">{p.numero_dossier} · {p.telephone || '—'}</div>
          </Link>
        ))}
        {!list.length && <p className="text-gray-500 text-center py-8">Aucun patient enregistré</p>}
      </div>
    </div>
  )
}
