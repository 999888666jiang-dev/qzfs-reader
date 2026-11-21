export default function NotFoundPage() {
  return (
    <div className="page">
      <header className="page-top">
        <a href="#/" className="icon-button" aria-label="返回首页">←</a>
        <h1>页面不存在</h1>
        <span />
      </header>
      <main className="page-main page-main--narrow">
        <div className="state-card">
          <h2>404</h2>
          <p>这个地址没有对应的页面。</p>
          <a className="btn btn--primary" href="#/">返回首页</a>
        </div>
      </main>
    </div>
  )
}
