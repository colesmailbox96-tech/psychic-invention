import { h } from 'preact';

interface MemoryViewerProps {
  memories: Array<{ tick: number; type: string; emotionalValence: number; importance: number }>;
}

const containerStyle: h.JSX.CSSProperties = {
  marginTop: '10px',
};

export function MemoryViewer(props: MemoryViewerProps): h.JSX.Element | null {
  if (props.memories.length === 0) return null;

  const sorted = [...props.memories].sort((a, b) => b.importance - a.importance).slice(0, 10);

  return h('div', { style: containerStyle },
    h('strong', null, 'Memories'),
    ...sorted.map((mem, i) =>
      h('div', { key: i, style: { fontSize: '11px', color: mem.emotionalValence > 0.5 ? '#2ecc71' : '#e74c3c' } },
        `[${mem.type}] imp:${mem.importance.toFixed(2)} val:${mem.emotionalValence.toFixed(2)}`,
      ),
    ),
  );
}
