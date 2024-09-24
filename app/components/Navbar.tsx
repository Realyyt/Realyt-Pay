"use client";
import Link from "next/link";
import { useAccount } from "wagmi";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { ThemeSwitch } from "./ThemeSwitch";
import { WalletButtons } from "./WalletButtons";
import UniswapButton from "./UniswapButton";
import UniswapModal from "./UniswapModal";

export const Navbar = () => {
  const account = useAccount();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isUniswapModalOpen, setIsUniswapModalOpen] = useState(false); // State for Uniswap modal

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <header className="fixed left-0 top-0 z-10 w-full bg-white/20 backdrop-blur transition-all dark:bg-neutral-900/80">
      <nav
        className="container mx-auto flex items-center justify-between p-4 text-neutral-900 dark:text-white lg:px-8"
        aria-label="Navbar"
      >
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5">
            <span className="sr-only">lyt</span>
            <svg className="floating-logo logo1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180.58 65.54" width="90" height="32.77">
              <defs>
                <style>
                  {`
                    .cls-1 { fill: #1973f7; }
                    .cls-2 { fill: #1973f7; }
                    .cls-3 { fill: #cf9fff; }
                    .cls-4 { fill: none; }
                    .cls-5 { fill: #aa6fef; }
                    .cls-6 { fill: #1c5af4; }
                  `}
                </style>
              </defs>
              <g id="Layer_2" data-name="Layer 2">
                <g id="Layer_1-2" data-name="Layer 1">
                  <path className="cls-1" d="M149.6,7.57h-12a1,1,0,0,0-.9.58l-7.3,18.7a1,1,0,0,1-1.8,0L120.68,8.16a1,1,0,0,0-.9-.59H104.64a.88.88,0,0,0-.87,1.21L120.06,42.3a.75.75,0,0,1,0,.62l-4.83,12.64a.87.87,0,0,0,.9,1.14h13.77a.94.94,0,0,0,.89-.56l19.67-47.4A.88.88,0,0,0,149.6,7.57Z"/>
                  <polygon className="cls-2" points="102.04 57.41 106.58 43.5 104.89 43.51 100.3 57.41 102.04 57.41"/>
                  <path className="cls-1" d="M92.05,42,99.25,7.7l-10.31,0c-3.79,0-5.26,3-6.07,6.78L75,50.74a5.3,5.3,0,0,0,5.41,6.74l18.86-.06,4.6-13.91-10.59,0A1.24,1.24,0,0,1,92.05,42Z"/>
                  <path className="cls-1" d="M179.93,17.41h-6.51a.64.64,0,0,1-.61-.85l2.89-8.14a.64.64,0,0,0-.61-.85H160.37a.65.65,0,0,0-.61.43l-3.19,9a.65.65,0,0,1-.61.43h-4.72a.64.64,0,0,0-.61.42L146.9,28.35a.63.63,0,0,0,.61.84h3.81a.64.64,0,0,1,.61.85l-4.45,12.53Q142,58,159.58,58h4.68l4.65-12.08h-2.76q-2,0-2.64-.72c-.4-.48-.41-1.28,0-2.39l4.67-13.16a.65.65,0,0,1,.61-.43h7.42a.65.65,0,0,0,.61-.42l3.73-10.52A.63.63,0,0,0,179.93,17.41Z"/>
                  <path className="cls-3" d="M171.67,45.89h-1L166,58h1.8a.65.65,0,0,0,.61-.43l3.84-10.8A.65.65,0,0,0,171.67,45.89Z"/>
                  <path className="cls-4" d="M46.6,32.33,38,23.68l6.29-15L42.75,7.15,18.94,31a1.61,1.61,0,0,0,0,2.26l8.65,8.65-6.29,15,1.49,1.48L46.6,34.58A1.59,1.59,0,0,0,46.6,32.33Z"/>
                  <path className="cls-2" d="M18.94,33.22a1.61,1.61,0,0,1,0-2.26L42.75,7.15,37.61,2a6.83,6.83,0,0,0-9.68,0L2,27.93a6.83,6.83,0,0,0,0,9.68L21.3,56.91l6.29-15Z"/>
                  <path className="cls-3" d="M44.24,8.63,38,23.68l8.65,8.65a1.59,1.59,0,0,1,0,2.25L22.79,58.39l5.14,5.14a6.83,6.83,0,0,0,9.68,0L63.53,37.61a6.83,6.83,0,0,0,0-9.68Z"/>
                  <path className="cls-5" d="M22.79,58.39l10-10,10,10-5.3,5.18a6.7,6.7,0,0,1-9.36,0Z"/>
                  <path className="cls-6" d="M42.75,7.18l-10,10-10-10L28.09,2a6.7,6.7,0,0,1,9.36,0Z"/>
                </g>
              </g>
            </svg>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3 text-sm">
          <WalletButtons />
          <UniswapButton onClick={() => setIsUniswapModalOpen(true)} /> {/* Add the Uniswap button here */}
          <div className={`${account.isConnected ? "" : "hidden lg:block"}`}>
            <ThemeSwitch />
          </div>
        </div>
      </nav>
      <UniswapModal
        isOpen={isUniswapModalOpen}
        onClose={() => setIsUniswapModalOpen(false)}
      />
    </header>
  );
};
