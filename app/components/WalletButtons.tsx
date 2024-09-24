"use client";

import { useCallback, useState } from "react";
import { useAccount, useConnect } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export const WalletButtons = () => {
  const { connectors, connect } = useConnect();
  const account = useAccount();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const createWallet = useCallback(() => {
    const coinbaseWalletConnector = connectors.find(
      (connector) => connector.id === "coinbaseWalletSDK",
    );
    if (coinbaseWalletConnector) {
      connect({ connector: coinbaseWalletConnector });
    }
  }, [connectors, connect]);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  return (
    <>
      <div className="relative sm:hidden">
        <button
          type="button"
          className="relative flex items-center justify-center gap-2 rounded-full px-2 py-1 text-xs transition-colors duration-300 ease-in-out bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
          onClick={toggleDropdown}
        >
          Wallet
        </button>
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
            <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    Connect Wallet
                  </button>
                )}
              </ConnectButton.Custom>
              <button
                onClick={createWallet}
                type="button"
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                role="menuitem"
              >
                Create Wallet
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="hidden sm:flex items-center gap-2">
        <ConnectButton.Custom>
          {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
            const ready = mounted;
            const connected = ready && account && chain;

            return (
              <div
                {...(!ready && {
                  "aria-hidden": true,
                  style: {
                    opacity: 0,
                    pointerEvents: "none",
                    userSelect: "none",
                  },
                })}
              >
                {(() => {
                  if (!connected) {
                    return (
                      <button
                        onClick={openConnectModal}
                        type="button"
                        className="relative flex items-center justify-center gap-2 rounded-full px-2 py-1 text-xs transition-colors duration-300 ease-in-out bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                      >
                        Connect Wallet
                      </button>
                    );
                  }

                  if (chain.unsupported) {
                    return (
                      <button
                        onClick={openChainModal}
                        type="button"
                        className="relative flex items-center justify-center gap-2 rounded-full px-2 py-1 text-xs transition-colors duration-300 ease-in-out bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                      >
                        Wrong network
                      </button>
                    );
                  }

                  return (
                    <button
                      onClick={openAccountModal}
                      type="button"
                      className="relative flex items-center justify-center gap-2 rounded-full px-2 py-1 text-xs transition-colors duration-300 ease-in-out bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
                    >
                      {account.displayName}
                    </button>
                  );
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>

        {!account.isConnected && (
          <button
            type="button"
            className="relative flex items-center justify-center gap-2 rounded-full px-2 py-1 text-xs text-gray-700 hover:bg-gray-100 dark:text-white dark:hover:bg-neutral-800"
            onClick={createWallet}
          >
            Create Wallet
          </button>
        )}
      </div>
    </>
  );
};
