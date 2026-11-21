import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('页面渲染失败', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="reader-state">
          <div className="state-card state-card--error">
            <h1>页面出错了</h1>
            <p>{this.state.error.message || '请刷新后重试。'}</p>
            <button type="button" className="btn btn--primary" onClick={() => window.location.reload()}>
              刷新页面
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
