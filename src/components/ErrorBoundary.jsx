import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{padding:'24px',background:'#FEF2F2',minHeight:'100dvh',display:'flex',flexDirection:'column',gap:'12px'}}>
          <h2 style={{color:'#DC2626',fontSize:'16px',fontWeight:700}}>Error al cargar el perfil</h2>
          <p style={{color:'#991B1B',fontSize:'13px',fontFamily:'monospace',background:'white',padding:'12px',borderRadius:'8px',whiteSpace:'pre-wrap'}}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack?.split('\n').slice(0,5).join('\n')}
          </p>
          <button onClick={() => window.history.back()} 
            style={{padding:'10px 20px',background:'#DC2626',color:'white',border:'none',borderRadius:'12px',fontSize:'14px'}}>
            Volver
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
