import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * App-wide crash guard: a render error anywhere shows a branded recovery
 * screen instead of a white screen. Error boundaries must be class
 * components, so the language is read straight from storage.
 */
class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('Unhandled render error:', error, info.componentStack);
  }

  private handleReload = (): void => {
    this.setState({ hasError: false });
    window.location.hash = '#/';
    window.location.reload();
  };

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;

    const ar = localStorage.getItem('academy-lang') === 'ar';

    return (
      <div
        dir={ar ? 'rtl' : 'ltr'}
        className="min-h-screen bg-[#0d1117] flex items-center justify-center px-6"
      >
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle size={28} className="text-red-400" />
          </div>
          <h1 className="text-xl font-black text-[#f3f6ff] mb-2">
            {ar ? 'حدث خطأ غير متوقع' : 'Something went wrong'}
          </h1>
          <p className="text-sm text-[#9aa5bf] mb-7 leading-relaxed">
            {ar
              ? 'واجهت الصفحة خطأ غير متوقع. تقدمك محفوظ — إعادة التحميل ستعيدك إلى بر الأمان.'
              : 'The page hit an unexpected error. Your progress is saved — reloading will take you back to safety.'}
          </p>
          <button
            onClick={this.handleReload}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00a859] text-white text-sm font-bold hover:bg-[#007a42] transition-colors"
          >
            <RotateCcw size={15} />
            {ar ? 'إعادة التحميل' : 'Reload the app'}
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
