import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function PatientDetail() {
  const { id } = useParams()
  const [patient, setPatient] = useState(null)
  const [consultations, setConsultations] = useState([])
  const [antecedents, setAntecedents] = useState([])
  const [traitements, setTraitements] = useState([])
  const [documents, setDocuments] = useState([])
  const [tab, setTab] = useState('consultations')
  const [newAnt, setNewAnt] = useState({ type: 'medical' })
  const [newTrait, setNewTrait] = useState({})

  async function load() {
    const { data: p } = await supabase.from('patients').select('*').eq('id', id).single()
    setPatient(p)
    const [{ data: c }, { data: a }, { data: t }, { data: d }] = await Promise.all([
      supabase.from('consultations').select('*').eq('patient_id', id).order('date_consultation', { ascending: false }),
      supabase.from('antecedents').select('*').eq('patient_id', id),
      supabase.from('traitements').select('*').eq('patient_id', id).order('created_at', { ascending: false }),
      supabase.from('documents').select('*').eq('patient_id', id).order('created_at', { ascending: false })
    ])
    setConsultations(c || []); setAntecedents(a || [])
    setTraitements(t || []); setDocuments(d || [])
  }
  useEffect(() => { load() }, [id])

  async function addAntecedent(e) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('antecedents').insert({ ...newAnt, patient_id: id, doctor_id: user.id })
    setNewAnt({ type: 'medical' }); load()
  }
  async function addTraitement(e) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('traitements').insert({ ...newTrait, patient_id: id, doctor_id: user.id })
    setNewTrait({}); load()
  }
  async function uploadDoc(file, type_doc) {
    if (!file) return
    const { data: { user } } = await supabase.auth.getUser()
    const path = `${user.id}/${id}/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('documents').upload(path, file)
    if (error) { alert(error.message); return }
    await supabase.from('documents').insert({
      doctor_id: user.id, patient_id: id, nom_fichier: file.name,
      type_document: type_doc, storage_path: path, taille: file.size, mime_type: file.type
    })
    load()
  }
  async function openDoc(doc) {
    const { data } = await supabase.storage.from('documents').createSignedUrl(doc.storage_path, 60)
    if (data) window.open(data.signedUrl, '_blank')
  }

  if (!patient) return <div className="p-4">Chargement…</div>
  const age = patient.date_naissance ? Math.floor((Date.now() - new Date(patient.date_naissance)) / 31557600000) : '—'

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex justify-between items-start gap-2">
          <div>
            <h1 className="text-xl font-bold">{patient.nom} {patient.prenom}</h1>
            <p className="text-gray-600 text-sm">{patient.numero_dossier}</p>
          </div>
          <Link to={`/patients/${id}/consultation`} className="btn whitespace-nowrap">+ Consultation</Link>
        </div>
        <div className="mt-3 text-sm grid grid-cols-2 gap-2 text-gray-700">
          <p>🎂 {age} ans ({patient.date_naissance})</p>
          <p>⚥ {patient.sexe}</p>
          <p>📞 {patient.telephone || '—'}</p>
          <p>📍 {patient.adresse || '—'}</p>
        </div>
        {patient.notes && <p className="text-sm mt-2 text-gray-600">📝 {patient.notes}</p>}
      </div>

      <div className="flex gap-1 overflow-x-auto border-b">
        {['consultations','antecedents','traitements','documents'].map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 text-sm whitespace-nowrap ${tab===t?'border-b-2 border-blue-600 font-bold text-blue-600':''}`}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {tab==='consultations' && (
        <div className="space-y-2">
          {consultations.map(c => (
            <div key={c.id} className="card">
              <div className="flex justify-between text-sm">
                <span className="font-bold">{c.motif || 'Consultation'}</span>
                <span>{new Date(c.date_consultation).toLocaleDateString('fr-FR')}</span>
              </div>
              {c.diagnostic && <p className="text-sm mt-1">🔬 <b>Diagnostic:</b> {c.diagnostic}</p>}
              {c.observations && <p className="text-sm text-gray-600 mt-1">{c.observations}</p>}
              <div className="text-xs grid grid-cols-3 gap-1 mt-2 text-gray-600">
                {c.poids && <span>Poids: {c.poids}kg</span>}
                {c.taille && <span>Taille: {c.taille}cm</span>}
                {c.temperature && <span>T°: {c.temperature}°C</span>}
                {c.tension_sys && <span>TA: {c.tension_sys}/{c.tension_dia}</span>}
                {c.frequence_cardiaque && <span>FC: {c.frequence_cardiaque}bpm</span>}
                {c.frequence_respiratoire && <span>FR: {c.frequence_respiratoire}</span>}
                {c.spo2 && <span>SpO2: {c.spo2}%</span>}
                {c.glycemie && <span>Glycémie: {c.glycemie}g/L</span>}
              </div>
            </div>
          ))}
          {!consultations.length && <p className="text-gray-500 text-center py-4">Aucune consultation</p>}
        </div>
      )}

      {tab==='antecedents' && (
        <div className="space-y-2">
          <form onSubmit={addAntecedent} className="card space-y-2">
            <select className="input" value={newAnt.type} onChange={e => setNewAnt({...newAnt, type: e.target.value})}>
              <option value="medical">Médical</option>
              <option value="chirurgical">Chirurgical</option>
              <option value="familial">Familial</option>
              <option value="allergie">Allergie</option>
              <option value="gyneco">Gynéco-obstétrical</option>
            </select>
            <input className="input" placeholder="Description" value={newAnt.description||''} onChange={e => setNewAnt({...newAnt, description: e.target.value})} required />
            <input className="input" type="date" value={newAnt.date_debut||''} onChange={e => setNewAnt({...newAnt, date_debut: e.target.value})} />
            <button className="btn" type="submit">Ajouter antécédent</button>
          </form>
          {antecedents.map(a => (
            <div key={a.id} className="card text-sm">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{a.type}</span>
              <p className="mt-1">{a.description}</p>
              <p className="text-xs text-gray-500">{a.date_debut || ''} · {a.statut}</p>
            </div>
          ))}
        </div>
      )}

      {tab==='traitements' && (
        <div className="space-y-2">
          <form onSubmit={addTraitement} className="card space-y-2">
            <input className="input" placeholder="Médicament *" value={newTrait.medicament||''} onChange={e => setNewTrait({...newTrait, medicament: e.target.value})} required />
            <input className="input" placeholder="Dosage" value={newTrait.dosage||''} onChange={e => setNewTrait({...newTrait, dosage: e.target.value})} />
            <input className="input" placeholder="Posologie" value={newTrait.posologie||''} onChange={e => setNewTrait({...newTrait, posologie: e.target.value})} />
            <input className="input" placeholder="Durée" value={newTrait.duree||''} onChange={e => setNewTrait({...newTrait, duree: e.target.value})} />
            <button className="btn" type="submit">Ajouter traitement</button>
          </form>
          {traitements.map(t => (
            <div key={t.id} className="card text-sm">
              <p className="font-bold">💊 {t.medicament} {t.dosage || ''}</p>
              <p className="text-gray-600">{t.posologie} · {t.duree}</p>
              <p className="text-xs text-gray-500 mt-1">Statut: {t.statut}</p>
            </div>
          ))}
        </div>
      )}

      {tab==='documents' && (
        <div className="space-y-2">
          <div className="card">
            <p className="text-sm mb-2 font-bold">Ajouter un document (scan)</p>
            <select id={`dt_${id}`} className="input mb-2">
              <option value="ordonnance">Ordonnance</option>
              <option value="analyse">Analyse</option>
              <option value="imagerie">Imagerie</option>
              <option value="autre">Autre</option>
            </select>
            <input type="file" accept="image/*,application/pdf"
              onChange={e => {
                const f = e.target.files[0]
                if (f) uploadDoc(f, document.getElementById(`dt_${id}`).value)
                e.target.value = ''
              }}
              className="text-sm" />
          </div>
          {documents.map(d => (
            <div key={d.id} className="card flex justify-between items-center gap-2">
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{d.nom_fichier}</p>
                <p className="text-xs text-gray-500">{d.type_document} · {new Date(d.created_at).toLocaleDateString('fr-FR')}</p>
              </div>
              <button className="text-blue-600 text-sm whitespace-nowrap" onClick={() => openDoc(d)}>Ouvrir</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
