import { h } from 'preact';

interface InspectorPanelProps {
  npcId: number | null;
  needs: { hunger: number; thirst: number; energy: number; warmth: number; safety: number; social: number } | null;
  emotions: { valence: number; arousal: number; mood: string } | null;
  inventory: Array<{ resourceType: string; quantity: number }>;
  relationships: Array<{ targetId: number; role: string; trust: number; affection: number }>;
  action: string;
  generation: number;
  onClose: () => void;
}

const panelStyle: h.JSX.CSSProperties = {
  position: 'absolute',
  top: '10px',
  right: '10px',
  width: '260px',
  maxHeight: 'calc(100vh - 20px)',
  overflowY: 'auto',
  background: 'rgba(0, 0, 0, 0.8)',
  color: '#ffffff',
  padding: '14px',
  borderRadius: '8px',
  fontFamily: 'monospace',
  fontSize: '12px',
  lineHeight: '1.5',
  pointerEvents: 'auto',
};

const barContainerStyle: h.JSX.CSSProperties = {
  background: '#333',
  borderRadius: '3px',
  height: '10px',
  marginTop: '2px',
  marginBottom: '6px',
  overflow: 'hidden',
};

function NeedBar({ label, value, color }: { label: string; value: number; color: string }) {
  return h('div', null,
    h('span', null, `${label}: ${(value * 100).toFixed(0)}%`),
    h('div', { style: barContainerStyle },
      h('div', {
        style: {
          width: `${Math.max(0, Math.min(100, value * 100))}%`,
          height: '100%',
          background: color,
          borderRadius: '3px',
          transition: 'width 0.3s',
        },
      }),
    ),
  );
}

export function InspectorPanel(props: InspectorPanelProps): h.JSX.Element | null {
  if (props.npcId === null) return null;

  const { npcId, needs, emotions, inventory, relationships, action, generation, onClose } = props;

  return h('div', { style: panelStyle },
    h('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' } },
      h('strong', null, `NPC #${npcId}`),
      h('button', {
        onClick: onClose,
        style: { background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '14px' },
      }, '✕'),
    ),
    h('div', null, `Gen: ${generation} | Action: ${action}`),

    needs
      ? h('div', { style: { marginTop: '10px' } },
          h('strong', null, 'Needs'),
          NeedBar({ label: 'Hunger', value: needs.hunger, color: '#e67e22' }),
          NeedBar({ label: 'Thirst', value: needs.thirst, color: '#3498db' }),
          NeedBar({ label: 'Energy', value: needs.energy, color: '#f1c40f' }),
          NeedBar({ label: 'Warmth', value: needs.warmth, color: '#e74c3c' }),
          NeedBar({ label: 'Safety', value: needs.safety, color: '#9b59b6' }),
          NeedBar({ label: 'Social', value: needs.social, color: '#1abc9c' }),
        )
      : null,

    emotions
      ? h('div', { style: { marginTop: '10px' } },
          h('strong', null, 'Emotions'),
          h('div', null, `Mood: ${emotions.mood}`),
          h('div', null, `Valence: ${emotions.valence.toFixed(2)} | Arousal: ${emotions.arousal.toFixed(2)}`),
        )
      : null,

    inventory.length > 0
      ? h('div', { style: { marginTop: '10px' } },
          h('strong', null, 'Inventory'),
          ...inventory.map(item =>
            h('div', { key: item.resourceType }, `${item.resourceType}: ${item.quantity}`),
          ),
        )
      : null,

    relationships.length > 0
      ? h('div', { style: { marginTop: '10px' } },
          h('strong', null, 'Relationships'),
          ...relationships.map(rel =>
            h('div', { key: rel.targetId },
              `#${rel.targetId} (${rel.role}) T:${rel.trust.toFixed(1)} A:${rel.affection.toFixed(1)}`),
          ),
        )
      : null,
  );
}
