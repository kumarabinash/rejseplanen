import { Analytics } from '@vercel/analytics/next';
import type { Metadata } from "next";
import { Martian_Mono } from "next/font/google";
import { Toaster } from 'react-hot-toast';
import "./globals.css";
import 'react-tooltip/dist/react-tooltip.css'
import Script from 'next/script';

import { SiBuymeacoffee } from "react-icons/si";
import { FaGithub } from "react-icons/fa";
import { FaLinkedin } from "react-icons/fa";

const martianMono = Martian_Mono({
  variable: "--font-martian-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Be on Time",
  description: "Be on Time - Never miss your ride again",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script src="https://cloud.umami.is/script.js" data-website-id={process.env.UMAMI_WEBSITE_ID} />
      </head>
      <body
        className={`${martianMono.className}  antialiased bg-white`}
      >
        {children}
        <Toaster position="bottom-center" />
        <Analytics />
        <footer className="fixed h-8 bottom-0 w-full bg-white dark:bg-gray-900 p-2 px-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-500 dark:text-gray-400 text-xs text-center">
              Be on Time
            </span>
            <div className="flex justify-between items-center gap-4">
              <a
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 text-center flex items-center justify-center hover:text-grey-500 dark:hover:text-white"
                href="https://www.linkedin.com/in/kumar-abinash/" target="_blank" rel="noopener noreferrer"><FaLinkedin className='inline-block' /></a>
              <a
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 text-center flex items-center justify-center"
                href="https://github.com/kumarabinash/rejseplanen" target="_blank" rel="noopener noreferrer"><FaGithub className='inline-block' /></a>

              <a href="https://www.buymeacoffee.com/kumarabinash" className='text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-200 text-center flex items-center justify-center'>
                <SiBuymeacoffee className='inline-block' />
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
