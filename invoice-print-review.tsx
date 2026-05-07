"use client";

/*
  Temporary isolated review file for Claude invoice print refinement.
  This file is not imported by the app and should not affect runtime behavior.

  Relevant print CSS class references:
  - invoice-print-backdrop
  - invoice-print-shell
  - invoice-print-page
  - invoice-sheet
  - invoice-header
  - invoice-number-card
  - invoice-detail-grid
  - invoice-detail-card
  - invoice-work
  - invoice-parts
  - invoice-totals
  - invoice-qr
  - invoice-total-card
*/

export type PaymentStatus = "unpaid" | "partial" | "paid";

export type WorkshopSettings = {
  workshopName: string;
  englishSubtitle: string;
  arabicSubtitle: string;
  phoneNumber: string;
  showQrPlaceholder: boolean;
};

export type InvoicePart = {
  rowId: string;
  itemName: string;
  arabicItemName: string;
  sku: string;
  quantity: number;
  unitSellingPrice: number;
  lineTotal: number;
};

export type Invoice = {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customerName: string;
  customerPhone: string;
  vehicle: string;
  plateNumber: string;
  jobCardNumber: string;
  jobDate: string;
  workPerformed: string;
  parts: InvoicePart[];
  laborCost: number;
  partsCost: number;
  subtotal: number;
  discount: number;
  taxPercentage: number;
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  remainingBalance: number;
  paymentStatus: PaymentStatus;
  notes: string;
  archived: boolean;
};

type Translate = (key: string) => string;

export type PrintInvoiceModalProps = {
  formatDate: (value: string) => string;
  formatPhone: (value: string) => string;
  formatMoney: (value: number) => string;
  invoice?: Invoice;
  onClose: () => void;
  settings: WorkshopSettings;
  t: Translate;
};

export const invoicePrintTranslationKeys = [
  "invoices.printNow",
  "invoices.form.close",
  "invoices.fields.invoiceNumber",
  "invoices.fields.invoiceDate",
  "invoices.print.customerDetails",
  "invoices.fields.customerName",
  "invoices.fields.customerPhone",
  "invoices.fields.paymentStatus",
  "invoices.print.vehicleDetails",
  "invoices.fields.vehicle",
  "invoices.fields.plateNumber",
  "invoices.fields.jobCardNumber",
  "invoices.fields.workPerformed",
  "invoices.print.part",
  "jobCards.parts.quantity",
  "jobCards.parts.unitSellingPrice",
  "jobCards.parts.lineTotal",
  "jobCards.parts.empty",
  "invoices.print.qrPlaceholder",
  "invoices.fields.laborCost",
  "invoices.fields.partsCost",
  "invoices.fields.discount",
  "invoices.fields.taxPercentage",
  "invoices.fields.taxAmount",
  "invoices.fields.grandTotal",
  "invoices.fields.paidAmount",
  "invoices.fields.remainingBalance",
  "jobCards.paymentStatus.unpaid",
  "jobCards.paymentStatus.partial",
  "jobCards.paymentStatus.paid",
];

export function CustomerField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase leading-5 text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold leading-5 text-slate-800">
        {value}
      </dd>
    </div>
  );
}

export function PaymentStatusBadge({
  status,
  t,
}: {
  status: PaymentStatus;
  t: Translate;
}) {
  const statusClasses: Record<PaymentStatus, string> = {
    paid: "bg-emerald-50 text-emerald-800",
    partial: "bg-amber-50 text-amber-800",
    unpaid: "bg-rose-50 text-rose-700",
  };

  return (
    <span
      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[status]}`}
    >
      {t(`jobCards.paymentStatus.${status}`)}
    </span>
  );
}

export function PrintInvoiceModal({
  formatDate,
  formatPhone,
  formatMoney,
  invoice,
  onClose,
  settings,
  t,
}: PrintInvoiceModalProps) {
  if (!invoice) {
    return null;
  }

  return (
    <div className="invoice-print-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/40 px-4 py-4">
      <div className="invoice-print-shell flex max-h-[94vh] w-full flex-col overflow-hidden rounded-lg bg-slate-100 shadow-xl sm:max-w-6xl print:max-h-none print:overflow-visible print:rounded-none print:bg-white print:shadow-none">
        <div className="shrink-0 border-b border-slate-100 bg-white p-4 print:hidden">
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="h-10 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
            >
              {t("invoices.printNow")}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {t("invoices.form.close")}
            </button>
          </div>
        </div>

        <div className="invoice-print-page max-h-[84vh] flex-1 overflow-y-auto p-4 sm:p-6 print:max-h-none print:overflow-visible print:p-0">
          <section className="invoice-sheet mx-auto w-full max-w-[900px] bg-white p-7 shadow-sm ring-1 ring-slate-200 sm:p-8 print:min-h-0 print:max-w-none print:p-0 print:shadow-none print:ring-0">
            <div className="invoice-header flex flex-col gap-5 border-b-2 border-slate-900 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-4xl font-black tracking-normal text-slate-950">
                  {settings.workshopName}
                </h2>
                <p className="mt-2 text-[15px] font-semibold text-slate-700">
                  {settings.englishSubtitle}
                </p>
                <p
                  className="mt-1 text-[15px] font-semibold text-slate-700"
                  lang="ar"
                  dir="rtl"
                >
                  {settings.arabicSubtitle}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-900" dir="ltr">
                  {formatPhone(settings.phoneNumber)}
                </p>
              </div>

              <div className="invoice-number-card rounded-md border border-slate-300 bg-slate-50 p-5 text-start sm:min-w-72 sm:text-end">
                <p className="text-xs font-medium uppercase text-slate-400">
                  {t("invoices.fields.invoiceNumber")}
                </p>
                <h3 className="mt-1 text-3xl font-black text-slate-950">
                  {invoice.invoiceNumber}
                </h3>
                <p className="mt-3 text-xs font-medium uppercase text-slate-400">
                  {t("invoices.fields.invoiceDate")}
                </p>
                <p className="mt-1 text-base font-bold text-slate-800">
                  {formatDate(invoice.invoiceDate)}
                </p>
                <div className="mt-3 flex sm:justify-end">
                  <PaymentStatusBadge status={invoice.paymentStatus} t={t} />
                </div>
              </div>
            </div>

            <div className="invoice-detail-grid mt-5 grid gap-4 sm:grid-cols-2">
              <section className="invoice-detail-card rounded-md border border-slate-200 p-4">
                <h4 className="border-b border-slate-200 pb-2 text-base font-black text-slate-900">
                  {t("invoices.print.customerDetails")}
                </h4>
                <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 text-sm">
                  <CustomerField
                    label={t("invoices.fields.customerName")}
                    value={invoice.customerName}
                  />
                  <CustomerField
                    label={t("invoices.fields.customerPhone")}
                    value={formatPhone(invoice.customerPhone)}
                  />
                  <CustomerField
                    label={t("invoices.fields.paymentStatus")}
                    value={t(`jobCards.paymentStatus.${invoice.paymentStatus}`)}
                  />
                </dl>
              </section>

              <section className="invoice-detail-card rounded-md border border-slate-200 p-4">
                <h4 className="border-b border-slate-200 pb-2 text-base font-black text-slate-900">
                  {t("invoices.print.vehicleDetails")}
                </h4>
                <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 text-sm">
                  <CustomerField
                    label={t("invoices.fields.vehicle")}
                    value={invoice.vehicle}
                  />
                  <CustomerField
                    label={t("invoices.fields.plateNumber")}
                    value={invoice.plateNumber}
                  />
                  <CustomerField
                    label={t("invoices.fields.jobCardNumber")}
                    value={invoice.jobCardNumber}
                  />
                </dl>
              </section>
            </div>

            <section className="invoice-work mt-5">
              <h4 className="text-base font-black text-slate-900">
                {t("invoices.fields.workPerformed")}
              </h4>
              <p className="mt-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                {invoice.workPerformed}
              </p>
            </section>

            <section className="invoice-parts mt-5 overflow-hidden rounded-md border border-slate-300">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-slate-900 text-xs font-bold uppercase text-white">
                  <tr>
                    <th className="w-[48%] px-4 py-2.5 text-start">
                      {t("invoices.print.part")}
                    </th>
                    <th className="w-[14%] px-4 py-2.5 text-center">
                      {t("jobCards.parts.quantity")}
                    </th>
                    <th className="w-[19%] px-4 py-2.5 text-center">
                      {t("jobCards.parts.unitSellingPrice")}
                    </th>
                    <th className="w-[19%] px-4 py-2.5 text-end">
                      {t("jobCards.parts.lineTotal")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.parts.length > 0 ? (
                    invoice.parts.map((part) => (
                      <tr key={part.rowId} className="border-t border-slate-100">
                        <td className="px-4 py-2.5 align-top">
                          <p className="font-semibold text-slate-900">
                            {part.itemName}
                          </p>
                          {part.arabicItemName ? (
                            <p className="text-xs text-slate-500">
                              {part.arabicItemName}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-2.5 text-center align-top">
                          {part.quantity}
                        </td>
                        <td className="px-4 py-2.5 text-center align-top">
                          {formatMoney(part.unitSellingPrice)}
                        </td>
                        <td className="px-4 py-2.5 text-end font-bold align-top">
                          {formatMoney(part.lineTotal)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-t border-slate-100">
                      <td colSpan={4} className="px-4 py-4 text-sm text-slate-500">
                        {t("jobCards.parts.empty")}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>

            <div className="invoice-totals mt-5 grid gap-5 sm:grid-cols-[1fr_360px]">
              {settings.showQrPlaceholder ? (
                <div className="invoice-qr flex size-32 items-center justify-center rounded-md border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs font-bold uppercase text-slate-400">
                  {t("invoices.print.qrPlaceholder")}
                </div>
              ) : (
                <div />
              )}

              <dl className="invoice-total-card grid gap-2 rounded-md border border-slate-300 bg-slate-50 p-5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt>{t("invoices.fields.laborCost")}</dt>
                  <dd className="font-semibold">{formatMoney(invoice.laborCost)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>{t("invoices.fields.partsCost")}</dt>
                  <dd className="font-semibold">{formatMoney(invoice.partsCost)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>{t("invoices.fields.discount")}</dt>
                  <dd className="font-semibold">{formatMoney(invoice.discount)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>{t("invoices.fields.taxPercentage")}</dt>
                  <dd className="font-semibold">{invoice.taxPercentage}%</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>{t("invoices.fields.taxAmount")}</dt>
                  <dd className="font-semibold">{formatMoney(invoice.taxAmount)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-y border-slate-300 bg-white px-2 py-3 text-xl font-black text-slate-950">
                  <dt>{t("invoices.fields.grandTotal")}</dt>
                  <dd>{formatMoney(invoice.grandTotal)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt>{t("invoices.fields.paidAmount")}</dt>
                  <dd className="font-semibold">{formatMoney(invoice.paidAmount)}</dd>
                </div>
                <div className="flex justify-between gap-4 text-base font-black text-slate-950">
                  <dt>{t("invoices.fields.remainingBalance")}</dt>
                  <dd>{formatMoney(invoice.remainingBalance)}</dd>
                </div>
              </dl>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
