"use client";
import Image from "next/image";
import { TbInfoSquareRounded } from "react-icons/tb";

import { TransactionPreviewProps } from "../types";
import {
  fetchSupportedTokens,
  formatCurrency,
  formatNumberWithCommas,
  getGatewayContractAddress,
  getInstitutionNameByCode,
  publicKeyEncrypt,
} from "../utils";
import { primaryBtnClasses, secondaryBtnClasses } from "../components";
import {
  useAccount,
  useWriteContract,
  useWatchContractEvent,
  useReadContract,
} from "wagmi";
import { fetchAggregatorPublicKey } from "../api/aggregator";
import {
  BaseError,
  decodeEventLog,
  encodeFunctionData,
  formatUnits,
  getAddress,
  parseUnits,
} from "viem";
import { erc20Abi, gatewayAbi } from "../api/abi";
import { useEffect, useState } from "react";
import {
  useSendSponsoredTransaction,
  useSmartAccount,
  useUserOpWait,
} from "@biconomy/use-aa";

const PROVIDER_ID = process.env.NEXT_PUBLIC_PROVIDER_ID;

/**
 * Renders a preview of a transaction with the provided details.
 *
 * @param handleBackButtonClick - Function to handle the back button click event.
 * @param handlePaymentConfirmation - Function to handle the payment confirmation button click event.
 * @param stateProps - Object containing the form values, fee, rate, and supported institutions.
 */
export const TransactionPreview = ({
  handleBackButtonClick,
  stateProps: {
    formValues,
    smartTokenBalance,
    fee,
    rate,
    recipientName,
    institutions: supportedInstitutions,
    setCreatedAt,
    setOrderId,
    setTransactionStatus,
  },
}: TransactionPreviewProps) => {
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [gatewayAllowance, setGatewayAllowance] = useState<number>(0);
  const [smartGatewayAllowance, setSmartGatewayAllowance] = useState<number>(0);
  const [paymasterAllowance, setPaymasterAllowance] = useState<number>(0);

  const { amount, token, currency, accountIdentifier, institution, memo } =
    formValues;

  // Rendered transaction information
  const renderedInfo = {
    amount: `${formatNumberWithCommas(amount)} ${token}`,
    fee: `${fee} ${token}`,
    totalValue: `${formatCurrency(Math.floor(amount * rate), currency, `en-${currency.slice(0, 2)}`)}`,
    recipient: recipientName,
    account: `${accountIdentifier} • ${getInstitutionNameByCode(institution, supportedInstitutions)}`,
    memo: memo,
  };

  const account = useAccount();
  const { smartAccountAddress } = useSmartAccount();

  // User operation hooks
  const {
    mutate,
    data: userOpResponse,
    error: userOpError,
    isPending: useropIsPending,
  } = useSendSponsoredTransaction();

  const {
    isLoading: waitIsLoading,
    isSuccess: waitIsSuccess,
    error: waitError,
    data: waitData,
  } = useUserOpWait(userOpResponse);

  const tokenAddress = fetchSupportedTokens(account.chain?.name)?.find(
    (t) => t.symbol.toUpperCase() === token,
  )?.address as `0x${string}`;

  const tokenDecimals = fetchSupportedTokens(account.chain?.name)?.find(
    (t) => t.symbol.toUpperCase() === token,
  )?.decimals;

  // Get allowance given to gateway contract
  const { data: gatewayAllowanceInWei } = useReadContract({
    abi: erc20Abi,
    address: tokenAddress,
    functionName: "allowance",
    args: [
      account.address!,
      getAddress(getGatewayContractAddress(account.chain?.name)!),
    ],
  });

  const { data: smartGatewayAllowanceInWei } = useReadContract({
    abi: erc20Abi,
    address: tokenAddress,
    functionName: "allowance",
    args: [
      account.address!,
      getGatewayContractAddress(account.chain?.name) as `0x${string}`,
    ],
  });

  // Get allowance given to paymaster contract
  const { data: paymasterAllowanceInWei } = useReadContract({
    abi: erc20Abi,
    address: tokenAddress,
    functionName: "allowance",
    args: [
      getAddress("0x00000f79b7faf42eebadba19acc07cd08af44789"),
      getGatewayContractAddress(account.chain?.name) as `0x${string}`,
    ],
  });

  const {
    data: hash,
    error,
    isPending,
    writeContractAsync,
  } = useWriteContract();

  // Update token balance when token balance is available
  useEffect(() => {
    if (gatewayAllowanceInWei && tokenDecimals) {
      setGatewayAllowance(
        Number(formatUnits(gatewayAllowanceInWei, tokenDecimals)),
      );
    }

    if (smartGatewayAllowanceInWei && tokenDecimals) {
      setSmartGatewayAllowance(
        Number(formatUnits(smartGatewayAllowanceInWei, tokenDecimals)),
      );
    }

    if (paymasterAllowanceInWei && tokenDecimals) {
      setPaymasterAllowance(
        Number(formatUnits(paymasterAllowanceInWei, tokenDecimals)),
      );
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    gatewayAllowanceInWei,
    smartGatewayAllowanceInWei,
    paymasterAllowanceInWei,
    tokenDecimals,
  ]);

  // Update confirmation state based on transaction status
  useEffect(() => {
    if (isPending || useropIsPending || waitIsLoading) {
      setIsConfirming(true);
    }

    if (errorMessage || userOpError || waitError) {
      setIsConfirming(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isPending,
    errorMessage,
    useropIsPending,
    userOpError,
    waitIsLoading,
    waitError,
  ]);

  // Watch for token Approval event
  useWatchContractEvent({
    address: tokenAddress,
    abi: erc20Abi,
    eventName: "Approval",
    args: {
      owner: account.address,
      spender: getGatewayContractAddress(account.chain?.name) as `0x${string}`,
    },
    async onLogs(logs: any) {
      const decodedLog = decodeEventLog({
        abi: erc20Abi,
        eventName: "Approval",
        data: logs[0].data,
        topics: logs[0].topics,
      });

      console.log(decodedLog);

      if (
        decodedLog.args.value == parseUnits(amount.toString(), tokenDecimals!)
      ) {
        await createOrder();
      }
    },
    poll: true,
  });

  // Watch for OrderCreated event
  useWatchContractEvent({
    address: getGatewayContractAddress(account.chain?.name) as `0x${string}`,
    abi: gatewayAbi,
    eventName: "OrderCreated",
    args: {
      sender: account.address,
      token: tokenAddress,
    },
    onLogs(logs: any) {
      const decodedLog = decodeEventLog({
        abi: gatewayAbi,
        eventName: "OrderCreated",
        data: logs[0].data,
        topics: logs[0].topics,
      });
      console.log(decodedLog.args.orderId);
      console.log(decodedLog.args.orderId as `0x${string}`);
      setOrderId(decodedLog.args.orderId);
      setTransactionStatus("pending");
    },
    poll: true,
  });

  const prepareCreateOrderParams = async () => {
    // Prepare recipient data
    const recipient = {
      accountIdentifier: formValues.accountIdentifier,
      accountName: recipientName,
      institution: formValues.institution,
      providerId: PROVIDER_ID,
      memo: formValues.memo,
    };

    // Fetch aggregator public key
    const publicKey = await fetchAggregatorPublicKey();
    const encryptedRecipient = publicKeyEncrypt(recipient, publicKey.data);

    // Prepare transaction parameters
    const params = {
      token: tokenAddress,
      amount: parseUnits(amount.toString(), tokenDecimals!),
      rate: parseUnits(rate.toString(), 0),
      senderFeeRecipient: getAddress(
        "0x0000000000000000000000000000000000000000",
      ),
      senderFee: BigInt(0),
      refundAddress: account.address,
      messageHash: encryptedRecipient,
    };

    return params;
  };

  const createOrder = async () => {
    try {
      const params = await prepareCreateOrderParams();
      setCreatedAt(new Date().toISOString());

      if (smartTokenBalance >= amount) {
        // Create order with sponsored user operation
        let transactions = [
          {
            to: getGatewayContractAddress(account.chain?.name) as `0x${string}`,
            data: encodeFunctionData({
              abi: gatewayAbi,
              functionName: "createOrder",
              args: [
                params.token,
                params.amount,
                params.rate,
                params.senderFeeRecipient,
                params.senderFee,
                params.refundAddress!,
                params.messageHash,
              ],
            }),
          },
        ];

        if (smartGatewayAllowance < amount) {
          // Approve gateway contract to spend token
          transactions.push({
            to: tokenAddress,
            data: encodeFunctionData({
              abi: erc20Abi,
              functionName: "approve",
              args: [
                getGatewayContractAddress(account.chain?.name) as `0x${string}`,
                parseUnits(amount.toString(), tokenDecimals!),
              ],
            }),
          });
        }

        if (paymasterAllowance < amount) {
          // Approve paymaster contract to spend token
          transactions.push({
            to: tokenAddress,
            data: encodeFunctionData({
              abi: erc20Abi,
              functionName: "approve",
              args: [
                getAddress("0x00000f79b7faf42eebadba19acc07cd08af44789"),
                parseUnits(amount.toString(), tokenDecimals!),
              ],
            }),
          });
        }

        mutate({ transactions });
      } else {
        // Create order
        await writeContractAsync({
          abi: gatewayAbi,
          address: getGatewayContractAddress(
            account.chain?.name,
          ) as `0x${string}`,
          functionName: "createOrder",
          args: [
            params.token,
            params.amount,
            params.rate,
            params.senderFeeRecipient,
            params.senderFee,
            params.refundAddress!,
            params.messageHash,
          ],
        });
      }
    } catch (e: any) {
      if (error) {
        setErrorMessage((error as BaseError).shortMessage || error!.message);
      } else {
        setErrorMessage((e as BaseError).shortMessage);
      }
      setIsConfirming(false);
    }
  };

  const handlePaymentConfirmation = async () => {
    try {
      setIsConfirming(true);

      if (smartTokenBalance >= amount) {
        await createOrder();
      } else {
        // Approve gateway contract to spend token
        if (gatewayAllowance < amount) {
          await writeContractAsync({
            address: tokenAddress,
            abi: erc20Abi,
            functionName: "approve",
            args: [
              getAddress(getGatewayContractAddress(account.chain?.name)!),
              parseUnits(amount.toString(), tokenDecimals!),
            ],
          });
        } else {
          await createOrder();
        }
      }
    } catch (e: any) {
      if (error) {
        setErrorMessage((error as BaseError).shortMessage || error!.message);
      } else {
        setErrorMessage((e as BaseError).shortMessage);
      }
      setIsConfirming(false);
    }
  };

  return (
    <div className="grid gap-6 py-10 text-sm">
      <div className="grid gap-4">
        <h2 className="text-xl font-medium text-neutral-900 dark:text-white/80">
          Review transaction {smartAccountAddress}
        </h2>
        <p className="text-gray-500 dark:text-white/50">
          Verify transaction details before you send
        </p>
      </div>

      <div className="grid gap-4">
        {/* Render transaction information */}
        {Object.entries(renderedInfo).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between gap-2">
            <h3 className="flex-1 text-gray-500 dark:text-white/50">
              {/* Capitalize the first letter of the key */}
              {key === "totalValue"
                ? "Total Value"
                : key.charAt(0).toUpperCase() + key.slice(1)}
            </h3>
            <p className="flex flex-1 items-center gap-1 font-medium text-neutral-900 dark:text-white/80">
              {/* Render token logo for amount and fee */}
              {(key === "amount" || key === "fee") && (
                <Image
                  src={`/${token.toLowerCase()}-logo.svg`}
                  alt={`${token} logo`}
                  width={14}
                  height={14}
                />
              )}
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Transaction detail disclaimer */}
      <div className="flex gap-2.5 rounded-xl border border-gray-200 bg-gray-50 p-3 text-gray-500 dark:border-white/10 dark:bg-white/5 dark:text-white/50">
        <TbInfoSquareRounded className="w-8 text-xl" />
        <p>
          Ensure the details above is correct. Failed transaction due to wrong
          details will attract a refund fee
        </p>
      </div>

      {/* CTAs */}
      <div className="flex gap-6">
        <button
          type="button"
          onClick={handleBackButtonClick}
          className={`w-fit ${secondaryBtnClasses}`}
        >
          Back
        </button>
        <button
          type="submit"
          onClick={handlePaymentConfirmation}
          className={`w-full ${primaryBtnClasses}`}
          disabled={isConfirming}
        >
          {isConfirming ? "Confirming..." : "Confirm payment"}
        </button>
      </div>

      <div>{errorMessage && <p>{errorMessage}</p>}</div>
    </div>
  );
};
