import { h } from 'preact';

interface WorldStatsProps {
  population: number;
  births: number;
  deaths: number;
  averageHappiness: number;
  tick: number;
}

const statsStyle: h.JSX.CSSProperties = {
  position: 'absolute',
  top: '10px',
  left: '220px',
  background: 'rgba(0, 0, 0, 0.7)',
  color: '#ffffff',
  padding: '10px 14px',
  borderRadius: '8px',
  fontFamily: 'monospace',
  fontSize: '12px',
  lineHeight: '1.6',
  pointerEvents: 'auto',
};

export function WorldStats(props: WorldStatsProps): h.JSX.Element {
  const { population, births, deaths, averageHappiness, tick } = props;
  const happinessBar = '█'.repeat(Math.round(averageHappiness * 10)) +
                       '░'.repeat(10 - Math.round(averageHappiness * 10));

  return h('div', { style: statsStyle },
    h('div', null, `Tick: ${tick}`),
    h('div', null, `Population: ${population}`),
    h('div', null, `Births: ${births} | Deaths: ${deaths}`),
    h('div', null, `Happiness: [${happinessBar}] ${(averageHappiness * 100).toFixed(0)}%`),
  );
}
