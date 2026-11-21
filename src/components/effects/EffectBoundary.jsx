import { Component } from 'react'

export default class EffectBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { failed: false }
  }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error, info) {
    console.warn('动效初始化失败，已回退静态版', error, info)
  }

  render() {
    if (this.state.failed) return this.props.fallback || null
    return this.props.children
  }
}
