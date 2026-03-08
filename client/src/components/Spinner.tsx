export default function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        border: `3px solid var(--border)`,
        borderTopColor: 'var(--neon-blue)',
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite',
        display: 'inline-block',
      }}
    />
  )
}

// Inject spin keyframe once
if (typeof document !== 'undefined' && !document.getElementById('spinner-style')) {
  const style = document.createElement('style')
  style.id = 'spinner-style'
  style.textContent = '@keyframes spin { to { transform: rotate(360deg); } }'
  document.head.appendChild(style)
}
