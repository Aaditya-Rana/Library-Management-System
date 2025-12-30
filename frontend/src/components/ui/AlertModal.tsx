'use client';

import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react';
import { Button } from './Button';
import { useEffect, useState } from 'react';

interface AlertModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
}

export default function AlertModal({ isOpen, onClose, title, message, type = 'warning' }: AlertModalProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        if (isOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsVisible(true);
        } else {
            timeoutId = setTimeout(() => setIsVisible(false), 300); // Wait for animation
        }
        return () => {
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [isOpen]);

    if (!isOpen && !isVisible) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle className="w-12 h-12 text-green-500" />;
            case 'error': return <AlertCircle className="w-12 h-12 text-red-500" />;
            case 'warning': return <AlertTriangle className="w-12 h-12 text-amber-500" />;
            case 'info': return <Info className="w-12 h-12 text-blue-500" />;
        }
    };

    const getColorClass = () => {
        switch (type) {
            case 'success': return 'bg-green-50 text-green-900';
            case 'error': return 'bg-red-50 text-red-900';
            case 'warning': return 'bg-amber-50 text-amber-900';
            case 'info': return 'bg-blue-50 text-blue-900';
        }
    };

    return (
        <div
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'bg-black/50 backdrop-blur-sm opacity-100' : 'bg-transparent opacity-0 pointer-events-none'}`}
            onClick={onClose}
        >
            <div
                className={`bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header with Close Button */}
                <div className="flex justify-end p-4 pb-0">
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 pb-8 text-center">
                    <div className="flex justify-center mb-4">
                        <div className={`p-4 rounded-full ${getColorClass().split(' ')[0]}`}>
                            {getIcon()}
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {title}
                    </h3>

                    <p className="text-gray-600 mb-8 leading-relaxed">
                        {message}
                    </p>

                    <Button
                        onClick={onClose}
                        className="w-full"
                        size="lg"
                        variant={type === 'error' ? 'danger' : type === 'warning' ? 'primary' : 'primary'}
                    >
                        Okay, got it
                    </Button>
                </div>
            </div>
        </div>
    );
}
