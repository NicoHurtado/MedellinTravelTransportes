import type { Metadata } from "next";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

import localFont from 'next/font/local';

const ciabatta = localFont({
    src: [
        {
            path: '../public/fonts/Ciabatta-Light.woff',
            weight: '300',
            style: 'normal',
        },
        {
            path: '../public/fonts/Ciabatta-Medium.woff',
            weight: '500',
            style: 'normal',
        },
    ],
    variable: '--font-ciabatta',
});

export const metadata: Metadata = {
    title: "Transportes Medellín Travel",
    description: "Transporte seguro y tours increíbles en Medellín",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="es">
            <body className={ciabatta.variable}>
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
