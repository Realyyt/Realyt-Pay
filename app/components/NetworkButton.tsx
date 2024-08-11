import Image from "next/image";
import { FaCircleCheck } from "react-icons/fa6";
import { NetworkButtonProps } from "../types";

export const NetworkButton = ({
  network,
  logo,
  alt,
  selectedNetwork,
  handleNetworkChange,
  disabled,
}: NetworkButtonProps) => (
  <button
    type="button"
    disabled={disabled}
    className={`relative flex items-center justify-center gap-2 rounded-full px-3 py-2.5 ${selectedNetwork === network ? "border border-[#CF9FFF]" : "border border-gray-300 dark:border-white/20"} disabled:cursor-not-allowed disabled:opacity-70`}
    onClick={() => handleNetworkChange(network)}
  >
    <Image src={logo} width={0} height={0} alt={alt} className="h-auto w-4" />
    <p className="text-[#CF9FFF]">
      {
        {
          base: "Base",
          arbitrum: "Arbitrum",
          polygon: "Polygon",
        }[network]
      }
    </p>

    <FaCircleCheck
      className={`absolute -right-1 top-0 rounded-full border border-[#CF9FFF] bg-white text-[#CF9FFF] transition-opacity dark:border-[#CF9FFF] dark:bg-neutral-900 ${
        selectedNetwork === network ? "opacity-100" : "opacity-0"
      }`}
    />
  </button>
);
