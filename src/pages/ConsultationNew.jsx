import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function ConsultationNew() {
  const { id } = useParams()
  const nav = useNavigate()
  const [form, setForm] = useState({})
  const [trait, setTrait] = useState({})
  const [busy, setBusy] = useState(false)
  const set = k => e => setForm({...form, [k]: e.target.value})
  const setT = k => e => setTrait({...trait, [k]: e.target.value})

  async function submit(e) {
    e.preventDefault(); setBusy(true)
    const { data: { user } } = await supabase.auth.getUser()
    const num = v => v ? parseFloat(v) : null
    const int = v => v ? parseInt(v) : null
    const { data, error } = await supabase.from('consultations').insert({
      motif: form.motif, diagnostic: form.diagnostic, observations: form.observations,
      poids: num(form.poids), taille: num(form.taille), temperature: num(form.temperature),
      tension_sys: int(form.tension_sys), tension_dia: int(form.tension_dia),
      frequence_cardiaque: int(form.frequence_cardiaque), frequence_respiratoire: int(form.frequence_respiratoire),
      spo2: int(form.spo2), glycemie: num(form.glycemie),
      patient_id: id, doctor_id: user.id
    }).select().single()
    if (error) { alert(error.message); setBusy(false); return }
    if (trait.medicament) {
      await supabase.from('traitements').insert({
        ...trait, patient_id: id, doctor_id: user.id, consultation_id: data.id,
        date_debut: new Date().toISOString().slice(0,10)
      })
    }
    nav(`/patients/${id}`)
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <h1 className="text-xl font-bold">Nouvelle consultation</h1>
      <div className="card space-y-2">
        <h2 className="font-bold text-sm">Motif / Diagnostic</h2>
        <input className="input" placeholder="Motif" onChange={set('motif')} />
        <input className="input" placeholder="Diagnostic" onChange={set('diagnostic')} />
        <textarea className="input" placeholder="Observations" onChange={set('observations')} />
      </div>
      <div className="card grid grid-cols-2 gap-2">
        <h2 className="font-bold text-sm col-span-2">Constantes</h2>
        {[
          ['poids','Poids (kg)','number','0.1'],['taille','Taille (cm)','number','1'],
          ['temperature','T° (°C)','number','0.1'],['tension_sys','TA systolique','number','1'],
          ['tension_dia','TA diastolique','number','1'],['frequence_cardiaque','FC (bpm)','number','1'],
          ['frequence_respiratoire','FR (/min)','number','1'],['spo2','SpO2 (%)','number','1'],
          ['glycemie','Glycémie (g/L)','number','0.01']
        ].map(([k,l,t,s]) => (
          <label key={k} className="text-sm">
            <span className="block text-gray-600 mb-1">{l}</span>
            <input className="input" type={t} step={s} onChange={set(k)} />
          </label>
        ))}
      </div>
      <div className="card space-y-2">
        <h2 className="font-bold text-sm">Traitement (optionnel)</h2>
        <input className="input" placeholder="Médicament" onChange={setT('medicament')} />
        <input className="input" placeholder="Dosage" onChange={setT('dosage')} />
        <input className="input" placeholder="Posologie" onChange={setT('posologie')} />
        <input className="input" placeholder="Durée" onChange={setT('duree')} />
      </div>
      <button className="btn w-full" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer la consultation'}</button>
    </form>
  )
}
