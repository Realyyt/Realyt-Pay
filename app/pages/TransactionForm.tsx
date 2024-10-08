"use client";
import Image from "next/image";
import { useAccount } from "wagmi";
import { ImSpinner2 } from "react-icons/im";
import { FaRegHourglass } from "react-icons/fa6";
import { useSmartAccount } from "@biconomy/use-aa";
import { AnimatePresence, motion } from "framer-motion";
import { PiCaretDown, PiCheckCircle } from "react-icons/pi";
import { useState, useCallback, useEffect } from "react";

import {
  AnimatedComponent,
  FundWalletModal,
  InputError,
  NetworkButton,
  SelectField,
  SelectField2,
  TabButton,
  Tooltip,
  UniswapModal, // Import UniswapModal
  fadeInOut,
  inputClasses,
  primaryBtnClasses,
  slideInDown,
  slideInOut,
} from "../components";
import { fetchSupportedTokens, formatCurrency } from "../utils";
import { InstitutionProps, TransactionFormProps } from "../types";
import { HiOutlineInformationCircle } from "react-icons/hi";

const currencies = [
  { value: "NGN", label: "Nigerian Naira (NGN)" },
  //{ value: "KES", label: "Kenyan Shilling (KES)", disabled: true },
  //{ value: "GHS", label: "Ghanaian Cedi (GHS)", disabled: true },
];

/**
 * TransactionForm component renders a form for submitting a transaction.
 * It includes fields for selecting network, token, amount, and recipient details.
 * The form also displays rate and fee information based on the selected token.
 *
 * @param formMethods - Form methods from react-hook-form library.
 * @param onSubmit - Function to handle form submission.
 * @param stateProps - State properties for the form.
 */
export const TransactionForm = ({
  formMethods,
  onSubmit,
  stateProps,
}: TransactionFormProps) => {
  const [nairaAmount, setNairaAmount] = useState("");
  const [localNairaAmount, setLocalNairaAmount] = useState("");
  const [isUniswapModalOpen, setIsUniswapModalOpen] = useState(false); // State for Uniswap modal

  // Destructure stateProps
  const {
    tokenBalance,
    smartTokenBalance,
    rate,
    isFetchingRate,
    recipientName,
    isFetchingRecipientName,
    selectedNetwork,
    handleNetworkChange,
    selectedTab,
    handleTabChange,
    isFetchingInstitutions: institutionsLoading,
    institutions: supportedInstitutions,
  } = stateProps;

  // Destructure formMethods from react-hook-form
  const {
    setValue,
    handleSubmit,
    register,
    watch,
    formState: { errors, isValid, isDirty, isSubmitting },
  } = formMethods;

  // Get values of currency, amount, and token from form
  let currency = watch("currency"),
    amount = watch("amount"),
    token = watch("token");

  // Get account information using custom hook
  const account = useAccount();
  const { smartAccountAddress } = useSmartAccount();

  // Array of objects for rendering rate and fee information
  const rateInfo = {
    key: "rate",
    label: "Rate",
    value: `${formatCurrency(rate, currency?.toString(), currency ? `en-${currency.toString().slice(0, 2)}` : "en-NG")}/DAI`,
  };

  const feeInfo = {
    key: "eta",
    label: "Funds available in",
    value: `15s`,
  };

  const renderedInfo = [rateInfo, feeInfo];

  // Array of available networks
  const networks = ["base", ];
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = parseFloat(value);
    setValue("amount", numericValue, { shouldValidate: true });
    if (!isNaN(numericValue) && rate) {
      const calculatedNaira = (numericValue * rate).toFixed(2);
      setNairaAmount(calculatedNaira);
      setLocalNairaAmount(calculatedNaira);
    } else {
      setNairaAmount("");
      setLocalNairaAmount("");
    }
  };

  const handleNairaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalNairaAmount(value);
    if (value && rate) {
      const calculatedUsd = parseFloat((parseFloat(value) / rate).toFixed(2));
      setValue("amount", calculatedUsd, { shouldValidate: true });
    } else {
      setValue("amount", 0, { shouldValidate: true });
    }
  };

  useEffect(() => {
    if (amount && rate) {
      const calculatedNaira = (parseFloat(amount.toString()) * rate).toFixed(2);
      setNairaAmount(calculatedNaira);
      setLocalNairaAmount(calculatedNaira);
    }
  }, [amount, rate]);

  useEffect(() => {
    if (localNairaAmount && rate) {
      const calculatedUsd = parseFloat((parseFloat(localNairaAmount) / rate).toFixed(2));
      setValue("amount", calculatedUsd, { shouldValidate: true });
    }
  }, [localNairaAmount, rate, setValue]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-6 py-10 text-sm text-neutral-900 transition-all dark:text-[#CF9FFF]"
      noValidate
    >
      {/* Networks */}
      <div className="flex items-center justify-center gap-3 font-medium">
        <input type="hidden" {...register("network")} value={selectedNetwork} />

        {/* Render network buttons */}
        {networks.map((network) => (
          <NetworkButton
            key={network}
            network={network}
            logo={`/${network}-logo.svg`}
            alt={`${network} logo`}
            selectedNetwork={selectedNetwork}
            handleNetworkChange={handleNetworkChange}
            disabled={network !== "base"}
          />
        ))}

        {/* 
        <Tooltip message="Other networks (coming soon)">
          <button
            type="button"
            aria-label="Other networks (coming soon)"
            className="flex items-center justify-center gap-2 rounded-full border border-gray-300 p-2.5 opacity-70 dark:border-white/20"
          >
            <PiCaretDown className="text-lg text-gray-400 dark:text-white/50" />
          </button>
        </Tooltip> */}
      </div>

      <div className="grid gap-4 rounded-3xl border border-[#CF9FFF] p-4 transition-all dark:border-white/10">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Token */}
          <div className="grid flex-1 gap-2">
            <SelectField2
              id="token"
              label="Token"
              options={
                fetchSupportedTokens(account.chain?.name)?.map((token) => ({
                  value: token.symbol,
                  label: token.symbol,
                })) ?? []
              }
              validation={{
                required: { value: true, message: "Token is required" },
                disabled: !account.isConnected,
              }}
              errors={errors}
              register={register}
              value={watch("token")}
              defaultValue="DAI"
              title={
                account.isConnected
                  ? "Select token to send"
                  : "Connect wallet to select token"
              }
            />
          </div>

          {/* Amount */}
          <div className="grid gap-4">
            <label htmlFor="amount" className="font-medium">
              Amount <span className="text-rose-500">*</span>
            </label>
            <div className="grid gap-2">
              {/* USD (DAI) Amount */}
              <div className="relative">
                <input
                  id="amount"
                  type="number"
                  step="0.01"
                  {...register("amount", {
                    required: { value: true, message: "Amount is required" },
                    disabled: !account.isConnected || token === "",
                    min: {
                      value: 0.01,
                      message: `Minimum amount is 0.01 ${token}`,
                    },
                    max: {
                      value: 500,
                      message: `Max amount is 500 ${token}`,
                    },
                    pattern: {
                      value: /^\d+(\.\d{1,2})?$/,
                      message: "Invalid amount",
                    },
                    
                  })}
                  onChange={handleAmountChange}
                  className={`${inputClasses} h-[42px] w-full pl-4 pr-14`}
                  placeholder="0.00"
                  title={
                    token === ""
                      ? "Select token to enable amount field"
                      : !account.isConnected
                        ? "Connect wallet to enable amount field"
                        : "Enter amount to send in USD"
                  }
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                {watch("token") ? watch("token") : "USD"}
                </div>
              </div>

              {/* Naira Amount (helper input) */}
              <div className="relative">
                <input
                  id="nairaAmount"
                  type="number"
                  step="0.01"
                  className={`${inputClasses} pl-4 pr-14`}
                  placeholder="0.00"
                  title={
                    token === ""
                      ? "Select token to enable amount field"
                      : !account.isConnected
                        ? "Connect wallet to enable amount field"
                        : "Enter amount in Naira"
                  }
                  value={localNairaAmount}
                  onChange={handleNairaChange}
                  disabled={!account.isConnected || token === ""}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-4">
                  ₦
                </div>
              </div>
            </div>
            {errors.amount && <InputError message={errors.amount.message} />}
          </div>
        </div>
        {/* Wallet and Smart Wallet Balance */}
        <AnimatePresence mode="wait">
          {account.status === "connected" && token !== "" && (
            <AnimatedComponent
              variant={slideInDown}
              className="flex items-start justify-between rounded-2xl border border-gray-200 dark:border-white/10"
            >
              <div className="grid flex-1 gap-3 p-4">
                <div className="flex items-center gap-1">
                  <p className="text-gray-500 dark:text-white/50">
                    Smart Wallet
                  </p>
                  <FundWalletModal address={smartAccountAddress} />
                  <button
                    type="button"
                    className="ml-2 rounded-full border border-gray-300 p-2.5 dark:border-white/20"
                    onClick={() => setIsUniswapModalOpen(true)}
                  >
                    Exchange
                  </button>
                </div>
                <div className="flex items-center gap-1">
                  {token && (
                    <Image
                      src={`/${String(token)?.toLowerCase()}-logo.svg`}
                      alt={`${token} logo`}
                      width={14}
                      height={14}
                    />
                  )}
                  <p>
                    {Math.round(smartTokenBalance * 100) / 100} {token}
                  </p>
                </div>
              </div>

              <div className="h-full w-px border border-dashed border-gray-200 dark:border-white/10"></div>

              <div className="grid flex-1 gap-3 p-4">
                <p className="text-gray-500 dark:text-white/50">
                  {account.connector.name}
                </p>
                <div className="flex items-center gap-1">
                  {token && (
                    <Image
                      src={`/${String(token)?.toLowerCase()}-logo.svg`}
                      alt={`${token} logo`}
                      width={14}
                      height={14}
                    />
                  )}
                  <p>
                    {Math.round(tokenBalance * 100) / 100} {token}
                  </p>
                </div>
              </div>
            </AnimatedComponent>
          )}
        </AnimatePresence>
      </div>

      {/* Recipient Details */}
      <div>
        <div className="flex items-center gap-1 pb-2">
          <h3 className="font-medium">
            Recipient details <span className="text-rose-500">*</span>
          </h3>
          <Tooltip message="Recipient details will be encrypted onchain.">
            <HiOutlineInformationCircle className="cursor-pointer text-gray-400 hover:text-gray-500" />
          </Tooltip>
        </div>

        <div className="grid gap-4 rounded-3xl border border-[#CF9FFF] p-4 transition-all dark:border-white/10">
          {/* Tabs */}
          <div className="flex items-center gap-2 rounded-full bg-[#CF9FFF] p-1 font-medium dark:bg-[#CF9FFF]">
            <TabButton
              tab="bank-transfer"
              selectedTab={selectedTab}
              handleTabChange={handleTabChange}
            />
            {/*<TabButton
              tab="mobile-money"
              selectedTab={selectedTab}
              handleTabChange={handleTabChange}
            />*/}
          </div>

          {/* Bank Transfer Tab Contents */}
          {selectedTab === "bank-transfer" && (
            <motion.div
              key="bank-transfer"
              {...fadeInOut}
              transition={{ duration: 0.3 }}
              className="grid gap-4"
            >
              {/* Currency */}
              <SelectField
                id="currency"
                label="Currency"
                defaultValue="NGN"
                options={currencies}
                validation={{
                  required: { value: true, message: "Select currency" },
                }}
                errors={errors}
                register={register}
                value={watch("currency")}
              />

              {/* Recipient Bank */}
              <SelectField
                id="institution"
                label="Recipient Bank"
                options={supportedInstitutions.map(
                  (institution: InstitutionProps) => ({
                    value: institution.code,
                    label: institution.name,
                  }),
                )}
                validation={{
                  required: { value: true, message: "Select recipient bank" },
                  disabled: watch("currency") === "" || institutionsLoading,
                }}
                errors={errors}
                register={register}
                isLoading={institutionsLoading}
                value={watch("institution")}
                title={
                  watch("currency") === ""
                    ? "Select currency to enable recipient bank"
                    : "Select recipient bank"
                }
              />

              {/* Recipient Account */}
              <div className="grid gap-2">
                <label htmlFor="recipient-account" className="font-medium">
                  Recipient Account <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="recipient-account"
                    {...register("accountIdentifier", {
                      required: {
                        value: true,
                        message: "Enter recipient account",
                      },
                      pattern: {
                        value: /\d{10}/,
                        message: "Invalid account identifier",
                      },
                    })}
                    className={inputClasses}
                    placeholder="12345678901"
                    maxLength={10}
                    pattern="\d{10}"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 dark:text-white/20">
                    {10 - (watch("accountIdentifier")?.toString().length ?? 0)}
                  </div>
                </div>
                {errors.accountIdentifier && (
                  <InputError message={errors.accountIdentifier.message} />
                )}

                <div className="flex items-center gap-1 text-gray-400 dark:text-white/50">
                  <AnimatePresence mode="wait">
                    {isFetchingRecipientName ? (
                      <AnimatedFeedbackItem>
                        <ImSpinner2 className="animate-spin" />
                        <p className="text-xs">Getting recipient name...</p>
                      </AnimatedFeedbackItem>
                    ) : (
                      <>
                        {recipientName && (
                          <AnimatedFeedbackItem>
                            <PiCheckCircle className="text-lg text-green-700 dark:text-green-500" />
                            <p className="capitalize text-gray-700 dark:text-white/80">
                              {recipientName.toLocaleLowerCase()}
                            </p>
                          </AnimatedFeedbackItem>
                        )}
                        {recipientName == "" &&
                          watch("accountIdentifier")?.toString().length ===
                            10 &&
                          !errors.accountIdentifier &&
                          isValid && (
                            <InputError message="Could not resolve account details" />
                          )}
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Memo */}
              <div className="grid gap-2">
                <label htmlFor="memo" className="font-medium">
                  Memo <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="memo"
                    {...register("memo", {
                      required: { value: true, message: "Enter memo" },
                    })}
                    className={inputClasses}
                    placeholder="Enter memo"
                    maxLength={25}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 dark:text-white/20">
                    {25 - (watch("memo")?.toString().length ?? 0)}
                  </div>
                </div>
                {errors.memo && <InputError message={errors.memo.message} />}
              </div>
            </motion.div>
          )}

          {/*  
          {selectedTab === "mobile-money" && (
            <motion.div
              key="mobile-money"
              {...fadeInOut}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 px-6 py-5 dark:border-white/10"
            >
              <FaRegHourglass className="text-yellow-700 dark:text-yellow-400" />
              <p className="text-gray-500">Coming soon</p>
            </motion.div>
          )}*/}
        </div>
      </div>
      {/* Submit button */}
      <button
        type="submit"
        disabled={
          !isValid || !isDirty || !account.isConnected || recipientName == ""
        }
        className={primaryBtnClasses}
      >
        {account.isConnected ? "Review Info" : "Connect wallet to continue"}
      </button>

      {/* Rate and fee */}
      <AnimatePresence>
        {rate > 0 && Number(amount) > 0 && account.isConnected && (
          <AnimatedComponent
            variant={slideInOut}
            className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-gray-50 transition-all dark:border-white/10 dark:bg-white/5"
          >
            {renderedInfo.map(({ key, label, value }, index) => (
              <AnimatedComponent
                key={key}
                delay={index * 0.1}
                className={`flex items-center justify-between border-dashed border-white/10 px-4 py-3 font-normal text-gray-500 transition-all dark:text-white/50 ${index === 1 ? "border-t" : ""}`}
              >
                <p>{label}</p>
                <p
                  className={`rounded-full px-2 py-1 transition-all ${
                    isFetchingRate
                      ? "animate-pulse bg-gradient-to-r from-white to-gray-100 dark:from-neutral-800 dark:to-neutral-900"
                      : "bg-white dark:bg-neutral-900"
                  }`}
                >
                  <span className={`${isFetchingRate ? "blur-xl" : ""}`}>
                    {value}
                  </span>
                </p>
              </AnimatedComponent>
            ))}
          </AnimatedComponent>
        )}
      </AnimatePresence>

      {/* Uniswap Modal */}
      <UniswapModal
        isOpen={isUniswapModalOpen}
        onClose={() => setIsUniswapModalOpen(false)}
      />
    </form>
  );
};

const AnimatedFeedbackItem = ({ children }: { children: React.ReactNode }) => (
  <AnimatedComponent
    variant={slideInDown}
    className="flex flex-1 items-center gap-1"
  >
    {children}
  </AnimatedComponent>
);
