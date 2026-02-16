import { h } from 'preact';

interface ControlPanelProps {
  speed: number;
  isPaused: boolean;
  onSpeedChange: (speed: number) => void;
  onPauseToggle: () => void;
  onSave: () => void;
  onExport: () => void;
}

const panelStyle: h.JSX.CSSProperties = {
  position: 'absolute',
  bottom: '10px',
  left: '50%',
  transform: 'translateX(-50%)',
  background: 'rgba(0, 0, 0, 0.7)',
  color: '#ffffff',
  padding: '8px 16px',
  borderRadius: '8px',
  fontFamily: 'monospace',
  fontSize: '13px',
  display: 'flex',
  gap: '8px',
  alignItems: 'center',
  pointerEvents: 'auto',
};

const btnStyle: h.JSX.CSSProperties = {
  background: '#444',
  color: '#fff',
  border: '1px solid #666',
  borderRadius: '4px',
  padding: '4px 10px',
  cursor: 'pointer',
  fontFamily: 'monospace',
  fontSize: '12px',
};

const activeBtnStyle: h.JSX.CSSProperties = {
  ...btnStyle,
  background: '#2980b9',
  borderColor: '#3498db',
};

export function ControlPanel(props: ControlPanelProps): h.JSX.Element {
  const { speed, isPaused, onSpeedChange, onPauseToggle, onSave, onExport } = props;

  const speeds = [1, 2, 5, 10];

  return h('div', { style: panelStyle },
    h('button', {
      style: isPaused ? activeBtnStyle : btnStyle,
      onClick: onPauseToggle,
    }, isPaused ? '▶ Play' : '⏸ Pause'),
    ...speeds.map(s =>
      h('button', {
        key: s,
        style: !isPaused && speed === s ? activeBtnStyle : btnStyle,
        onClick: () => onSpeedChange(s),
      }, `${s}x`),
    ),
    h('button', { style: btnStyle, onClick: onSave }, '💾 Save'),
    h('button', { style: btnStyle, onClick: onExport }, '📤 Export'),
  );
}
