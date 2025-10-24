import { useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, TileLayer, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png'
import markerIconUrl from 'leaflet/dist/images/marker-icon.png'
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'
import './App.css'

// Ensure Leaflet markers load correctly when bundled by Vite.
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2xUrl,
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
})

const CITY_DATA = [
  {
    id: 'new-york',
    name: 'New York, USA',
    lat: 40.7128,
    lng: -74.006,
    timezone: 'America/New_York',
    region: 'North America',
  },
  {
    id: 'london',
    name: 'London, United Kingdom',
    lat: 51.5074,
    lng: -0.1278,
    timezone: 'Europe/London',
    region: 'Europe',
  },
  {
    id: 'tokyo',
    name: 'Tokyo, Japan',
    lat: 35.6895,
    lng: 139.6917,
    timezone: 'Asia/Tokyo',
    region: 'Asia',
  },
  {
    id: 'sydney',
    name: 'Sydney, Australia',
    lat: -33.8688,
    lng: 151.2093,
    timezone: 'Australia/Sydney',
    region: 'Oceania',
  },
  {
    id: 'los-angeles',
    name: 'Los Angeles, USA',
    lat: 34.0522,
    lng: -118.2437,
    timezone: 'America/Los_Angeles',
    region: 'North America',
  },
  {
    id: 'cape-town',
    name: 'Cape Town, South Africa',
    lat: -33.9249,
    lng: 18.4241,
    timezone: 'Africa/Johannesburg',
    region: 'Africa',
  },
  {
    id: 'rio',
    name: 'Rio de Janeiro, Brazil',
    lat: -22.9068,
    lng: -43.1729,
    timezone: 'America/Sao_Paulo',
    region: 'South America',
  },
  {
    id: 'dubai',
    name: 'Dubai, UAE',
    lat: 25.2048,
    lng: 55.2708,
    timezone: 'Asia/Dubai',
    region: 'Middle East',
  },
]

const CITY_BY_ID = CITY_DATA.reduce((acc, city) => {
  acc.set(city.id, city)
  return acc
}, new Map())

const INITIAL_VIEW = { center: [20, 0], zoom: 2 }

function App() {
  // Track the current reference time so every clock updates simultaneously.
  const [now, setNow] = useState(() => new Date())
  const [selectedCityIds, setSelectedCityIds] = useState(() =>
    CITY_DATA.slice(0, 4).map((city) => city.id),
  )
  const [use24HourClock, setUse24HourClock] = useState(false)

  // Re-compute the "now" timestamp every second for live updates.
  useEffect(() => {
    const timerId = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timerId)
  }, [])

  const selectedCities = useMemo(
    () => selectedCityIds.map((id) => CITY_BY_ID.get(id)).filter(Boolean),
    [selectedCityIds],
  )

  // Cache Intl formatters by timezone so we only pay their construction cost when the
  // user toggles between 12-hour and 24-hour modes.
  const timeFormatters = useMemo(() => {
    const maps = new Map()
    CITY_DATA.forEach(({ timezone }) => {
      if (!maps.has(timezone)) {
        maps.set(
          timezone,
          new Intl.DateTimeFormat(undefined, {
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: !use24HourClock,
            timeZone: timezone,
          }),
        )
      }
    })
    return maps
  }, [use24HourClock])

  // Date formatters do not depend on the clock mode, so they are created once.
  const dateFormatters = useMemo(() => {
    const maps = new Map()
    CITY_DATA.forEach(({ timezone }) => {
      if (!maps.has(timezone)) {
        maps.set(
          timezone,
          new Intl.DateTimeFormat(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            timeZone: timezone,
          }),
        )
      }
    })
    return maps
  }, [])

  // Only append a city when it is not already tracked.
  const handleMarkerSelect = (cityId) => {
    setSelectedCityIds((prev) => (prev.includes(cityId) ? prev : [...prev, cityId]))
  }

  const handleRemove = (cityId) => {
    setSelectedCityIds((prev) => prev.filter((id) => id !== cityId))
  }

  const toggleClockFormat = () => {
    setUse24HourClock((prev) => !prev)
  }

  return (
    <div className="app-shell">
      <header className="intro">
        <div>
          <h1>World Clock Map</h1>
          <p>
            Click any marker to pin a city&apos;s local time below. Remove cities to tidy up the
            list, then tap a marker again to restore them.
          </p>
        </div>
        <button type="button" className="format-toggle" onClick={toggleClockFormat}>
          Switch to {use24HourClock ? '12-hour' : '24-hour'} format
        </button>
      </header>

      <section className="map-panel">
        <h2 className="section-title">Explore the map</h2>
        <MapContainer className="map" center={INITIAL_VIEW.center} zoom={INITIAL_VIEW.zoom}>
          <TileLayer
            attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {CITY_DATA.map((city) => (
            <Marker
              key={city.id}
              position={[city.lat, city.lng]}
              eventHandlers={{
                click: () => handleMarkerSelect(city.id),
              }}
            >
              <Tooltip direction="top" offset={[0, -18]} opacity={0.9} permanent={false}>
                <span>
                  {city.name}
                  <br />
                  {city.timezone}
                </span>
              </Tooltip>
            </Marker>
          ))}
        </MapContainer>
      </section>

      <section className="list-panel">
        <header className="list-header">
          <h2 className="section-title">World Clock List</h2>
          <p>{selectedCities.length} city{selectedCities.length === 1 ? '' : 'ies'} tracked</p>
        </header>

        {selectedCities.length === 0 ? (
          <div className="empty-state">
            <p>No cities yet. Select a marker to add its clock.</p>
          </div>
        ) : (
          <ul className="clock-list" aria-live="polite">
            {selectedCities.map((city) => {
              const timeFormatter = timeFormatters.get(city.timezone)
              const dateFormatter = dateFormatters.get(city.timezone)
              const timeText = timeFormatter?.format(now) ?? 'Time unavailable'
              const dateText = dateFormatter?.format(now) ?? 'Date unavailable'

              return (
                <li key={city.id} className="clock-card">
                  <div className="clock-card__heading">
                    <div>
                      <h3>{city.name}</h3>
                      <p className="clock-card__timezone">{city.timezone}</p>
                    </div>
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => handleRemove(city.id)}
                      aria-label={`Remove ${city.name} from the world clock list`}
                    >
                      Remove
                    </button>
                  </div>
                  <dl className="clock-card__details">
                    <div>
                      <dt>Local time</dt>
                      <dd>{timeText}</dd>
                    </div>
                    <div>
                      <dt>Date</dt>
                      <dd>{dateText}</dd>
                    </div>
                    <div>
                      <dt>Region</dt>
                      <dd>{city.region}</dd>
                    </div>
                  </dl>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

export default App
