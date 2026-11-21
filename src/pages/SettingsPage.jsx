import { useSettings } from '../hooks/useSettings'
import SettingsPanel from '../components/SettingsPanel'
import Icon from '../components/Icon'

export default function SettingsPage() {
  const { settings, update, reset } = useSettings()

  return (
    <div className="page">
      <header className="page-top">
        <a href="#/" className="icon-button" aria-label="返回首页"><Icon name="left" /></a>
        <h1>阅读设置</h1>
        <a href="#/shelf" className="icon-button" aria-label="书架"><Icon name="bookmarks" /></a>
      </header>

      <main className="page-main page-main--narrow">
        <p className="muted">
          设置会立即生效，并保存在本机。阅读页的设置抽屉与此处使用同一份数据。
        </p>
        <SettingsPanel settings={settings} onChange={update} onReset={reset} />
        <div className="settings-links">
          <a href="#/shelf">数据管理（导出/导入/清空）<Icon name="right" size={16} /></a>
          <a href="#/about">关于文本与缺失说明<Icon name="right" size={16} /></a>
        </div>
      </main>
    </div>
  )
}
