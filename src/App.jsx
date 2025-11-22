import { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

function Toolbar({ onAddNode, onSave, onNew, title, setTitle }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-800/80 border-b border-slate-700 sticky top-0 z-10">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="bg-slate-700 text-white px-3 py-2 rounded outline-none w-64"
        placeholder="Titre de la mindmap"
      />
      <button onClick={onAddNode} className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded">
        Ajouter un noeud
      </button>
      <button onClick={onSave} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded">
        Sauvegarder
      </button>
      <button onClick={onNew} className="px-3 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded ml-auto">
        Nouveau
      </button>
    </div>
  )
}

function Node({ node, selected, onMouseDown, onChangeLabel }) {
  return (
    <div
      onMouseDown={(e) => onMouseDown(e, node.id)}
      className={`absolute select-none cursor-move ${selected ? 'ring-2 ring-blue-400' : ''}`}
      style={{ left: node.x, top: node.y }}
    >
      <input
        value={node.label}
        onChange={(e) => onChangeLabel(node.id, e.target.value)}
        className="bg-white/90 text-slate-900 px-3 py-2 rounded shadow min-w-[140px]"
      />
    </div>
  )
}

function App() {
  const [mindmaps, setMindmaps] = useState([])
  const [currentId, setCurrentId] = useState(null)
  const [title, setTitle] = useState('Nouvelle mindmap')
  const [nodes, setNodes] = useState([])
  const [draggingId, setDraggingId] = useState(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  // Load list
  useEffect(() => {
    fetch(`${API_BASE}/api/mindmaps`).then(r => r.json()).then(setMindmaps).catch(() => {})
  }, [])

  // Basic canvas dragging for nodes
  const onMouseMove = (e) => {
    if (!draggingId) return
    setNodes(prev => prev.map(n => n.id === draggingId ? { ...n, x: e.clientX - offset.x, y: e.clientY - offset.y } : n))
  }

  const onMouseUp = () => setDraggingId(null)

  const handleMouseDown = (e, id) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setDraggingId(id)
    setOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  const addNode = () => {
    const id = Math.random().toString(36).slice(2, 9)
    setNodes([...nodes, { id, label: 'Idée', x: 200, y: 150 }])
  }

  const changeLabel = (id, value) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, label: value } : n))
  }

  const createNew = async () => {
    try {
      const r = await fetch(`${API_BASE}/api/mindmaps`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) })
      const data = await r.json()
      setCurrentId(data.id)
      setTitle(data.title)
      setNodes([])
      setMindmaps([data, ...mindmaps])
    } catch {}
  }

  const save = async () => {
    if (!currentId) return await createNew()
    await fetch(`${API_BASE}/api/mindmaps/${currentId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, nodes }) })
  }

  const loadMindmap = async (id) => {
    const r = await fetch(`${API_BASE}/api/mindmaps/${id}`)
    const data = await r.json()
    setCurrentId(data.id)
    setTitle(data.title)
    setNodes(data.nodes || [])
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white" onMouseMove={onMouseMove} onMouseUp={onMouseUp}>
      <Toolbar onAddNode={addNode} onSave={save} onNew={createNew} title={title} setTitle={setTitle} />

      <div className="grid grid-cols-12">
        <aside className="col-span-3 border-r border-slate-800 p-3 space-y-2 bg-slate-900/80">
          <h3 className="text-sm uppercase tracking-wide text-slate-400">Vos mindmaps</h3>
          <button onClick={createNew} className="w-full text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded mt-2">+ Nouvelle</button>
          <div className="space-y-1 mt-2 max-h-[70vh] overflow-auto pr-1">
            {mindmaps.map(m => (
              <div key={m.id} className={`px-3 py-2 rounded cursor-pointer hover:bg-slate-800 ${currentId === m.id ? 'bg-slate-800' : ''}`} onClick={() => loadMindmap(m.id)}>
                <div className="text-sm font-medium">{m.title}</div>
              </div>
            ))}
          </div>
        </aside>

        <main className="relative col-span-9 h-[calc(100vh-56px)] overflow-hidden bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.15),transparent_40%)]">
          {nodes.map(n => (
            <Node key={n.id} node={n} selected={draggingId === n.id} onMouseDown={handleMouseDown} onChangeLabel={changeLabel} />
          ))}
        </main>
      </div>
    </div>
  )
}

export default App
