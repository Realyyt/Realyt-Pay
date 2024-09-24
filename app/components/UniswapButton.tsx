import React from "react";

interface UniswapButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

const UniswapButton: React.FC<UniswapButtonProps> = ({ onClick, disabled }) => (
  <button
    type="button"
    disabled={disabled}
    className={`relative flex items-center justify-center gap-2 rounded-full px-3 py-2.5 transition-colors duration-300 ease-in-out bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 disabled:cursor-not-allowed disabled:opacity-70`}
    onClick={onClick}
  >
    <span className="text-white">Lytswap</span>
  </button>
);

export default UniswapButton;