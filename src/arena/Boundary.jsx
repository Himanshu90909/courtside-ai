import React from 'react';
// A bug in one page must not blank the whole app.
export default class Boundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidUpdate(prev) { if (prev.resetKey !== this.props.resetKey && this.state.err) this.setState({ err: null }); }
  render() {
    if (!this.state.err) return this.props.children;
    return (<div className="errbox" role="alert"><b>This page hit an unexpected error.</b><p className="mute small">{String(this.state.err.message || this.state.err).slice(0, 160)}</p><button className="btn sm" onClick={() => this.setState({ err: null })}>Try again</button></div>);
  }
}
