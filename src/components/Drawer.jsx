import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'

export default function Drawer({ open, title, onClose, side = 'right', children, footer = null, wide = false }) {
  const panelRef = useRef(null)
  const restoreRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = event => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab' || !panelRef.current) return
      const nodes = panelRef.current.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      if (!nodes.length) return
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    restoreRef.current = document.activeElement
    document.addEventListener('keydown', onKeyDown)
    document.body.classList.add('drawer-open')
    const timer = window.setTimeout(() => {
      panelRef.current?.querySelector('button, input, select, a[href]')?.focus()
    }, 30)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.classList.remove('drawer-open')
      window.clearTimeout(timer)
      if (restoreRef.current instanceof HTMLElement) restoreRef.current.focus()
    }
  }, [open, onClose])

  if (!open) return null
  return createPortal(
    <div className="drawer-overlay" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <aside
        ref={panelRef}
        className={`drawer drawer--${side}${wide ? ' drawer--wide' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header className="drawer-head">
          <h2>{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="关闭">
            <Icon name="close" />
          </button>
        </header>
        <div className="drawer-body">{children}</div>
        {footer ? <footer className="drawer-foot">{footer}</footer> : null}
      </aside>
    </div>,
    document.body,
  )
}
