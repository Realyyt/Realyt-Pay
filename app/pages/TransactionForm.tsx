import { useAccount } from "wagmi";
import { PiCaretDown } from "react-icons/pi";
import { FaRegHourglass } from "react-icons/fa6";
import { AiOutlineQuestionCircle } from "react-icons/ai";

import {
  InputError,
  NetworkButton,
  SelectField,
  TabButton,
  inputClasses,
  primaryBtnClasses,
} from "../components";
import { InstitutionProps, TransactionFormProps } from "../types";
import { formatNumberWithCommas } from "../utils";
import { ImSpinner2 } from "react-icons/im";

const tokens = [
  { value: "USDC", label: "USDC" },
  { value: "USDT", label: "USDT", disabled: true },
  { value: "DAI", label: "DAI", disabled: true },
  { value: "ETH", label: "ETH", disabled: true },
  { value: "BTC", label: "BTC", disabled: true },
];

const currencies = [
  { value: "NGN", label: "Nigerian Naira (NGN)" },
  { value: "KES", label: "Kenyan Shilling (KES)", disabled: true },
  { value: "GHS", label: "Ghanaian Cedi (GHS)", disabled: true },
];

export const TransactionForm = ({
  formMethods,
  onSubmit,
  stateProps: {
    rate,
    isFetchingRate,
    selectedNetwork,
    handleNetworkChange,
    selectedTab,
    handleTabChange,
    isFetchingInstitutions: institutionsLoading,
    institutions: supportedInstitutions,
  },
}: TransactionFormProps) => {
  const account = useAccount();
  const {
    handleSubmit,
    register,
    watch,
    formState: { errors, isValid, isDirty, isSubmitting },
  } = formMethods;

  let currency = watch("currency"),
    amount = watch("amount"),
    token = watch("token"),
    recipientBank = watch("recipientBank"),
    recipientAccount = watch("recipientAccount"),
    memo = watch("memo");

  const renderedInfo = [
    {
      key: "rate",
      label: "Rate",
      value: `${currency} ${formatNumberWithCommas(rate)}/$`,
    },
    { key: "fee", label: "Fee", value: `0.1%` },
  ];

  const networks = ["base", "arbitrum", "polygon"];

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-6 py-10 text-sm text-neutral-900 transition-all dark:text-white"
      noValidate
    >
      {/* Networks */}
      <div className="flex items-center justify-between gap-3 font-medium">
        <input type="hidden" {...register("network")} value={selectedNetwork} />

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

        {/* Other network buttons */}
        <button
          type="button"
          disabled
          aria-label="Other networks"
          className="flex cursor-not-allowed items-center justify-center gap-2 rounded-full border border-gray-300 p-2.5 opacity-70 dark:border-white/20"
        >
          <PiCaretDown className="cursor-pointer text-lg text-gray-400 dark:text-white/50" />
        </button>
      </div>

      <div className="flex items-start gap-4">
        {/* Token */}
        <SelectField
          id="token"
          label="Token"
          options={tokens}
          defaultValue="USDC"
          validation={{
            required: { value: true, message: "Token is required" },
          }}
          errors={errors}
          register={register}
          value={watch("token")}
        />

        {/* Amount */}
        <div className="grid flex-1 gap-2">
          <label htmlFor="amount" className="font-medium">
            Amount <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              id="amount"
              type="number"
              step="0.01"
              {...register("amount", {
                required: { value: true, message: "Amount is required" },
                disabled: watch("token") === "",
                min: {
                  value: 0.01,
                  message: "Minimum amount is 0.01",
                },
                max: {
                  value: 1000000,
                  message: "Max. amount is 1,000,000",
                },
                pattern: {
                  value: /^\d+(\.\d{1,2})?$/,
                  message: "Invalid amount",
                },
              })}
              className={`${inputClasses} pl-4 pr-14`}
              placeholder="0.00"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-4">
              {watch("token")}
            </div>
          </div>
          {errors.amount && <InputError message={errors.amount.message} />}
        </div>
      </div>

      <div>
        <h3 className="pb-2 font-medium">
          Recipient details <span className="text-rose-500">*</span>
        </h3>

        <div className="grid gap-4 rounded-3xl border border-gray-200 p-4 transition-all dark:border-white/10">
          {/* Tabs */}
          <div className="flex items-center gap-2 rounded-full bg-gray-50 p-1 font-medium dark:bg-white/5">
            <TabButton
              tab="bank-transfer"
              selectedTab={selectedTab}
              handleTabChange={handleTabChange}
            />
            <TabButton
              tab="mobile-money"
              selectedTab={selectedTab}
              handleTabChange={handleTabChange}
            />
          </div>

          {/* Bank Transfer Tab Contents */}
          {selectedTab === "bank-transfer" && (
            <div className="grid gap-4">
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
                id="recipientBank"
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
                value={watch("recipientBank")}
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
                    {...register("recipientAccount", {
                      required: {
                        value: true,
                        message: "Enter recipient account",
                      },
                      pattern: {
                        value: /\d{10}/,
                        message: "Invalid account number",
                      },
                    })}
                    className={inputClasses}
                    placeholder="12345678901"
                    maxLength={10}
                    pattern="\d{10}"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 dark:text-white/20">
                    {10 - (watch("recipientAccount")?.toString().length ?? 0)}
                  </div>
                </div>
                {errors.recipientAccount && (
                  <InputError message={errors.recipientAccount.message} />
                )}
                {!errors.recipientAccount && (
                  <div className="flex items-center gap-1 text-gray-400 dark:text-white/50">
                    <AiOutlineQuestionCircle />
                    <p>Usually 10 digits.</p>
                  </div>
                )}
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
            </div>
          )}

          {/* Mobile Money Tab Contents */}
          {selectedTab === "mobile-money" && (
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-gray-200 px-6 py-5 dark:border-white/10">
              <FaRegHourglass className="text-yellow-700 dark:text-yellow-400" />
              <p className="text-gray-500">Coming soon</p>
            </div>
          )}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={
          !isValid || !isDirty || isSubmitting || account.status !== "connected"
        }
        className={primaryBtnClasses}
      >
        {isSubmitting
          ? "Submitting..."
          : account.status === "connected"
            ? "Confirm Payment"
            : "Connect wallet to continue"}
      </button>

      {/* Rate, Fee and Amount calculations */}
      {rate > 0 && amount && Number(amount) > 0 && (
        <div className="flex flex-col rounded-2xl border border-gray-200 bg-gray-50 transition-all dark:border-white/10 dark:bg-white/5">
          {isFetchingRate ? (
            <div className="flex items-center justify-center gap-2 px-4 py-11">
              <ImSpinner2 className="animate-spin text-lg text-neutral-900 dark:text-white" />
              <p className="text-xs">
                Fetching rate for {currency}{" "}
                {formatNumberWithCommas(amount as number)}
              </p>
            </div>
          ) : (
            renderedInfo.map(({ key, label, value }, index) => (
              <div
                key={key}
                className={`flex items-center justify-between border-dashed border-white/10 px-4 py-3 font-normal text-gray-500 transition-all dark:text-white/50 ${
                  index === 1 ? "border-t" : ""
                }`}
              >
                <p>{label}</p>
                <p className="rounded-full bg-white px-2 py-1 transition-all dark:bg-neutral-900">
                  {value}
                </p>
              </div>
            ))
          )}
        </div>
      )}
    </form>
  );
};