import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Здесь можно отправить ошибку в систему мониторинга (Sentry и т.д.)
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.content}>
            <div style={styles.emoji}>😔</div>
            <h1 style={styles.title}>Что-то пошло не так</h1>
            <p style={styles.message}>
              Произошла непредвиденная ошибка. Попробуйте перезагрузить страницу.
            </p>
            <div style={styles.buttons}>
              <button style={styles.primaryButton} onClick={this.handleReload}>
                Перезагрузить
              </button>
              <button style={styles.secondaryButton} onClick={this.handleGoHome}>
                На главную
              </button>
            </div>
            {import.meta.env.DEV && this.state.error && (
              <details style={styles.details}>
                <summary style={styles.summary}>Детали ошибки</summary>
                <pre style={styles.errorText}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    background: 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
    fontFamily: 'Inter, -apple-system, sans-serif',
  },
  content: {
    textAlign: 'center',
    maxWidth: '400px',
  },
  emoji: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: '12px',
  },
  message: {
    fontSize: '16px',
    color: '#64748B',
    marginBottom: '24px',
    lineHeight: '1.5',
  },
  buttons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  primaryButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    background: 'linear-gradient(135deg, #4A90E2 0%, #357ABD 100%)',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  secondaryButton: {
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#64748B',
    background: '#fff',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  details: {
    marginTop: '24px',
    textAlign: 'left',
  },
  summary: {
    cursor: 'pointer',
    color: '#64748B',
    fontSize: '14px',
  },
  errorText: {
    marginTop: '12px',
    padding: '12px',
    background: '#FEE2E2',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#991B1B',
    overflow: 'auto',
    maxHeight: '200px',
  },
};

export default ErrorBoundary;
