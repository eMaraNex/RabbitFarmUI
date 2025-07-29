"use client";

import { Component, ReactNode, ErrorInfo } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.log('Error caught by boundary:', error, errorInfo);
    }

    render(): ReactNode {
        if (this.state.hasError) {
            return <h2>Something went wrong. Please refresh the page.</h2>;
        }

        return this.props.children;
    }
}

export default ErrorBoundary;