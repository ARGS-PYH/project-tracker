import React from 'react'
import { Link } from 'react-router-dom'

export default function Brand({ to = '/', className = '', onClick }) {
  return (
    <Link to={to} className={`v2-brand v2-brand-lockup ${className}`.trim()} onClick={onClick}>
      <img className="v2-brand-icon" src="/pltk-rocket-brand.svg?v=20261103" alt="" aria-hidden="true" />
      <span className="v2-brand-copy">
        <strong>PLTK</strong>
        <small>PRODUCT LAUNCH TRACKER</small>
      </span>
    </Link>
  )
}
