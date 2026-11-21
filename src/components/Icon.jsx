const paths = {
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6L6 18',
  search: 'M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm6.5-2.5L22 21',
  bookmark: 'M6 4h12v17l-6-4-6 4V4Z',
  settings: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8-3.5c0-.4 0-.8-.1-1.2l2-1.5-2-3.4-2.4 1a8 8 0 0 0-2-1.2L15 3h-4l-.4 2.7a8 8 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.5a8.6 8.6 0 0 0 0 2.4l-2 1.5 2 3.4 2.4-1a8 8 0 0 0 2 1.2L11 21h4l.4-2.7a8 8 0 0 0 2-1.2l2.4 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z',
  list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  book: 'M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Zm0 0V21.5',
  home: 'M3 11.5 12 4l9 7.5M5 10v10h14V10',
  left: 'M15 18l-6-6 6-6',
  right: 'M9 6l6 6-6 6',
  down: 'M6 9l6 6 6-6',
  download: 'M12 4v11m0 0 4-4m-4 4-4-4M4 20h16',
  upload: 'M12 20V9m0 0 4 4m-4-4-4 4M4 4h16',
  trash: 'M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13',
  check: 'M4 12l5 5L20 6',
  bookmarks: 'M8 4h9v17l-4.5-3L8 21V4ZM4 7v14l3-2',
}

export default function Icon({ name, size = 20, className = '', filled = false }) {
  const d = paths[name]
  if (!d) return null
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  )
}
