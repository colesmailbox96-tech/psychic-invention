import { h } from 'preact';

interface BrainVisualizerProps {
  actionProbs: number[];
  actionNames: string[];
  currentAction: string;
  hiddenState: number[];
}

const containerStyle: h.JSX.CSSProperties = {
  marginTop: '10px',
};

const barBg: h.JSX.CSSProperties = {
  background: '#333',
  borderRadius: '2px',
  height: '8px',
  marginTop: '1px',
  marginBottom: '3px',
  overflow: 'hidden',
};

export function BrainVisualizer(props: BrainVisualizerProps): h.JSX.Element | null {
  if (props.actionProbs.length === 0) return null;

  const maxProb = Math.max(...props.actionProbs, 0.01);

  return h('div', { style: containerStyle },
    h('strong', null, `Brain — ${props.currentAction}`),
    ...props.actionNames.map((name, i) => {
      const prob = props.actionProbs[i] ?? 0;
      const isCurrent = name === props.currentAction;
      return h('div', { key: name },
        h('span', { style: { fontSize: '10px', color: isCurrent ? '#2ecc71' : '#999' } },
          `${name}: ${(prob * 100).toFixed(1)}%`,
        ),
        h('div', { style: barBg },
          h('div', {
            style: {
              width: `${(prob / maxProb) * 100}%`,
              height: '100%',
              background: isCurrent ? '#2ecc71' : '#3498db',
              borderRadius: '2px',
            },
          }),
        ),
      );
    }),
    h('div', { style: { fontSize: '10px', color: '#666', marginTop: '4px' } },
      `Hidden state: [${props.hiddenState.slice(0, 6).map(v => v.toFixed(2)).join(', ')}…]`,
    ),
  );
}
