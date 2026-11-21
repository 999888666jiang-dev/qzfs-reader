import { useEffect, useState } from 'react'

function currentPath() {
  const raw = window.location.hash || '#/'
  return raw.startsWith('#') ? raw.slice(1) : raw
}

// M0 空壳：只验证构建、hash 路由骨架（R-14）与首屏主题脚本，不接真实数据。
export default function App() {
  const [path, setPath] = useState(currentPath)

  useEffect(() => {
    const onChange = () => setPath(currentPath())
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return (
    <main className="shell">
      <h1>全职法师 · 阅读站</h1>
      <p>
        当前路由：<code>{path || '/'}</code>
      </p>
      <p className="shell-note">
        M0 工程基线（T-01）。语料在 M1 生成，页面与目录在 M2 接入。
      </p>
    </main>
  )
}
