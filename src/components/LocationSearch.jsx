import React, { useEffect, useState } from 'react';
import { Combobox, useCombobox, InputBase, ActionIcon, Loader } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';

console.log('🏌️‍♂️ LocationSearch component loaded');

// Tiny inline SVG icons (no extra deps)
const IconCurrentLocation = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="3" fill="currentColor" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
  </svg>
);
const IconX = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

function LocationSearch({ onLocationSelect }) {
  // Query text in the input
  const [query, setQuery] = useState('');
  // Debounced query so we don’t spam the API while typing
  const [debounced] = useDebouncedValue(query, 350);
  // Place suggestion results
  const [results, setResults] = useState([]); // [{ display_name, lat, lon }]
  // Loading states
  const [searching, setSearching] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  // Combobox store
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
  });

  // Fetch suggestions from OpenStreetMap Nominatim
  useEffect(() => {
    let active = true;

    async function fetchPlaces() {
      if (!debounced || debounced.length < 3) {
        if (active) setResults([]);
        return;
      }
      try {
        setSearching(true);
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(debounced)}`;
        const res = await fetch(url);

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        if (active) setResults(Array.isArray(data) ? data : []);
      } catch (e) {
        if (active) setResults([]);
        console.error('Place search error:', e);
      } finally {
        if (active) setSearching(false);
      }
    }

    fetchPlaces();
    return () => {
      active = false;
    };
  }, [debounced]);

  // When a suggestion is chosen
  function handleOptionSubmit(indexStr) {
    const idx = Number(indexStr);
    const sel = results[idx];
    if (!sel) return;
    const location = {
      lat: Number(sel.lat),
      lng: Number(sel.lon),
      name: sel.display_name,
    };
    setQuery(sel.display_name);
    onLocationSelect(location);
    combobox.closeDropdown();
  }

  // Clickable icon to use browser geolocation
  function handleUseMyLocation() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          name: 'My Location',
        };
        setQuery('My Location');
        onLocationSelect(location);
        setGeoLoading(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        alert('Unable to retrieve your location.');
        setGeoLoading(false);
      }
    );
  }

  // Clear the input and selection
  function handleClear() {
    setQuery('');
    setResults([]);
    onLocationSelect(null);
    combobox.closeDropdown();
  }

  return (
    <Combobox store={combobox} onOptionSubmit={handleOptionSubmit} withinPortal={false}>
      <Combobox.Target>
        <InputBase
          value={query}
          onChange={(e) => {
            setQuery(e.currentTarget.value);
            combobox.openDropdown();
          }}
          onFocus={() => combobox.openDropdown()}
          onBlur={() => combobox.closeDropdown()}
          placeholder="Sort by location"
          radius="xl"
          style={{ minWidth: 300 }}
          rightSection={
            (searching || geoLoading) ? (
              <Loader size="xs" color="var(--header-green)" />
            ) : query ? (
              <ActionIcon
                variant="subtle"
                aria-label="Clear"
                title="Clear"
                onClick={handleClear}
                style={{ color: 'var(--header-green)' }}
              >
                <IconX size={16} />
              </ActionIcon>
            ) : (
              <ActionIcon
                variant="subtle"
                aria-label="Use my location"
                title="Use my location"
                onClick={handleUseMyLocation}
                style={{ color: 'var(--header-green)' }}
              >
                <IconCurrentLocation size={16} />
              </ActionIcon>
            )
          }
        />
      </Combobox.Target>

      <Combobox.Dropdown>
        <Combobox.Options>
          {searching && <Combobox.Empty>Searching…</Combobox.Empty>}
          {!searching && results.length === 0 && query.length >= 3 && (
            <Combobox.Empty>No results</Combobox.Empty>
          )}
          {!searching &&
            results.map((r, i) => (
              <Combobox.Option value={String(i)} key={`${r.place_id || i}`}>
                {r.display_name}
              </Combobox.Option>
            ))}
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  );
}

export default LocationSearch;
