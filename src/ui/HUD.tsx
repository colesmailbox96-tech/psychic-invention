import { h } from 'preact';

interface HUDProps {
  tick: number;
  hour: number;
  day: number;
  season: string;
  year: number;
  population: number;
  weather: string;
  speed: number;
  selectedNPC: { id: number; name: string; mood: string; action: string } | null;
}

const containerStyle: h.JSX.CSSProperties = {
  position: 'absolute',
  top: '10px',
  left: '10px',
  background: 'rgba(0, 0, 0, 0.7)',
  color: '#ffffff',
  padding: '12px 16px',
  borderRadius: '8px',
  fontFamily: 'monospace',
  fontSize: '13px',
  lineHeight: '1.6',
  minWidth: '180px',
  pointerEvents: 'auto',
};

export function HUD(props: HUDProps): h.JSX.Element {
  const { hour, day, season, year, population, weather, speed, selectedNPC } = props;

  return h('div', { style: containerStyle },
    h('div', null, `Day ${day + 1} | ${String(hour).padStart(2, '0')}:00`),
    h('div', null, `${season} — Year ${year + 1}`),
    h('div', null, `Pop: ${population} | ${weather}`),
    h('div', null, `Speed: ${speed}x`),
    selectedNPC
      ? h('div', { style: { marginTop: '8px', borderTop: '1px solid #555', paddingTop: '6px' } },
          h('div', null, `NPC #${selectedNPC.id}: ${selectedNPC.name}`),
          h('div', null, `Mood: ${selectedNPC.mood}`),
          h('div', null, `Action: ${selectedNPC.action}`),
        )
      : null,
  );
}
