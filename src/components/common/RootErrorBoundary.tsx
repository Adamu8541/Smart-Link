import { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class RootErrorBoundary extends Component<Props, State> {
  // @ts-ignore
  public props!: Props;
  // @ts-ignore
  public state: State = {
    hasError: false,
    error: null,
  };

  constructor(props: Props) {
    super(props);
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[RootErrorBoundary] Uncaught application runtime error:", error, errorInfo);
    
    const isChunkError = error.message && (
      error.message.includes("Failed to fetch dynamically imported module") ||
      error.message.includes("Importing a module script failed") ||
      error.message.includes("Loading chunk")
    );

    if (isChunkError && !sessionStorage.getItem("smartlink_chunk_retry")) {
      sessionStorage.setItem("smartlink_chunk_retry", "true");
      window.location.reload();
    }
  }

  handleReload = () => {
    sessionStorage.removeItem("smartlink_chunk_retry");
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl border border-[#E5E7EB] shadow-xl p-6 sm:p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-600">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-[#111827]">Application Reload Needed</h2>
              <p className="text-xs text-[#4B5563] leading-relaxed">
                SmartLink NG was updated or encountered a temporary connection glitch. Reloading will refresh the latest portal assets.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-left overflow-auto max-h-28">
                <p className="text-[11px] font-mono text-gray-700 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="w-full py-3 bg-[#0F2D5C] hover:bg-[#111827] text-white font-bold rounded-xl text-xs transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              Reload Portal Now
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
