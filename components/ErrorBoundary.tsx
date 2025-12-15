import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    private handleReload = () => {
        window.location.reload();
    };

    private handleReset = () => {
        localStorage.clear();
        window.location.reload();
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6 font-sans">
                    <div className="bg-white p-8 rounded-lg shadow-xl border border-red-100 max-w-2xl w-full">
                        <div className="flex items-center space-x-4 mb-6">
                            <div className="p-3 bg-red-50 rounded-full">
                                <AlertTriangle className="h-8 w-8 text-red-600" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Application Error</h1>
                                <p className="text-sm text-gray-500">The application encountered a critical error and cannot display this page.</p>
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-md p-4 mb-6 overflow-x-auto">
                            <code className="text-red-400 font-mono text-sm block mb-2">
                                {this.state.error && this.state.error.toString()}
                            </code>
                            <code className="text-gray-500 font-mono text-xs block whitespace-pre-wrap">
                                {this.state.errorInfo && this.state.errorInfo.componentStack}
                            </code>
                        </div>

                        <div className="flex space-x-4">
                            <button
                                onClick={this.handleReload}
                                className="flex items-center justify-center px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-md font-medium transition-colors"
                            >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Reload Page
                            </button>
                            <button
                                onClick={this.handleReset}
                                className="flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors"
                            >
                                Reset Data & Reload
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-4 text-center">
                            Invoking "Reset Data" will clear local storage, which often resolves data corruption issues.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
