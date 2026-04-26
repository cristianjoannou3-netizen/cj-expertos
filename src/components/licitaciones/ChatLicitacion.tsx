'use client'
import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { Send, MessageCircle } from 'lucide-react'
import { useChat } from '@/hooks/useChat'
import type { Perfil } from '@/types/perfil'

interface Props {
  licitacionId: string
  perfil: Perfil
  participantes: Record<string, Perfil>
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

export default function ChatLicitacion({ licitacionId, perfil, participantes }: Props) {
  const { mensajes, loading, enviarMensaje } = useChat(licitacionId, perfil.id)
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [mensajes])

  const handleEnviar = async () => {
    const t = texto.trim()
    if (!t || enviando) return
    setEnviando(true)
    setTexto('')
    await enviarMensaje(t)
    setEnviando(false)
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleEnviar()
    }
  }

  // Agrupar mensajes por fecha
  const mensajesPorFecha: { fecha: string; items: typeof mensajes }[] = []
  for (const m of mensajes) {
    const fecha = formatDate(m.created_at)
    const ultimo = mensajesPorFecha[mensajesPorFecha.length - 1]
    if (ultimo?.fecha === fecha) {
      ultimo.items.push(m)
    } else {
      mensajesPorFecha.push({ fecha, items: [m] })
    }
  }

  return (
    <div className="bg-[var(--card)] rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
        <MessageCircle size={18} className="text-[var(--primary)]" />
        <h3 className="font-bold text-slate-800 text-base">Chat de obra</h3>
        <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          {mensajes.length} mensaje{mensajes.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Lista de mensajes */}
      <div className="h-80 overflow-y-auto px-4 py-3 space-y-1 bg-slate-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-slate-400">Cargando mensajes...</p>
          </div>
        ) : mensajes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <MessageCircle size={32} className="text-slate-200" />
            <p className="text-sm text-slate-400">No hay mensajes todavía.</p>
            <p className="text-xs text-slate-300">Usá este chat para coordinar con la contraparte.</p>
          </div>
        ) : (
          mensajesPorFecha.map(({ fecha, items }) => (
            <div key={fecha}>
              {/* Separador de fecha */}
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-xs text-slate-400 font-medium">{fecha}</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {items.map((m) => {
                const esPropio = m.autor_id === perfil.id
                const autor = participantes[m.autor_id]
                const inicial = (autor?.nombre ?? 'U')[0].toUpperCase()

                return (
                  <div
                    key={m.id}
                    className={`flex items-end gap-2 mb-2 ${esPropio ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    {/* Avatar */}
                    <div className="w-7 h-7 rounded-full bg-[var(--surface)] flex items-center justify-center shrink-0 text-xs font-black text-[var(--primary)]">
                      {inicial}
                    </div>

                    {/* Burbuja */}
                    <div className={`max-w-[75%] ${esPropio ? 'items-end' : 'items-start'} flex flex-col`}>
                      {!esPropio && (
                        <p className="text-xs text-slate-400 font-medium mb-0.5 ml-1">
                          {autor?.nombre ?? 'Usuario'}
                        </p>
                      )}
                      <div
                        className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                          esPropio
                            ? 'bg-[var(--primary)] text-white rounded-br-sm'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
                        }`}
                      >
                        {m.contenido}
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5 mx-1">
                        {formatTime(m.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 px-4 py-3 border-t border-slate-100 bg-white">
        <textarea
          ref={textareaRef}
          value={texto}
          onChange={e => setTexto(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribí un mensaje... (Ctrl+Enter para enviar)"
          rows={1}
          className="flex-1 resize-none px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] placeholder-slate-400 max-h-28 overflow-y-auto"
          style={{ minHeight: '42px' }}
          disabled={enviando}
        />
        <button
          onClick={handleEnviar}
          disabled={!texto.trim() || enviando}
          className="w-10 h-10 rounded-xl bg-[var(--primary)] text-white flex items-center justify-center shrink-0 hover:opacity-90 disabled:opacity-40 transition-opacity"
          title="Enviar (Ctrl+Enter)"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
