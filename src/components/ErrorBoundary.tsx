import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode; resetKey?: string };
type State = { hasError: boolean; resetKey?: string };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, resetKey: this.props.resetKey };

  static getDerivedStateFromError(): Partial<State> {
    return { hasError: true };
  }

  static getDerivedStateFromProps(props: Props, state: State): Partial<State> | null {
    if (props.resetKey !== state.resetKey) {
      return { hasError: false, resetKey: props.resetKey };
    }
    return null;
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Apps Studio render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center px-6 py-16 text-center">
          <p className="font-display text-lg font-extrabold text-fg">
            Something went wrong
          </p>
          <p className="mt-2 max-w-sm text-sm text-mute">
            The page failed to load. Try again.
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="mt-5 rounded-xl bg-accent px-5 py-2.5 text-sm font-extrabold text-ink"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
