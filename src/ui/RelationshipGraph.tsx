import { h } from 'preact';

interface RelationshipGraphProps {
  relationships: Array<{ targetId: number; role: string; trust: number; affection: number }>;
}

const containerStyle: h.JSX.CSSProperties = {
  marginTop: '10px',
};

function getRoleColor(role: string): string {
  switch (role) {
    case 'partner': return '#e74c3c';
    case 'friend': return '#2ecc71';
    case 'acquaintance': return '#f1c40f';
    case 'rival': return '#e67e22';
    case 'enemy': return '#c0392b';
    default: return '#95a5a6';
  }
}

export function RelationshipGraph(props: RelationshipGraphProps): h.JSX.Element | null {
  if (props.relationships.length === 0) return null;

  return h('div', { style: containerStyle },
    h('strong', null, 'Relationships'),
    ...props.relationships.slice(0, 8).map(rel =>
      h('div', {
        key: rel.targetId,
        style: { fontSize: '11px', color: getRoleColor(rel.role) },
      }, `#${rel.targetId} ${rel.role} T:${rel.trust.toFixed(2)} A:${rel.affection.toFixed(2)}`),
    ),
  );
}
