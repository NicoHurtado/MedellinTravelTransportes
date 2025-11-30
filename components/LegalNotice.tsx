'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/i18n';

interface LegalNoticeProps {
    variant?: 'default' | 'compact';
}

export default function LegalNotice({ variant = 'default' }: LegalNoticeProps) {
    const { language } = useLanguage();

    const textEs = {
        line1: "Al continuar, aceptas nuestros",
        line2: "y autorizas el tratamiento de tus datos personales conforme a nuestra",
        terminos: "Términos y Condiciones",
        privacidad: "Política de Privacidad"
    };

    const textEn = {
        line1: "By continuing, you accept our",
        line2: "and authorize the processing of your personal data according to our",
        terminos: "Terms and Conditions",
        privacidad: "Privacy Policy"
    };

    const text = language === 'es' ? textEs : textEn;

    if (variant === 'compact') {
        return (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-xs text-gray-600 text-center leading-relaxed">
                    {text.line1}{' '}
                    <Link
                        href="/terminos-condiciones"
                        target="_blank"
                        className="text-blue-600 hover:text-blue-700 underline font-medium"
                    >
                        {text.terminos}
                    </Link>
                    {' '}{text.line2}{' '}
                    <Link
                        href="/politica-privacidad"
                        target="_blank"
                        className="text-blue-600 hover:text-blue-700 underline font-medium"
                    >
                        {text.privacidad}
                    </Link>.
                </p>
            </div>
        );
    }

    return (
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-sm">
            <div className="space-y-2">
                <p className="text-sm text-gray-700 leading-relaxed">
                    <span className="inline-flex items-center">
                        <svg className="w-4 h-4 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium text-gray-800">{text.line1}</span>
                    </span>
                    {' '}
                    <Link
                        href="/terminos-condiciones"
                        target="_blank"
                        className="text-blue-600 hover:text-blue-700 underline font-semibold transition-colors"
                    >
                        {text.terminos}
                    </Link>
                </p>

                <p className="text-sm text-gray-700 leading-relaxed">
                    <span className="inline-flex items-center">
                        <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium text-gray-800">{text.line2}</span>
                    </span>
                    {' '}
                    <Link
                        href="/politica-privacidad"
                        target="_blank"
                        className="text-blue-600 hover:text-blue-700 underline font-semibold transition-colors"
                    >
                        {text.privacidad}
                    </Link>
                </p>
            </div>
        </div>
    );
}
