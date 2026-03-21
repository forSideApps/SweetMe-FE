import { useState } from 'react'

export default function ThemeLogo({ logoUrl, slug, size = 20 }) {
  const [failed, setFailed] = useState(false)

  const src = logoUrl || (slug ? `/logos/${slug}.png` : null)

  if (!src || failed) return <span style={{ fontSize: size, lineHeight: 1 }}>💜</span>

  return (
    <img
      src={src}
      alt={slug}
      className="theme-logo"
      style={{ height: size, width: 'auto' }}
      onError={() => setFailed(true)}
    />
  )
}
