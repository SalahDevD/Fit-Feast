import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg max-w-md">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Oops! Une erreur s'est produite</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              Nous nous excusons pour le désagrément. Veuillez rafraîchir la page ou réessayer.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-dark transition"
            >
              Rafraîchir la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
