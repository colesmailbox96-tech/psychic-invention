import { h } from 'preact';

const containerStyle: h.JSX.CSSProperties = {
  position: 'absolute',
  bottom: '60px',
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'rgba(0, 0, 0, 0.6)',
  color: '#aaa',
  padding: '8px 14px',
  borderRadius: '6px',
  fontFamily: 'monospace',
  fontSize: '11px',
  pointerEvents: 'auto',
};

export function MobileControls(): h.JSX.Element {
  return h('div', { style: containerStyle },
    h('div', null, 'Touch: Drag to pan | Pinch to zoom | Tap to select'),
  );
}
