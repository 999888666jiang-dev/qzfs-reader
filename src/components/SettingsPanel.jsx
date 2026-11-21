import { FONTS, PAGE_WIDTHS, THEMES } from '../lib/settings'

export default function SettingsPanel({ settings, onChange, onReset }) {
  function set(key, value) {
    onChange({ [key]: value })
  }

  function reset() {
    if (window.confirm('恢复默认阅读设置？')) onReset()
  }

  return (
    <div className="settings-panel">
      <section className="setting-group">
        <div className="setting-title">
          <h3>阅读背景</h3>
          <span>{THEMES.find(item => item.id === settings.theme)?.label}</span>
        </div>
        <div className="theme-grid">
          {THEMES.map(theme => (
            <button
              key={theme.id}
              type="button"
              className={`theme-swatch${settings.theme === theme.id ? ' is-active' : ''}`}
              onClick={() => set('theme', theme.id)}
              aria-pressed={settings.theme === theme.id}
            >
              <span className="theme-dot" style={{ background: theme.dot }} />
              <span>{theme.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="setting-group">
        <div className="setting-title">
          <h3>字号</h3>
          <span>{settings.fontSize} px</span>
        </div>
        <input
          className="range"
          type="range"
          min="14"
          max="32"
          step="1"
          value={settings.fontSize}
          onChange={event => set('fontSize', Number(event.target.value))}
          aria-label="正文字号"
        />
        <div className="preset-row">
          {[16, 20, 24, 28].map(size => (
            <button
              key={size}
              type="button"
              className={`chip${settings.fontSize === size ? ' is-active' : ''}`}
              onClick={() => set('fontSize', size)}
            >
              {size}
            </button>
          ))}
        </div>
      </section>

      <section className="setting-group">
        <div className="setting-title">
          <h3>字体</h3>
        </div>
        <div className="segmented">
          {FONTS.map(font => (
            <button
              key={font.id}
              type="button"
              className={settings.fontFamily === font.id ? 'is-active' : ''}
              onClick={() => set('fontFamily', font.id)}
            >
              {font.label}
            </button>
          ))}
        </div>
      </section>

      <section className="setting-group">
        <div className="setting-title">
          <h3>行距</h3>
          <span>{settings.lineHeight.toFixed(2)}</span>
        </div>
        <input
          className="range"
          type="range"
          min="1.5"
          max="2.2"
          step="0.05"
          value={settings.lineHeight}
          onChange={event => set('lineHeight', Number(event.target.value))}
          aria-label="行距"
        />
      </section>

      <section className="setting-group">
        <div className="setting-title">
          <h3>段距</h3>
          <span>{settings.paragraphGap.toFixed(1)} em</span>
        </div>
        <input
          className="range"
          type="range"
          min="0"
          max="1.5"
          step="0.1"
          value={settings.paragraphGap}
          onChange={event => set('paragraphGap', Number(event.target.value))}
          aria-label="段距"
        />
      </section>

      <section className="setting-group">
        <div className="setting-title">
          <h3>页宽</h3>
        </div>
        <div className="segmented">
          {PAGE_WIDTHS.map(width => (
            <button
              key={width.id}
              type="button"
              className={settings.pageWidth === width.id ? 'is-active' : ''}
              onClick={() => set('pageWidth', width.id)}
            >
              {width.label}
            </button>
          ))}
        </div>
      </section>

      <section className="setting-group">
        <label className="toggle-row">
          <span>
            <strong>两端对齐</strong>
            <small>中文排版更整齐，移动端可关闭</small>
          </span>
          <input
            type="checkbox"
            checked={settings.justify}
            onChange={event => set('justify', event.target.checked)}
          />
        </label>
        <label className="toggle-row">
          <span>
            <strong>显示阅读进度</strong>
            <small>顶部细进度条</small>
          </span>
          <input
            type="checkbox"
            checked={settings.showProgress}
            onChange={event => set('showProgress', event.target.checked)}
          />
        </label>
      </section>

      <button type="button" className="btn btn--ghost btn--block" onClick={reset}>
        恢复默认设置
      </button>
    </div>
  )
}
