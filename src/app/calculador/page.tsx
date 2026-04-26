'use client'
import { useState, useCallback } from 'react'
import AppShell from '@/components/layout/AppShell'
import Card from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { calcularAbertura, LINEAS, TIPOLOGIAS } from '@/lib/calculador/calculos'
import type { ResultadoCalculo, ParametrosCalculo, Linea } from '@/lib/calculador/types'
import { Calculator, Download, Save, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ── Helpers ────────────────────────────────────────────────────
function fmt(n: number) { return n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function fmtMoney(n: number) { return '$\u202F' + n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) }

// ── Exportar a PDF / print ─────────────────────────────────────
function exportarPDF(params: ParametrosCalculo, resultado: ResultadoCalculo, nombre: string, precioKg: number, precioM2: number) {
  const costoAluminio = resultado.totalKgComprar * precioKg
  const costoVidrio   = resultado.vidrio.totalM2 * precioM2
  const total         = costoAluminio + costoVidrio

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Presupuesto − ${nombre}</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; margin: 24px; color: #1e293b; }
  h1   { font-size: 18px; margin-bottom: 4px; }
  h2   { font-size: 14px; margin: 16px 0 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
  th, td { text-align: left; padding: 5px 8px; border: 1px solid #e2e8f0; }
  th { background: #f8fafc; font-weight: 700; }
  .right { text-align: right; }
  .total { font-weight: 700; font-size: 14px; }
  .badge { display: inline-block; background: #dbeafe; color: #1d4ed8; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; }
  .summary { background: #f1f5f9; border-radius: 8px; padding: 12px; margin: 12px 0; }
  .summary p { margin: 3px 0; }
</style>
</head>
<body>
<h1>Presupuesto de Abertura</h1>
<p><strong>${nombre}</strong> — generado ${new Date().toLocaleDateString('es-AR')}</p>

<div class="summary">
  <p><strong>Línea:</strong> ${params.linea} &nbsp;|&nbsp; <strong>Tipología:</strong> ${params.tipologia} &nbsp;|&nbsp; <strong>Vidrio:</strong> ${params.dvh ? 'DVH' : 'Simple'}</p>
  <p><strong>Medidas:</strong> ${params.A} × ${params.H} mm &nbsp;|&nbsp; <strong>Borde:</strong> ${params.tipoBorde ?? 'recto'}</p>
</div>

<h2>Perfilería de aluminio</h2>
<table>
<tr><th>Perfil</th><th>Descripción</th><th class="right">Medida (mm)</th><th class="right">Cant.</th><th class="right">Corte</th><th class="right">m util.</th><th class="right">m comprar</th><th class="right">Barras</th><th class="right">kg util.</th><th class="right">kg comprar</th></tr>
${resultado.lista.map(p => `<tr>
  <td>${p.perfil}</td>
  <td>${p.desc}</td>
  <td class="right">${p.medidaMm ?? '—'}</td>
  <td class="right">${p.cantidad}</td>
  <td class="right">${p.corte}</td>
  <td class="right">${fmt(p.metrosUtilizar)}</td>
  <td class="right">${fmt(p.metrosComprar)}</td>
  <td class="right">${p.barras}</td>
  <td class="right">${fmt(p.kgUtilizar)}</td>
  <td class="right">${fmt(p.kgComprar)}</td>
</tr>`).join('')}
<tr class="total">
  <td colspan="8"><strong>TOTAL ALUMINIO</strong></td>
  <td class="right">${fmt(resultado.totalKgUtilizar)} kg</td>
  <td class="right">${fmt(resultado.totalKgComprar)} kg</td>
</tr>
</table>

<h2>Vidrio</h2>
<table>
<tr><th>Panel</th><th class="right">Ancho (mm)</th><th class="right">Alto (mm)</th><th class="right">m²</th></tr>
${resultado.vidrio.paneles.map(p => `<tr>
  <td>${p.nombre}</td>
  <td class="right">${p.ancho}</td>
  <td class="right">${p.alto}</td>
  <td class="right">${((p.ancho * p.alto) / 1e6).toFixed(3)}</td>
</tr>`).join('')}
<tr class="total"><td colspan="3"><strong>TOTAL VIDRIO</strong></td><td class="right">${fmt(resultado.vidrio.totalM2)} m²</td></tr>
</table>

<h2>Resumen de costos</h2>
<table>
<tr><th>Ítem</th><th class="right">Cantidad</th><th class="right">Precio unit.</th><th class="right">Subtotal</th></tr>
<tr><td>Aluminio</td><td class="right">${fmt(resultado.totalKgComprar)} kg</td><td class="right">${fmtMoney(precioKg)}/kg</td><td class="right">${fmtMoney(costoAluminio)}</td></tr>
<tr><td>Vidrio</td><td class="right">${fmt(resultado.vidrio.totalM2)} m²</td><td class="right">${fmtMoney(precioM2)}/m²</td><td class="right">${fmtMoney(costoVidrio)}</td></tr>
<tr class="total"><td colspan="3"><strong>TOTAL ESTIMADO</strong></td><td class="right">${fmtMoney(total)}</td></tr>
</table>

<p style="margin-top:20px; font-size:10px; color:#94a3b8">Generado por CJ Expertos · Los precios son estimativos y no incluyen mano de obra ni herrajes.</p>
</body>
</html>`

  const win = window.open('', '_blank')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 400)
}

// ── Componente principal ───────────────────────────────────────
export default function CalculadorPage() {
  // Parámetros
  const [linea, setLinea]       = useState<Linea>('MODENA')
  const [tipologia, setTipologia] = useState('VC')
  const [anchoMm, setAnchoMm]   = useState('1500')
  const [altoMm, setAltoMm]     = useState('1200')
  const [dvh, setDvh]           = useState(false)
  const [tipoBorde, setTipoBorde] = useState<'recto' | 'curvo'>('recto')
  const [conTravesano, setConTravesano] = useState(false)
  // Precios
  const [precioKg, setPrecioKg] = useState('3500')
  const [precioM2, setPrecioM2] = useState('8000')
  // Guardar
  const [nombrePresup, setNombrePresup] = useState('Presupuesto')
  const [obraId, setObraId]     = useState('')
  const [saving, setSaving]     = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  // Resultado
  const [resultado, setResultado] = useState<ResultadoCalculo | null>(null)
  const [error, setError]         = useState('')
  const [tablaAbierta, setTablaAbierta] = useState(true)

  const supabase = createClient()

  const tipologiasFiltradas = TIPOLOGIAS.filter(t => t.lineas.includes(linea))

  const calcular = useCallback(() => {
    setError('')
    const A = parseInt(anchoMm)
    const H = parseInt(altoMm)
    if (isNaN(A) || A <= 0) { setError('Ancho inválido.'); return }
    if (isNaN(H) || H <= 0) { setError('Alto inválido.');  return }
    const params: ParametrosCalculo = { linea, tipologia, A, H, dvh, tipoBorde, conTravesano }
    const res = calcularAbertura(params)
    if (res.lista.length === 0) { setError('Esta combinación de línea/tipología no tiene perfiles definidos.'); return }
    setResultado(res)
    setTablaAbierta(true)
  }, [linea, tipologia, anchoMm, altoMm, dvh, tipoBorde, conTravesano])

  const guardarPresupuesto = useCallback(async () => {
    if (!resultado) return
    setSaving(true); setSavedMsg('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('No autenticado')
      const A = parseInt(anchoMm), H = parseInt(altoMm)
      const pk = parseFloat(precioKg) || 0, pm = parseFloat(precioM2) || 0
      const total = resultado.totalKgComprar * pk + resultado.vidrio.totalM2 * pm

      const payload = {
        carpintero_id:     user.id,
        obra_id:           obraId || null,
        nombre:            nombrePresup,
        parametros:        { linea, tipologia, A, H, dvh, tipoBorde, conTravesano } as ParametrosCalculo,
        resultado:         resultado,
        precio_kg_aluminio: pk,
        precio_m2_vidrio:   pm,
        total_estimado:     total,
      }

      const { error: e } = await supabase.from('presupuestos_calculados').insert(payload)
      if (e) throw new Error(e.message)
      setSavedMsg('Presupuesto guardado correctamente.')
    } catch (err) {
      setSavedMsg(err instanceof Error ? err.message : 'Error al guardar.')
    } finally {
      setSaving(false)
    }
  }, [resultado, supabase, anchoMm, altoMm, precioKg, precioM2, nombrePresup, obraId, linea, tipologia, dvh, tipoBorde, conTravesano])

  const costoAluminio = resultado ? resultado.totalKgComprar * (parseFloat(precioKg) || 0) : 0
  const costoVidrio   = resultado ? resultado.vidrio.totalM2 * (parseFloat(precioM2) || 0) : 0
  const totalEstimado = costoAluminio + costoVidrio

  return (
    <AppShell perfil={null} pageTitle="Calculador de Aberturas">
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-center gap-3 mb-1">
          <Calculator size={24} className="text-[var(--accent)]" />
          <h1 className="text-2xl font-black text-slate-800">Calculador de Aberturas</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Panel de parámetros */}
          <div className="lg:col-span-1 space-y-4">
            <Card header="Parámetros">
              <div className="space-y-3">
                <Select
                  label="Línea"
                  options={LINEAS.map(l => ({ value: l, label: l }))}
                  value={linea}
                  onChange={e => { setLinea(e.target.value as Linea); setTipologia(TIPOLOGIAS.filter(t => t.lineas.includes(e.target.value as Linea))[0]?.id ?? 'VC') }}
                />
                <Select
                  label="Tipología"
                  options={tipologiasFiltradas.map(t => ({ value: t.id, label: t.label }))}
                  value={tipologia}
                  onChange={e => setTipologia(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input label="Ancho (mm)" type="number" inputMode="numeric" min={100} max={9999} value={anchoMm} onChange={e => setAnchoMm(e.target.value)} className="text-center font-bold" />
                  <Input label="Alto (mm)" type="number" inputMode="numeric" min={100} max={9999} value={altoMm} onChange={e => setAltoMm(e.target.value)} className="text-center font-bold" />
                </div>

                <div className="flex items-center gap-2">
                  <input type="checkbox" id="dvh" checked={dvh} onChange={e => setDvh(e.target.checked)} className="w-4 h-4 rounded" />
                  <label htmlFor="dvh" className="text-sm font-semibold text-slate-700">DVH (doble vidriado hermético)</label>
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="travesano" checked={conTravesano} onChange={e => setConTravesano(e.target.checked)} className="w-4 h-4 rounded" />
                  <label htmlFor="travesano" className="text-sm font-semibold text-slate-700">Con travesaño</label>
                </div>
                <Select
                  label="Tipo de borde"
                  options={[{ value: 'recto', label: 'Recto' }, { value: 'curvo', label: 'Curvo' }]}
                  value={tipoBorde}
                  onChange={e => setTipoBorde(e.target.value as 'recto' | 'curvo')}
                />
              </div>
            </Card>

            <Card header="Precios unitarios">
              <div className="space-y-3">
                <Input label="Precio aluminio ($/kg)" type="number" inputMode="decimal" min={0} value={precioKg} onChange={e => setPrecioKg(e.target.value)} />
                <Input label="Precio vidrio ($/m²)" type="number" inputMode="decimal" min={0} value={precioM2} onChange={e => setPrecioM2(e.target.value)} />
              </div>
            </Card>

            {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-semibold">{error}</div>}

            <Button className="w-full" size="lg" onClick={calcular}>
              <Calculator size={18} /> Calcular
            </Button>
          </div>

          {/* Resultado */}
          <div className="lg:col-span-2 space-y-4">
            {!resultado ? (
              <Card>
                <div className="text-center py-16 text-slate-400">
                  <Calculator size={36} className="mx-auto mb-3 opacity-30" />
                  <p className="font-semibold">Completá los parámetros y presioná Calcular</p>
                </div>
              </Card>
            ) : (
              <>
                {/* Resumen kg + vidrio */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Kg a utilizar', value: `${fmt(resultado.totalKgUtilizar)} kg`, color: 'text-slate-800' },
                    { label: 'Kg a comprar',  value: `${fmt(resultado.totalKgComprar)} kg`,  color: 'text-[var(--primary)]' },
                    { label: 'Vidrio total',  value: `${fmt(resultado.vidrio.totalM2)} m²`, color: 'text-[var(--accent)]' },
                    { label: 'Kg depósito',   value: `${fmt(resultado.totalKgDeposito)} kg`, color: 'text-slate-400' },
                  ].map(s => (
                    <Card key={s.label} padding="sm">
                      <p className="text-xs text-slate-400 mb-1">{s.label}</p>
                      <p className={`text-lg font-black ${s.color}`}>{s.value}</p>
                    </Card>
                  ))}
                </div>

                {/* Tabla de perfiles */}
                <Card>
                  <button className="w-full flex items-center justify-between text-sm font-bold text-slate-700 pb-2 border-b border-slate-100"
                    onClick={() => setTablaAbierta(t => !t)}>
                    <span>Perfiles ({resultado.lista.length} tipos)</span>
                    {tablaAbierta ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {tablaAbierta && (
                    <div className="overflow-x-auto mt-2">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-slate-400 border-b border-slate-100">
                            <th className="py-2 text-left font-semibold">Perfil</th>
                            <th className="py-2 text-left font-semibold">Descripción</th>
                            <th className="py-2 text-right font-semibold">mm</th>
                            <th className="py-2 text-right font-semibold">Cant.</th>
                            <th className="py-2 text-right font-semibold">Corte</th>
                            <th className="py-2 text-right font-semibold">m util.</th>
                            <th className="py-2 text-right font-semibold">Barras</th>
                            <th className="py-2 text-right font-semibold">kg util.</th>
                            <th className="py-2 text-right font-semibold">kg comp.</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resultado.lista.map((p, i) => (
                            <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                              <td className="py-2 font-bold text-slate-700">{p.perfil}</td>
                              <td className="py-2 text-slate-600 max-w-40 truncate">{p.desc}</td>
                              <td className="py-2 text-right font-mono">{p.medidaMm ?? '—'}</td>
                              <td className="py-2 text-right">{p.cantidad}</td>
                              <td className="py-2 text-right text-slate-400">{p.corte}</td>
                              <td className="py-2 text-right font-mono">{fmt(p.metrosUtilizar)}</td>
                              <td className="py-2 text-right font-bold">{p.barras}</td>
                              <td className="py-2 text-right font-mono">{fmt(p.kgUtilizar)}</td>
                              <td className="py-2 text-right font-mono font-bold">{fmt(p.kgComprar)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="font-black text-slate-800 border-t-2 border-slate-200">
                            <td colSpan={7} className="py-2">TOTAL</td>
                            <td className="py-2 text-right">{fmt(resultado.totalKgUtilizar)}</td>
                            <td className="py-2 text-right">{fmt(resultado.totalKgComprar)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </Card>

                {/* Vidrio */}
                <Card header="Vidrio">
                  <div className="space-y-2">
                    {resultado.vidrio.paneles.map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-sm">
                        <span className="font-semibold text-slate-700">{p.nombre}</span>
                        <span className="font-mono text-slate-600">{p.ancho} × {p.alto} mm</span>
                        <Badge variant="info" size="sm">{((p.ancho * p.alto) / 1e6).toFixed(3)} m²</Badge>
                      </div>
                    ))}
                    <div className="flex justify-between pt-1 border-t border-slate-100 font-black text-slate-800">
                      <span>Total</span>
                      <span>{fmt(resultado.vidrio.totalM2)} m²</span>
                    </div>
                  </div>
                </Card>

                {/* Costo estimado */}
                {(parseFloat(precioKg) > 0 || parseFloat(precioM2) > 0) && (
                  <Card header="Costo estimado de materiales">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Aluminio ({fmt(resultado.totalKgComprar)} kg × {fmtMoney(parseFloat(precioKg))}/kg)</span>
                        <span className="font-bold">{fmtMoney(costoAluminio)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Vidrio ({fmt(resultado.vidrio.totalM2)} m² × {fmtMoney(parseFloat(precioM2))}/m²)</span>
                        <span className="font-bold">{fmtMoney(costoVidrio)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-200 font-black text-lg text-slate-800">
                        <span>Total materiales</span>
                        <span className="text-[var(--primary)]">{fmtMoney(totalEstimado)}</span>
                      </div>
                      <p className="text-xs text-slate-400">* No incluye mano de obra, herrajes ni imprevistos.</p>
                    </div>
                  </Card>
                )}

                {/* Guardar + exportar */}
                <Card header="Guardar presupuesto">
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input label="Nombre del presupuesto" placeholder="Ej: Ventanas depto García" value={nombrePresup} onChange={e => setNombrePresup(e.target.value)} />
                      <Input label="Vincular a obra (ID, opcional)" placeholder="ID de la obra" value={obraId} onChange={e => setObraId(e.target.value)} />
                    </div>
                    {savedMsg && (
                      <p className={`text-sm font-semibold ${savedMsg.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>{savedMsg}</p>
                    )}
                    <div className="flex gap-3">
                      <Button variant="outline" loading={saving} onClick={guardarPresupuesto} className="flex-1">
                        <Save size={15} /> Guardar
                      </Button>
                      <Button variant="secondary" onClick={() => {
                        const A = parseInt(anchoMm), H = parseInt(altoMm)
                        exportarPDF({ linea, tipologia, A, H, dvh, tipoBorde, conTravesano }, resultado!, nombrePresup, parseFloat(precioKg) || 0, parseFloat(precioM2) || 0)
                      }} className="flex-1">
                        <Download size={15} /> Exportar PDF
                      </Button>
                    </div>
                  </div>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
