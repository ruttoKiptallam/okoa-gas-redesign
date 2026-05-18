import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return React.createElement('div', { style: { padding: '2rem', fontFamily: 'sans-serif' } },
        React.createElement('h1', null, 'Something went wrong'),
        React.createElement('p', null, this.state.error?.message || 'Unknown error'),
        React.createElement('pre', { style: { background: '#f5f5f5', padding: '1rem' } }, this.state.error?.stack)
      );
    }
    return this.props.children;
  }
}

window.onerror = (message, source, lineno, colno, error) => {
  console.error('Global error:', message, error);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  React.createElement(React.StrictMode, null,
    React.createElement(ErrorBoundary, null,
      React.createElement(App)
    )
  )
);