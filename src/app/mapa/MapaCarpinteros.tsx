'use client'
import { useState, useMemo, useCallback } from 'react'
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api'
import { Search, Filter, MapPin, ShieldCheck } from 'lucide-react'
import RangoBadge from '@/components/RangoBadge'
import RangoIcon from '@/components/ui/RangoIcon'
import type { Perfil } from '@/types/perfil'

// Coordenadas aproximadas por ciudad argentina
const CIUDADES_COORDS: Record<string, { lat: number; lng: number }> = {
  'buenos aires':        { lat: -34.6037, lng: -58.3816 },
  'caba':                { lat: -34.6037, lng: -58.3816 },
  'capital federal':     { lat: -34.6037, lng: -58.3816 },
  'córdoba':             { lat: -31.4135, lng: -64.1810 },
  'cordoba':             { lat: -31.4135, lng: -64.1810 },
  'rosario':             { lat: -32.9468, lng: -60.6393 },
  'mendoza':             { lat: -32.8908, lng: -68.8272 },
  'la plata':            { lat: -34.9215, lng: -57.9545 },
  'tucumán':             { lat: -26.8083, lng: -65.2176 },
  'tucuman':             { lat: -26.8083, lng: -65.2176 },
  'mar del plata':       { lat: -38.0023, lng: -57.5575 },
  'salta':               { lat: -24.7859, lng: -65.4116 },
  'santa fe':            { lat: -31.6333, lng: -60.7000 },
  'san juan':            { lat: -31.5375, lng: -68.5364 },
  'resistencia':         { lat: -27.4513, lng: -58.9862 },
  'corrientes':          { lat: -27.4806, lng: -58.8341 },
  'posadas':             { lat: -27.3621, lng: -55.8969 },
  'neuquén':             { lat: -38.9516, lng: -68.0591 },
  'neuquen':             { lat: -38.9516, lng: -68.0591 },
  'bahía blanca':        { lat: -38.7183, lng: -62.2663 },
  'bahia blanca':        { lat: -38.7183, lng: -62.2663 },
  'formosa':             { lat: -26.1775, lng: -58.1781 },
  'san salvador':        { lat: -24.1858, lng: -65.2995 },
  'jujuy':               { lat: -24.1858, lng: -65.2995 },
  'catamarca':           { lat: -28.4696, lng: -65.7795 },
  'la rioja':            { lat: -29.4132, lng: -66.8560 },
  'san luis':            { lat: -33.2950, lng: -66.3356 },
  'río gallegos':        { lat: -51.6230, lng: -69.2168 },
  'rio gallegos':        { lat: -51.6230, lng: -69.2168 },
  'ushuaia':             { lat: -54.8019, lng: -68.3030 },
  'rawson':              { lat: -43.3002, lng: -65.1023 },
  'viedma':              { lat: -40.8135, lng: -62.9967 },
  'paraná':              { lat: -31.7333, lng: -60.5333 },
  'parana':              { lat: -31.7333, lng: -60.5333 },
  'santiago del estero': { lat: -27.7951, lng: -64.2615 },
}

function coordsPorCiudad(ciudad?: string | null): { lat: number; lng: number } | null {
  if (!ciudad) return null
  const key = ciudad.toLowerCase().trim()
  return CIUDADES_COORDS[key] ?? null
}

function jitter(coord: { lat: number; lng: number }, idx: number): { lat: number; lng: number } {
  const angle = (idx * 137.5 * Math.PI) / 180
  const r = 0.01 * Math.sqrt(idx % 8)
  return { lat: coord.lat + r * Math.sin(angle), lng: coord.lng + r * Math.cos(angle) }
}

const RANGOS_OPTS = [
  { value: '', label: 'Todos los rangos' },
  { value: 'estrella_1', label: 'Estrella 1' },
  { value: 'estrella_2', label: 'Estrella 2' },
  { value: 'estrella_3', label: 'Estrella 3' },
  { value: 'estrella_4', label: 'Estrella 4' },
  { value: 'estrella_5', label: 'Estrella 5' },
  { value: 'zafiro',     label: 'Zafiro' },
  { value: 'rubi',       label: 'Rubí' },
  { value: 'esmeralda',  label: 'Esmeralda' },
  { value: 'diamante',   label: 'Diamante' },
]

const MAP_CONTAINER_STYLE = { height: '100%', width: '100%' }
const DEFAULT_CENTER = { lat: -38.0, lng: -63.0 }
const DEFAULT_ZOOM = 5

interface Props {
  carpinteros: Perfil[]
}

export default function MapaCarpinteros({ carpinteros }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [rango, setRango] = useState('')
  const [soloVerificados, setSoloVerificados] = useState(false)
  const [panelAbierto, setPanelAbierto] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? '',
    id: 'cj-google-maps-script',
  })

  const onLoad = useCallback((_map: google.maps.Map) => {}, [])
  const onUnmount = useCallback(() => {}, [])

  const carpinterosFiltrados = useMemo(() => {
    return carpinteros.filter(c => {
      if (rango && c.rango !== rango) return false
      if (soloVerificados && !c.verificado) return false
      if (busqueda) {
        const q = busqueda.toLowerCase()
        if (!c.ciudad?.toLowerCase().includes(q) && !c.nombre?.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [carpinteros, rango, soloVerificados, busqueda])

  const conCoordenadas = useMemo(() =>
    carpinterosFiltrados
      .map((c, i) => {
        const base = coordsPorCiudad(c.ciudad)
        if (!base) return null
        return { carpintero: c, pos: jitter(base, i) }
      })
      .filter(Boolean) as { carpintero: Perfil; pos: { lat: number; lng: number } }[]
  , [carpinterosFiltrados])

  const selectedCarpintero = conCoordenadas.find(x => x.carpintero.id === selectedId)

  return (
    <div className="relative h-full w-full flex">
      {/* Panel de filtros */}
      <div className={`${panelAbierto ? 'w-72' : 'w-0'} shrink-0 transition-all duration-300 overflow-hidden bg-white border-r border-slate-200 flex flex-col z-10`}>
        <div className="p-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-[var(--accent)]" />
              <h3 className="font-bold text-sm text-slate-700">Filtros</h3>
            </div>
            <span className="text-xs text-slate-500 bg-[var(--surface)] px-2 py-0.5 rounded-full font-medium border border-slate-100">
              {conCoordenadas.length} en mapa
            </span>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Ciudad o nombre..."
                className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-slate-50"
              />
            </div>

            <select
              value={rango}
              onChange={e => setRango(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent)] bg-slate-50"
            >
              {RANGOS_OPTS.map(r => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>

            <label className="flex items-center gap-2 cursor-pointer select-none" onClick={() => setSoloVerificados(v => !v)}>
              <div className={`w-9 h-5 rounded-full transition-colors relative ${soloVerificados ? 'bg-[var(--primary)]' : 'bg-slate-200'}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${soloVerificados ? 'left-4' : 'left-0.5'}`} />
              </div>
              <span className="text-sm text-slate-600">Solo verificados</span>
            </label>
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {carpinterosFiltrados.length === 0 ? (
            <div className="text-center text-slate-400 text-sm p-6">
              <MapPin size={24} className="mx-auto mb-2 opacity-30" />
              <p>Sin resultados</p>
            </div>
          ) : (
            carpinterosFiltrados.map(c => (
              <a
                key={c.id}
                href={`/carpinteros/${c.id}`}
                className="flex items-start gap-3 p-3 hover:bg-[var(--surface)] transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-[var(--surface)] flex items-center justify-center shrink-0 text-sm font-black text-[var(--primary)] border border-[var(--accent-light)]">
                  {c.nombre[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{c.nombre}</p>
                    {c.verificado && <ShieldCheck size={11} className="text-[var(--accent)] shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    <RangoBadge rango={c.rango} />
                    {c.ciudad && (
                      <span className="text-xs text-slate-400 flex items-center gap-0.5">
                        <MapPin size={10} /> {c.ciudad}
                      </span>
                    )}
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      </div>

      {/* Botón toggle panel */}
      <button
        onClick={() => setPanelAbierto(v => !v)}
        className="absolute top-1/2 -translate-y-1/2 z-20 bg-white border border-slate-200 rounded-r-lg px-1 py-3 shadow-sm hover:bg-slate-50 transition-colors"
        style={{ left: panelAbierto ? '288px' : '0' }}
        title={panelAbierto ? 'Ocultar panel' : 'Mostrar panel'}
      >
        <span className="text-slate-400 text-xs">{panelAbierto ? '◀' : '▶'}</span>
      </button>

      {/* Mapa */}
      <div className="flex-1 h-full relative">
        {loadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
            <div className="text-center p-6">
              <MapPin size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 font-medium">No se pudo cargar el mapa</p>
              <p className="text-xs text-slate-400 mt-1">Verificá la clave de Google Maps</p>
            </div>
          </div>
        )}
        {!isLoaded && !loadError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500">Cargando mapa...</p>
            </div>
          </div>
        )}
        {isLoaded && (
          <GoogleMap
            mapContainerStyle={MAP_CONTAINER_STYLE}
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
              disableDefaultUI: false,
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
              styles: [
                { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
                { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
              ],
            }}
          >
            {conCoordenadas.map(({ carpintero: c, pos }) => (
              <MarkerF
                key={c.id}
                position={pos}
                onClick={() => setSelectedId(c.id)}
                title={c.nombre}
                icon={{
                  url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
                      <path d="M16 0C7.164 0 0 7.164 0 16c0 10 16 24 16 24s16-14 16-24C32 7.164 24.836 0 16 0z" fill="#2563EB"/>
                      <path d="M16 2C8.268 2 2 8.268 2 16c0 9.5 14 22 14 22s14-12.5 14-22C30 8.268 23.732 2 16 2z" fill="#3B82F6"/>
                      <circle cx="16" cy="16" r="8" fill="white"/>
                      <text x="16" y="20" text-anchor="middle" font-size="10" font-weight="bold" fill="#2563EB" font-family="Arial">CJ</text>
                    </svg>
                  `)}`,
                  scaledSize: new google.maps.Size(32, 40),
                  anchor: new google.maps.Point(16, 40),
                }}
              />
            ))}

            {selectedId && selectedCarpintero && (
              <InfoWindowF
                position={selectedCarpintero.pos}
                onCloseClick={() => setSelectedId(null)}
              >
                <div className="min-w-[180px] max-w-[220px]">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center shrink-0 text-xs font-black text-[var(--primary)]">
                      {selectedCarpintero.carpintero.nombre[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{selectedCarpintero.carpintero.nombre}</p>
                      {selectedCarpintero.carpintero.ciudad && (
                        <p className="text-xs text-slate-400">{selectedCarpintero.carpintero.ciudad}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <RangoIcon rango={selectedCarpintero.carpintero.rango} size="sm" />
                    <RangoBadge rango={selectedCarpintero.carpintero.rango} />
                  </div>
                  {selectedCarpintero.carpintero.verificado && (
                    <p className="text-xs text-[var(--primary)] font-semibold flex items-center gap-1 mb-2">
                      <ShieldCheck size={11} /> Verificado
                    </p>
                  )}
                  <a
                    href={`/carpinteros/${selectedCarpintero.carpintero.id}`}
                    className="block w-full text-center text-xs font-bold py-1.5 px-3 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-mid)] transition-colors"
                  >
                    Ver perfil →
                  </a>
                </div>
              </InfoWindowF>
            )}
          </GoogleMap>
        )}
      </div>
    </div>
  )
}
