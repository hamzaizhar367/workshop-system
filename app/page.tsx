"use client";

import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type FocusEvent,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useLanguage } from "./language-provider";
import { workshopDataService } from "./workshop-data-service";

type SectionKey =
  | "dashboard"
  | "customers"
  | "vehicles"
  | "jobCards"
  | "inventory"
  | "purchases"
  | "expenses"
  | "invoices"
  | "reports"
  | "recycleBin"
  | "settings";

type CustomerType = "new" | "repeat";
type ToastMessage = {
  id: number;
  translationKey: string;
};

type Customer = {
  id: number;
  name: string;
  phone: string;
  city: string;
  type: CustomerType;
  notes: string;
  archived: boolean;
};

type CustomerForm = {
  name: string;
  phone: string;
  city: string;
  type: CustomerType;
  notes: string;
};

type JobCardStatus = "inWorkshop" | "completed" | "cancelled";
type PaymentStatus = "unpaid" | "partial" | "paid";
type VehicleDisplayStatus = "active" | JobCardStatus;
type RecordTab = "active" | "archived";
type InventoryUnitType = "piece" | "liter" | "set" | "box";
type InventoryItemType = "stock" | "service";
type ExpenseCategory =
  | "rent"
  | "salaries"
  | "utilities"
  | "equipment"
  | "fuel"
  | "miscellaneous";
type ExpensePaymentMethod = "cash" | "card" | "bankTransfer";
type ReportRange = "today" | "week" | "month" | "all";
type AppLanguage = "en" | "ar";
type RecycleBinFilter =
  | "all"
  | "customers"
  | "vehicles"
  | "jobCards"
  | "inventory"
  | "purchases"
  | "expenses"
  | "invoices";
type RecycleBinRecordType = Exclude<RecycleBinFilter, "all">;
type RecycleBinRecord = {
  id: number;
  type: RecycleBinRecordType;
  title: string;
  subtitle: string;
  details: string;
  searchText: string;
  status?: string;
};
type PendingPermanentDelete = {
  id: number;
  type: RecycleBinRecordType;
  title: string;
};

const getPaymentStatusFromAmounts = (paidAmount: number, grandTotal: number) => {
  if (paidAmount <= 0) {
    return "unpaid" as const;
  }

  return paidAmount >= grandTotal ? ("paid" as const) : ("partial" as const);
};

const isInvoiceLinkedToCustomer = (invoice: Invoice, customer: Customer) =>
  invoice.customerId === customer.id ||
  (!invoice.customerId && invoice.customerName === customer.name);

const isInvoiceLinkedToVehicle = (invoice: Invoice, vehicle: Vehicle) =>
  invoice.vehicleId === vehicle.id ||
  (!invoice.vehicleId && invoice.plateNumber === vehicle.plateNumber);

type WorkshopSettings = {
  workshopName: string;
  englishSubtitle: string;
  arabicSubtitle: string;
  phoneNumber: string;
  city: string;
  country: string;
  address: string;
  logoInitials: string;
  defaultCustomerCity: string;
  invoicePrefix: string;
  jobCardPrefix: string;
  purchaseOrderPrefix: string;
  defaultVatPercentage: string;
  defaultCurrency: string;
  showQrPlaceholder: boolean;
  defaultPaymentMethod: ExpensePaymentMethod;
  defaultPaymentStatus: PaymentStatus;
  lowStockAlertEnabled: boolean;
  archiveConfirmationEnabled: boolean;
  defaultLanguage: AppLanguage;
  compactModeEnabled: boolean;
  systemNotes: string;
};

type JobPart = {
  id: number;
  rowId: string;
  inventoryItemId: number;
  itemName: string;
  arabicItemName: string;
  quantity: number;
  unitSellingPrice: number;
  lineTotal: number;
  itemType: InventoryItemType;
};

type JobPartFormLine = {
  rowId: string;
  inventoryItemId: string;
  quantity: string;
  unitSellingPrice: string;
};

type Vehicle = {
  id: number;
  customerId: number;
  ownerName: string;
  plateNumber: string;
  make: string;
  model: string;
  year: string;
  colorKey: string;
  vehicleTypeKey: string;
  notes: string;
  archived: boolean;
};

type VehicleForm = {
  ownerName: string;
  plateNumber: string;
  make: string;
  model: string;
  year: string;
  color: string;
  vehicleType: string;
  notes: string;
};

type JobCard = {
  id: number;
  jobNumber: string;
  vehicleId: number;
  customerId: number;
  date: string;
  status: JobCardStatus;
  customerName: string;
  vehicleLabel: string;
  plateNumber: string;
  complaint: string;
  workPerformed: string;
  mechanic: string;
  laborCost: number;
  partsCost: number;
  partsUsed: JobPart[];
  paidAmount: number;
  paymentStatus: PaymentStatus;
  notes: string;
  archived: boolean;
  stockDeducted: boolean;
  deductedParts: JobPart[];
};

type JobCardForm = {
  jobNumber: string;
  vehicleId: string;
  date: string;
  status: JobCardStatus;
  complaint: string;
  workPerformed: string;
  mechanic: string;
  laborCost: string;
  partsCost: string;
  partsUsed: JobPartFormLine[];
  paidAmount: string;
  paymentStatus: PaymentStatus;
  notes: string;
};

type InventoryItem = {
  id: number;
  itemName: string;
  arabicItemName: string;
  category: string;
  sku: string;
  brand: string;
  supplierName: string;
  itemType: InventoryItemType;
  stockQuantity: number;
  unitType: InventoryUnitType;
  costPrice: number;
  sellingPrice: number;
  minimumStock: number;
  location: string;
  notes: string;
  archived: boolean;
};

type InventoryForm = {
  itemName: string;
  arabicItemName: string;
  category: string;
  sku: string;
  brand: string;
  supplierName: string;
  itemType: InventoryItemType;
  stockQuantity: string;
  unitType: InventoryUnitType;
  costPrice: string;
  sellingPrice: string;
  minimumStock: string;
  location: string;
  notes: string;
};

type PurchaseItem = {
  rowId: string;
  inventoryItemId: number;
  itemName: string;
  arabicItemName: string;
  sku: string;
  currentStock: number;
  quantity: number;
  costPrice: number;
  lineTotal: number;
};

type Purchase = {
  id: number;
  purchaseId: string;
  supplierName: string;
  purchaseDate: string;
  items: PurchaseItem[];
  totalQuantity: number;
  totalAmount: number;
  paymentStatus: PaymentStatus;
  notes: string;
  createdBy: string;
};

type PurchaseItemFormLine = {
  rowId: string;
  inventoryItemId: string;
  quantity: string;
  costPrice: string;
};

type PurchaseForm = {
  supplierName: string;
  purchaseDate: string;
  paymentStatus: PaymentStatus;
  notes: string;
  items: PurchaseItemFormLine[];
};

type Expense = {
  id: number;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  paymentMethod: ExpensePaymentMethod;
  notes: string;
  createdBy: string;
  archived: boolean;
};

type ExpenseForm = {
  title: string;
  category: ExpenseCategory;
  amount: string;
  date: string;
  paymentMethod: ExpensePaymentMethod;
  notes: string;
  createdBy: string;
};

type InvoicePart = {
  rowId: string;
  itemName: string;
  arabicItemName: string;
  sku: string;
  quantity: number;
  unitSellingPrice: number;
  lineTotal: number;
};

type Invoice = {
  id: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customerId?: number;
  vehicleId?: number;
  customerName: string;
  customerPhone: string;
  customerCity?: string;
  vehicle: string;
  plateNumber: string;
  jobCardId: number;
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
  correctionStatus?: "corrected";
  correctionReason?: string;
  correctedAt?: string;
};

type InvoiceForm = {
  invoiceType: "quick" | "jobCard";
  jobCardId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerCity: string;
  vehicleId: string;
  vehiclePlateNumber: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleColor: string;
  vehicleType: string;
  workPerformed: string;
  laborCost: string;
  partsCost: string;
  invoiceDate: string;
  dueDate: string;
  discount: string;
  taxPercentage: string;
  paidAmount: string;
  paymentStatus: PaymentStatus;
  notes: string;
};

const activeJobStatuses: JobCardStatus[] = ["inWorkshop"];
const isLiveJobCard = (jobCard: Pick<JobCard, "archived" | "status">) =>
  !jobCard.archived && activeJobStatuses.includes(jobCard.status);

const navigationItems: Array<{ key: SectionKey; translationKey: string }> = [
  { key: "dashboard", translationKey: "nav.dashboard" },
  { key: "customers", translationKey: "nav.customers" },
  { key: "vehicles", translationKey: "nav.vehicles" },
  { key: "jobCards", translationKey: "nav.jobCards" },
  { key: "inventory", translationKey: "nav.inventory" },
  { key: "purchases", translationKey: "nav.purchases" },
  { key: "expenses", translationKey: "nav.expenses" },
  { key: "invoices", translationKey: "nav.invoices" },
  { key: "reports", translationKey: "nav.reports" },
  { key: "recycleBin", translationKey: "nav.recycleBin" },
  { key: "settings", translationKey: "nav.settings" },
];

const recycleBinFilters: RecycleBinFilter[] = [
  "all",
  "customers",
  "vehicles",
  "jobCards",
  "inventory",
  "purchases",
  "expenses",
  "invoices",
];

const dashboardFinancialCardDefinitions = [
  { key: "todaysRevenue", translationKey: "cards.todaysRevenue", currency: true },
  { key: "todayExpenses", translationKey: "cards.todayExpenses", currency: true },
  { key: "todayProfit", translationKey: "cards.todayProfit", currency: true },
] as const;

const dashboardOperationsCardDefinitions = [
  { key: "activeJobs", translationKey: "cards.activeJobs" },
  { key: "pendingPayments", translationKey: "cards.pendingPayments", currency: true },
  { key: "lowStockItems", translationKey: "cards.lowStockItems" },
] as const;

const expenseCategories: ExpenseCategory[] = [
  "rent",
  "salaries",
  "utilities",
  "equipment",
  "fuel",
  "miscellaneous",
];

const expensePaymentMethods: ExpensePaymentMethod[] = [
  "cash",
  "card",
  "bankTransfer",
];

const reportRanges: ReportRange[] = ["today", "week", "month", "all"];

const defaultWorkshopSettings: WorkshopSettings = {
  workshopName: "CAR DC9",
  englishSubtitle: "Electronic Alignment & Car Services",
  arabicSubtitle: "ميزان إلكتروني وخدمات سيارات",
  phoneNumber: "0503191429",
  city: "Riyadh",
  country: "Saudi Arabia",
  address: "",
  logoInitials: "DC9",
  defaultCustomerCity: "",
  invoicePrefix: "INV",
  jobCardPrefix: "JC",
  purchaseOrderPrefix: "PO",
  defaultVatPercentage: "0",
  defaultCurrency: "SAR",
  showQrPlaceholder: true,
  defaultPaymentMethod: "cash",
  defaultPaymentStatus: "unpaid",
  lowStockAlertEnabled: true,
  archiveConfirmationEnabled: false,
  defaultLanguage: "en",
  compactModeEnabled: false,
  systemNotes: "",
};

const initialCustomers: Customer[] = [
  {
    id: 1,
    name: "Ahmed Al-Qahtani",
    phone: "+966 50 123 4567",
    city: "Riyadh",
    type: "repeat",
    notes: "",
    archived: false,
  },
  {
    id: 2,
    name: "Sarah Al-Harbi",
    phone: "+966 55 765 4321",
    city: "Jeddah",
    type: "new",
    notes: "",
    archived: false,
  },
  {
    id: 3,
    name: "Khalid Al-Otaibi",
    phone: "+966 54 222 9080",
    city: "Dammam",
    type: "repeat",
    notes: "",
    archived: false,
  },
  {
    id: 4,
    name: "Mona Al-Zahrani",
    phone: "+966 56 980 1122",
    city: "Makkah",
    type: "new",
    notes: "",
    archived: false,
  },
  {
    id: 5,
    name: "Fahad Al-Dosari",
    phone: "+966 53 441 7001",
    city: "Riyadh",
    type: "repeat",
    notes: "",
    archived: false,
  },
];

const emptyCustomerForm: CustomerForm = {
  name: "",
  phone: "",
  city: "",
  type: "new",
  notes: "",
};

const initialVehicles: Vehicle[] = [
  {
    id: 1,
    customerId: 1,
    ownerName: "Ahmed Al-Qahtani",
    plateNumber: "RHD 4821",
    make: "Toyota",
    model: "Land Cruiser",
    year: "2022",
    colorKey: "vehicles.colors.white",
    vehicleTypeKey: "vehicles.types.suv",
    notes: "",
    archived: false,
  },
  {
    id: 2,
    customerId: 2,
    ownerName: "Sarah Al-Harbi",
    plateNumber: "JDA 1190",
    make: "Hyundai",
    model: "Sonata",
    year: "2021",
    colorKey: "vehicles.colors.silver",
    vehicleTypeKey: "vehicles.types.sedan",
    notes: "",
    archived: false,
  },
  {
    id: 3,
    customerId: 3,
    ownerName: "Khalid Al-Otaibi",
    plateNumber: "DMM 7742",
    make: "Nissan",
    model: "Patrol",
    year: "2020",
    colorKey: "vehicles.colors.black",
    vehicleTypeKey: "vehicles.types.suv",
    notes: "",
    archived: false,
  },
  {
    id: 4,
    customerId: 4,
    ownerName: "Mona Al-Zahrani",
    plateNumber: "MKA 5308",
    make: "Kia",
    model: "Sportage",
    year: "2023",
    colorKey: "vehicles.colors.blue",
    vehicleTypeKey: "vehicles.types.suv",
    notes: "",
    archived: false,
  },
  {
    id: 5,
    customerId: 5,
    ownerName: "Fahad Al-Dosari",
    plateNumber: "RYD 9081",
    make: "Ford",
    model: "Ranger",
    year: "2019",
    colorKey: "vehicles.colors.gray",
    vehicleTypeKey: "vehicles.types.pickup",
    notes: "",
    archived: false,
  },
  {
    id: 6,
    customerId: 1,
    ownerName: "Ahmed Al-Qahtani",
    plateNumber: "KBR 6724",
    make: "Mercedes-Benz",
    model: "Sprinter",
    year: "2020",
    colorKey: "vehicles.colors.white",
    vehicleTypeKey: "vehicles.types.van",
    notes: "",
    archived: false,
  },
];

const emptyVehicleForm: VehicleForm = {
  ownerName: "",
  plateNumber: "",
  make: "",
  model: "",
  year: "",
  color: "",
  vehicleType: "",
  notes: "",
};

const initialJobCards: JobCard[] = [
  {
    id: 1,
    jobNumber: "JC-1001",
    vehicleId: 1,
    customerId: 1,
    date: "2026-05-03",
    status: "inWorkshop",
    customerName: "Ahmed Al-Qahtani",
    vehicleLabel: "Toyota Land Cruiser",
    plateNumber: "RHD 4821",
    complaint: "Brake noise and delayed oil service",
    workPerformed: "Brake inspection and engine oil replacement",
    mechanic: "Yousef",
    laborCost: 450,
    partsCost: 400,
    partsUsed: [],
    paidAmount: 0,
    paymentStatus: "unpaid",
    notes: "Brake inspection and oil service",
    archived: false,
    stockDeducted: false,
    deductedParts: [],
  },
  {
    id: 2,
    jobNumber: "JC-1002",
    vehicleId: 2,
    customerId: 2,
    date: "2026-05-04",
    status: "completed",
    customerName: "Sarah Al-Harbi",
    vehicleLabel: "Hyundai Sonata",
    plateNumber: "JDA 1190",
    complaint: "Routine service",
    workPerformed: "Changed oil, filters, and checked fluids",
    mechanic: "Nasser",
    laborCost: 220,
    partsCost: 200,
    partsUsed: [],
    paidAmount: 420,
    paymentStatus: "paid",
    notes: "Regular service",
    archived: false,
    stockDeducted: true,
    deductedParts: [],
  },
  {
    id: 3,
    jobNumber: "JC-1003",
    vehicleId: 3,
    customerId: 3,
    date: "2026-04-29",
    status: "completed",
    customerName: "Khalid Al-Otaibi",
    vehicleLabel: "Nissan Patrol",
    plateNumber: "DMM 7742",
    complaint: "Front suspension vibration",
    workPerformed: "Replaced control arm bushings",
    mechanic: "Faisal",
    laborCost: 500,
    partsCost: 700,
    partsUsed: [],
    paidAmount: 500,
    paymentStatus: "partial",
    notes: "Suspension repair",
    archived: false,
    stockDeducted: true,
    deductedParts: [],
  },
  {
    id: 4,
    jobNumber: "JC-1004",
    vehicleId: 4,
    customerId: 4,
    date: "2026-04-26",
    status: "completed",
    customerName: "Mona Al-Zahrani",
    vehicleLabel: "Kia Sportage",
    plateNumber: "MKA 5308",
    complaint: "AC cooling is weak",
    workPerformed: "AC diagnosis and refrigerant top-up",
    mechanic: "Omar",
    laborCost: 180,
    partsCost: 140,
    partsUsed: [],
    paidAmount: 320,
    paymentStatus: "paid",
    notes: "AC diagnosis",
    archived: false,
    stockDeducted: true,
    deductedParts: [],
  },
  {
    id: 5,
    jobNumber: "JC-1005",
    vehicleId: 5,
    customerId: 5,
    date: "2026-05-01",
    status: "inWorkshop",
    customerName: "Fahad Al-Dosari",
    vehicleLabel: "Ford Ranger",
    plateNumber: "RYD 9081",
    complaint: "Transmission slipping",
    workPerformed: "Transmission scan and road test",
    mechanic: "Majed",
    laborCost: 390,
    partsCost: 250,
    partsUsed: [],
    paidAmount: 0,
    paymentStatus: "unpaid",
    notes: "Transmission check",
    archived: false,
    stockDeducted: false,
    deductedParts: [],
  },
  {
    id: 6,
    jobNumber: "JC-1006",
    vehicleId: 6,
    customerId: 1,
    date: "2026-04-20",
    status: "completed",
    customerName: "Ahmed Al-Qahtani",
    vehicleLabel: "Mercedes-Benz Sprinter",
    plateNumber: "KBR 6724",
    complaint: "Fleet van scheduled service",
    workPerformed: "Full inspection and preventive service",
    mechanic: "Yousef",
    laborCost: 480,
    partsCost: 500,
    partsUsed: [],
    paidAmount: 980,
    paymentStatus: "paid",
    notes: "Fleet van service",
    archived: false,
    stockDeducted: true,
    deductedParts: [],
  },
];

const emptyJobCardForm: JobCardForm = {
  jobNumber: "",
  vehicleId: "",
  date: "",
  status: "inWorkshop",
  complaint: "",
  workPerformed: "",
  mechanic: "",
  laborCost: "0",
  partsCost: "0",
  partsUsed: [],
  paidAmount: "0",
  paymentStatus: "unpaid",
  notes: "",
};

const initialInventoryItems: InventoryItem[] = [
  {
    id: 1,
    itemName: "Engine Oil",
    arabicItemName: "زيت المحرك",
    category: "Lubricants",
    sku: "OIL-5W30-4L",
    brand: "Shell",
    supplierName: "Gulf Auto Supplies",
    itemType: "stock",
    stockQuantity: 18,
    unitType: "liter",
    costPrice: 32,
    sellingPrice: 48,
    minimumStock: 12,
    location: "A1",
    notes: "Synthetic 5W-30 oil",
    archived: false,
  },
  {
    id: 2,
    itemName: "Oil Filter",
    arabicItemName: "فلتر زيت",
    category: "Filters",
    sku: "FLT-OIL-TY01",
    brand: "Denso",
    supplierName: "Riyadh Parts Co.",
    itemType: "stock",
    stockQuantity: 9,
    unitType: "piece",
    costPrice: 22,
    sellingPrice: 38,
    minimumStock: 10,
    location: "B2",
    notes: "Common Toyota fitment",
    archived: false,
  },
  {
    id: 3,
    itemName: "Air Filter",
    arabicItemName: "فلتر هواء",
    category: "Filters",
    sku: "FLT-AIR-HY02",
    brand: "Mann Filter",
    supplierName: "Jeddah Auto Trading",
    itemType: "stock",
    stockQuantity: 14,
    unitType: "piece",
    costPrice: 28,
    sellingPrice: 50,
    minimumStock: 8,
    location: "B3",
    notes: "Sedan and SUV stock",
    archived: false,
  },
  {
    id: 4,
    itemName: "Brake Pads",
    arabicItemName: "فحمات فرامل",
    category: "Brake System",
    sku: "BRK-PAD-FR01",
    brand: "Brembo",
    supplierName: "Eastern Brake Supply",
    itemType: "stock",
    stockQuantity: 5,
    unitType: "set",
    costPrice: 145,
    sellingPrice: 230,
    minimumStock: 6,
    location: "C1",
    notes: "Front axle set",
    archived: false,
  },
  {
    id: 5,
    itemName: "Spark Plug",
    arabicItemName: "بواجي",
    category: "Ignition",
    sku: "IGN-SPK-NG01",
    brand: "NGK",
    supplierName: "Riyadh Parts Co.",
    itemType: "stock",
    stockQuantity: 36,
    unitType: "piece",
    costPrice: 18,
    sellingPrice: 32,
    minimumStock: 16,
    location: "D4",
    notes: "Iridium plug",
    archived: false,
  },
  {
    id: 6,
    itemName: "Wheel Alignment Service",
    arabicItemName: "خدمة ميزان الأذرعة",
    category: "Services",
    sku: "SRV-ALIGN-001",
    brand: "CAR DC9",
    supplierName: "In-house",
    itemType: "service",
    stockQuantity: 1,
    unitType: "set",
    costPrice: 0,
    sellingPrice: 150,
    minimumStock: 0,
    location: "Service Bay",
    notes: "Service item for billing later",
    archived: false,
  },
];

const emptyInventoryForm: InventoryForm = {
  itemName: "",
  arabicItemName: "",
  category: "",
  sku: "",
  brand: "",
  supplierName: "",
  itemType: "stock",
  stockQuantity: "0",
  unitType: "piece",
  costPrice: "0",
  sellingPrice: "0",
  minimumStock: "0",
  location: "",
  notes: "",
};

const initialPurchases: Purchase[] = [
  {
    id: 1,
    purchaseId: "PO-1001",
    supplierName: "Gulf Auto Supplies",
    purchaseDate: "2026-05-01",
    items: [
      {
        rowId: "mock-po-1001-1",
        inventoryItemId: 1,
        itemName: "Engine Oil",
        arabicItemName: "زيت المحرك",
        sku: "OIL-5W30-4L",
        currentStock: 8,
        quantity: 10,
        costPrice: 32,
        lineTotal: 320,
      },
      {
        rowId: "mock-po-1001-2",
        inventoryItemId: 2,
        itemName: "Oil Filter",
        arabicItemName: "فلتر زيت",
        sku: "FLT-OIL-TY01",
        currentStock: 5,
        quantity: 4,
        costPrice: 22,
        lineTotal: 88,
      },
    ],
    totalQuantity: 14,
    totalAmount: 408,
    paymentStatus: "paid",
    notes: "Monthly fast-moving service stock.",
    createdBy: "Hamza",
  },
  {
    id: 2,
    purchaseId: "PO-1002",
    supplierName: "Eastern Brake Supply",
    purchaseDate: "2026-05-03",
    items: [
      {
        rowId: "mock-po-1002-1",
        inventoryItemId: 4,
        itemName: "Brake Pads",
        arabicItemName: "فحمات فرامل",
        sku: "BRK-PAD-FR01",
        currentStock: 2,
        quantity: 3,
        costPrice: 145,
        lineTotal: 435,
      },
    ],
    totalQuantity: 3,
    totalAmount: 435,
    paymentStatus: "partial",
    notes: "Front brake pad sets for scheduled jobs.",
    createdBy: "Hamza",
  },
];

const initialExpenses: Expense[] = [
  {
    id: 1,
    title: "Workshop rent",
    category: "rent",
    amount: 12000,
    date: "2026-05-01",
    paymentMethod: "bankTransfer",
    notes: "Monthly facility rent.",
    createdBy: "Hamza",
    archived: false,
  },
  {
    id: 2,
    title: "Technician salaries",
    category: "salaries",
    amount: 18500,
    date: "2026-05-02",
    paymentMethod: "bankTransfer",
    notes: "Payroll advance for service team.",
    createdBy: "Hamza",
    archived: false,
  },
  {
    id: 3,
    title: "Fuel for pickup",
    category: "fuel",
    amount: 420,
    date: "2026-05-04",
    paymentMethod: "cash",
    notes: "Customer pickup and supplier visits.",
    createdBy: "Hamza",
    archived: false,
  },
];

const emptyPurchaseForm: PurchaseForm = {
  supplierName: "",
  purchaseDate: "",
  paymentStatus: "unpaid",
  notes: "",
  items: [],
};

const emptyExpenseForm: ExpenseForm = {
  title: "",
  category: "rent",
  amount: "",
  date: "",
  paymentMethod: "cash",
  notes: "",
  createdBy: "Hamza",
};

const emptyInvoiceForm: InvoiceForm = {
  invoiceType: "quick",
  jobCardId: "",
  customerId: "",
  customerName: "",
  customerPhone: "",
  customerCity: "",
  vehicleId: "",
  vehiclePlateNumber: "",
  vehicleMake: "",
  vehicleModel: "",
  vehicleYear: "",
  vehicleColor: "",
  vehicleType: "",
  workPerformed: "",
  laborCost: "",
  partsCost: "",
  invoiceDate: "",
  dueDate: "",
  discount: "0",
  taxPercentage: "0",
  paidAmount: "0",
  paymentStatus: "unpaid",
  notes: "",
};

type DemoPersistedData = {
  customers: Customer[];
  vehicles: Vehicle[];
  jobCards: JobCard[];
  inventoryItems: InventoryItem[];
  purchases: Purchase[];
  expenses: Expense[];
  invoices: Invoice[];
  settings: WorkshopSettings;
};

const createRecordId = workshopDataService.createRecordId;
const OWNER_DELETE_CODE = "DC9-OWNER-2026";
const subscribeToHydration = () => () => {};
const getHydratedSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

const getDefaultDemoData = (): DemoPersistedData => ({
  customers: initialCustomers,
  vehicles: initialVehicles,
  jobCards: initialJobCards,
  inventoryItems: initialInventoryItems,
  purchases: initialPurchases,
  expenses: initialExpenses,
  invoices: [],
  settings: defaultWorkshopSettings,
});

const backupDataKeys = [
  "customers",
  "vehicles",
  "jobCards",
  "inventoryItems",
  "purchases",
  "expenses",
  "invoices",
  "settings",
];

const backupArrayDataKeys = backupDataKeys.filter((key) => key !== "settings");

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const isValidBackupDataShape = (
  value: unknown,
): value is Partial<DemoPersistedData> => {
  if (!isObjectRecord(value) || !isObjectRecord(value.settings)) {
    return false;
  }

  return backupArrayDataKeys.every((key) => Array.isArray(value[key]));
};

const isSectionKey = (value: string): value is SectionKey =>
  navigationItems.some((item) => item.key === value);

const getSafeString = (value: unknown) =>
  typeof value === "string" ? value : "";

const arabicIndicDigits: Record<string, string> = {
  "٠": "0",
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
  "۰": "0",
  "۱": "1",
  "۲": "2",
  "۳": "3",
  "۴": "4",
  "۵": "5",
  "۶": "6",
  "۷": "7",
  "۸": "8",
  "۹": "9",
};

const normalizeNumberInput = (value: unknown) => {
  const rawValue =
    typeof value === "number" && Number.isFinite(value)
      ? String(value)
      : getSafeString(value);

  return rawValue
    .trim()
    .replace(/[٠-٩۰-۹]/g, (digit) => arabicIndicDigits[digit] ?? digit)
    .replace(/٫/g, ".")
    .replace(/[٬,]/g, "")
    .replace(/\s+/g, "");
};

const parseSafeNumber = (value: unknown) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const normalizedValue = normalizeNumberInput(value);

  if (!normalizedValue || !/^-?(?:\d+|\d*\.\d+)$/.test(normalizedValue)) {
    return null;
  }

  const parsedValue = Number(normalizedValue);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const validateNonNegativeAmount = (value: unknown, label: string) => {
  const parsedValue = parseSafeNumber(value);

  if (parsedValue === null || parsedValue < 0) {
    return {
      errorKey: "toast.amountInvalid",
      label,
      value: null,
    };
  }

  return {
    errorKey: null,
    label,
    value: parsedValue,
  };
};

const roundMoney = (value: number) =>
  Number.isFinite(value) ? Math.round((value + Number.EPSILON) * 100) / 100 : 0;

const validatePaidAmount = (paid: unknown, total: number) => {
  const paidValidation = validateNonNegativeAmount(paid, "paidAmount");

  if (paidValidation.errorKey || paidValidation.value === null) {
    return paidValidation;
  }

  const roundedPaidAmount = roundMoney(paidValidation.value);
  const roundedTotal = roundMoney(total);

  if (roundedPaidAmount > roundedTotal) {
    return {
      errorKey: "toast.paidAmountTooHigh",
      label: paidValidation.label,
      value: null,
    };
  }

  return {
    ...paidValidation,
    value: roundedPaidAmount,
  };
};

const validateOptionalNonNegativeAmount = (value: unknown, label: string) =>
  normalizeNumberInput(value) === ""
    ? { errorKey: null, value: 0 }
    : validateNonNegativeAmount(value, label);

const getFinancialInputErrorKey = (
  value: unknown,
  errorKey = "toast.amountInvalid",
) => {
  if (normalizeNumberInput(value) === "") {
    return null;
  }

  const parsedValue = parseSafeNumber(value);
  return parsedValue === null || parsedValue < 0 ? errorKey : null;
};

const getInvoiceMoneyInputErrorKey = (value: unknown) => {
  if (normalizeNumberInput(value) === "") {
    return null;
  }

  const parsedValue = parseSafeNumber(value);

  if (parsedValue !== null && parsedValue < 0) {
    return "toast.negativeValuesNotAllowed";
  }

  return parsedValue === null ? "toast.amountInvalid" : null;
};

const getPaidAmountInputErrorKey = (paid: unknown, total: number) => {
  if (normalizeNumberInput(paid) === "") {
    return null;
  }

  const paidValidation = validatePaidAmount(paid, total);
  return paidValidation.errorKey;
};

const cleanSaudiPhoneInput = (value: unknown) =>
  getSafeString(value).trim().replace(/[\s\-()]/g, "");

const getCleanPhoneDigits = (value: unknown) => {
  const compactValue = cleanSaudiPhoneInput(value);

  if (!compactValue) {
    return null;
  }

  if (!/^\+?\d+$/.test(compactValue)) {
    return null;
  }

  return compactValue.replace(/^\+/, "");
};

const getSaudiLocalDigits = (value: unknown) => {
  let digits = getCleanPhoneDigits(value);

  if (digits === null) {
    return null;
  }

  if (digits.startsWith("966")) {
    digits = digits.slice(3);
  } else if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  return digits;
};

const normalizeSaudiPhone = (value: unknown) => {
  const rawValue = getSafeString(value).trim();

  if (!rawValue) {
    return "";
  }

  const compactValue = cleanSaudiPhoneInput(value);

  if (/^\+\d+$/.test(compactValue)) {
    return compactValue;
  }

  const localDigits = getSaudiLocalDigits(value);

  if (localDigits === null) {
    return rawValue;
  }

  if (!localDigits) {
    return "+966";
  }

  return `+966${localDigits}`;
};

const formatSaudiPhone = (value: unknown) => {
  const normalizedPhone = normalizeSaudiPhone(value);
  const isNormalizedSaudiPhone = /^\+966\d+$/.test(normalizedPhone);

  if (!isNormalizedSaudiPhone) {
    return normalizedPhone;
  }

  const localDigits = normalizedPhone.replace(/^\+966/, "");

  if (!localDigits) {
    return normalizedPhone;
  }

  const firstGroup = localDigits.slice(0, 2);
  const secondGroup = localDigits.slice(2, 5);
  const thirdGroup = localDigits.slice(5, 9);

  return ["+966", firstGroup, secondGroup, thirdGroup].filter(Boolean).join(" ");
};

const isValidSaudiPhone = (value: string) =>
  /^(05\d{8}|01\d{8})$/.test(cleanSaudiPhoneInput(value)) ||
  /^\+\d{7,15}$/.test(cleanSaudiPhoneInput(value));

const normalizeSearchName = (value: unknown) =>
  getSafeString(value).trim().replace(/\s+/g, " ").toLowerCase();

const getSafeNumber = (value: unknown, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value)
    ? value
    : typeof value === "string" && parseSafeNumber(value) !== null
      ? (parseSafeNumber(value) ?? fallback)
      : fallback;

const isStoredRecord = <T,>(value: T | null | undefined): value is T =>
  Boolean(value) && typeof value === "object";

const getSafePaymentStatus = (value: unknown): PaymentStatus =>
  value === "paid" || value === "partial" || value === "unpaid"
    ? value
    : "unpaid";

const getSyncedPersistedPayment = (
  paymentStatus: PaymentStatus,
  paidAmount: number,
  totalAmount: number,
) => {
  if (paymentStatus === "paid") {
    return {
      paidAmount: totalAmount,
      paymentStatus: "paid" as const,
    };
  }

  if (paymentStatus === "unpaid") {
    return {
      paidAmount: 0,
      paymentStatus: "unpaid" as const,
    };
  }

  const safePaidAmount = Math.min(Math.max(0, paidAmount), totalAmount);

  return {
    paidAmount: safePaidAmount,
    paymentStatus: getPaymentStatusFromAmounts(safePaidAmount, totalAmount),
  };
};

type FinancialCalculationInput = {
  invoices: Invoice[];
  purchases: Purchase[];
  expenses: Expense[];
  isInRange: (date: string) => boolean;
};

const calculatePaidRevenue = (invoices: Invoice[]) =>
  roundMoney(invoices.reduce((total, invoice) => total + invoice.paidAmount, 0));

const calculateOutstandingBalance = (invoices: Invoice[]) =>
  roundMoney(
    invoices.reduce((total, invoice) => total + invoice.remainingBalance, 0),
  );

const calculateRealExpenses = (expenses: Expense[], purchases: Purchase[]) => {
  const expenseTotal = expenses.reduce(
    (total, expense) => total + expense.amount,
    0,
  );
  const purchaseTotal = purchases.reduce(
    (total, purchase) => total + purchase.totalAmount,
    0,
  );

  return {
    expenseTotal: roundMoney(expenseTotal),
    purchaseTotal: roundMoney(purchaseTotal),
    total: roundMoney(expenseTotal + purchaseTotal),
  };
};

const calculateNetProfit = (paidRevenue: number, realExpenses: number) =>
  roundMoney(paidRevenue - realExpenses);

const calculateFinancialSummary = ({
  expenses,
  invoices,
  isInRange,
  purchases,
}: FinancialCalculationInput) => {
  const scopedInvoices = invoices.filter(
    (invoice) => !invoice.archived && isInRange(invoice.invoiceDate),
  );
  const scopedExpenses = expenses.filter(
    (expense) => !expense.archived && isInRange(expense.date),
  );
  const scopedPurchases = purchases.filter((purchase) =>
    isInRange(purchase.purchaseDate),
  );
  const invoiceGrandTotal = scopedInvoices.reduce(
    (total, invoice) => total + invoice.grandTotal,
    0,
  );
  const paidRevenue = calculatePaidRevenue(scopedInvoices);
  const outstandingBalance = calculateOutstandingBalance(scopedInvoices);
  const realExpenses = calculateRealExpenses(scopedExpenses, scopedPurchases);

  return {
    invoices: scopedInvoices,
    expenses: scopedExpenses,
    purchases: scopedPurchases,
    invoiceGrandTotal: roundMoney(invoiceGrandTotal),
    paidRevenue,
    outstandingBalance,
    workshopExpenses: realExpenses.expenseTotal,
    purchaseCosts: realExpenses.purchaseTotal,
    totalExpenses: realExpenses.total,
    netProfit: calculateNetProfit(paidRevenue, realExpenses.total),
  };
};

const normalizePersistedAppData = (
  storedData: Partial<DemoPersistedData>,
): DemoPersistedData => {
  const fallback = getDefaultDemoData();

  return {
    customers: (Array.isArray(storedData.customers) ? storedData.customers : fallback.customers)
      .filter(isStoredRecord)
      .map((customer) => ({
        ...customer,
        phone: normalizeSaudiPhone(customer.phone),
      })),
    vehicles: (Array.isArray(storedData.vehicles) ? storedData.vehicles : fallback.vehicles).filter(
      isStoredRecord,
    ),
    jobCards: (Array.isArray(storedData.jobCards) ? storedData.jobCards : fallback.jobCards).filter(
      isStoredRecord,
    ).map(
      (jobCard) => {
        const totalAmount = getSafeNumber(jobCard.laborCost) + getSafeNumber(jobCard.partsCost);
        const syncedPayment = getSyncedPersistedPayment(
          getSafePaymentStatus(jobCard.paymentStatus),
          getSafeNumber(jobCard.paidAmount),
          totalAmount,
        );

        return {
          ...jobCard,
          laborCost: getSafeNumber(jobCard.laborCost),
          partsCost: getSafeNumber(jobCard.partsCost),
          partsUsed: Array.isArray(jobCard.partsUsed)
            ? jobCard.partsUsed.filter(isStoredRecord)
            : [],
          paidAmount: syncedPayment.paidAmount,
          paymentStatus: syncedPayment.paymentStatus,
          stockDeducted: jobCard.stockDeducted === true,
          deductedParts: Array.isArray(jobCard.deductedParts)
            ? jobCard.deductedParts.filter(isStoredRecord)
            : [],
        };
      },
    ),
    inventoryItems: (
      Array.isArray(storedData.inventoryItems)
        ? storedData.inventoryItems
        : fallback.inventoryItems
    ).filter(isStoredRecord),
    purchases: (Array.isArray(storedData.purchases) ? storedData.purchases : fallback.purchases).filter(
      isStoredRecord,
    ),
    expenses: (Array.isArray(storedData.expenses) ? storedData.expenses : fallback.expenses).filter(
      isStoredRecord,
    ),
    invoices: (Array.isArray(storedData.invoices) ? storedData.invoices : fallback.invoices).filter(
      isStoredRecord,
    ).map(
      (invoice) => {
        const legacyInvoice = invoice as Invoice & { taxPercentage?: number };
        const laborCost = getSafeNumber(invoice.laborCost);
        const partsCost = getSafeNumber(invoice.partsCost);
        const subtotal = laborCost + partsCost;
        const discount = getSafeNumber(invoice.discount);
        const legacyTaxAmount = getSafeNumber(invoice.taxAmount);
        const taxPercentage = getSafeNumber(
          legacyInvoice.taxPercentage,
          subtotal > 0 ? (legacyTaxAmount / subtotal) * 100 : 0,
        );
        const taxAmount = subtotal * (taxPercentage / 100);
        const grandTotal = Math.max(0, subtotal + taxAmount - discount);
        const syncedPayment = getSyncedPersistedPayment(
          getSafePaymentStatus(invoice.paymentStatus),
          getSafeNumber(invoice.paidAmount),
          grandTotal,
        );

        return {
          ...invoice,
          customerPhone: normalizeSaudiPhone(invoice.customerPhone),
          laborCost,
          partsCost,
          subtotal,
          discount,
          taxPercentage,
          taxAmount,
          grandTotal,
          paidAmount: syncedPayment.paidAmount,
          remainingBalance: Math.max(0, grandTotal - syncedPayment.paidAmount),
          paymentStatus: syncedPayment.paymentStatus,
        };
      },
    ),
    settings: {
      ...fallback.settings,
      ...(storedData.settings ?? {}),
      phoneNumber: normalizeSaudiPhone(
        storedData.settings?.phoneNumber ?? fallback.settings.phoneNumber,
      ),
      defaultLanguage:
        storedData.settings?.defaultLanguage === "ar" ||
        storedData.settings?.defaultLanguage === "en"
          ? storedData.settings.defaultLanguage
          : fallback.settings.defaultLanguage,
    },
  };
};

const loadAppData = () => {
  const fallback = getDefaultDemoData();
  const storedData = workshopDataService.loadAppData<DemoPersistedData>(fallback);

  return normalizePersistedAppData(storedData);
};

const saveAppData = (data: DemoPersistedData) => {
  return workshopDataService.saveAppData(data);
};

export default function Home() {
  const { dir, isLanguageReady, locale, setLocale, t } = useLanguage();
  const isAppHydrated = useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydrationSnapshot,
  );
  const [initialDemoData] = useState<DemoPersistedData>(loadAppData);
  const [appData, setAppData] = useState<DemoPersistedData>(initialDemoData);
  const [activeSection, setActiveSection] = useState<SectionKey>(() => {
    const storedSection = workshopDataService.loadActiveSection("dashboard");

    return isSectionKey(storedSection) ? storedSection : "dashboard";
  });
  const updateAppDataSlice = <Key extends keyof DemoPersistedData>(
    key: Key,
    value: SetStateAction<DemoPersistedData[Key]>,
  ) => {
    setAppData((currentData) => {
      const nextValue =
        typeof value === "function"
          ? (value as (currentValue: DemoPersistedData[Key]) => DemoPersistedData[Key])(
              currentData[key],
            )
          : value;

      return Object.is(currentData[key], nextValue)
        ? currentData
        : {
            ...currentData,
            [key]: nextValue,
          };
    });
  };

  const customers = appData.customers;
  const vehicles = appData.vehicles;
  const jobCards = appData.jobCards;
  const inventoryItems = appData.inventoryItems;
  const purchases = appData.purchases;
  const expenses = appData.expenses;
  const invoices = appData.invoices;
  const settings = appData.settings;

  const updateCustomers = (value: SetStateAction<Customer[]>) =>
    updateAppDataSlice("customers", value);
  const updateVehicles = (value: SetStateAction<Vehicle[]>) =>
    updateAppDataSlice("vehicles", value);
  const updateJobCards = (value: SetStateAction<JobCard[]>) =>
    updateAppDataSlice("jobCards", value);
  const updateInventory = (value: SetStateAction<InventoryItem[]>) =>
    updateAppDataSlice("inventoryItems", value);
  const updatePurchases = (value: SetStateAction<Purchase[]>) =>
    updateAppDataSlice("purchases", value);
  const updateExpenses = (value: SetStateAction<Expense[]>) =>
    updateAppDataSlice("expenses", value);
  const updateInvoices = (value: SetStateAction<Invoice[]>) =>
    updateAppDataSlice("invoices", value);
  const updateSettings = (value: SetStateAction<WorkshopSettings>) =>
    updateAppDataSlice("settings", value);

  const setCustomers = updateCustomers;
  const setVehicles = updateVehicles;
  const setJobCards = updateJobCards;
  const setInventoryItems = updateInventory;
  const setPurchases = updatePurchases;
  const setExpenses = updateExpenses;
  const setInvoices = updateInvoices;
  const setSettings = updateSettings;

  const [customerSearch, setCustomerSearch] = useState("");
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState<CustomerForm>(emptyCustomerForm);
  const [editingCustomerId, setEditingCustomerId] = useState<number | null>(null);
  const [customerTab, setCustomerTab] = useState<RecordTab>("active");
  const [customerPhoneError, setCustomerPhoneError] = useState(false);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [vehicleForm, setVehicleForm] = useState<VehicleForm>(emptyVehicleForm);
  const [editingVehicleId, setEditingVehicleId] = useState<number | null>(null);
  const [vehicleModalSource, setVehicleModalSource] = useState<"vehicles" | "jobCard" | null>(null);
  const [historyVehicleId, setHistoryVehicleId] = useState<number | null>(null);
  const [vehicleTab, setVehicleTab] = useState<RecordTab>("active");
  const [isJobCardModalOpen, setIsJobCardModalOpen] = useState(false);
  const [jobCardForm, setJobCardForm] = useState<JobCardForm>(emptyJobCardForm);
  const [editingJobCardId, setEditingJobCardId] = useState<number | null>(null);
  const [jobCardTab, setJobCardTab] = useState<RecordTab>("active");
  const [jobCardSearch, setJobCardSearch] = useState("");
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryTab, setInventoryTab] = useState<RecordTab>("active");
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [inventoryForm, setInventoryForm] =
    useState<InventoryForm>(emptyInventoryForm);
  const [editingInventoryItemId, setEditingInventoryItemId] =
    useState<number | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [editingPurchaseId, setEditingPurchaseId] = useState<number | null>(null);
  const [purchaseForm, setPurchaseForm] = useState<PurchaseForm>(emptyPurchaseForm);
  const [expandedPurchaseId, setExpandedPurchaseId] = useState<number | null>(null);
  const [duplicatePurchaseRowId, setDuplicatePurchaseRowId] = useState<string | null>(
    null,
  );
  const [expenseTab, setExpenseTab] = useState<RecordTab>("active");
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState<ExpenseForm>(emptyExpenseForm);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceTab, setInvoiceTab] = useState<RecordTab>("active");
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState<InvoiceForm>(emptyInvoiceForm);
  const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null);
  const [printInvoiceId, setPrintInvoiceId] = useState<number | null>(null);
  const [isPrintRendering, setIsPrintRendering] = useState(false);
  const [correctionInvoiceId, setCorrectionInvoiceId] = useState<number | null>(null);
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctingJobCardId, setCorrectingJobCardId] = useState<number | null>(null);
  const [reportRange, setReportRange] = useState<ReportRange>("month");
  const [recycleBinFilter, setRecycleBinFilter] = useState<RecycleBinFilter>("all");
  const [recycleBinSearch, setRecycleBinSearch] = useState("");
  const [pendingPermanentDelete, setPendingPermanentDelete] =
    useState<PendingPermanentDelete | null>(null);
  const [permanentDeleteConfirmation, setPermanentDeleteConfirmation] =
    useState("");
  const [ownerDeleteCodeInput, setOwnerDeleteCodeInput] = useState("");
  const [settingsDraft, setSettingsDraft] = useState<WorkshopSettings>(
    initialDemoData.settings,
  );
  const [settingsSavedMessage, setSettingsSavedMessage] = useState<string | null>(null);
  const [settingsPhoneError, setSettingsPhoneError] = useState(false);
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);

  const isArabic = locale === "ar";
  const numberLocale = isArabic ? "ar-SA" : "en-SA";
  const workshopSubtitle = isArabic ? settings.arabicSubtitle : settings.englishSubtitle;

  useEffect(() => {
    if (!isAppHydrated) {
      return;
    }

    workshopDataService.saveActiveSection(activeSection);
  }, [activeSection, isAppHydrated]);

  useEffect(() => {
    if (!isAppHydrated) {
      return;
    }

    const saveResult = saveAppData(appData);

    if (!saveResult.ok) {
      showToast(
        saveResult.error === "quotaExceeded"
          ? "toast.storageQuotaExceeded"
          : "toast.storageSaveFailed",
      );
    }
  }, [appData, isAppHydrated]);

  useEffect(() => {
    document.body.classList.toggle(
      "invoice-printing",
      printInvoiceId !== null || isPrintRendering,
    );

    return () => {
      document.body.classList.remove("invoice-printing");
    };
  }, [isPrintRendering, printInvoiceId]);

  useEffect(() => {
    const finishPrintRendering = () => {
      setIsPrintRendering(false);
    };

    window.addEventListener("afterprint", finishPrintRendering);

    return () => {
      window.removeEventListener("afterprint", finishPrintRendering);
    };
  }, []);

  const formatPhone = (value: string) =>
    value ? formatSaudiPhone(value) : t("common.notAvailable");

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();

    return customers.filter((customer) => {
      if (customer.archived !== (customerTab === "archived")) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [customer.name, customer.phone, formatSaudiPhone(customer.phone), customer.city].some((value) =>
        value.toLowerCase().includes(query),
      );
    });
  }, [customerSearch, customers, customerTab]);

  const filteredVehicles = useMemo(() => {
    const query = vehicleSearch.trim().toLowerCase();

    return vehicles.filter((vehicle) => {
      if (vehicle.archived !== (vehicleTab === "archived")) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        vehicle.ownerName,
        vehicle.plateNumber,
        vehicle.make,
        vehicle.model,
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [vehicleSearch, vehicles, vehicleTab]);

  const filteredJobCards = useMemo(() => {
    const query = jobCardSearch.trim().toLowerCase();

    return jobCards.filter((jobCard) => {
      if (jobCard.archived !== (jobCardTab === "archived")) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        jobCard.jobNumber,
        jobCard.customerName,
        jobCard.vehicleLabel,
        jobCard.plateNumber,
        jobCard.mechanic,
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [jobCardSearch, jobCards, jobCardTab]);

  const filteredInventoryItems = useMemo(() => {
    const query = inventorySearch.trim().toLowerCase();

    return inventoryItems.filter((item) => {
      if (item.archived !== (inventoryTab === "archived")) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        item.itemName,
        item.arabicItemName,
        item.category,
        item.sku,
        item.brand,
        item.supplierName,
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [inventoryItems, inventorySearch, inventoryTab]);

  const filteredInvoices = useMemo(() => {
    const query = invoiceSearch.trim().toLowerCase();

    return invoices.filter((invoice) => {
      if (invoice.archived !== (invoiceTab === "archived")) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        invoice.invoiceNumber,
        invoice.customerName,
        invoice.customerPhone,
        invoice.customerCity ?? "",
        formatSaudiPhone(invoice.customerPhone),
        invoice.vehicle,
        invoice.plateNumber,
        invoice.jobCardNumber,
      ].some((value) => value.toLowerCase().includes(query));
    });
  }, [invoiceSearch, invoices, invoiceTab]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((expense) => expense.archived === (expenseTab === "archived"));
  }, [expenseTab, expenses]);

  const activeExpenses = useMemo(
    () => expenses.filter((expense) => !expense.archived),
    [expenses],
  );

  const currentDate = new Date();
  const currentWeekday = currentDate.getDay();
  const weekStartDate = new Date(currentDate);
  weekStartDate.setDate(currentDate.getDate() - (currentWeekday === 0 ? 6 : currentWeekday - 1));
  weekStartDate.setHours(0, 0, 0, 0);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekStartDate.getDate() + 6);
  weekEndDate.setHours(23, 59, 59, 999);
  const isDateInReportRange = (value: string, range: ReportRange) => {
    const recordDate = new Date(value);

    if (range === "all") {
      return true;
    }

    if (range === "today") {
      return recordDate.toDateString() === currentDate.toDateString();
    }

    if (range === "week") {
      return recordDate >= weekStartDate && recordDate <= weekEndDate;
    }

    return (
      recordDate.getMonth() === currentDate.getMonth() &&
      recordDate.getFullYear() === currentDate.getFullYear()
    );
  };

  const monthlyExpenseTotal = activeExpenses.reduce(
    (total, expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentDate.getMonth() &&
        expenseDate.getFullYear() === currentDate.getFullYear()
        ? total + expense.amount
        : total;
    },
    0,
  );
  const weeklyExpenseTotal = activeExpenses.reduce(
    (total, expense) => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= weekStartDate && expenseDate <= weekEndDate
        ? total + expense.amount
        : total;
    },
    0,
  );
  const largestExpenseAmount = activeExpenses.reduce(
    (highestAmount, expense) => Math.max(highestAmount, expense.amount),
    0,
  );
  const expenseCategoryTotals = expenseCategories.map((category) => ({
    category,
    total: activeExpenses
      .filter((expense) => expense.category === category)
      .reduce((total, expense) => total + expense.amount, 0),
  }));
  const activeInvoiceJobCardIds = new Set(
    invoices.filter((invoice) => !invoice.archived).map((invoice) => invoice.jobCardId),
  );
  const hasActiveInvoiceForJobCard = (
    jobCardId: number,
    excludeInvoiceId?: number,
  ) =>
    jobCardId > 0 &&
    invoices.some(
      (invoice) =>
        !invoice.archived &&
        invoice.jobCardId === jobCardId &&
        invoice.id !== excludeInvoiceId,
    );
  const dashboardActiveJobs = jobCards.filter(
    (jobCard) =>
      !jobCard.archived &&
      jobCard.status !== "completed" &&
      jobCard.status !== "cancelled",
  );
  const dashboardFinancials = calculateFinancialSummary({
    expenses,
    invoices,
    purchases,
    isInRange: (date) => isDateInReportRange(date, "today"),
  });
  const dashboardLowStockItems = inventoryItems.filter(
    (item) => !item.archived && item.stockQuantity <= item.minimumStock,
  );
  const dashboardStats = {
    activeJobs: dashboardActiveJobs.length,
    todaysRevenue: dashboardFinancials.paidRevenue,
    todayExpenses: dashboardFinancials.totalExpenses,
    todayProfit: dashboardFinancials.netProfit,
    pendingPayments: dashboardFinancials.outstandingBalance,
    lowStockItems: dashboardLowStockItems.length,
  };
  const dashboardFinancialCards = dashboardFinancialCardDefinitions.map((card) => ({
    ...card,
    value: dashboardStats[card.key],
  }));
  const dashboardOperationsCards = dashboardOperationsCardDefinitions.map((card) => ({
    ...card,
    value: dashboardStats[card.key],
  }));
  const reportFinancials = calculateFinancialSummary({
    expenses,
    invoices,
    purchases,
    isInRange: (date) => isDateInReportRange(date, reportRange),
  });
  const reportInvoices = reportFinancials.invoices;
  const reportExpenses = reportFinancials.expenses;
  const reportPurchases = reportFinancials.purchases;
  const reportCompletedJobs = jobCards.filter(
    (jobCard) =>
      !jobCard.archived &&
      jobCard.status === "completed" &&
      isDateInReportRange(jobCard.date, reportRange),
  );
  const reportCompletedWorkValue = reportCompletedJobs.reduce(
    (total, jobCard) => total + jobCard.laborCost + jobCard.partsCost,
    0,
  );
  const reportUninvoicedCompletedJobs = reportCompletedJobs.filter(
    (jobCard) => !activeInvoiceJobCardIds.has(jobCard.id),
  );
  const reportUninvoicedCompletedWorkValue = reportUninvoicedCompletedJobs.reduce(
    (total, jobCard) => total + jobCard.laborCost + jobCard.partsCost,
    0,
  );
  const reportLowStockItems = inventoryItems.filter(
    (item) => !item.archived && item.stockQuantity <= item.minimumStock,
  );
  const reportExpenseCategoryTotals = expenseCategories.map((category) => ({
    category,
    total: reportExpenses
      .filter((expense) => expense.category === category)
      .reduce((total, expense) => total + expense.amount, 0),
  }));
  const reportTotalRevenue = reportFinancials.invoiceGrandTotal;
  const reportPaidRevenue = reportFinancials.paidRevenue;
  const reportOutstandingBalance = reportFinancials.outstandingBalance;
  const reportTotalExpenses = reportFinancials.workshopExpenses;
  const reportPurchaseCosts = reportFinancials.purchaseCosts;
  const reportEstimatedNetProfit = reportFinancials.netProfit;
  const reportUnpaidInvoices = reportInvoices.filter(
    (invoice) => invoice.paymentStatus !== "paid" || invoice.remainingBalance > 0,
  );
  const recycleBinRecords: RecycleBinRecord[] = [
    ...customers
      .filter((customer) => customer.archived)
      .map((customer) => ({
        id: customer.id,
        type: "customers" as const,
        title: customer.name,
        subtitle: `${formatSaudiPhone(customer.phone)} - ${customer.city}`,
        details: t(`customers.types.${customer.type}`),
        searchText: [
          customer.name,
          customer.phone,
          formatSaudiPhone(customer.phone),
          customer.city,
          customer.type,
        ].join(" "),
      })),
    ...vehicles
      .filter((vehicle) => vehicle.archived)
      .map((vehicle) => ({
        id: vehicle.id,
        type: "vehicles" as const,
        title: `${vehicle.make} ${vehicle.model}`,
        subtitle: `${vehicle.plateNumber} - ${vehicle.ownerName}`,
        details: `${vehicle.year} - ${vehicle.colorKey} - ${vehicle.vehicleTypeKey}`,
        searchText: [
          vehicle.ownerName,
          vehicle.plateNumber,
          vehicle.make,
          vehicle.model,
          vehicle.year,
          vehicle.colorKey,
          vehicle.vehicleTypeKey,
        ].join(" "),
      })),
    ...jobCards
      .filter((jobCard) => jobCard.archived)
      .map((jobCard) => ({
        id: jobCard.id,
        type: "jobCards" as const,
        title: jobCard.jobNumber,
        subtitle: `${jobCard.customerName} - ${jobCard.vehicleLabel} - ${jobCard.plateNumber}`,
        details: `${formatMoney(jobCard.laborCost + jobCard.partsCost)} - ${t(`vehicles.status.${jobCard.status}`)}`,
        searchText: [
          jobCard.jobNumber,
          jobCard.customerName,
          jobCard.vehicleLabel,
          jobCard.plateNumber,
          jobCard.mechanic,
          jobCard.complaint,
          jobCard.workPerformed,
        ].join(" "),
      })),
    ...inventoryItems
      .filter((item) => item.archived)
      .map((item) => ({
        id: item.id,
        type: "inventory" as const,
        title: item.itemName,
        subtitle: `${item.arabicItemName} - ${item.sku}`,
        details: `${item.category} - ${item.brand} - ${formatMoney(item.sellingPrice)}`,
        searchText: [
          item.itemName,
          item.arabicItemName,
          item.sku,
          item.category,
          item.brand,
          item.supplierName,
          item.location,
        ].join(" "),
      })),
    ...expenses
      .filter((expense) => expense.archived)
      .map((expense) => ({
        id: expense.id,
        type: "expenses" as const,
        title: expense.title,
        subtitle: `${t(`expenses.category.${expense.category}`)} - ${formatDate(expense.date)}`,
        details: `${formatMoney(expense.amount)} - ${t(`expenses.paymentMethod.${expense.paymentMethod}`)}`,
        searchText: [
          expense.title,
          expense.category,
          expense.amount,
          expense.date,
          expense.paymentMethod,
          expense.notes,
          expense.createdBy,
        ].join(" "),
      })),
    ...invoices
      .filter((invoice) => invoice.archived)
      .map((invoice) => ({
        id: invoice.id,
        type: "invoices" as const,
        title: invoice.invoiceNumber,
        subtitle: `${invoice.customerName} - ${invoice.vehicle} - ${invoice.plateNumber}`,
        details: `${formatMoney(invoice.grandTotal)} - ${t(`jobCards.paymentStatus.${invoice.paymentStatus}`)}`,
        searchText: [
          invoice.invoiceNumber,
          invoice.customerName,
          invoice.customerPhone,
          invoice.customerCity ?? "",
          invoice.vehicle,
          invoice.plateNumber,
          invoice.jobCardNumber,
          invoice.workPerformed,
          invoice.notes,
          invoice.correctionReason ?? "",
        ].join(" "),
        status: invoice.correctionStatus ? t("invoices.correctedLabel") : undefined,
      })),
  ];
  const filteredRecycleBinRecords = recycleBinRecords.filter((record) => {
    const matchesFilter =
      recycleBinFilter === "all" || record.type === recycleBinFilter;
    const query = recycleBinSearch.trim().toLowerCase();
    const matchesSearch =
      !query ||
      [record.title, record.subtitle, record.details, record.searchText]
        .join(" ")
        .toLowerCase()
        .includes(query);

    return matchesFilter && matchesSearch;
  });

  const getVehicleJobs = (vehicleId: number) => {
    return jobCards.filter((jobCard) => jobCard.vehicleId === vehicleId);
  };

  const getServiceSummaryJobs = (vehicleId: number) => {
    return getVehicleJobs(vehicleId).filter(
      (jobCard) => !jobCard.archived && jobCard.status === "completed",
    );
  };

  const getActiveJob = (vehicleId: number) => {
    return getVehicleJobs(vehicleId).find(
      (jobCard) => !jobCard.archived && activeJobStatuses.includes(jobCard.status),
    );
  };

  const getLatestVehicleJob = (vehicleId: number) => {
    const activeJob = getActiveJob(vehicleId);

    if (activeJob) {
      return activeJob;
    }

    return getServiceSummaryJobs(vehicleId).toSorted((firstJob, secondJob) =>
      secondJob.date.localeCompare(firstJob.date),
    )[0];
  };

  const getCustomerVehicles = (customerId: number) => {
    return vehicles.filter((vehicle) => vehicle.customerId === customerId);
  };

  const getCustomerJobs = (customerId: number) => {
    const customerVehicleIds = new Set(
      getCustomerVehicles(customerId).map((vehicle) => vehicle.id),
    );

    return jobCards.filter((jobCard) => customerVehicleIds.has(jobCard.vehicleId));
  };

  function formatNumber(value: number) {
    return new Intl.NumberFormat(numberLocale).format(value);
  }

  function formatMoney(value: number) {
    const currencyCode = /^[A-Z]{3}$/.test(settings.defaultCurrency)
      ? settings.defaultCurrency
      : "SAR";

    return new Intl.NumberFormat(numberLocale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  function formatSummaryMoney(value: number) {
    const currencyCode = /^[A-Z]{3}$/.test(settings.defaultCurrency)
      ? settings.defaultCurrency
      : "SAR";
    const roundedValue = Number.isFinite(value)
      ? Math.round((value + Number.EPSILON) * 100) / 100
      : 0;
    const hasDecimals = !Number.isInteger(roundedValue);
    const formattedAmount = new Intl.NumberFormat(numberLocale, {
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: hasDecimals ? 2 : 0,
    }).format(roundedValue);

    return `${currencyCode} ${formattedAmount}`;
  }

  function formatDate(value: string) {
    return new Intl.DateTimeFormat(numberLocale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  }

  const formatCardValue = (value: number, currency?: boolean) => {
    return currency ? formatSummaryMoney(value) : formatNumber(value);
  };

  const parsePositiveNumber = (value: string) => {
    const parsedValue = parseSafeNumber(value);
    return parsedValue !== null && parsedValue > 0 ? parsedValue : 0;
  };

  const parseWholeNumber = (value: string) => {
    const parsedValue = parseSafeNumber(value);
    const wholeValue = parsedValue === null ? null : Math.floor(parsedValue);
    return wholeValue !== null && wholeValue > 0 ? wholeValue : 0;
  };

  const getTodayInputValue = () => new Date().toISOString().slice(0, 10);
  const getDocumentPrefix = (value: string, fallback: string) =>
    value.trim().replace(/[^a-zA-Z0-9]/g, "").toUpperCase() || fallback;
  const getPrefixedRecordNumber = (value: string, prefix: string) => {
    const normalizedPrefix = `${prefix}-`;
    const parsedNumber = Number(
      value.startsWith(normalizedPrefix)
        ? value.slice(normalizedPrefix.length)
        : value.split("-").at(-1),
    );

    return Number.isFinite(parsedNumber) ? parsedNumber : 0;
  };

  const getNextJobNumber = () => {
    const prefix = getDocumentPrefix(settings.jobCardPrefix, "JC");
    const highestJobNumber = jobCards.reduce((highestNumber, jobCard) => {
      const parsedNumber = getPrefixedRecordNumber(jobCard.jobNumber, prefix);
      return Number.isFinite(parsedNumber)
        ? Math.max(highestNumber, parsedNumber)
        : highestNumber;
    }, 1000);

    return `${prefix}-${highestJobNumber + 1}`;
  };

  const getNextPurchaseId = () => {
    const prefix = getDocumentPrefix(settings.purchaseOrderPrefix, "PO");
    const highestPurchaseNumber = purchases.reduce((highestNumber, purchase) => {
      const parsedNumber = getPrefixedRecordNumber(purchase.purchaseId, prefix);
      return Number.isFinite(parsedNumber)
        ? Math.max(highestNumber, parsedNumber)
        : highestNumber;
    }, 1000);

    return `${prefix}-${highestPurchaseNumber + 1}`;
  };

  const getNextInvoiceNumber = () => {
    const prefix = getDocumentPrefix(settings.invoicePrefix, "INV");
    const highestInvoiceNumber = invoices.reduce((highestNumber, invoice) => {
      const parsedNumber = getPrefixedRecordNumber(invoice.invoiceNumber, prefix);
      return Number.isFinite(parsedNumber)
        ? Math.max(highestNumber, parsedNumber)
        : highestNumber;
    }, 1000);

    return `${prefix}-${highestInvoiceNumber + 1}`;
  };

  const getPaymentStatusFromAmounts = (paidAmount: number, grandTotal: number) => {
    const roundedPaidAmount = roundMoney(paidAmount);
    const roundedGrandTotal = roundMoney(grandTotal);

    if (roundedPaidAmount <= 0) {
      return "unpaid" as const;
    }

    return roundedPaidAmount >= roundedGrandTotal
      ? ("paid" as const)
      : ("partial" as const);
  };

  const getInvoiceCalculations = (
    laborCost: number,
    partsCost: number,
    discount: number,
    taxPercentage: number,
    paidAmount: number,
  ) => {
    const subtotal = roundMoney(laborCost + partsCost);
    const taxAmount = roundMoney(subtotal * (taxPercentage / 100));
    const grandTotal = roundMoney(Math.max(0, subtotal + taxAmount - discount));
    const roundedPaidAmount = roundMoney(paidAmount);
    const remainingBalance = roundMoney(Math.max(0, grandTotal - roundedPaidAmount));

    return {
      subtotal,
      taxAmount,
      grandTotal,
      remainingBalance,
      paidAmount: roundedPaidAmount,
      paymentStatus: getPaymentStatusFromAmounts(roundedPaidAmount, grandTotal),
    };
  };

  const getDefaultInvoicePaidAmountFromJobCard = (
    jobCard: JobCard,
    discount: number,
    taxPercentage: number,
  ) => {
    const availablePaidAmount =
      typeof jobCard.paidAmount === "number" &&
      Number.isFinite(jobCard.paidAmount)
        ? jobCard.paidAmount
        : 0;

    if (jobCard.paymentStatus === "partial") {
      return availablePaidAmount;
    }

    if (jobCard.paymentStatus === "unpaid") {
      return 0;
    }

    return getInvoiceCalculations(
      jobCard.laborCost,
      jobCard.partsCost,
      discount,
      taxPercentage,
      0,
    ).grandTotal;
  };

  const getJobPartsFromForm = () => {
    return jobCardForm.partsUsed.reduce<JobPart[]>((parts, partLine) => {
      const inventoryItem = inventoryItems.find(
        (item) => item.id === Number(partLine.inventoryItemId),
      );
      const quantity = parsePositiveNumber(partLine.quantity);

      if (!inventoryItem || quantity <= 0) {
        return parts;
      }

      const unitSellingPrice = parsePositiveNumber(partLine.unitSellingPrice);

      return [
        ...parts,
        {
          id: inventoryItem.id,
          rowId: partLine.rowId,
          inventoryItemId: inventoryItem.id,
          itemName: inventoryItem.itemName,
          arabicItemName: inventoryItem.arabicItemName,
          quantity,
          unitSellingPrice,
          lineTotal: quantity * unitSellingPrice,
          itemType: inventoryItem.itemType,
        },
      ];
    }, []);
  };

  const getJobPartsValidationErrorKey = () => {
    for (const partLine of jobCardForm.partsUsed) {
      if (!partLine.inventoryItemId) {
        continue;
      }

      const quantityValidation = validateNonNegativeAmount(
        partLine.quantity,
        "quantity",
      );

      if (quantityValidation.errorKey || quantityValidation.value === null) {
        return "toast.quantityInvalid";
      }

      const unitPriceValidation = validateNonNegativeAmount(
        partLine.unitSellingPrice,
        "unitSellingPrice",
      );

      if (unitPriceValidation.errorKey || unitPriceValidation.value === null) {
        return "toast.amountInvalid";
      }
    }

    return null;
  };

  const getStockDeductionQuantities = (partsUsed: JobPart[]) => {
    return partsUsed.reduce<Record<number, number>>((quantities, part) => {
      if (part.itemType === "service") {
        return quantities;
      }

      return {
        ...quantities,
        [part.inventoryItemId]:
          (quantities[part.inventoryItemId] ?? 0) + part.quantity,
      };
    }, {});
  };

  const getInsufficientStockItemName = (
    partsUsed: JobPart[],
    restorableParts: JobPart[] = [],
  ) => {
    const usedQuantities = getStockDeductionQuantities(partsUsed);
    const restorableQuantities = getStockDeductionQuantities(restorableParts);

    const insufficientItemId = Object.entries(usedQuantities).find(
      ([itemId, quantity]) => {
        const inventoryItem = inventoryItems.find((item) => item.id === Number(itemId));
        const restorableQuantity = restorableQuantities[Number(itemId)] ?? 0;

        return inventoryItem
          ? quantity > inventoryItem.stockQuantity + restorableQuantity
          : false;
      },
    )?.[0];

    return insufficientItemId
      ? inventoryItems.find((item) => item.id === Number(insufficientItemId))?.itemName
      : undefined;
  };

  const hasDuplicateJobParts = (partsUsed: JobPart[]) => {
    const selectedItemIds = partsUsed.map((part) => part.inventoryItemId);
    return new Set(selectedItemIds).size !== selectedItemIds.length;
  };

  const applyJobStockAdjustment = (
    previousDeductedParts: JobPart[],
    nextDeductedParts: JobPart[],
  ) => {
    const previousQuantities = getStockDeductionQuantities(previousDeductedParts);
    const nextQuantities = getStockDeductionQuantities(nextDeductedParts);
    const adjustedItemIds = new Set([
      ...Object.keys(previousQuantities),
      ...Object.keys(nextQuantities),
    ]);

    if (
      adjustedItemIds.size === 0 ||
      [...adjustedItemIds].every(
        (itemId) =>
          (previousQuantities[Number(itemId)] ?? 0) ===
          (nextQuantities[Number(itemId)] ?? 0),
      )
    ) {
      return;
    }

    setInventoryItems((currentItems) =>
      currentItems.map((item) => {
        const quantityDelta =
          (nextQuantities[item.id] ?? 0) - (previousQuantities[item.id] ?? 0);

        return {
          ...item,
          stockQuantity: Math.max(0, item.stockQuantity - quantityDelta),
        };
      }),
    );
  };

  const showToast = (translationKey: string) => {
    const nextToast = { id: Date.now(), translationKey };
    setToastMessage(nextToast);

    window.setTimeout(() => {
      setToastMessage((currentToast) =>
        currentToast?.id === nextToast.id ? null : currentToast,
      );
    }, 2200);
  };

  const openCustomerModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomerId(customer.id);
      setCustomerForm({
        name: customer.name,
        phone: customer.phone,
        city: customer.city,
        type: customer.type,
        notes: customer.notes,
      });
    } else {
      setEditingCustomerId(null);
      setCustomerForm({
        ...emptyCustomerForm,
        city: settings.defaultCustomerCity.trim() || emptyCustomerForm.city,
      });
    }

    setCustomerPhoneError(false);
    setIsCustomerModalOpen(true);
  };

  const closeCustomerModal = () => {
    setIsCustomerModalOpen(false);
    setCustomerForm(emptyCustomerForm);
    setEditingCustomerId(null);
    setCustomerPhoneError(false);
  };

  const saveCustomer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const rawPhone = customerForm.phone.trim();
    const normalizedPhone = rawPhone ? normalizeSaudiPhone(customerForm.phone) : "";

    if (rawPhone && !isValidSaudiPhone(normalizedPhone)) {
      setCustomerPhoneError(true);
      return;
    }

    if (editingCustomerId) {
      const existingCustomer = customers.find(
        (customer) => customer.id === editingCustomerId,
      );
      const nextCustomerName = customerForm.name.trim();
      const nextCustomerCity = customerForm.city.trim();

      setCustomers((currentCustomers) =>
        currentCustomers.map((customer) =>
          customer.id === editingCustomerId
            ? {
                ...customer,
                name: nextCustomerName,
                phone: normalizedPhone,
                city: nextCustomerCity,
                type: customerForm.type,
                notes: customerForm.notes.trim(),
              }
          : customer,
        ),
      );

      setVehicles((currentVehicles) =>
        currentVehicles.map((vehicle) =>
          vehicle.customerId === editingCustomerId ||
          (existingCustomer && vehicle.ownerName === existingCustomer.name)
            ? {
                ...vehicle,
                customerId: editingCustomerId,
                ownerName: nextCustomerName,
              }
            : vehicle,
        ),
      );
      setJobCards((currentJobCards) =>
        currentJobCards.map((jobCard) =>
          isLiveJobCard(jobCard) &&
          (jobCard.customerId === editingCustomerId ||
            (existingCustomer && jobCard.customerName === existingCustomer.name))
            ? {
                ...jobCard,
                customerId: editingCustomerId,
                customerName: nextCustomerName,
              }
            : jobCard,
        ),
      );
      closeCustomerModal();
      return;
    }

    const nextCustomer: Customer = {
      id: createRecordId(),
      name: customerForm.name.trim(),
      phone: normalizedPhone,
      city: customerForm.city.trim(),
      type: customerForm.type,
      notes: customerForm.notes.trim(),
      archived: false,
    };

    setCustomers((currentCustomers) => [nextCustomer, ...currentCustomers]);
    closeCustomerModal();
  };

  const setCustomerArchived = (customerId: number, archived: boolean) => {
    setCustomers((currentCustomers) =>
      currentCustomers.map((customer) =>
        customer.id === customerId ? { ...customer, archived } : customer,
      ),
    );
    showToast(archived ? "toast.recordArchived" : "toast.recordRestored");
  };

  const openVehicleModal = (vehicle?: Vehicle) => {
    setVehicleModalSource("vehicles");

    if (vehicle) {
      setEditingVehicleId(vehicle.id);
      setVehicleForm({
        ownerName: vehicle.ownerName,
        plateNumber: vehicle.plateNumber,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year,
        color: vehicle.colorKey.startsWith("vehicles.colors.")
          ? t(vehicle.colorKey)
          : vehicle.colorKey,
        vehicleType: vehicle.vehicleTypeKey.startsWith("vehicles.types.")
          ? t(vehicle.vehicleTypeKey)
          : vehicle.vehicleTypeKey,
        notes: vehicle.notes,
      });
    } else {
      setEditingVehicleId(null);
      setVehicleForm(emptyVehicleForm);
    }

    setIsVehicleModalOpen(true);
  };

  const openVehicleModalFromJobCard = () => {
    setEditingVehicleId(null);
    setVehicleForm(emptyVehicleForm);
    setVehicleModalSource("jobCard");
    setIsVehicleModalOpen(true);
  };

  const closeVehicleModal = () => {
    setIsVehicleModalOpen(false);
    setVehicleForm(emptyVehicleForm);
    setEditingVehicleId(null);
    setVehicleModalSource(null);
  };

  const saveVehicle = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextOwnerName = vehicleForm.ownerName.trim();
    const matchingCustomer = customers.find(
      (customer) => customer.name.toLowerCase() === nextOwnerName.toLowerCase(),
    );
    const nextCustomerId = matchingCustomer?.id ?? 0;
    const nextVehicleLabel = `${vehicleForm.make.trim()} ${vehicleForm.model.trim()}`.trim();
    const nextPlateNumber = vehicleForm.plateNumber.trim();

    if (editingVehicleId) {
      const existingVehicle = vehicles.find((vehicle) => vehicle.id === editingVehicleId);
      const resolvedCustomerId =
        matchingCustomer?.id ?? existingVehicle?.customerId ?? 0;
      const resolvedCustomerName = matchingCustomer?.name ?? nextOwnerName;

      setVehicles((currentVehicles) =>
        currentVehicles.map((vehicle) =>
          vehicle.id === editingVehicleId
            ? {
                ...vehicle,
                customerId: resolvedCustomerId,
                ownerName: resolvedCustomerName,
                plateNumber: nextPlateNumber,
                make: vehicleForm.make.trim(),
                model: vehicleForm.model.trim(),
                year: vehicleForm.year.trim(),
                colorKey: vehicleForm.color.trim(),
                vehicleTypeKey: vehicleForm.vehicleType.trim(),
                notes: vehicleForm.notes.trim(),
              }
            : vehicle,
        ),
      );
      setJobCards((currentJobCards) =>
        currentJobCards.map((jobCard) =>
          isLiveJobCard(jobCard) &&
          (jobCard.vehicleId === editingVehicleId ||
            (existingVehicle && jobCard.plateNumber === existingVehicle.plateNumber))
            ? {
                ...jobCard,
                vehicleId: editingVehicleId,
                customerId: resolvedCustomerId,
                customerName: resolvedCustomerName,
                vehicleLabel: nextVehicleLabel,
                plateNumber: nextPlateNumber,
              }
            : jobCard,
        ),
      );
      closeVehicleModal();
      return;
    }

    const nextVehicle: Vehicle = {
      id: createRecordId(),
      customerId: nextCustomerId,
      ownerName: nextOwnerName,
      plateNumber: nextPlateNumber,
      make: vehicleForm.make.trim(),
      model: vehicleForm.model.trim(),
      year: vehicleForm.year.trim(),
      colorKey: vehicleForm.color.trim(),
      vehicleTypeKey: vehicleForm.vehicleType.trim(),
      notes: vehicleForm.notes.trim(),
      archived: false,
    };

    setVehicles((currentVehicles) => [nextVehicle, ...currentVehicles]);
    if (vehicleModalSource === "jobCard") {
      setJobCardForm((currentForm) => ({
        ...currentForm,
        vehicleId: String(nextVehicle.id),
      }));
    }
    closeVehicleModal();
  };

  const setVehicleArchived = (vehicleId: number, archived: boolean) => {
    setVehicles((currentVehicles) =>
      currentVehicles.map((vehicle) =>
        vehicle.id === vehicleId ? { ...vehicle, archived } : vehicle,
      ),
    );
    showToast(archived ? "toast.recordArchived" : "toast.recordRestored");
  };

  const startJobForVehicle = (vehicle: Vehicle) => {
    const activeJob = getActiveJob(vehicle.id);

    if (activeJob) {
      openJobCardModal(activeJob);
      setActiveSection("jobCards");
      setJobCardTab("active");
      return;
    }

    setJobCardForm({
      ...emptyJobCardForm,
      vehicleId: String(vehicle.id),
      jobNumber: getNextJobNumber(),
      date: getTodayInputValue(),
      status: "inWorkshop",
      paymentStatus: "unpaid",
    });
    setEditingJobCardId(null);
    setActiveSection("jobCards");
    setJobCardTab("active");
    setIsJobCardModalOpen(true);
  };

  const viewActiveJobForVehicle = (jobCard: JobCard) => {
    openJobCardModal(jobCard);
    setActiveSection("jobCards");
    setJobCardTab("active");
  };

  const historyVehicle = vehicles.find((vehicle) => vehicle.id === historyVehicleId);

  const openJobCardModal = (jobCard?: JobCard) => {
    if (jobCard) {
      setEditingJobCardId(jobCard.id);
      setJobCardForm({
        jobNumber: jobCard.jobNumber,
        vehicleId: String(jobCard.vehicleId),
        date: jobCard.date,
        status: jobCard.status,
        complaint: jobCard.complaint,
        workPerformed: jobCard.workPerformed,
        mechanic: jobCard.mechanic,
        laborCost: String(jobCard.laborCost),
        partsCost: String(jobCard.partsCost),
        partsUsed: jobCard.partsUsed.map((part, index) => ({
          rowId: part.rowId || `saved-${jobCard.id}-${part.inventoryItemId}-${index}`,
          inventoryItemId: String(part.inventoryItemId),
          quantity: String(part.quantity),
          unitSellingPrice: String(part.unitSellingPrice),
        })),
        paidAmount: String(jobCard.paidAmount),
        paymentStatus: jobCard.paymentStatus,
        notes: jobCard.notes,
      });
    } else {
      setEditingJobCardId(null);
      setJobCardForm({
        ...emptyJobCardForm,
        jobNumber: getNextJobNumber(),
        date: getTodayInputValue(),
        paidAmount: "0",
        paymentStatus: settings.defaultPaymentStatus,
      });
    }

    setIsJobCardModalOpen(true);
  };

  const closeJobCardModal = () => {
    if (editingJobCardId !== null && editingJobCardId === correctingJobCardId) {
      setCorrectingJobCardId(null);
    }

    setIsJobCardModalOpen(false);
    setEditingJobCardId(null);
    setJobCardForm(emptyJobCardForm);
  };

  const openNewJobCardFromDashboard = () => {
    openJobCardModal();
  };

  const saveJobCard = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const selectedVehicle = vehicles.find(
      (vehicle) => vehicle.id === Number(jobCardForm.vehicleId),
    );

    if (!selectedVehicle) {
      return;
    }

    const conflictingActiveJob = getActiveJob(selectedVehicle.id);

    if (
      activeJobStatuses.includes(jobCardForm.status) &&
      conflictingActiveJob &&
      conflictingActiveJob.id !== editingJobCardId
    ) {
      showToast("toast.activeJobExists");
      return;
    }

    const selectedCustomer = customers.find(
      (customer) => customer.id === selectedVehicle.customerId,
    );
    const existingJobCard = editingJobCardId
      ? jobCards.find((jobCard) => jobCard.id === editingJobCardId)
      : undefined;
    const laborValidation = validateNonNegativeAmount(
      jobCardForm.laborCost,
      "laborCost",
    );

    if (laborValidation.errorKey || laborValidation.value === null) {
      showToast("toast.laborCostInvalid");
      return;
    }

    const partsValidationErrorKey = getJobPartsValidationErrorKey();

    if (partsValidationErrorKey) {
      showToast(partsValidationErrorKey);
      return;
    }

    const partsUsed = getJobPartsFromForm();
    const partsCost = partsUsed.reduce((total, part) => total + part.lineTotal, 0);
    const laborCost = laborValidation.value;
    const totalAmount = laborCost + partsCost;
    const hasActiveLinkedInvoice = editingJobCardId
      ? hasActiveInvoiceForJobCard(editingJobCardId)
      : false;

    if (
      existingJobCard &&
      hasActiveLinkedInvoice &&
      (existingJobCard.laborCost !== laborCost ||
        existingJobCard.partsCost !== partsCost ||
        existingJobCard.status !== jobCardForm.status ||
        existingJobCard.vehicleId !== selectedVehicle.id)
    ) {
      showToast("toast.invoicedJobCardLocked");
      return;
    }

    const paidValidation = validatePaidAmount(jobCardForm.paidAmount, totalAmount);

    if (paidValidation.errorKey || paidValidation.value === null) {
      showToast(paidValidation.errorKey);
      return;
    }

    const paidAmount = paidValidation.value;
    const paymentStatus = getPaymentStatusFromAmounts(paidAmount, totalAmount);
    const shouldPreserveHistoricalJobSnapshot =
      existingJobCard !== undefined &&
      !isLiveJobCard(existingJobCard) &&
      existingJobCard.vehicleId === selectedVehicle.id &&
      !activeJobStatuses.includes(jobCardForm.status);
    const isSavingCompletedJob = jobCardForm.status === "completed";
    const previousDeductedParts =
      existingJobCard?.stockDeducted === true ? existingJobCard.deductedParts : [];
    const nextDeductedParts = isSavingCompletedJob
      ? partsUsed.filter((part) => part.itemType === "stock")
      : [];
    const insufficientStockItemName = isSavingCompletedJob
      ? getInsufficientStockItemName(partsUsed, previousDeductedParts)
      : undefined;

    if (insufficientStockItemName) {
      showToast("toast.insufficientStock");
      return;
    }

    if (hasDuplicateJobParts(partsUsed)) {
      showToast("toast.duplicateParts");
      return;
    }

    const jobCardValues = {
      jobNumber: jobCardForm.jobNumber.trim(),
      vehicleId: selectedVehicle.id,
      customerId: shouldPreserveHistoricalJobSnapshot
        ? existingJobCard.customerId
        : selectedVehicle.customerId,
      date: jobCardForm.date,
      status: jobCardForm.status,
      customerName: shouldPreserveHistoricalJobSnapshot
        ? existingJobCard.customerName
        : selectedCustomer?.name ?? selectedVehicle.ownerName,
      vehicleLabel: shouldPreserveHistoricalJobSnapshot
        ? existingJobCard.vehicleLabel
        : `${selectedVehicle.make} ${selectedVehicle.model}`,
      plateNumber: shouldPreserveHistoricalJobSnapshot
        ? existingJobCard.plateNumber
        : selectedVehicle.plateNumber,
      complaint: jobCardForm.complaint.trim(),
      workPerformed: jobCardForm.workPerformed.trim(),
      mechanic: jobCardForm.mechanic.trim(),
      laborCost,
      partsCost,
      partsUsed,
      paidAmount,
      paymentStatus,
      notes: jobCardForm.notes.trim(),
      stockDeducted: nextDeductedParts.length > 0,
      deductedParts: nextDeductedParts,
    };

    if (editingJobCardId) {
      const correctedJobCard: JobCard | null =
        existingJobCard && editingJobCardId === correctingJobCardId
          ? {
              ...existingJobCard,
              ...jobCardValues,
              archived: jobCardValues.status === "cancelled"
                ? true
                : existingJobCard.archived,
            }
          : null;

      setJobCards((currentJobCards) =>
        currentJobCards.map((jobCard) =>
          jobCard.id === editingJobCardId
            ? {
                ...jobCard,
                ...jobCardValues,
                archived: jobCardValues.status === "cancelled" ? true : jobCard.archived,
              }
            : jobCard,
        ),
      );
      applyJobStockAdjustment(previousDeductedParts, nextDeductedParts);
      if (correctedJobCard) {
        setCorrectingJobCardId(null);
        closeJobCardModal();
        if (correctedJobCard.status === "completed" && !correctedJobCard.archived) {
          openInvoiceModalForJobCard(correctedJobCard);
        } else {
          showToast("toast.correctedInvoiceRequiresCompletedJob");
        }
        return;
      }
      closeJobCardModal();
      return;
    }

    const nextJobCard: JobCard = {
      id: createRecordId(),
      ...jobCardValues,
      archived: jobCardValues.status === "cancelled",
    };

    setJobCards((currentJobCards) => [nextJobCard, ...currentJobCards]);
    applyJobStockAdjustment([], nextDeductedParts);
    closeJobCardModal();
  };

  const setJobCardArchived = (jobCardId: number, archived: boolean) => {
    const targetJobCard = jobCards.find((jobCard) => jobCard.id === jobCardId);
    const activeJob = targetJobCard ? getActiveJob(targetJobCard.vehicleId) : undefined;
    const wouldRestoreActiveJob =
      !archived &&
      targetJobCard !== undefined &&
      activeJobStatuses.includes(targetJobCard.status);

    if (wouldRestoreActiveJob && activeJob && activeJob.id !== jobCardId) {
      showToast("toast.activeJobExists");
      return;
    }

    setJobCards((currentJobCards) =>
      currentJobCards.map((jobCard) =>
        jobCard.id === jobCardId
          ? {
              ...jobCard,
              archived,
            }
          : jobCard,
      ),
    );
    showToast(archived ? "toast.recordArchived" : "toast.recordRestored");
  };

  const openInventoryModal = (item?: InventoryItem) => {
    if (item) {
      setEditingInventoryItemId(item.id);
      setInventoryForm({
        itemName: item.itemName,
        arabicItemName: item.arabicItemName,
        category: item.category,
        sku: item.sku,
        brand: item.brand,
        supplierName: item.supplierName,
        itemType: item.itemType,
        stockQuantity: String(item.stockQuantity),
        unitType: item.unitType,
        costPrice: String(item.costPrice),
        sellingPrice: String(item.sellingPrice),
        minimumStock: String(item.minimumStock),
        location: item.location,
        notes: item.notes,
      });
    } else {
      setEditingInventoryItemId(null);
      setInventoryForm(emptyInventoryForm);
    }

    setIsInventoryModalOpen(true);
  };

  const closeInventoryModal = () => {
    setIsInventoryModalOpen(false);
    setInventoryForm(emptyInventoryForm);
    setEditingInventoryItemId(null);
  };

  const getInventoryFormValues = () => ({
    itemName: inventoryForm.itemName.trim(),
    arabicItemName: inventoryForm.arabicItemName.trim(),
    category: inventoryForm.category.trim(),
    sku: inventoryForm.sku.trim(),
    brand: inventoryForm.brand.trim(),
    supplierName: inventoryForm.supplierName.trim(),
    itemType: inventoryForm.itemType,
    stockQuantity: parseWholeNumber(inventoryForm.stockQuantity),
    unitType: inventoryForm.unitType,
    costPrice: parsePositiveNumber(inventoryForm.costPrice),
    sellingPrice: parsePositiveNumber(inventoryForm.sellingPrice),
    minimumStock: parseWholeNumber(inventoryForm.minimumStock),
    location: inventoryForm.location.trim(),
    notes: inventoryForm.notes.trim(),
  });

  const getInventoryValidationErrorKey = () => {
    const stockValidation = validateNonNegativeAmount(
      inventoryForm.stockQuantity,
      "stockQuantity",
    );
    const minimumStockValidation = validateNonNegativeAmount(
      inventoryForm.minimumStock,
      "minimumStock",
    );

    if (
      stockValidation.errorKey ||
      stockValidation.value === null ||
      minimumStockValidation.errorKey ||
      minimumStockValidation.value === null
    ) {
      return "toast.quantityInvalid";
    }

    const costValidation = validateNonNegativeAmount(
      inventoryForm.costPrice,
      "costPrice",
    );
    const sellingValidation = validateNonNegativeAmount(
      inventoryForm.sellingPrice,
      "sellingPrice",
    );

    if (
      costValidation.errorKey ||
      costValidation.value === null ||
      sellingValidation.errorKey ||
      sellingValidation.value === null
    ) {
      return "toast.amountInvalid";
    }

    return null;
  };

  const saveInventoryItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrorKey = getInventoryValidationErrorKey();

    if (validationErrorKey) {
      showToast(validationErrorKey);
      return;
    }

    const inventoryValues = getInventoryFormValues();

    if (editingInventoryItemId) {
      setInventoryItems((currentItems) =>
        currentItems.map((item) =>
          item.id === editingInventoryItemId ? { ...item, ...inventoryValues } : item,
        ),
      );
      closeInventoryModal();
      return;
    }

    const nextItem: InventoryItem = {
      id: Date.now(),
      ...inventoryValues,
      archived: false,
    };

    setInventoryItems((currentItems) => [nextItem, ...currentItems]);
    closeInventoryModal();
  };

  const setInventoryItemArchived = (itemId: number, archived: boolean) => {
    setInventoryItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, archived } : item,
      ),
    );
    showToast(archived ? "toast.recordArchived" : "toast.recordRestored");
  };

  const openPurchaseModal = (purchase?: Purchase) => {
    if (purchase) {
      setEditingPurchaseId(purchase.id);
      setPurchaseForm({
        supplierName: purchase.supplierName,
        purchaseDate: purchase.purchaseDate,
        paymentStatus: purchase.paymentStatus,
        notes: purchase.notes,
        items: purchase.items.map((item, index) => ({
          rowId: item.rowId || `purchase-${purchase.id}-${item.inventoryItemId}-${index}`,
          inventoryItemId: String(item.inventoryItemId),
          quantity: String(item.quantity),
          costPrice: String(item.costPrice),
        })),
      });
    } else {
      setEditingPurchaseId(null);
      setPurchaseForm({
        ...emptyPurchaseForm,
        paymentStatus: settings.defaultPaymentStatus,
        purchaseDate: getTodayInputValue(),
      });
    }

    setDuplicatePurchaseRowId(null);
    setIsPurchaseModalOpen(true);
  };

  const closePurchaseModal = () => {
    setIsPurchaseModalOpen(false);
    setEditingPurchaseId(null);
    setPurchaseForm(emptyPurchaseForm);
    setDuplicatePurchaseRowId(null);
  };

  const getPurchaseItemsFromForm = () => {
    return purchaseForm.items.reduce<PurchaseItem[]>((items, itemLine) => {
      const inventoryItem = inventoryItems.find(
        (item) => item.id === Number(itemLine.inventoryItemId),
      );
      const quantity = parsePositiveNumber(itemLine.quantity);

      if (!inventoryItem || quantity <= 0) {
        return items;
      }

      const costPrice = parsePositiveNumber(itemLine.costPrice);

      return [
        ...items,
        {
          rowId: itemLine.rowId,
          inventoryItemId: inventoryItem.id,
          itemName: inventoryItem.itemName,
          arabicItemName: inventoryItem.arabicItemName,
          sku: inventoryItem.sku,
          currentStock: inventoryItem.stockQuantity,
          quantity,
          costPrice,
          lineTotal: quantity * costPrice,
        },
      ];
    }, []);
  };

  const getPurchaseItemsValidationErrorKey = () => {
    for (const itemLine of purchaseForm.items) {
      if (!itemLine.inventoryItemId) {
        continue;
      }

      const quantityValidation = validateNonNegativeAmount(
        itemLine.quantity,
        "purchaseQuantity",
      );

      if (quantityValidation.errorKey || quantityValidation.value === null) {
        return "toast.quantityInvalid";
      }

      const costValidation = validateNonNegativeAmount(
        itemLine.costPrice,
        "purchaseCost",
      );

      if (costValidation.errorKey || costValidation.value === null) {
        return "toast.amountInvalid";
      }
    }

    return null;
  };

  const getPurchaseStockQuantities = (purchaseItems: PurchaseItem[]) => {
    return purchaseItems.reduce<Record<number, number>>(
      (quantities, item) => ({
        ...quantities,
        [item.inventoryItemId]:
          (quantities[item.inventoryItemId] ?? 0) + item.quantity,
      }),
      {},
    );
  };

  const getPurchaseStockAdjustmentErrorKey = (
    previousItems: PurchaseItem[],
    nextItems: PurchaseItem[],
  ) => {
    const previousQuantities = getPurchaseStockQuantities(previousItems);
    const nextQuantities = getPurchaseStockQuantities(nextItems);
    const adjustedItemIds = new Set([
      ...Object.keys(previousQuantities),
      ...Object.keys(nextQuantities),
    ]);

    const wouldReduceBelowZero = [...adjustedItemIds].some((itemId) => {
      const item = inventoryItems.find(
        (inventoryItem) => inventoryItem.id === Number(itemId),
      );
      const stockDelta =
        (nextQuantities[Number(itemId)] ?? 0) -
        (previousQuantities[Number(itemId)] ?? 0);

      return item ? item.stockQuantity + stockDelta < 0 : false;
    });

    return wouldReduceBelowZero ? "toast.insufficientStock" : null;
  };

  const applyPurchaseStockAdjustment = (
    previousItems: PurchaseItem[],
    nextItems: PurchaseItem[],
  ) => {
    const previousQuantities = getPurchaseStockQuantities(previousItems);
    const nextQuantities = getPurchaseStockQuantities(nextItems);
    const adjustedItemIds = new Set([
      ...Object.keys(previousQuantities),
      ...Object.keys(nextQuantities),
    ]);

    if (
      adjustedItemIds.size === 0 ||
      [...adjustedItemIds].every(
        (itemId) =>
          (previousQuantities[Number(itemId)] ?? 0) ===
          (nextQuantities[Number(itemId)] ?? 0),
      )
    ) {
      return;
    }

    setInventoryItems((currentItems) =>
      currentItems.map((item) => {
        const stockDelta =
          (nextQuantities[item.id] ?? 0) - (previousQuantities[item.id] ?? 0);

        return {
          ...item,
          stockQuantity: Math.max(0, item.stockQuantity + stockDelta),
        };
      }),
    );
  };

  const savePurchase = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrorKey = getPurchaseItemsValidationErrorKey();

    if (validationErrorKey) {
      showToast(validationErrorKey);
      return;
    }

    const purchaseItems = getPurchaseItemsFromForm();
    const purchasedItemIds = purchaseItems.map((item) => item.inventoryItemId);

    if (new Set(purchasedItemIds).size !== purchasedItemIds.length) {
      showToast("toast.duplicateParts");
      return;
    }

    if (purchaseItems.length === 0) {
      showToast("toast.purchaseItemsRequired");
      return;
    }

    const existingPurchase = editingPurchaseId
      ? purchases.find((purchase) => purchase.id === editingPurchaseId)
      : undefined;

    if (editingPurchaseId && !existingPurchase) {
      return;
    }

    const stockAdjustmentErrorKey = getPurchaseStockAdjustmentErrorKey(
      existingPurchase?.items ?? [],
      purchaseItems,
    );

    if (stockAdjustmentErrorKey) {
      showToast(stockAdjustmentErrorKey);
      return;
    }

    const purchaseValues = {
      purchaseId: existingPurchase?.purchaseId ?? getNextPurchaseId(),
      supplierName: purchaseForm.supplierName.trim(),
      purchaseDate: purchaseForm.purchaseDate,
      items: purchaseItems,
      totalQuantity: purchaseItems.reduce((total, item) => total + item.quantity, 0),
      totalAmount: purchaseItems.reduce((total, item) => total + item.lineTotal, 0),
      paymentStatus: purchaseForm.paymentStatus,
      notes: purchaseForm.notes.trim(),
      createdBy: "Hamza",
    };

    if (editingPurchaseId && existingPurchase) {
      setPurchases((currentPurchases) =>
        currentPurchases.map((purchase) =>
          purchase.id === editingPurchaseId
            ? {
                ...purchase,
                ...purchaseValues,
              }
            : purchase,
        ),
      );
      applyPurchaseStockAdjustment(existingPurchase.items, purchaseItems);
      closePurchaseModal();
      return;
    }

    const nextPurchase: Purchase = {
      id: Date.now(),
      ...purchaseValues,
    };

    setPurchases((currentPurchases) => [nextPurchase, ...currentPurchases]);
    applyPurchaseStockAdjustment([], purchaseItems);
    closePurchaseModal();
  };

  const openExpenseModal = () => {
    setExpenseForm({
      ...emptyExpenseForm,
      date: getTodayInputValue(),
      paymentMethod: settings.defaultPaymentMethod,
    });
    setIsExpenseModalOpen(true);
  };

  const closeExpenseModal = () => {
    setIsExpenseModalOpen(false);
    setExpenseForm(emptyExpenseForm);
  };

  const saveExpense = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const amountValidation = validateNonNegativeAmount(
      expenseForm.amount,
      "expenseAmount",
    );

    if (amountValidation.errorKey || amountValidation.value === null) {
      showToast("toast.amountInvalid");
      return;
    }

    const amount = amountValidation.value;

    if (amount <= 0) {
      showToast("toast.amountInvalid");
      return;
    }

    const nextExpense: Expense = {
      id: Date.now(),
      title: expenseForm.title.trim(),
      category: expenseForm.category,
      amount,
      date: expenseForm.date,
      paymentMethod: expenseForm.paymentMethod,
      notes: expenseForm.notes.trim(),
      createdBy: expenseForm.createdBy.trim() || "Hamza",
      archived: false,
    };

    setExpenses((currentExpenses) => [nextExpense, ...currentExpenses]);
    closeExpenseModal();
  };

  const setExpenseArchived = (expenseId: number, archived: boolean) => {
    setExpenses((currentExpenses) =>
      currentExpenses.map((expense) =>
        expense.id === expenseId ? { ...expense, archived } : expense,
      ),
    );
    showToast(archived ? "toast.recordArchived" : "toast.recordRestored");
  };

  const getCompletedJobCardsForInvoice = () => {
    const invoicedJobCardIds = new Set(
      invoices.filter((invoice) => !invoice.archived).map((invoice) => invoice.jobCardId),
    );

    return jobCards.filter(
      (jobCard) =>
        !jobCard.archived &&
        jobCard.status === "completed" &&
        (!invoicedJobCardIds.has(jobCard.id) || jobCard.id === Number(invoiceForm.jobCardId)),
    );
  };

  const openInvoiceModal = (invoice?: Invoice) => {
    if (invoice) {
      setEditingInvoiceId(invoice.id);
      setInvoiceForm({
        invoiceType: invoice.jobCardId > 0 ? "jobCard" : "quick",
        jobCardId: String(invoice.jobCardId),
        customerId: invoice.customerId ? String(invoice.customerId) : "",
        customerName: invoice.customerName,
        customerPhone: invoice.customerPhone,
        customerCity: invoice.customerCity ?? "",
        vehicleId: invoice.vehicleId ? String(invoice.vehicleId) : "",
        vehiclePlateNumber: invoice.plateNumber,
        vehicleMake: invoice.vehicle,
        vehicleModel: "",
        vehicleYear: "",
        vehicleColor: "",
        vehicleType: "",
        workPerformed: invoice.workPerformed,
        laborCost: String(invoice.laborCost),
        partsCost: String(invoice.partsCost),
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        discount: String(invoice.discount),
        taxPercentage: String(invoice.taxPercentage),
        paidAmount: String(invoice.paidAmount),
        paymentStatus: invoice.paymentStatus,
        notes: invoice.notes,
      });
    } else {
      setEditingInvoiceId(null);
      setInvoiceForm({
        ...emptyInvoiceForm,
        customerCity: settings.defaultCustomerCity.trim() || emptyInvoiceForm.customerCity,
        invoiceDate: getTodayInputValue(),
        dueDate: getTodayInputValue(),
        taxPercentage: settings.defaultVatPercentage,
        paymentStatus: "unpaid",
      });
    }

    setIsInvoiceModalOpen(true);
  };

  const openInvoiceModalForJobCard = (jobCard: JobCard) => {
    const taxPercentage = settings.defaultVatPercentage;
    const discount = 0;
    const defaultPaidAmount = getDefaultInvoicePaidAmountFromJobCard(
      jobCard,
      discount,
      parsePositiveNumber(taxPercentage),
    );
    const invoiceTotal = getInvoiceCalculations(
      jobCard.laborCost,
      jobCard.partsCost,
      discount,
      parsePositiveNumber(taxPercentage),
      defaultPaidAmount,
    );

    setEditingInvoiceId(null);
    setInvoiceForm({
      ...emptyInvoiceForm,
      invoiceType: "jobCard",
      jobCardId: String(jobCard.id),
      customerId: String(jobCard.customerId),
      vehicleId: String(jobCard.vehicleId),
      workPerformed: jobCard.workPerformed,
      laborCost: String(jobCard.laborCost),
      partsCost: String(jobCard.partsCost),
      invoiceDate: getTodayInputValue(),
      dueDate: getTodayInputValue(),
      taxPercentage,
      paidAmount: String(defaultPaidAmount),
      paymentStatus: getPaymentStatusFromAmounts(
        defaultPaidAmount,
        invoiceTotal.grandTotal,
      ),
    });
    setInvoiceTab("active");
    setActiveSection("invoices");
    setIsInvoiceModalOpen(true);
  };

  const closeInvoiceModal = () => {
    setIsInvoiceModalOpen(false);
    setEditingInvoiceId(null);
    setInvoiceForm(emptyInvoiceForm);
  };

  const getInvoiceValidationErrorKey = (laborCost: number, partsCost: number) => {
    const invoiceInputs = [
      invoiceForm.laborCost,
      invoiceForm.partsCost,
      invoiceForm.discount,
      invoiceForm.taxPercentage,
      invoiceForm.paidAmount,
    ];

    if (
      invoiceInputs.some((value) => {
        const parsedValue = parseSafeNumber(value);
        return parsedValue !== null && parsedValue < 0;
      })
    ) {
      return "toast.negativeValuesNotAllowed";
    }

    const discountValidation = validateOptionalNonNegativeAmount(
      invoiceForm.discount,
      "discount",
    );
    const taxValidation = validateOptionalNonNegativeAmount(
      invoiceForm.taxPercentage,
      "taxPercentage",
    );

    if (
      discountValidation.errorKey ||
      discountValidation.value === null ||
      taxValidation.errorKey ||
      taxValidation.value === null
    ) {
      return "toast.amountInvalid";
    }

    const calculations = getInvoiceCalculations(
      laborCost,
      partsCost,
      discountValidation.value,
      taxValidation.value,
      0,
    );
    const paidValidation = validatePaidAmount(
      invoiceForm.paidAmount,
      calculations.grandTotal,
    );

    return paidValidation.errorKey;
  };

  const buildInvoiceValues = (jobCard: JobCard, existingInvoice?: Invoice) => {
    const customer = customers.find((customerRecord) => customerRecord.id === jobCard.customerId);
    const discount = parsePositiveNumber(invoiceForm.discount);
    const taxPercentage = parsePositiveNumber(invoiceForm.taxPercentage);
    const paidAmount = roundMoney(parsePositiveNumber(invoiceForm.paidAmount));
    const calculations = getInvoiceCalculations(
      jobCard.laborCost,
      jobCard.partsCost,
      discount,
      taxPercentage,
      paidAmount,
    );

    return {
      invoiceNumber: existingInvoice?.invoiceNumber ?? getNextInvoiceNumber(),
      invoiceDate: invoiceForm.invoiceDate,
      dueDate: invoiceForm.dueDate,
      customerId: jobCard.customerId,
      vehicleId: jobCard.vehicleId,
      customerName: jobCard.customerName,
      customerPhone: customer?.phone ?? "",
      customerCity: customer?.city ?? "",
      vehicle: jobCard.vehicleLabel,
      plateNumber: jobCard.plateNumber,
      jobCardId: jobCard.id,
      jobCardNumber: jobCard.jobNumber,
      jobDate: jobCard.date,
      workPerformed: jobCard.workPerformed,
      parts:
        jobCard.partsUsed.length > 0
          ? jobCard.partsUsed.map((part) => ({
              rowId: part.rowId,
              itemName: part.itemName,
              arabicItemName: part.arabicItemName,
              sku: inventoryItems.find((item) => item.id === part.inventoryItemId)?.sku ?? "",
              quantity: part.quantity,
              unitSellingPrice: part.unitSellingPrice,
              lineTotal: part.lineTotal,
            }))
          : jobCard.partsCost > 0
            ? [
                {
                  rowId: `legacy-parts-${jobCard.id}`,
                  itemName: "Parts used",
                  arabicItemName: "قطع مستخدمة",
                  sku: "",
                  quantity: 1,
                  unitSellingPrice: jobCard.partsCost,
                  lineTotal: jobCard.partsCost,
                },
              ]
            : [],
      laborCost: jobCard.laborCost,
      partsCost: jobCard.partsCost,
      subtotal: calculations.subtotal,
      discount,
      taxPercentage,
      taxAmount: calculations.taxAmount,
      grandTotal: calculations.grandTotal,
      paidAmount,
      remainingBalance: calculations.remainingBalance,
      paymentStatus: calculations.paymentStatus,
      notes: invoiceForm.notes.trim(),
    };
  };

  const buildQuickInvoiceValues = (
    customer: Customer,
    vehicle: Vehicle | undefined,
    existingInvoice?: Invoice,
  ) => {
    const laborCost = parsePositiveNumber(invoiceForm.laborCost);
    const partsCost = parsePositiveNumber(invoiceForm.partsCost);
    const discount = parsePositiveNumber(invoiceForm.discount);
    const taxPercentage = parsePositiveNumber(invoiceForm.taxPercentage);
    const paidAmount = roundMoney(parsePositiveNumber(invoiceForm.paidAmount));
    const calculations = getInvoiceCalculations(
      laborCost,
      partsCost,
      discount,
      taxPercentage,
      paidAmount,
    );
    const vehicleLabel = vehicle
      ? `${vehicle.make} ${vehicle.model}`.trim()
      : invoiceForm.vehicleId === "__new"
        ? `${invoiceForm.vehicleMake.trim()} ${invoiceForm.vehicleModel.trim()}`.trim() ||
          t("common.unknown")
        : "";
    const plateNumber = vehicle
      ? vehicle.plateNumber
      : invoiceForm.vehicleId === "__new"
        ? invoiceForm.vehiclePlateNumber.trim()
        : "";

    return {
      invoiceNumber: existingInvoice?.invoiceNumber ?? getNextInvoiceNumber(),
      invoiceDate: invoiceForm.invoiceDate,
      dueDate: invoiceForm.dueDate,
      customerId: customer.id,
      vehicleId: vehicle?.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerCity: customer.city,
      vehicle: vehicleLabel || t("common.notAvailable"),
      plateNumber: plateNumber || t("common.notAvailable"),
      jobCardId: 0,
      jobCardNumber: t("invoices.form.quickInvoiceLabel"),
      jobDate: invoiceForm.invoiceDate,
      workPerformed: invoiceForm.workPerformed.trim(),
      parts:
        partsCost > 0
          ? [
              {
                rowId: `quick-parts-${existingInvoice?.id ?? "manual"}`,
                itemName: t("invoices.form.manualPartsItem"),
                arabicItemName: "",
                sku: "",
                quantity: 1,
                unitSellingPrice: partsCost,
                lineTotal: partsCost,
              },
            ]
          : [],
      laborCost,
      partsCost,
      subtotal: calculations.subtotal,
      discount,
      taxPercentage,
      taxAmount: calculations.taxAmount,
      grandTotal: calculations.grandTotal,
      paidAmount,
      remainingBalance: calculations.remainingBalance,
      paymentStatus: calculations.paymentStatus,
      notes: invoiceForm.notes.trim(),
    };
  };

  const saveInvoice = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const logInvoiceSaveFailure = (translationKey: string, details?: unknown) => {
      console.warn("[CAR DC9] Invoice save blocked", { translationKey, details });
      showToast(translationKey);
    };

    const selectedJobCard =
      invoiceForm.invoiceType === "jobCard"
        ? jobCards.find((jobCard) => jobCard.id === Number(invoiceForm.jobCardId))
        : undefined;

    if (invoiceForm.invoiceType === "jobCard" && !selectedJobCard) {
      logInvoiceSaveFailure("toast.invoiceJobCardRequired", {
        invoiceType: invoiceForm.invoiceType,
      });
      return;
    }

    if (selectedJobCard && selectedJobCard.status !== "completed") {
      logInvoiceSaveFailure("toast.invoiceJobCardRequired", {
        jobCardId: selectedJobCard.id,
        status: selectedJobCard.status,
      });
      return;
    }

    if (
      selectedJobCard &&
      hasActiveInvoiceForJobCard(selectedJobCard.id, editingInvoiceId ?? undefined)
    ) {
      logInvoiceSaveFailure("toast.duplicateActiveInvoice", {
        jobCardId: selectedJobCard.id,
      });
      return;
    }

    if (!invoiceForm.invoiceDate || !invoiceForm.dueDate) {
      logInvoiceSaveFailure("toast.invoiceDatesRequired", {
        invoiceDate: invoiceForm.invoiceDate,
        dueDate: invoiceForm.dueDate,
      });
      return;
    }

    const laborCostForValidation = selectedJobCard
      ? selectedJobCard.laborCost
      : parsePositiveNumber(invoiceForm.laborCost);
    const partsCostForValidation = selectedJobCard
      ? selectedJobCard.partsCost
      : parsePositiveNumber(invoiceForm.partsCost);
    const validationErrorKey = getInvoiceValidationErrorKey(
      laborCostForValidation,
      partsCostForValidation,
    );

    if (validationErrorKey) {
      logInvoiceSaveFailure(validationErrorKey, {
        laborCost: laborCostForValidation,
        partsCost: partsCostForValidation,
        discount: invoiceForm.discount,
        taxPercentage: invoiceForm.taxPercentage,
        paidAmount: invoiceForm.paidAmount,
      });
      return;
    }

    const discountForValidation = parsePositiveNumber(invoiceForm.discount);
    const taxPercentageForValidation = parsePositiveNumber(invoiceForm.taxPercentage);
    const paidAmountForValidation = parsePositiveNumber(invoiceForm.paidAmount);
    const invoiceValidationTotals = getInvoiceCalculations(
      laborCostForValidation,
      partsCostForValidation,
      discountForValidation,
      taxPercentageForValidation,
      paidAmountForValidation,
    );

    if (invoiceValidationTotals.grandTotal <= 0) {
      logInvoiceSaveFailure("toast.invoiceTotalRequired", {
        grandTotal: invoiceValidationTotals.grandTotal,
        laborCost: laborCostForValidation,
        partsCost: partsCostForValidation,
        discount: discountForValidation,
      });
      return;
    }

    if (!selectedJobCard && laborCostForValidation + partsCostForValidation <= 0) {
      const quickInvoiceErrorKey = invoiceForm.workPerformed.trim()
        ? "toast.invoiceTotalRequired"
        : "toast.invoiceServiceOrAmountRequired";
      logInvoiceSaveFailure(quickInvoiceErrorKey, {
        laborCost: laborCostForValidation,
        partsCost: partsCostForValidation,
      });
      return;
    }

    if (editingInvoiceId) {
      const existingInvoice = invoices.find((invoice) => invoice.id === editingInvoiceId);

      if (!existingInvoice) {
        console.warn("[CAR DC9] Invoice save blocked", {
          reason: "missing existing invoice",
          editingInvoiceId,
        });
        return;
      }

      if (!selectedJobCard && existingInvoice.jobCardId === 0) {
        const paidValidation = validatePaidAmount(
          invoiceForm.paidAmount,
          existingInvoice.grandTotal,
        );

        if (paidValidation.errorKey || paidValidation.value === null) {
          logInvoiceSaveFailure(paidValidation.errorKey, {
            paidAmount: invoiceForm.paidAmount,
            grandTotal: existingInvoice.grandTotal,
          });
          return;
        }

        const roundedPaidAmount = roundMoney(paidValidation.value);
        setInvoices((currentInvoices) =>
          currentInvoices.map((invoice) =>
            invoice.id === editingInvoiceId
              ? {
                  ...invoice,
                  paidAmount: roundedPaidAmount,
                  remainingBalance: roundMoney(
                    Math.max(0, existingInvoice.grandTotal - roundedPaidAmount),
                  ),
                  paymentStatus: getPaymentStatusFromAmounts(
                    roundedPaidAmount,
                    existingInvoice.grandTotal,
                  ),
                  notes: invoiceForm.notes.trim(),
                }
              : invoice,
          ),
        );
        console.info("[CAR DC9] Invoice save succeeded", {
          invoiceId: editingInvoiceId,
          mode: "quick-payment-update",
        });
        showToast("toast.invoiceSaved");
        closeInvoiceModal();
        return;
      }

      if (!selectedJobCard) {
        logInvoiceSaveFailure("toast.invoiceJobCardRequired");
        return;
      }

      const paidValidation = validatePaidAmount(
        invoiceForm.paidAmount,
        existingInvoice.grandTotal,
      );

      if (paidValidation.errorKey || paidValidation.value === null) {
        logInvoiceSaveFailure(paidValidation.errorKey, {
          paidAmount: invoiceForm.paidAmount,
          grandTotal: existingInvoice.grandTotal,
        });
        return;
      }

      const roundedPaidAmount = roundMoney(paidValidation.value);
      setInvoices((currentInvoices) =>
        currentInvoices.map((invoice) =>
          invoice.id === editingInvoiceId
            ? {
                ...invoice,
                paidAmount: roundedPaidAmount,
                remainingBalance: roundMoney(
                  Math.max(0, existingInvoice.grandTotal - roundedPaidAmount),
                ),
                paymentStatus: getPaymentStatusFromAmounts(
                  roundedPaidAmount,
                  existingInvoice.grandTotal,
                ),
                notes: invoiceForm.notes.trim(),
              }
            : invoice,
        ),
      );
      console.info("[CAR DC9] Invoice save succeeded", {
        invoiceId: editingInvoiceId,
        mode: "job-card-payment-update",
      });
      showToast("toast.invoiceSaved");
      closeInvoiceModal();
      return;
    }

    let invoiceValues: Omit<Invoice, "id" | "archived">;

    if (selectedJobCard) {
      invoiceValues = buildInvoiceValues(selectedJobCard);
    } else {
      let invoiceCustomer = customers.find(
        (customer) => customer.id === Number(invoiceForm.customerId),
      );
      const rawCustomerPhone = invoiceForm.customerPhone.trim();
      const normalizedPhone = rawCustomerPhone
        ? normalizeSaudiPhone(invoiceForm.customerPhone)
        : "";
      const normalizedCustomerName = normalizeSearchName(invoiceForm.customerName);

      if (!invoiceCustomer) {
        if (!invoiceForm.customerName.trim()) {
          logInvoiceSaveFailure("toast.invoiceCustomerRequired");
          return;
        }

        if (normalizedPhone && !isValidSaudiPhone(normalizedPhone)) {
          logInvoiceSaveFailure("toast.phoneInvalid", {
            customerPhone: invoiceForm.customerPhone,
            normalizedPhone,
          });
          return;
        }

        const duplicateCustomer = customers.find(
          (customer) =>
            !customer.archived &&
            (normalizeSearchName(customer.name) === normalizedCustomerName ||
              (normalizedPhone &&
                normalizeSaudiPhone(customer.phone) === normalizedPhone)),
        );

        if (duplicateCustomer) {
          logInvoiceSaveFailure("toast.duplicateCustomerFound", {
            customerId: duplicateCustomer.id,
          });
          return;
        }

        invoiceCustomer = {
          id: createRecordId(),
          name: invoiceForm.customerName.trim(),
          phone: normalizedPhone,
          city: invoiceForm.customerCity.trim(),
          type: "new",
          notes: "",
          archived: false,
        };
        setCustomers((currentCustomers) => [invoiceCustomer as Customer, ...currentCustomers]);
      }

      let invoiceVehicle =
        invoiceForm.vehicleId && invoiceForm.vehicleId !== "__new"
          ? vehicles.find((vehicle) => vehicle.id === Number(invoiceForm.vehicleId))
          : undefined;

      if (invoiceForm.vehicleId === "__new") {
        if (!invoiceForm.vehiclePlateNumber.trim()) {
          logInvoiceSaveFailure("toast.invoiceVehicleRequired");
          return;
        }

        invoiceVehicle = {
          id: createRecordId(),
          customerId: invoiceCustomer.id,
          ownerName: invoiceCustomer.name,
          plateNumber: invoiceForm.vehiclePlateNumber.trim(),
          make: invoiceForm.vehicleMake.trim() || t("common.unknown"),
          model: invoiceForm.vehicleModel.trim(),
          year: invoiceForm.vehicleYear.trim(),
          colorKey: invoiceForm.vehicleColor.trim(),
          vehicleTypeKey: invoiceForm.vehicleType.trim(),
          notes: "",
          archived: false,
        };
        setVehicles((currentVehicles) => [invoiceVehicle as Vehicle, ...currentVehicles]);
      }

      invoiceValues = buildQuickInvoiceValues(invoiceCustomer, invoiceVehicle);
    }

    const nextInvoice: Invoice = {
      id: createRecordId(),
      ...invoiceValues,
      archived: false,
    };

    setInvoices((currentInvoices) => [nextInvoice, ...currentInvoices]);
    showToast("toast.invoiceSaved");
    console.info("[CAR DC9] Invoice save succeeded", {
      invoiceId: nextInvoice.id,
      invoiceNumber: nextInvoice.invoiceNumber,
      mode: selectedJobCard ? "job-card" : "quick",
      customerId: nextInvoice.customerId,
      vehicleId: nextInvoice.vehicleId,
      grandTotal: nextInvoice.grandTotal,
      paidAmount: nextInvoice.paidAmount,
      remainingBalance: nextInvoice.remainingBalance,
    });
    closeInvoiceModal();
  };

  const setInvoiceArchived = (invoiceId: number, archived: boolean) => {
    const targetInvoice = invoices.find((invoice) => invoice.id === invoiceId);

    if (
      targetInvoice &&
      !archived &&
      hasActiveInvoiceForJobCard(targetInvoice.jobCardId, targetInvoice.id)
    ) {
      showToast("toast.duplicateActiveInvoice");
      return;
    }

    setInvoices((currentInvoices) =>
      currentInvoices.map((invoice) =>
        invoice.id === invoiceId ? { ...invoice, archived } : invoice,
      ),
    );
    showToast(archived ? "toast.recordArchived" : "toast.recordRestored");
  };

  const openInvoiceCorrectionModal = (invoice: Invoice) => {
    if (invoice.archived) {
      return;
    }

    setCorrectionInvoiceId(invoice.id);
    setCorrectionReason("");
  };

  const closeInvoiceCorrectionModal = () => {
    setCorrectionInvoiceId(null);
    setCorrectionReason("");
  };

  const confirmInvoiceCorrection = () => {
    const reason = correctionReason.trim();
    const invoiceToCorrect = correctionInvoiceId
      ? invoices.find((invoice) => invoice.id === correctionInvoiceId)
      : undefined;
    const linkedJobCard = invoiceToCorrect
      ? jobCards.find((jobCard) => jobCard.id === invoiceToCorrect.jobCardId)
      : undefined;

    if (!invoiceToCorrect || !linkedJobCard) {
      closeInvoiceCorrectionModal();
      return;
    }

    if (!reason) {
      showToast("toast.correctionReasonRequired");
      return;
    }

    if (hasActiveInvoiceForJobCard(invoiceToCorrect.jobCardId, invoiceToCorrect.id)) {
      showToast("toast.duplicateActiveInvoice");
      return;
    }

    setInvoices((currentInvoices) =>
      currentInvoices.map((invoice) =>
        invoice.id === invoiceToCorrect.id
          ? {
              ...invoice,
              archived: true,
              correctionStatus: "corrected",
              correctionReason: reason,
              correctedAt: new Date().toISOString(),
            }
          : invoice,
      ),
    );
    setCorrectingJobCardId(linkedJobCard.id);
    setInvoiceTab("archived");
    closeInvoiceCorrectionModal();
    openJobCardModal(linkedJobCard);
  };

  const restoreRecycleBinRecord = (record: RecycleBinRecord) => {
    if (record.type === "customers") {
      setCustomerArchived(record.id, false);
      return;
    }

    if (record.type === "vehicles") {
      setVehicleArchived(record.id, false);
      return;
    }

    if (record.type === "jobCards") {
      setJobCardArchived(record.id, false);
      return;
    }

    if (record.type === "inventory") {
      setInventoryItemArchived(record.id, false);
      return;
    }

    if (record.type === "expenses") {
      setExpenseArchived(record.id, false);
      return;
    }

    if (record.type === "invoices") {
      setInvoiceArchived(record.id, false);
    }
  };

  const getPermanentDeleteBlockReason = (record: RecycleBinRecord) => {
    if (
      record.type === "invoices" ||
      record.type === "jobCards" ||
      record.type === "purchases" ||
      record.type === "expenses"
    ) {
      return "recycleBin.delete.protectedFinancial";
    }

    if (record.type === "customers") {
      const customer = customers.find((item) => item.id === record.id);
      const hasLinkedVehicles = vehicles.some(
        (vehicle) => vehicle.customerId === record.id,
      );
      const hasLinkedJobCards = jobCards.some(
        (jobCard) => jobCard.customerId === record.id,
      );
      const hasLinkedInvoices = customer
        ? invoices.some((invoice) => isInvoiceLinkedToCustomer(invoice, customer))
        : false;

      return hasLinkedVehicles || hasLinkedJobCards || hasLinkedInvoices
        ? "recycleBin.delete.customerLinked"
        : null;
    }

    if (record.type === "vehicles") {
      const vehicle = vehicles.find((item) => item.id === record.id);
      const hasLinkedJobCards = jobCards.some(
        (jobCard) => jobCard.vehicleId === record.id,
      );
      const hasLinkedInvoices = vehicle
        ? invoices.some((invoice) => isInvoiceLinkedToVehicle(invoice, vehicle))
        : false;

      return hasLinkedJobCards || hasLinkedInvoices
        ? "recycleBin.delete.vehicleLinked"
        : null;
    }

    if (record.type === "inventory") {
      const hasJobUsage = jobCards.some((jobCard) =>
        [...jobCard.partsUsed, ...jobCard.deductedParts].some(
          (part) => part.inventoryItemId === record.id,
        ),
      );
      const hasPurchaseHistory = purchases.some((purchase) =>
        purchase.items.some((item) => item.inventoryItemId === record.id),
      );

      return hasJobUsage || hasPurchaseHistory
        ? "recycleBin.delete.inventoryLinked"
        : null;
    }

    return null;
  };

  const openPermanentDeleteModal = (record: RecycleBinRecord) => {
    if (getPermanentDeleteBlockReason(record)) {
      return;
    }

    setPendingPermanentDelete({
      id: record.id,
      type: record.type,
      title: record.title,
    });
    setPermanentDeleteConfirmation("");
    setOwnerDeleteCodeInput("");
  };

  const closePermanentDeleteModal = () => {
    setPendingPermanentDelete(null);
    setPermanentDeleteConfirmation("");
    setOwnerDeleteCodeInput("");
  };

  const confirmPermanentDelete = () => {
    if (
      !pendingPermanentDelete ||
      permanentDeleteConfirmation !== "DELETE" ||
      ownerDeleteCodeInput !== OWNER_DELETE_CODE
    ) {
      return;
    }

    if (pendingPermanentDelete.type === "customers") {
      setCustomers((currentCustomers) =>
        currentCustomers.filter((customer) => customer.id !== pendingPermanentDelete.id),
      );
    }

    if (pendingPermanentDelete.type === "vehicles") {
      setVehicles((currentVehicles) =>
        currentVehicles.filter((vehicle) => vehicle.id !== pendingPermanentDelete.id),
      );
    }

    if (pendingPermanentDelete.type === "inventory") {
      setInventoryItems((currentItems) =>
        currentItems.filter((item) => item.id !== pendingPermanentDelete.id),
      );
    }

    showToast("toast.recordPermanentlyDeleted");
    closePermanentDeleteModal();
  };

  const saveSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedPhone = normalizeSaudiPhone(settingsDraft.phoneNumber);
    const defaultVatValidation = validateOptionalNonNegativeAmount(
      settingsDraft.defaultVatPercentage,
      "defaultVatPercentage",
    );

    if (!isValidSaudiPhone(normalizedPhone)) {
      setSettingsPhoneError(true);
      return;
    }

    if (defaultVatValidation.errorKey || defaultVatValidation.value === null) {
      showToast("toast.amountInvalid");
      return;
    }

    const nextSettings = {
      ...settingsDraft,
      invoicePrefix: getDocumentPrefix(settingsDraft.invoicePrefix, "INV"),
      jobCardPrefix: getDocumentPrefix(settingsDraft.jobCardPrefix, "JC"),
      purchaseOrderPrefix: getDocumentPrefix(settingsDraft.purchaseOrderPrefix, "PO"),
      defaultCurrency: settingsDraft.defaultCurrency.trim().toUpperCase() || "SAR",
      logoInitials: settingsDraft.logoInitials.trim() || "DC9",
      workshopName: settingsDraft.workshopName.trim() || defaultWorkshopSettings.workshopName,
      englishSubtitle:
        settingsDraft.englishSubtitle.trim() || defaultWorkshopSettings.englishSubtitle,
      arabicSubtitle:
        settingsDraft.arabicSubtitle.trim() || defaultWorkshopSettings.arabicSubtitle,
      phoneNumber: normalizedPhone,
      defaultCustomerCity: settingsDraft.defaultCustomerCity.trim(),
      defaultVatPercentage: String(defaultVatValidation.value),
    };

    setSettingsPhoneError(false);
    setSettings(nextSettings);
    setSettingsDraft(nextSettings);
    setLocale(nextSettings.defaultLanguage);
    setSettingsSavedMessage("settings.savedMessage");
  };

  const updateAppLanguage = (nextLanguage: AppLanguage) => {
    setLocale(nextLanguage);
    setSettings((currentSettings) => ({
      ...currentSettings,
      defaultLanguage: nextLanguage,
    }));
    setSettingsDraft((currentSettings) => ({
      ...currentSettings,
      defaultLanguage: nextLanguage,
    }));
  };

  const resetSettings = () => {
    setSettings(defaultWorkshopSettings);
    setSettingsDraft(defaultWorkshopSettings);
    setSettingsPhoneError(false);
    setLocale(defaultWorkshopSettings.defaultLanguage);
    setSettingsSavedMessage("settings.resetMessage");
  };

  const resetDemoData = () => {
    if (workshopDataService.canUseBrowser() && !window.confirm(t("settings.demoReset.confirm"))) {
      return;
    }

    const defaultDemoData = getDefaultDemoData();

    workshopDataService.clearAppData();
    setAppData(defaultDemoData);
    setSettingsDraft(defaultDemoData.settings);
    setLocale(defaultDemoData.settings.defaultLanguage);
    setActiveSection("settings");
    setSettingsSavedMessage("settings.demoReset.success");
  };

  const downloadBackup = () => {
    if (!workshopDataService.canUseBrowser()) {
      showToast("toast.storageSaveFailed");
      return;
    }

    const didDownload = workshopDataService.downloadTextFile(
      workshopDataService.serializeBackup(appData),
      workshopDataService.getBackupFilename(),
    );

    showToast(didDownload ? "toast.backupDownloaded" : "toast.storageSaveFailed");
  };

  const importBackup = (event: ChangeEvent<HTMLInputElement>) => {
    const backupFile = event.target.files?.[0];
    event.target.value = "";

    if (!backupFile) {
      return;
    }

    if (
      backupFile.type !== "application/json" &&
      !backupFile.name.toLowerCase().endsWith(".json")
    ) {
      showToast("toast.backupInvalid");
      return;
    }

    if (
      workshopDataService.canUseBrowser() &&
      !window.confirm(t("settings.backup.restoreConfirm"))
    ) {
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const parsedBackup = workshopDataService.parseBackup<Partial<DemoPersistedData>>(
        String(reader.result),
        backupDataKeys,
      );

      if (!parsedBackup.ok) {
        showToast("toast.backupInvalid");
        return;
      }

      if (!isValidBackupDataShape(parsedBackup.data)) {
        showToast("toast.backupInvalid");
        return;
      }

      try {
        const nextAppData = normalizePersistedAppData(parsedBackup.data);
        const saveResult = saveAppData(nextAppData);

        if (!saveResult.ok) {
          showToast(
            saveResult.error === "quotaExceeded"
              ? "toast.storageQuotaExceeded"
              : "toast.storageSaveFailed",
          );
          return;
        }

        workshopDataService.downloadTextFile(
          workshopDataService.serializeBackup(appData),
          workshopDataService.getBackupFilename(),
        );
        setAppData(nextAppData);
        setSettingsDraft(nextAppData.settings);
        setLocale(nextAppData.settings.defaultLanguage);
        setActiveSection("settings");
        showToast("toast.backupRestored");
      } catch {
        showToast("toast.backupInvalid");
      }
    };

    reader.onerror = () => {
      showToast("toast.backupInvalid");
    };

    reader.readAsText(backupFile);
  };

  const sectionHeaderKeys: Record<SectionKey, { title: string; subtitle: string }> = {
    dashboard: { title: "topbar.title", subtitle: "topbar.subtitle" },
    customers: { title: "customers.title", subtitle: "customers.subtitle" },
    vehicles: { title: "vehicles.title", subtitle: "vehicles.subtitle" },
    jobCards: { title: "jobCards.title", subtitle: "jobCards.subtitle" },
    inventory: { title: "inventory.title", subtitle: "inventory.subtitle" },
    purchases: { title: "purchases.title", subtitle: "purchases.subtitle" },
    expenses: { title: "expenses.title", subtitle: "expenses.subtitle" },
    invoices: { title: "invoices.title", subtitle: "invoices.subtitle" },
    reports: { title: "reports.title", subtitle: "reports.subtitle" },
    recycleBin: { title: "recycleBin.title", subtitle: "recycleBin.subtitle" },
    settings: { title: "settings.title", subtitle: "settings.subtitle" },
  };

  const topbarTitleKey = sectionHeaderKeys[activeSection].title;
  const topbarSubtitleKey = sectionHeaderKeys[activeSection].subtitle;
  const isVehicleModalOpenFromJobCard =
    isVehicleModalOpen && vehicleModalSource === "jobCard";
  const printInvoice = printInvoiceId
    ? invoices.find((invoice) => invoice.id === printInvoiceId)
    : undefined;
  const printCurrentInvoice = () => {
    if (!printInvoice) {
      return;
    }

    setIsPrintRendering(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.print();
      });
    });
  };

  return !isLanguageReady || !isAppHydrated ? (
    <LoadingScreen />
  ) : isPrintRendering && printInvoice ? (
    <main dir={dir} className="invoice-print-only bg-white text-slate-950">
      <PrintInvoiceModal
        formatDate={formatDate}
        formatPhone={formatPhone}
        formatMoney={formatMoney}
        invoice={printInvoice}
        isPrintRendering={isPrintRendering}
        onClose={() => {
          setIsPrintRendering(false);
          setPrintInvoiceId(null);
        }}
        onPrint={printCurrentInvoice}
        settings={settings}
        t={t}
      />
    </main>
  ) : (
    <main dir={dir} className="h-screen overflow-hidden bg-slate-100 text-slate-950">
      <div className="app-shell flex h-screen overflow-hidden bg-slate-100">
        <aside className="hidden h-screen w-72 shrink-0 border-e border-slate-200 bg-slate-50 px-4 py-5 shadow-lg shadow-slate-200/50 md:fixed md:inset-y-0 md:start-0 md:z-30 md:flex md:flex-col">
          <div className="mb-7 rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-700 text-sm font-bold text-white shadow-sm shadow-emerald-950/20">
                {settings.logoInitials}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-slate-950">
                  {settings.workshopName}
                </p>
                <p className="mt-0.5 truncate text-xs text-slate-500">
                  {workshopSubtitle}
                </p>
              </div>
            </div>
            <p className="mt-3 rounded-md bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-600" dir="ltr">
              {formatPhone(settings.phoneNumber)}
            </p>
          </div>

          <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto pe-1">
            {navigationItems.map((item) => (
              <NavigationButton
                key={item.key}
                isActive={item.key === activeSection}
                label={t(item.translationKey)}
                onClick={() => setActiveSection(item.key)}
              />
            ))}
          </nav>

          <div className="mt-5 rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              CAR DC9
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {t("settings.demoNotice.title")}
            </p>
          </div>
        </aside>

        <section className="flex h-screen min-w-0 flex-1 flex-col md:ps-72">
          <header className="shrink-0 border-b border-slate-200 bg-white/95 px-4 py-4 shadow-sm shadow-slate-200/60 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-emerald-700">
                    {t(topbarSubtitleKey)}
                  </p>
                  <h1 className="mt-1 text-2xl font-semibold tracking-normal text-slate-950">
                    {t(topbarTitleKey)}
                  </h1>
                </div>

                <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-700 text-xs font-bold text-white md:hidden">
                  {settings.logoInitials}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="hidden text-end text-xs text-slate-500 xl:block">
                  <p className="font-medium text-slate-700">{settings.workshopName}</p>
                  <p dir="ltr">{formatPhone(settings.phoneNumber)}</p>
                </div>

                <label className="sr-only" htmlFor="global-search">
                  {t("topbar.searchPlaceholder")}
                </label>
                <input
                  id="global-search"
                  type="search"
                  placeholder={t("topbar.searchPlaceholder")}
                  className="h-11 w-full rounded-md border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:bg-white sm:w-72"
                />

                <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 p-1">
                  <span className="sr-only">{t("language.label")}</span>
                  <button
                    type="button"
                    onClick={() => updateAppLanguage("ar")}
                    className={`h-9 rounded px-3 text-sm font-medium transition ${
                      isArabic
                        ? "bg-white text-emerald-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                    aria-pressed={isArabic}
                  >
                    {t("language.arabic")}
                  </button>
                  <button
                    type="button"
                    onClick={() => updateAppLanguage("en")}
                    className={`h-9 rounded px-3 text-sm font-medium transition ${
                      !isArabic
                        ? "bg-white text-emerald-800 shadow-sm"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                    aria-pressed={!isArabic}
                  >
                    {t("language.english")}
                  </button>
                </div>
              </div>
            </div>

            <p className="mt-3 rounded-md border border-sky-100 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800">
              {t("settings.demoNotice.title")}
            </p>

            <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 md:hidden">
              {navigationItems.map((item) => {
                const isActive = item.key === activeSection;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveSection(item.key)}
                    className={`shrink-0 rounded-md px-3 py-2 text-sm font-medium ${
                      isActive
                        ? "bg-emerald-700 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {t(item.translationKey)}
                  </button>
                );
              })}
            </nav>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
            {activeSection === "customers" ? (
              <CustomersSection
                customerForm={customerForm}
                customerPhoneError={customerPhoneError}
                customerSearch={customerSearch}
                customers={filteredCustomers}
                invoices={invoices}
                formatDate={formatDate}
                formatMoney={formatMoney}
                formatNumber={formatNumber}
                isEditing={editingCustomerId !== null}
                isModalOpen={isCustomerModalOpen}
                onArchivedChange={setCustomerArchived}
                onCloseModal={closeCustomerModal}
                onOpenModal={openCustomerModal}
                onSave={saveCustomer}
                onSearchChange={setCustomerSearch}
                activeTab={customerTab}
                onTabChange={setCustomerTab}
                onUpdateForm={(nextForm) => {
                  setCustomerForm(nextForm);
                  setCustomerPhoneError(false);
                }}
                formatPhone={formatPhone}
                getCustomerJobs={getCustomerJobs}
                getCustomerVehicles={getCustomerVehicles}
                t={t}
              />
            ) : activeSection === "vehicles" ? (
              <>
                <VehiclesSection
                  formatDate={formatDate}
                  formatNumber={formatNumber}
                  isEditing={editingVehicleId !== null}
                  isModalOpen={isVehicleModalOpen}
                  onArchivedChange={setVehicleArchived}
                  onCloseModal={closeVehicleModal}
                  onOpenModal={openVehicleModal}
                  onSave={saveVehicle}
                  onSearchChange={setVehicleSearch}
                  onViewHistory={(vehicle) => setHistoryVehicleId(vehicle.id)}
                  activeTab={vehicleTab}
                  onTabChange={setVehicleTab}
                  onUpdateForm={setVehicleForm}
                  getActiveJob={getActiveJob}
                  getLatestVehicleJob={getLatestVehicleJob}
                  getServiceSummaryJobs={getServiceSummaryJobs}
                  onStartJob={startJobForVehicle}
                  onViewActiveJob={viewActiveJobForVehicle}
                  t={t}
                  vehicleForm={vehicleForm}
                  vehicleSearch={vehicleSearch}
                  vehicles={filteredVehicles}
                />
                {historyVehicle ? (
                  <ServiceHistoryModal
                    formatDate={formatDate}
                    formatMoney={formatMoney}
                    jobCards={getVehicleJobs(historyVehicle.id)}
                    onClose={() => setHistoryVehicleId(null)}
                    t={t}
                    vehicle={historyVehicle}
                  />
                ) : null}
              </>
            ) : activeSection === "jobCards" ? (
              <JobCardsSection
                formatDate={formatDate}
                formatMoney={formatMoney}
                isModalOpen={isJobCardModalOpen && !isVehicleModalOpenFromJobCard}
                isEditing={editingJobCardId !== null}
                isFinancialLocked={
                  editingJobCardId
                    ? hasActiveInvoiceForJobCard(editingJobCardId)
                    : false
                }
                jobCardForm={jobCardForm}
                jobCardSearch={jobCardSearch}
                jobCardTab={jobCardTab}
                jobCards={filteredJobCards}
                isJobCardInvoiced={hasActiveInvoiceForJobCard}
                onArchivedChange={setJobCardArchived}
                onCloseModal={closeJobCardModal}
                onCreateInvoice={openInvoiceModalForJobCard}
                onOpenModal={openJobCardModal}
                onOpenVehicleModal={openVehicleModalFromJobCard}
                onSave={saveJobCard}
                onSearchChange={setJobCardSearch}
                onTabChange={setJobCardTab}
                onUpdateForm={setJobCardForm}
                t={t}
                inventoryItems={inventoryItems}
                vehicles={vehicles}
              />
            ) : activeSection === "inventory" ? (
              <InventorySection
                activeTab={inventoryTab}
                formatMoney={formatMoney}
                formatNumber={formatNumber}
                inventoryForm={inventoryForm}
                inventoryItems={filteredInventoryItems}
                inventorySearch={inventorySearch}
                isEditing={editingInventoryItemId !== null}
                isModalOpen={isInventoryModalOpen}
                onArchivedChange={setInventoryItemArchived}
                onCloseModal={closeInventoryModal}
                onOpenModal={openInventoryModal}
                onSave={saveInventoryItem}
                onSearchChange={setInventorySearch}
                onTabChange={setInventoryTab}
                onUpdateForm={setInventoryForm}
                t={t}
              />
            ) : activeSection === "purchases" ? (
              <PurchasesSection
                duplicateRowId={duplicatePurchaseRowId}
                expandedPurchaseId={expandedPurchaseId}
                formatDate={formatDate}
                formatMoney={formatMoney}
                formatNumber={formatNumber}
                inventoryItems={inventoryItems}
                isModalOpen={isPurchaseModalOpen}
                onCloseModal={closePurchaseModal}
                onDuplicateRowChange={setDuplicatePurchaseRowId}
                onExpandedPurchaseChange={setExpandedPurchaseId}
                onOpenModal={openPurchaseModal}
                onSave={savePurchase}
                onUpdateForm={setPurchaseForm}
                purchaseForm={purchaseForm}
                purchases={purchases}
                t={t}
              />
            ) : activeSection === "expenses" ? (
              <ExpensesSection
                activeTab={expenseTab}
                categoryTotals={expenseCategoryTotals}
                expenseForm={expenseForm}
                expenses={filteredExpenses}
                expenseCount={activeExpenses.length}
                formatDate={formatDate}
                formatMoney={formatMoney}
                formatSummaryMoney={formatSummaryMoney}
                isModalOpen={isExpenseModalOpen}
                largestExpense={largestExpenseAmount}
                monthlyExpenseTotal={monthlyExpenseTotal}
                onArchivedChange={setExpenseArchived}
                onCloseModal={closeExpenseModal}
                onOpenModal={openExpenseModal}
                onSave={saveExpense}
                onTabChange={setExpenseTab}
                onUpdateForm={setExpenseForm}
                t={t}
                weeklyExpenseTotal={weeklyExpenseTotal}
              />
            ) : activeSection === "invoices" ? (
              <>
                <InvoicesSection
                  activeTab={invoiceTab}
                  availableJobCards={getCompletedJobCardsForInvoice()}
                  customers={customers}
                  defaultCustomerCity={settings.defaultCustomerCity}
                  formatDate={formatDate}
                  formatPhone={formatPhone}
                  formatMoney={formatMoney}
                  getDefaultPaidAmountFromJobCard={getDefaultInvoicePaidAmountFromJobCard}
                  invoiceForm={invoiceForm}
                  invoiceSearch={invoiceSearch}
                  invoices={filteredInvoices}
                  isEditing={editingInvoiceId !== null}
                  isModalOpen={isInvoiceModalOpen}
                  onArchivedChange={setInvoiceArchived}
                  onCloseModal={closeInvoiceModal}
                  onCorrectInvoice={openInvoiceCorrectionModal}
                  onOpenModal={openInvoiceModal}
                  onPrintInvoice={(invoice) => setPrintInvoiceId(invoice.id)}
                  onSave={saveInvoice}
                  onSearchChange={setInvoiceSearch}
                  onTabChange={setInvoiceTab}
                  onUpdateForm={setInvoiceForm}
                  t={t}
                  vehicles={vehicles}
                />
              </>
            ) : activeSection === "reports" ? (
              <ReportsSection
                completedJobs={reportCompletedJobs}
                completedWorkValue={reportCompletedWorkValue}
                estimatedNetProfit={reportEstimatedNetProfit}
                expenseCategoryTotals={reportExpenseCategoryTotals}
                filterRange={reportRange}
                formatDate={formatDate}
                formatMoney={formatMoney}
                formatSummaryMoney={formatSummaryMoney}
                formatNumber={formatNumber}
                lowStockItems={reportLowStockItems}
                onFilterChange={setReportRange}
                outstandingBalance={reportOutstandingBalance}
                paidRevenue={reportPaidRevenue}
                purchaseCosts={reportPurchaseCosts}
                purchases={reportPurchases}
                t={t}
                totalExpenses={reportTotalExpenses}
                totalRevenue={reportTotalRevenue}
                unpaidInvoices={reportUnpaidInvoices}
                uninvoicedCompletedJobs={reportUninvoicedCompletedJobs}
                uninvoicedCompletedWorkValue={reportUninvoicedCompletedWorkValue}
              />
            ) : activeSection === "recycleBin" ? (
              <RecycleBinSection
                activeFilter={recycleBinFilter}
                getDeleteBlockReason={getPermanentDeleteBlockReason}
                onDelete={openPermanentDeleteModal}
                onFilterChange={setRecycleBinFilter}
                onRestore={restoreRecycleBinRecord}
                onSearchChange={setRecycleBinSearch}
                records={filteredRecycleBinRecords}
                searchValue={recycleBinSearch}
                t={t}
              />
            ) : activeSection === "settings" ? (
              <SettingsSection
                onDownloadBackup={downloadBackup}
                onImportBackup={importBackup}
                onResetDemoData={resetDemoData}
                onReset={resetSettings}
                onSave={saveSettings}
                onUpdateSettings={(nextSettings) => {
                  setSettingsDraft(nextSettings);
                  setSettingsPhoneError(false);
                }}
                savedMessage={settingsSavedMessage}
                settings={settingsDraft}
                settingsPhoneError={settingsPhoneError}
                t={t}
              />
            ) : (
              <DashboardSection
                financialCards={dashboardFinancialCards}
                formatCardValue={formatCardValue}
                onCreateJobCard={openNewJobCardFromDashboard}
                operationsCards={dashboardOperationsCards}
                t={t}
              />
            )}
          </div>
        </section>
      </div>
      {printInvoiceId ? (
        <PrintInvoiceModal
          formatDate={formatDate}
          formatPhone={formatPhone}
          formatMoney={formatMoney}
          invoice={printInvoice}
          isPrintRendering={isPrintRendering}
          onClose={() => {
            setIsPrintRendering(false);
            setPrintInvoiceId(null);
          }}
          onPrint={printCurrentInvoice}
          settings={settings}
          t={t}
        />
      ) : null}
      {activeSection !== "vehicles" && isVehicleModalOpen ? (
        <VehicleModal
          isEditing={editingVehicleId !== null}
          onClose={closeVehicleModal}
          onSave={saveVehicle}
          onUpdateForm={setVehicleForm}
          t={t}
          vehicleForm={vehicleForm}
        />
      ) : null}
      {activeSection !== "jobCards" && isJobCardModalOpen && !isVehicleModalOpenFromJobCard ? (
        <JobCardModal
          formatMoney={formatMoney}
          inventoryItems={inventoryItems}
          isEditing={editingJobCardId !== null}
          isFinancialLocked={
            editingJobCardId ? hasActiveInvoiceForJobCard(editingJobCardId) : false
          }
          jobCardForm={jobCardForm}
          onClose={closeJobCardModal}
          onOpenVehicleModal={openVehicleModalFromJobCard}
          onSave={saveJobCard}
          onUpdateForm={setJobCardForm}
          t={t}
          vehicles={vehicles}
        />
      ) : null}
      {correctionInvoiceId ? (
        <InvoiceCorrectionModal
          invoice={invoices.find((invoice) => invoice.id === correctionInvoiceId)}
          onClose={closeInvoiceCorrectionModal}
          onConfirm={confirmInvoiceCorrection}
          onReasonChange={setCorrectionReason}
          reason={correctionReason}
          t={t}
        />
      ) : null}
      {pendingPermanentDelete ? (
        <PermanentDeleteModal
          confirmationValue={permanentDeleteConfirmation}
          ownerDeleteCodeValue={ownerDeleteCodeInput}
          onClose={closePermanentDeleteModal}
          onConfirm={confirmPermanentDelete}
          onConfirmationChange={setPermanentDeleteConfirmation}
          onOwnerDeleteCodeChange={setOwnerDeleteCodeInput}
          record={pendingPermanentDelete}
          t={t}
        />
      ) : null}
      {toastMessage ? (
        <div className="fixed inset-x-4 bottom-4 z-[60] flex justify-center">
          <div className="rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 shadow-lg">
            {t(toastMessage.translationKey)}
          </div>
        </div>
      ) : null}
    </main>
  );
}

function LoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 text-slate-950">
      <section className="text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-lg bg-emerald-700 text-sm font-bold text-white">
          DC9
        </div>
        <h1 className="mt-4 text-xl font-bold tracking-normal">CAR DC9</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">
          Loading workshop system...
        </p>
      </section>
    </main>
  );
}

function NavigationButton({
  isActive,
  label,
  onClick,
}: {
  isActive: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-start text-sm font-medium transition ${
        isActive
          ? "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200"
          : "text-slate-600 hover:bg-white hover:text-slate-950 hover:shadow-sm"
      }`}
    >
      <span
        className={`size-2 shrink-0 rounded-full ${
          isActive ? "bg-emerald-700" : "bg-slate-300"
        }`}
      />
      <span className="truncate">{label}</span>
    </button>
  );
}

function DashboardSection({
  financialCards,
  formatCardValue,
  onCreateJobCard,
  operationsCards,
  t,
}: {
  financialCards: Array<{
    key: string;
    translationKey: string;
    value: number;
    currency?: boolean;
  }>;
  formatCardValue: (value: number, currency?: boolean) => string;
  onCreateJobCard: () => void;
  operationsCards: Array<{
    key: string;
    translationKey: string;
    value: number;
    currency?: boolean;
  }>;
  t: (key: string) => string;
}) {
  const renderCards = (
    cards: Array<{
      key: string;
      translationKey: string;
      value: number;
      currency?: boolean;
    }>,
  ) => (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <article
          key={card.key}
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                {t(card.translationKey)}
              </p>
              <p className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">
                {formatCardValue(card.value, "currency" in card && card.currency)}
              </p>
            </div>
            <span className="mt-1 size-3 rounded-full bg-emerald-500" />
          </div>
        </article>
      ))}
    </section>
  );

  return (
    <>
      <section className="mb-6 rounded-lg bg-emerald-800 px-5 py-6 text-white shadow-sm sm:px-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-emerald-100">
              {t("topbar.branch")}
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal">
              {t("dashboard.welcomeTitle")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-emerald-50">
              {t("dashboard.welcomeBody")}
            </p>
          </div>

          <button
            type="button"
            onClick={onCreateJobCard}
            className="h-11 rounded-md bg-white px-4 text-sm font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-50"
          >
            {t("dashboard.quickAction")}
          </button>
        </div>
      </section>

      <div className="grid gap-6">
        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {t("dashboard.financialSnapshot")}
          </h3>
          {renderCards(financialCards)}
        </section>

        <section>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {t("dashboard.operationsSnapshot")}
          </h3>
          {renderCards(operationsCards)}
        </section>
      </div>
    </>
  );
}

function PaginationControls({
  currentPage,
  onPageChange,
  pageCount,
  summary,
  t,
}: {
  currentPage: number;
  onPageChange: (page: number) => void;
  pageCount: number;
  summary: string;
  t: (key: string) => string;
}) {
  if (pageCount <= 1) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <p>{summary}</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          className="h-9 rounded-md border border-slate-200 px-3 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
        >
          {t("common.previous")}
        </button>
        <span className="rounded-md bg-slate-50 px-3 py-2">
          {t("common.pageSummary")
            .replace("{page}", String(currentPage))
            .replace("{pages}", String(pageCount))}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(pageCount, currentPage + 1))}
          disabled={currentPage >= pageCount}
          className="h-9 rounded-md border border-slate-200 px-3 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
        >
          {t("common.next")}
        </button>
      </div>
    </div>
  );
}

function CustomersSection({
  activeTab,
  customerForm,
  customerPhoneError,
  customerSearch,
  customers,
  invoices,
  formatDate,
  formatPhone,
  formatMoney,
  formatNumber,
  isEditing,
  isModalOpen,
  onArchivedChange,
  onCloseModal,
  onOpenModal,
  onSave,
  onSearchChange,
  onTabChange,
  onUpdateForm,
  getCustomerJobs,
  getCustomerVehicles,
  t,
}: {
  activeTab: RecordTab;
  customerForm: CustomerForm;
  customerPhoneError: boolean;
  customerSearch: string;
  customers: Customer[];
  invoices: Invoice[];
  formatDate: (value: string) => string;
  formatPhone: (value: string) => string;
  formatMoney: (value: number) => string;
  formatNumber: (value: number) => string;
  isEditing: boolean;
  isModalOpen: boolean;
  onArchivedChange: (customerId: number, archived: boolean) => void;
  onCloseModal: () => void;
  onOpenModal: (customer?: Customer) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onSearchChange: (value: string) => void;
  onTabChange: (value: RecordTab) => void;
  onUpdateForm: (value: CustomerForm) => void;
  getCustomerJobs: (customerId: number) => JobCard[];
  getCustomerVehicles: (customerId: number) => Vehicle[];
  t: (key: string) => string;
}) {
  const pageSize = 50;
  const [currentPage, setCurrentPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(customers.length / pageSize));
  const safePage = Math.min(currentPage, pageCount);
  const paginatedCustomers = customers.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  return (
    <>
      <section className="mb-6 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-700">
            {t(
              activeTab === "archived"
                ? "customers.archivedRecordCount"
                : "customers.activeRecordCount",
            ).replace("{count}", formatNumber(customers.length))}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal">
            {t("customers.title")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {t("customers.subtitle")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenModal()}
          className="h-11 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
        >
          {t("customers.addButton")}
        </button>
      </section>

      <section className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex-1">
          <label className="sr-only" htmlFor="customer-search">
            {t("customers.searchLabel")}
          </label>
          <input
            id="customer-search"
            type="search"
            value={customerSearch}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("customers.searchPlaceholder")}
            className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600"
          />
        </div>

        <RecordTabs
          activeTab={activeTab}
          onTabChange={onTabChange}
          t={t}
        />
      </section>

      {customers.length > 0 ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {paginatedCustomers.map((customer) => {
            const customerVehicles = getCustomerVehicles(customer.id);
            const customerJobs = getCustomerJobs(customer.id);
            const customerInvoices = invoices.filter(
              (invoice) =>
                !invoice.archived &&
                isInvoiceLinkedToCustomer(invoice, customer),
            );
            const lastCustomerJob = customerJobs.toSorted((firstJob, secondJob) =>
              secondJob.date.localeCompare(firstJob.date),
            )[0];
            const jobOutstandingBalance = customerJobs
              .filter((jobCard) => jobCard.status !== "completed")
              .filter((jobCard) => jobCard.paymentStatus !== "paid")
              .reduce(
                (total, jobCard) =>
                  total +
                  Math.max(0, jobCard.laborCost + jobCard.partsCost - jobCard.paidAmount),
                0,
              );
            const invoiceOutstandingBalance = customerInvoices.reduce(
              (total, invoice) => total + Math.max(0, invoice.remainingBalance),
              0,
            );
            const outstandingBalance = jobOutstandingBalance + invoiceOutstandingBalance;

            return (
              <article
                key={customer.id}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold tracking-normal text-slate-950">
                      {customer.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500" dir="ltr">{formatPhone(customer.phone)}</p>
                  </div>
                  <span
                    className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                      customer.archived
                        ? "bg-slate-100 text-slate-600"
                        : customer.type === "repeat"
                        ? "bg-emerald-50 text-emerald-800"
                        : "bg-sky-50 text-sky-800"
                    }`}
                  >
                    {customer.archived
                      ? t("common.archived")
                      : t(customer.type === "repeat" ? "customers.typeRepeat" : "customers.typeNew")}
                  </span>
                </div>

                <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                  <CustomerField label={t("customers.fields.city")} value={customer.city} />
                  <CustomerField
                    label={t("customers.fields.totalVehicles")}
                    value={formatNumber(customerVehicles.length)}
                  />
                  <CustomerField
                    label={t("customers.fields.totalVisits")}
                    value={formatNumber(customerJobs.length)}
                  />
                  <CustomerField
                    label={t("customers.fields.outstandingBalance")}
                    value={formatMoney(outstandingBalance)}
                  />
                  <CustomerField
                    label={t("customers.fields.lastVisit")}
                    value={lastCustomerJob ? formatDate(lastCustomerJob.date) : t("common.notAvailable")}
                  />
                </dl>

                <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => onOpenModal(customer)}
                    className="h-10 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {t("common.viewEdit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => onArchivedChange(customer.id, !customer.archived)}
                    className={`h-10 rounded-md border px-3 text-sm font-semibold transition ${
                      customer.archived
                        ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        : "border-amber-200 text-amber-700 hover:bg-amber-50"
                    }`}
                  >
                    {t(customer.archived ? "common.restore" : "common.archive")}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-12 text-center shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">
            {t(
              activeTab === "archived"
                ? "customers.emptyArchivedTitle"
                : "customers.emptyActiveTitle",
            )}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {t(
              activeTab === "archived"
                ? "customers.emptyArchivedBody"
                : "customers.emptyActiveBody",
            )}
          </p>
        </section>
      )}

      <PaginationControls
        currentPage={safePage}
        onPageChange={setCurrentPage}
        pageCount={pageCount}
        summary={t("common.paginationSummary")
          .replace("{shown}", String(paginatedCustomers.length))
          .replace("{total}", String(customers.length))}
        t={t}
      />

      {isModalOpen ? (
        <CustomerModal
          customerForm={customerForm}
          customerPhoneError={customerPhoneError}
          isEditing={isEditing}
          onClose={onCloseModal}
          onSave={onSave}
          onUpdateForm={onUpdateForm}
          t={t}
        />
      ) : null}
    </>
  );
}

function CustomerField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase leading-5 text-slate-400">{label}</dt>
      <dd className="mt-1 break-words text-sm font-semibold leading-5 text-slate-800">{value}</dd>
    </div>
  );
}

function CustomerModal({
  customerForm,
  customerPhoneError,
  isEditing,
  onClose,
  onSave,
  onUpdateForm,
  t,
}: {
  customerForm: CustomerForm;
  customerPhoneError: boolean;
  isEditing: boolean;
  onClose: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateForm: (value: CustomerForm) => void;
  t: (key: string) => string;
}) {
  const hasPhoneValue = Boolean(cleanSaudiPhoneInput(customerForm.phone));
  const isCurrentPhoneValid = isValidSaudiPhone(customerForm.phone);
  const showPhoneError =
    (customerPhoneError || hasPhoneValue) && !isCurrentPhoneValid;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/40 px-4 py-4">
      <form
        onSubmit={onSave}
        className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-lg bg-white shadow-xl sm:max-w-4xl"
      >
        <div className="shrink-0 border-b border-slate-100 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-normal">
                {t(isEditing ? "customers.form.editTitle" : "customers.form.title")}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {t(isEditing ? "customers.form.editSubtitle" : "customers.form.subtitle")}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-2 py-1 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
            >
              {t("customers.form.close")}
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 pb-28">
          <div className="grid gap-4">
            <FormField
              label={t("customers.fields.name")}
              value={customerForm.name}
              onChange={(value) => onUpdateForm({ ...customerForm, name: value })}
              placeholder={t("customers.form.namePlaceholder")}
              required
            />
            <PhoneField
              error={showPhoneError ? t("customers.form.phoneInvalid") : undefined}
              label={t("customers.fields.phone")}
              value={customerForm.phone ? formatSaudiPhone(customerForm.phone) : ""}
              onChange={(value) =>
                onUpdateForm({
                  ...customerForm,
                  phone: value.trim() ? normalizeSaudiPhone(value) : "",
                })
              }
              placeholder={t("customers.form.phonePlaceholder")}
            />
            <FormField
              label={t("customers.fields.city")}
              value={customerForm.city}
              onChange={(value) => onUpdateForm({ ...customerForm, city: value })}
              placeholder={t("customers.form.cityPlaceholder")}
              required
            />

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                {t("customers.fields.customerType")}
              </span>
              <select
                value={customerForm.type}
                onChange={(event) =>
                  onUpdateForm({
                    ...customerForm,
                    type: event.target.value as CustomerType,
                  })
                }
                className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-600"
              >
                <option value="new">{t("customers.typeNew")}</option>
                <option value="repeat">{t("customers.typeRepeat")}</option>
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                {t("customers.fields.notes")}
              </span>
              <textarea
                value={customerForm.notes}
                onChange={(event) =>
                  onUpdateForm({ ...customerForm, notes: event.target.value })
                }
                placeholder={t("customers.form.notesPlaceholder")}
                rows={4}
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600"
              />
            </label>
          </div>
        </div>

        <div className="sticky bottom-0 flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-white p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {t("customers.form.cancel")}
          </button>
          <button
            type="submit"
            disabled={showPhoneError}
            className="h-11 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {t("customers.form.save")}
          </button>
        </div>
      </form>
    </div>
  );
}

function VehiclesSection({
  activeTab,
  formatDate,
  formatNumber,
  isEditing,
  isModalOpen,
  onArchivedChange,
  onCloseModal,
  onOpenModal,
  onSave,
  onSearchChange,
  onViewHistory,
  onTabChange,
  onUpdateForm,
  getActiveJob,
  getLatestVehicleJob,
  getServiceSummaryJobs,
  onStartJob,
  onViewActiveJob,
  t,
  vehicleForm,
  vehicleSearch,
  vehicles,
}: {
  activeTab: RecordTab;
  formatDate: (value: string) => string;
  formatNumber: (value: number) => string;
  isEditing: boolean;
  isModalOpen: boolean;
  onArchivedChange: (vehicleId: number, archived: boolean) => void;
  onCloseModal: () => void;
  onOpenModal: (vehicle?: Vehicle) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onSearchChange: (value: string) => void;
  onViewHistory: (vehicle: Vehicle) => void;
  onTabChange: (value: RecordTab) => void;
  onUpdateForm: (value: VehicleForm) => void;
  getActiveJob: (vehicleId: number) => JobCard | undefined;
  getLatestVehicleJob: (vehicleId: number) => JobCard | undefined;
  getServiceSummaryJobs: (vehicleId: number) => JobCard[];
  onStartJob: (vehicle: Vehicle) => void;
  onViewActiveJob: (jobCard: JobCard) => void;
  t: (key: string) => string;
  vehicleForm: VehicleForm;
  vehicleSearch: string;
  vehicles: Vehicle[];
}) {
  const pageSize = 50;
  const [currentPage, setCurrentPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(vehicles.length / pageSize));
  const safePage = Math.min(currentPage, pageCount);
  const paginatedVehicles = vehicles.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  return (
    <>
      <section className="mb-6 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-700">
            {t(
              activeTab === "archived"
                ? "vehicles.archivedRecordCount"
                : "vehicles.activeRecordCount",
            ).replace("{count}", formatNumber(vehicles.length))}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal">
            {t("vehicles.title")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {t("vehicles.subtitle")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenModal()}
          className="h-11 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
        >
          {t("vehicles.addButton")}
        </button>
      </section>

      <section className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex-1">
          <label className="sr-only" htmlFor="vehicle-search">
            {t("vehicles.searchLabel")}
          </label>
          <input
            id="vehicle-search"
            type="search"
            value={vehicleSearch}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("vehicles.searchPlaceholder")}
            className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600"
          />
        </div>

        <RecordTabs
          activeTab={activeTab}
          onTabChange={onTabChange}
          t={t}
        />
      </section>

      {vehicles.length > 0 ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {paginatedVehicles.map((vehicle) => {
            const serviceSummaryJobs = getServiceSummaryJobs(vehicle.id);
            const latestVehicleJob = getLatestVehicleJob(vehicle.id);
            const activeJob = getActiveJob(vehicle.id);

            return (
              <article
                key={vehicle.id}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-xl font-semibold tracking-normal text-slate-950">
                      {vehicle.make} {vehicle.model}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {vehicle.ownerName}
                    </p>
                  </div>
                  {vehicle.archived ? (
                    <span className="w-fit shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                      {t("common.archived")}
                    </span>
                  ) : (
                    <VehicleStatusBadge status={latestVehicleJob?.status ?? "active"} t={t} />
                  )}
                </div>

              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <CustomerField
                  label={t("vehicles.fields.plateNumber")}
                  value={vehicle.plateNumber}
                />
                <CustomerField
                  label={t("vehicles.fields.year")}
                  value={vehicle.year}
                />
                <CustomerField
                  label={t("vehicles.fields.color")}
                  value={t(vehicle.colorKey)}
                />
                <CustomerField
                  label={t("vehicles.fields.vehicleType")}
                  value={t(vehicle.vehicleTypeKey)}
                />
              </dl>

              <section className="mt-5 rounded-lg bg-slate-50 p-4">
                <h4 className="text-sm font-semibold text-slate-800">
                  {t("vehicles.maintenance.title")}
                </h4>
                <dl className="mt-4 grid gap-4 sm:grid-cols-3">
                  <CustomerField
                    label={t("vehicles.fields.totalVisits")}
                    value={formatNumber(serviceSummaryJobs.length)}
                  />
                  <CustomerField
                    label={t("vehicles.fields.lastServiceDate")}
                    value={latestVehicleJob ? formatDate(latestVehicleJob.date) : t("common.notAvailable")}
                  />
                  <CustomerField
                    label={t("vehicles.fields.currentStatus")}
                    value={latestVehicleJob ? t(`vehicles.status.${latestVehicleJob.status}`) : t("common.notAvailable")}
                  />
                  <CustomerField
                    label={t("vehicles.fields.lastWorkPerformed")}
                    value={latestVehicleJob?.workPerformed || t("common.notAvailable")}
                  />
                </dl>
              </section>

              <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                {!vehicle.archived ? (
                  <button
                    type="button"
                    onClick={() =>
                      activeJob ? onViewActiveJob(activeJob) : onStartJob(vehicle)
                    }
                    className={`h-10 rounded-md px-3 text-sm font-semibold text-white transition ${
                      activeJob
                        ? "bg-amber-600 hover:bg-amber-700"
                        : "bg-emerald-700 hover:bg-emerald-800"
                    }`}
                  >
                    {t(activeJob ? "vehicles.viewActiveJob" : "vehicles.startJob")}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => onOpenModal(vehicle)}
                  className="h-10 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {t("common.viewEdit")}
                </button>
                <button
                  type="button"
                  onClick={() => onViewHistory(vehicle)}
                  className="h-10 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {t("vehicles.viewServiceHistory")}
                </button>
                <button
                  type="button"
                  onClick={() => onArchivedChange(vehicle.id, !vehicle.archived)}
                  className={`h-10 rounded-md border px-3 text-sm font-semibold transition ${
                    vehicle.archived
                      ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      : "border-amber-200 text-amber-700 hover:bg-amber-50"
                  }`}
                >
                  {t(vehicle.archived ? "common.restore" : "common.archive")}
                </button>
              </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-12 text-center shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">
            {t(
              activeTab === "archived"
                ? "vehicles.emptyArchivedTitle"
                : "vehicles.emptyActiveTitle",
            )}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {t(
              activeTab === "archived"
                ? "vehicles.emptyArchivedBody"
                : "vehicles.emptyActiveBody",
            )}
          </p>
        </section>
      )}

      <PaginationControls
        currentPage={safePage}
        onPageChange={setCurrentPage}
        pageCount={pageCount}
        summary={t("common.paginationSummary")
          .replace("{shown}", String(paginatedVehicles.length))
          .replace("{total}", String(vehicles.length))}
        t={t}
      />

      {isModalOpen ? (
        <VehicleModal
          isEditing={isEditing}
          onClose={onCloseModal}
          onSave={onSave}
          onUpdateForm={onUpdateForm}
          t={t}
          vehicleForm={vehicleForm}
        />
      ) : null}
    </>
  );
}

function VehicleStatusBadge({
  status,
  t,
}: {
  status: VehicleDisplayStatus;
  t: (key: string) => string;
}) {
  const statusClasses: Record<VehicleDisplayStatus, string> = {
    active: "bg-emerald-50 text-emerald-800",
    inWorkshop: "bg-amber-50 text-amber-800",
    completed: "bg-emerald-50 text-emerald-800",
    cancelled: "bg-rose-50 text-rose-700",
  };

  return (
    <span
      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[status]}`}
    >
      {t(`vehicles.status.${status}`)}
    </span>
  );
}

function PaymentStatusBadge({
  status,
  t,
}: {
  status: PaymentStatus;
  t: (key: string) => string;
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

function VehicleModal({
  isEditing,
  onClose,
  onSave,
  onUpdateForm,
  t,
  vehicleForm,
}: {
  isEditing: boolean;
  onClose: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateForm: (value: VehicleForm) => void;
  t: (key: string) => string;
  vehicleForm: VehicleForm;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/40 px-4 py-4">
      <form
        onSubmit={onSave}
        className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-lg bg-white shadow-xl sm:max-w-2xl"
      >
        <div className="shrink-0 border-b border-slate-100 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-normal">
                {t(isEditing ? "vehicles.form.editTitle" : "vehicles.form.title")}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {t(isEditing ? "vehicles.form.editSubtitle" : "vehicles.form.subtitle")}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-2 py-1 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
            >
              {t("vehicles.form.close")}
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 pb-28">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label={t("vehicles.fields.ownerName")}
              value={vehicleForm.ownerName}
              onChange={(value) => onUpdateForm({ ...vehicleForm, ownerName: value })}
              placeholder={t("vehicles.form.ownerPlaceholder")}
              required
            />
            <FormField
              label={t("vehicles.fields.plateNumber")}
              value={vehicleForm.plateNumber}
              onChange={(value) => onUpdateForm({ ...vehicleForm, plateNumber: value })}
              placeholder={t("vehicles.form.platePlaceholder")}
              required
            />
            <FormField
              label={t("vehicles.fields.make")}
              value={vehicleForm.make}
              onChange={(value) => onUpdateForm({ ...vehicleForm, make: value })}
              placeholder={t("vehicles.form.makePlaceholder")}
              required
            />
            <FormField
              label={t("vehicles.fields.model")}
              value={vehicleForm.model}
              onChange={(value) => onUpdateForm({ ...vehicleForm, model: value })}
              placeholder={t("vehicles.form.modelPlaceholder")}
              required
            />
            <FormField
              label={t("vehicles.fields.year")}
              value={vehicleForm.year}
              onChange={(value) => onUpdateForm({ ...vehicleForm, year: value })}
              placeholder={t("vehicles.form.yearPlaceholder")}
              required
            />
            <FormField
              label={t("vehicles.fields.color")}
              value={vehicleForm.color}
              onChange={(value) => onUpdateForm({ ...vehicleForm, color: value })}
              placeholder={t("vehicles.form.colorPlaceholder")}
              required
            />
            <FormField
              label={t("vehicles.fields.vehicleType")}
              value={vehicleForm.vehicleType}
              onChange={(value) =>
                onUpdateForm({ ...vehicleForm, vehicleType: value })
              }
              placeholder={t("vehicles.form.typePlaceholder")}
              required
            />

            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                {t("vehicles.fields.notes")}
              </span>
              <textarea
                value={vehicleForm.notes}
                onChange={(event) =>
                  onUpdateForm({ ...vehicleForm, notes: event.target.value })
                }
                placeholder={t("vehicles.form.notesPlaceholder")}
                rows={4}
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600"
              />
            </label>
          </div>
        </div>

        <div className="sticky bottom-0 flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-white p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {t("vehicles.form.cancel")}
          </button>
          <button
            type="submit"
            className="h-11 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            {t("vehicles.form.save")}
          </button>
        </div>
      </form>
    </div>
  );
}

function ServiceHistoryModal({
  formatDate,
  formatMoney,
  jobCards,
  onClose,
  t,
  vehicle,
}: {
  formatDate: (value: string) => string;
  formatMoney: (value: number) => string;
  jobCards: JobCard[];
  onClose: () => void;
  t: (key: string) => string;
  vehicle: Vehicle;
}) {
  const sortedJobCards = jobCards.toSorted((firstJob, secondJob) =>
    secondJob.date.localeCompare(firstJob.date),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/40 px-4 py-4">
      <div className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-lg bg-white shadow-xl sm:max-w-3xl">
        <div className="shrink-0 border-b border-slate-100 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-normal">
                {t("vehicles.history.title")}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {vehicle.make} {vehicle.model} - {vehicle.plateNumber}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-2 py-1 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
            >
              {t("vehicles.history.close")}
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 pb-28">
          {sortedJobCards.length > 0 ? (
            <div className="grid gap-4">
              {sortedJobCards.map((jobCard) => (
                <article
                  key={jobCard.id}
                  className="rounded-lg border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-950">
                        {jobCard.jobNumber}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatDate(jobCard.date)}
                      </p>
                    </div>
                    <VehicleStatusBadge status={jobCard.status} t={t} />
                  </div>

                  <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                    <CustomerField
                      label={t("jobCards.fields.complaint")}
                      value={jobCard.complaint}
                    />
                    <CustomerField
                      label={t("jobCards.fields.workPerformed")}
                      value={jobCard.workPerformed}
                    />
                    <CustomerField
                      label={t("jobCards.fields.mechanic")}
                      value={jobCard.mechanic}
                    />
                    <div>
                      <dt className="text-xs font-medium uppercase text-slate-400">
                        {t("jobCards.fields.paymentStatus")}
                      </dt>
                      <dd className="mt-1">
                        <PaymentStatusBadge status={jobCard.paymentStatus} t={t} />
                      </dd>
                    </div>
                    <CustomerField
                      label={t("jobCards.fields.totalAmount")}
                      value={formatMoney(jobCard.laborCost + jobCard.partsCost)}
                    />
                  </dl>
                  {jobCard.partsUsed.length > 0 ? (
                    <div className="mt-4 rounded-lg bg-slate-50 p-3">
                      <p className="text-xs font-medium uppercase text-slate-400">
                        {t("jobCards.parts.summary")}
                      </p>
                      <p className="mt-2 text-sm font-semibold text-slate-800">
                        {jobCard.partsUsed
                          .map(
                            (part) =>
                              `${part.itemName} x ${part.quantity} (${formatMoney(part.lineTotal)})`,
                          )
                          .join(", ")}
                      </p>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <section className="rounded-lg border border-dashed border-slate-300 px-5 py-12 text-center">
              <h3 className="text-lg font-semibold text-slate-950">
                {t("vehicles.history.emptyTitle")}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                {t("vehicles.history.emptyBody")}
              </p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function JobCardsSection({
  formatDate,
  formatMoney,
  inventoryItems,
  isEditing,
  isFinancialLocked,
  isModalOpen,
  isJobCardInvoiced,
  jobCardForm,
  jobCardSearch,
  jobCardTab,
  jobCards,
  onArchivedChange,
  onCloseModal,
  onCreateInvoice,
  onOpenModal,
  onOpenVehicleModal,
  onSave,
  onSearchChange,
  onTabChange,
  onUpdateForm,
  t,
  vehicles,
}: {
  formatDate: (value: string) => string;
  formatMoney: (value: number) => string;
  inventoryItems: InventoryItem[];
  isEditing: boolean;
  isFinancialLocked: boolean;
  isModalOpen: boolean;
  isJobCardInvoiced: (jobCardId: number, excludeInvoiceId?: number) => boolean;
  jobCardForm: JobCardForm;
  jobCardSearch: string;
  jobCardTab: RecordTab;
  jobCards: JobCard[];
  onArchivedChange: (jobCardId: number, archived: boolean) => void;
  onCloseModal: () => void;
  onCreateInvoice: (jobCard: JobCard) => void;
  onOpenModal: (jobCard?: JobCard) => void;
  onOpenVehicleModal: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onSearchChange: (value: string) => void;
  onTabChange: (value: RecordTab) => void;
  onUpdateForm: (value: JobCardForm) => void;
  t: (key: string) => string;
  vehicles: Vehicle[];
}) {
  const sortedJobCards = jobCards.toSorted((firstJob, secondJob) =>
    secondJob.date.localeCompare(firstJob.date),
  );

  return (
    <>
      <section className="mb-6 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-700">
            {t("jobCards.recordCount").replace("{count}", String(jobCards.length))}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal">
            {t("jobCards.title")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {t("jobCards.subtitle")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenModal()}
          className="h-11 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
        >
          {t("jobCards.addButton")}
        </button>
      </section>

      <section className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex-1">
          <label className="sr-only" htmlFor="job-card-search">
            {t("jobCards.searchLabel")}
          </label>
          <input
            id="job-card-search"
            type="search"
            value={jobCardSearch}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("jobCards.searchPlaceholder")}
            className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600"
          />
        </div>

        <RecordTabs activeTab={jobCardTab} onTabChange={onTabChange} t={t} />
      </section>

      {sortedJobCards.length > 0 ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {sortedJobCards.map((jobCard) => (
            <article
              key={jobCard.id}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-xl font-semibold tracking-normal text-slate-950">
                    {jobCard.jobNumber}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatDate(jobCard.date)}
                  </p>
                </div>
                {jobCard.archived ? (
                  <span className="w-fit shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {t("common.archived")}
                  </span>
                ) : (
                  <VehicleStatusBadge status={jobCard.status} t={t} />
                )}
              </div>

              <div className="mt-4 rounded-lg bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">
                  {jobCard.customerName}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {jobCard.vehicleLabel} - {jobCard.plateNumber}
                </p>
              </div>

              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <CustomerField label={t("jobCards.fields.complaint")} value={jobCard.complaint} />
                <CustomerField label={t("jobCards.fields.workPerformed")} value={jobCard.workPerformed} />
                <CustomerField label={t("jobCards.fields.mechanic")} value={jobCard.mechanic} />
                <CustomerField label={t("jobCards.fields.notes")} value={jobCard.notes || t("common.notAvailable")} />
              </dl>

              <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="grid gap-3 sm:grid-cols-4">
                  <CustomerField
                    label={t("jobCards.fields.laborCost")}
                    value={formatMoney(jobCard.laborCost)}
                  />
                  <CustomerField
                    label={t("jobCards.fields.partsCost")}
                    value={formatMoney(jobCard.partsCost)}
                  />
                  <CustomerField
                    label={t("jobCards.parts.partsCount")}
                    value={String(jobCard.partsUsed.length)}
                  />
                  <CustomerField
                    label={t("jobCards.fields.paidAmount")}
                    value={formatMoney(jobCard.paidAmount)}
                  />
                  <CustomerField
                    label={t("jobCards.fields.remainingAmount")}
                    value={formatMoney(Math.max(0, jobCard.laborCost + jobCard.partsCost - jobCard.paidAmount))}
                  />
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-400">
                      {t("jobCards.fields.totalAmount")}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-slate-950">
                      {formatMoney(jobCard.laborCost + jobCard.partsCost)}
                    </p>
                  </div>
                </div>
                <PaymentStatusBadge status={jobCard.paymentStatus} t={t} />
              </div>

              <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                {!jobCard.archived &&
                jobCard.status === "completed" &&
                !isJobCardInvoiced(jobCard.id) ? (
                  <button
                    type="button"
                    onClick={() => onCreateInvoice(jobCard)}
                    className="h-10 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                  >
                    {t("reports.uninvoicedJobs.createInvoice")}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => onOpenModal(jobCard)}
                  className="h-10 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {t("common.viewEdit")}
                </button>
                <button
                  type="button"
                  onClick={() => onArchivedChange(jobCard.id, !jobCard.archived)}
                  className={`h-10 rounded-md border px-3 text-sm font-semibold transition ${
                    jobCard.archived
                      ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      : "border-amber-200 text-amber-700 hover:bg-amber-50"
                  }`}
                >
                  {t(jobCard.archived ? "common.restore" : "jobCards.cancelArchive")}
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-12 text-center shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">
            {t("jobCards.emptyTitle")}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {t("jobCards.emptyBody")}
          </p>
        </section>
      )}

      {isModalOpen ? (
        <JobCardModal
          formatMoney={formatMoney}
          inventoryItems={inventoryItems}
          isEditing={isEditing}
          isFinancialLocked={isFinancialLocked}
          jobCardForm={jobCardForm}
          onClose={onCloseModal}
          onOpenVehicleModal={onOpenVehicleModal}
          onSave={onSave}
          onUpdateForm={onUpdateForm}
          t={t}
          vehicles={vehicles}
        />
      ) : null}
    </>
  );
}

function JobCardModal({
  formatMoney,
  inventoryItems,
  isEditing,
  isFinancialLocked,
  jobCardForm,
  onClose,
  onOpenVehicleModal,
  onSave,
  onUpdateForm,
  t,
  vehicles,
}: {
  formatMoney: (value: number) => string;
  inventoryItems: InventoryItem[];
  isEditing: boolean;
  isFinancialLocked: boolean;
  jobCardForm: JobCardForm;
  onClose: () => void;
  onOpenVehicleModal: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateForm: (value: JobCardForm) => void;
  t: (key: string) => string;
  vehicles: Vehicle[];
}) {
  const [duplicatePartRowId, setDuplicatePartRowId] = useState<string | null>(null);
  const [isPartsExpanded, setIsPartsExpanded] = useState(
    jobCardForm.partsUsed.length > 0,
  );
  const selectedVehicle = vehicles.find(
    (vehicle) => vehicle.id === Number(jobCardForm.vehicleId),
  );
  const getFormCost = (value: string) => {
    const parsedValue = parseSafeNumber(value);
    return parsedValue !== null && parsedValue > 0 ? parsedValue : 0;
  };
  const activeInventoryItems = inventoryItems.filter((item) => !item.archived);
  const getPartLineTotal = (partLine: JobPartFormLine) =>
    getFormCost(partLine.quantity) * getFormCost(partLine.unitSellingPrice);
  const partsTotal = jobCardForm.partsUsed.reduce(
    (total, partLine) => total + getPartLineTotal(partLine),
    0,
  );
  const totalAmount = getFormCost(jobCardForm.laborCost) + partsTotal;
  const rawPaidAmount = getFormCost(jobCardForm.paidAmount);
  const paidAmount = rawPaidAmount;
  const syncedPaymentStatus =
    paidAmount <= 0 ? "unpaid" : paidAmount >= totalAmount ? "paid" : "partial";
  const remainingAmount = Math.max(0, totalAmount - paidAmount);
  const laborCostErrorKey = getFinancialInputErrorKey(
    jobCardForm.laborCost,
    "toast.laborCostInvalid",
  );
  const paidAmountErrorKey = getPaidAmountInputErrorKey(
    jobCardForm.paidAmount,
    totalAmount,
  );
  const hasPartFinancialErrors = jobCardForm.partsUsed.some((partLine) =>
    Boolean(
      getFinancialInputErrorKey(partLine.quantity, "toast.quantityInvalid") ||
        getFinancialInputErrorKey(partLine.unitSellingPrice),
    ),
  );
  const hasJobCardFinancialErrors = Boolean(
    laborCostErrorKey || paidAmountErrorKey || hasPartFinancialErrors,
  );
  const selectedInventoryItemIds = jobCardForm.partsUsed
    .map((partLine) => partLine.inventoryItemId)
    .filter(Boolean);
  const createPartRowId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `part-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const addPartLine = () => {
    setIsPartsExpanded(true);
    onUpdateForm({
      ...jobCardForm,
      partsUsed: [
        ...jobCardForm.partsUsed,
        {
          rowId: createPartRowId(),
          inventoryItemId: "",
          quantity: "1",
          unitSellingPrice: "0",
        },
      ],
    });
  };

  const updatePartLine = (
    rowId: string,
    nextValues: Partial<Omit<JobPartFormLine, "rowId">>,
  ) => {
    onUpdateForm({
      ...jobCardForm,
      partsUsed: jobCardForm.partsUsed.map((partLine) =>
        partLine.rowId === rowId ? { ...partLine, ...nextValues } : partLine,
      ),
    });
  };

  const removePartLine = (rowId: string) => {
    onUpdateForm({
      ...jobCardForm,
      partsUsed: jobCardForm.partsUsed.filter((partLine) => partLine.rowId !== rowId),
    });
  };
  const updateJobCardPaidAmount = (value: string) => {
    const parsedPaidAmount = parseSafeNumber(value);
    const nextPaidAmount =
      parsedPaidAmount !== null && parsedPaidAmount > 0 ? parsedPaidAmount : 0;

    onUpdateForm({
      ...jobCardForm,
      paidAmount: value,
      paymentStatus:
        nextPaidAmount <= 0
          ? "unpaid"
          : nextPaidAmount >= totalAmount
            ? "paid"
            : "partial",
    });
  };
  const updateJobCardPaymentStatus = (status: PaymentStatus) => {
    const nextPaidAmount =
      status === "paid"
        ? totalAmount
        : status === "unpaid"
          ? 0
          : paidAmount > 0 && paidAmount < totalAmount
            ? paidAmount
            : totalAmount > 0
              ? totalAmount / 2
              : 0;

    onUpdateForm({
      ...jobCardForm,
      paidAmount: String(nextPaidAmount),
      paymentStatus:
        nextPaidAmount <= 0
          ? "unpaid"
          : nextPaidAmount >= totalAmount
            ? "paid"
            : "partial",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/40 px-4 py-4">
      <form
        onSubmit={onSave}
        className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-lg bg-white shadow-xl sm:max-w-4xl"
      >
        <div className="shrink-0 border-b border-slate-100 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-normal">
                {t(isEditing ? "jobCards.form.editTitle" : "jobCards.form.title")}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {t(isEditing ? "jobCards.form.editSubtitle" : "jobCards.form.subtitle")}
              </p>
              {isFinancialLocked ? (
                <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                  {t("toast.invoicedJobCardLocked")}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-2 py-1 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
            >
              {t("jobCards.form.close")}
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4 pb-24 sm:p-5 sm:pb-24">
          <div className="grid gap-3">
            <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 lg:grid-cols-3">
              <FormField
                label={t("jobCards.fields.jobNumber")}
                value={jobCardForm.jobNumber}
                onChange={(value) => onUpdateForm({ ...jobCardForm, jobNumber: value })}
                placeholder={t("jobCards.form.jobNumberPlaceholder")}
                required
              />

              <FormField
                inputType="date"
                label={t("jobCards.fields.date")}
                value={jobCardForm.date}
                onChange={(value) => onUpdateForm({ ...jobCardForm, date: value })}
                placeholder={t("jobCards.form.datePlaceholder")}
                required
              />

              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  {t("jobCards.fields.status")}
                </span>
                <select
                  value={jobCardForm.status}
                  onChange={(event) =>
                    onUpdateForm({
                      ...jobCardForm,
                      status: event.target.value as JobCardStatus,
                    })
                  }
                  disabled={isFinancialLocked}
                  className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-600"
                >
                  <option value="inWorkshop">{t("vehicles.status.inWorkshop")}</option>
                  <option value="completed">{t("vehicles.status.completed")}</option>
                  <option value="cancelled">{t("vehicles.status.cancelled")}</option>
                </select>
              </label>

              <label className="block lg:col-span-3">
                <span className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-700">
                    {t("jobCards.fields.vehicle")}
                  </span>
                  <button
                    type="button"
                    onClick={onOpenVehicleModal}
                    disabled={isFinancialLocked}
                    className="h-8 rounded-md border border-emerald-200 bg-white px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50"
                  >
                    {t("jobCards.form.addNewVehicle")}
                  </button>
                </span>
                <select
                  value={jobCardForm.vehicleId}
                  onChange={(event) =>
                    onUpdateForm({ ...jobCardForm, vehicleId: event.target.value })
                  }
                  required
                  disabled={isFinancialLocked}
                  className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <option value="">{t("jobCards.form.vehiclePlaceholder")}</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.plateNumber} - {vehicle.make} {vehicle.model}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs leading-5 text-slate-500">
                  {t("jobCards.form.vehicleHelper")}
                </p>
              </label>

              {selectedVehicle ? (
                <div className="grid gap-3 rounded-lg border border-slate-100 bg-slate-50 p-3 sm:grid-cols-3 lg:col-span-3">
                  <CustomerField
                    label={t("jobCards.fields.customerName")}
                    value={selectedVehicle.ownerName}
                  />
                  <CustomerField
                    label={t("jobCards.fields.vehicleName")}
                    value={`${selectedVehicle.make} ${selectedVehicle.model}`}
                  />
                  <CustomerField
                    label={t("jobCards.fields.plateNumber")}
                    value={selectedVehicle.plateNumber}
                  />
                </div>
              ) : null}
            </section>

            <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 lg:grid-cols-3">
              <FormField
                label={t("jobCards.fields.complaint")}
                value={jobCardForm.complaint}
                onChange={(value) => onUpdateForm({ ...jobCardForm, complaint: value })}
                placeholder={t("jobCards.form.complaintPlaceholder")}
              />

              <FormField
                label={t("jobCards.fields.mechanic")}
                value={jobCardForm.mechanic}
                onChange={(value) => onUpdateForm({ ...jobCardForm, mechanic: value })}
                placeholder={t("jobCards.form.mechanicPlaceholder")}
              />

              <FormField
                inputType="number"
                label={t("jobCards.fields.laborCost")}
                min="0"
                value={jobCardForm.laborCost}
                onChange={(value) => onUpdateForm({ ...jobCardForm, laborCost: value })}
                placeholder={t("jobCards.form.laborCostPlaceholder")}
                error={laborCostErrorKey ? t(laborCostErrorKey) : undefined}
                disabled={isFinancialLocked}
                required
              />

              <FormField
                label={t("jobCards.fields.workPerformed")}
                value={jobCardForm.workPerformed}
                onChange={(value) => onUpdateForm({ ...jobCardForm, workPerformed: value })}
                placeholder={t("jobCards.form.workPlaceholder")}
                required
              />
            </section>

            <section className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {t("jobCards.parts.title")}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {t("jobCards.parts.subtitle")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                      {t("jobCards.parts.partsCount")}: {jobCardForm.partsUsed.length}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                      {t("jobCards.fields.partsCost")}: {formatMoney(partsTotal)}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setIsPartsExpanded((current) => !current)}
                    className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {t(
                      isPartsExpanded
                        ? "jobCards.parts.hideParts"
                        : "jobCards.parts.manageParts",
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={addPartLine}
                    disabled={isFinancialLocked}
                    className="h-9 rounded-md border border-emerald-200 bg-white px-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                  >
                    {t("jobCards.parts.addPart")}
                  </button>
                </div>
              </div>

              {isPartsExpanded ? (
                <div className="mt-3 grid gap-3">
                  {jobCardForm.partsUsed.length > 0 ? (
                    <div className="grid gap-3">
                      {jobCardForm.partsUsed.map((partLine) => {
                        const selectedItem = inventoryItems.find(
                          (item) => item.id === Number(partLine.inventoryItemId),
                        );
                        const quantity = getFormCost(partLine.quantity);
                        const quantityErrorKey = getFinancialInputErrorKey(
                          partLine.quantity,
                          "toast.quantityInvalid",
                        );
                        const unitPriceErrorKey = getFinancialInputErrorKey(
                          partLine.unitSellingPrice,
                        );
                        const showStockWarning =
                          selectedItem?.itemType === "stock" &&
                          quantity > selectedItem.stockQuantity;
                        const showDuplicateWarning =
                          duplicatePartRowId === partLine.rowId ||
                          (Boolean(partLine.inventoryItemId) &&
                            selectedInventoryItemIds.filter(
                              (itemId) => itemId === partLine.inventoryItemId,
                            ).length > 1);

                        return (
                          <div
                            key={partLine.rowId}
                            className="rounded-lg border border-slate-200 bg-white p-3 transition hover:border-slate-300"
                          >
                            <div className="mb-3 flex flex-col gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-slate-950">
                                  {selectedItem?.itemName ?? t("jobCards.parts.emptyRow")}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                  {selectedItem?.arabicItemName || t("common.notAvailable")}
                                </p>
                                {selectedItem ? (
                                  <p className="mt-1 text-xs font-medium text-slate-500">
                                    {selectedItem.sku}
                                  </p>
                                ) : null}
                              </div>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(120px,0.85fr)_minmax(120px,0.85fr)_minmax(130px,0.9fr)_minmax(150px,0.95fr)] lg:items-end">
                              <label className="block">
                                <span className="text-sm font-medium text-slate-700">
                                  {t("jobCards.parts.inventoryItem")}
                                </span>
                                <select
                                  value={partLine.inventoryItemId}
                                  onChange={(event) => {
                                    const nextInventoryItemId = event.target.value;
                                    const isDuplicateItem =
                                      Boolean(nextInventoryItemId) &&
                                      selectedInventoryItemIds.includes(nextInventoryItemId) &&
                                      partLine.inventoryItemId !== nextInventoryItemId;

                                    if (isDuplicateItem) {
                                      setDuplicatePartRowId(partLine.rowId);
                                      return;
                                    }

                                    const selectedInventoryItem = inventoryItems.find(
                                      (item) => item.id === Number(nextInventoryItemId),
                                    );
                                    setDuplicatePartRowId(null);

                                    updatePartLine(partLine.rowId, {
                                      inventoryItemId: nextInventoryItemId,
                                      unitSellingPrice: selectedInventoryItem
                                        ? String(selectedInventoryItem.sellingPrice)
                                        : "0",
                                    });
                                  }}
                                  disabled={isFinancialLocked}
                                  className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                                >
                                  <option value="">
                                    {t("jobCards.parts.selectItem")}
                                  </option>
                                  {activeInventoryItems.map((item) => (
                                    <option
                                      key={item.id}
                                      value={item.id}
                                      disabled={
                                        selectedInventoryItemIds.includes(String(item.id)) &&
                                        partLine.inventoryItemId !== String(item.id)
                                      }
                                    >
                                      {item.itemName} - {item.sku}
                                    </option>
                                  ))}
                                </select>
                              </label>

                            <div>
                              <p className="text-sm font-medium text-slate-700">
                                {t("jobCards.parts.availableStockLabel")}
                              </p>
                              <div className="mt-1 flex flex-wrap gap-2">
                                {selectedItem ? (
                                  <>
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                      {t(`inventory.itemTypes.${selectedItem.itemType}`)}
                                    </span>
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                                      {selectedItem.itemType === "service"
                                        ? t("jobCards.parts.noStockDeduction")
                                        : t("jobCards.parts.availableStock").replace(
                                            "{count}",
                                            String(selectedItem.stockQuantity),
                                          )}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-sm font-semibold text-slate-500">
                                    {t("common.notAvailable")}
                                  </span>
                                )}
                              </div>
                            </div>

                            <label className="block">
                              <span className="text-sm font-medium text-slate-700">
                                {t("jobCards.parts.quantity")}
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={partLine.quantity}
                                onChange={(event) =>
                                  updatePartLine(partLine.rowId, {
                                    quantity: event.target.value,
                                  })
                                }
                                placeholder={t("jobCards.parts.quantityPlaceholder")}
                                disabled={isFinancialLocked}
                                aria-invalid={Boolean(quantityErrorKey)}
                                className={`mt-1 h-10 w-full rounded-md border bg-white px-3 text-center text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${
                                  quantityErrorKey ? "border-rose-300" : "border-slate-200"
                                }`}
                              />
                              {quantityErrorKey ? (
                                <p className="mt-1 text-xs font-medium text-rose-600">
                                  {t(quantityErrorKey)}
                                </p>
                              ) : null}
                            </label>

                            <label className="block">
                              <span className="text-sm font-medium text-slate-700">
                                {t("jobCards.parts.unitSellingPrice")}
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={partLine.unitSellingPrice}
                                onChange={(event) =>
                                  updatePartLine(partLine.rowId, {
                                    unitSellingPrice: event.target.value,
                                  })
                                }
                                placeholder={t("jobCards.parts.pricePlaceholder")}
                                disabled={isFinancialLocked}
                                aria-invalid={Boolean(unitPriceErrorKey)}
                                className={`mt-1 h-10 w-full rounded-md border bg-white px-3 text-center text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${
                                  unitPriceErrorKey ? "border-rose-300" : "border-slate-200"
                                }`}
                              />
                              {unitPriceErrorKey ? (
                                <p className="mt-1 text-xs font-medium text-rose-600">
                                  {t(unitPriceErrorKey)}
                                </p>
                              ) : null}
                            </label>

                            <div className="flex items-end justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 md:col-span-2 lg:col-span-1">
                              <div>
                                <p className="text-sm font-medium text-slate-700">
                                  {t("jobCards.parts.lineTotal")}
                                </p>
                                <p className="mt-1 text-base font-bold text-slate-950">
                                  {formatMoney(getPartLineTotal(partLine))}
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => removePartLine(partLine.rowId)}
                                disabled={isFinancialLocked}
                                className="h-9 shrink-0 rounded-md border border-rose-200 px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                              >
                                {t("common.remove")}
                              </button>
                            </div>
                            </div>

                            {showStockWarning || showDuplicateWarning ? (
                              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                {showStockWarning ? (
                                  <span className="rounded-full bg-rose-50 px-3 py-1 font-semibold text-rose-700">
                                    {t("jobCards.parts.stockWarning")}
                                  </span>
                                ) : null}
                                {showDuplicateWarning ? (
                                  <span className="rounded-full bg-amber-50 px-3 py-1 font-semibold text-amber-700">
                                    {t("jobCards.parts.duplicateWarning")}
                                  </span>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-5 text-center">
                      <p className="text-sm font-semibold text-slate-700">
                        {t("jobCards.parts.empty")}
                      </p>
                      <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">
                        {t("jobCards.parts.emptyHint")}
                      </p>
                      <button
                        type="button"
                        onClick={addPartLine}
                        disabled={isFinancialLocked}
                        className="mt-4 h-9 rounded-md border border-emerald-200 bg-white px-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                      >
                        {t("jobCards.parts.addPart")}
                      </button>
                    </div>
                  )}
                </div>
              ) : null}
            </section>

            <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase text-slate-400">
                  {t("jobCards.fields.partsCost")}
                </p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {formatMoney(partsTotal)}
                </p>
              </div>
              <div className="sm:text-end">
                <p className="text-xs font-medium uppercase text-slate-400">
                  {t("jobCards.fields.totalAmount")}
                </p>
                <p className="mt-1 text-xl font-bold text-emerald-800">
                  {formatMoney(totalAmount)}
                </p>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="grid gap-3 sm:grid-cols-3 sm:items-end">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">
                    {t("jobCards.fields.paymentStatus")}
                  </span>
                  <select
                    value={syncedPaymentStatus}
                    onChange={(event) =>
                      updateJobCardPaymentStatus(event.target.value as PaymentStatus)
                    }
                    className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-600"
                  >
                    <option value="unpaid">{t("jobCards.paymentStatus.unpaid")}</option>
                    <option value="partial">{t("jobCards.paymentStatus.partial")}</option>
                    <option value="paid">{t("jobCards.paymentStatus.paid")}</option>
                  </select>
                </label>
                <FormField
                  inputType="number"
                  label={t("jobCards.fields.paidAmount")}
                  min="0"
                  value={jobCardForm.paidAmount}
                  onChange={updateJobCardPaidAmount}
                  placeholder={t("jobCards.form.paidAmountPlaceholder")}
                  error={paidAmountErrorKey ? t(paidAmountErrorKey) : undefined}
                />
                <div className="rounded-md bg-slate-50 px-3 py-2">
                  <p className="text-xs font-medium uppercase text-slate-400">
                    {t("jobCards.fields.remainingAmount")}
                  </p>
                  <p className="mt-1 text-base font-bold text-slate-950">
                    {formatMoney(remainingAmount)}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                <p className="text-xs font-medium uppercase text-slate-400">
                  {t("jobCards.fields.paymentStatus")}
                </p>
                <PaymentStatusBadge status={syncedPaymentStatus} t={t} />
              </div>
            </section>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                {t("jobCards.fields.notes")}
              </span>
              <textarea
                value={jobCardForm.notes}
                onChange={(event) =>
                  onUpdateForm({ ...jobCardForm, notes: event.target.value })
                }
                placeholder={t("jobCards.form.notesPlaceholder")}
                rows={3}
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600"
              />
            </label>
          </div>
        </div>

        <div className="sticky bottom-0 flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-white p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {t("jobCards.form.cancel")}
          </button>
          <button
            type="submit"
            disabled={hasJobCardFinancialErrors}
            className="h-11 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {t("jobCards.form.save")}
          </button>
        </div>
      </form>
    </div>
  );
}

function InvoicesSection({
  activeTab,
  availableJobCards,
  customers,
  defaultCustomerCity,
  formatDate,
  formatPhone,
  formatMoney,
  getDefaultPaidAmountFromJobCard,
  invoiceForm,
  invoiceSearch,
  invoices,
  isEditing,
  isModalOpen,
  onArchivedChange,
  onCloseModal,
  onCorrectInvoice,
  onOpenModal,
  onPrintInvoice,
  onSave,
  onSearchChange,
  onTabChange,
  onUpdateForm,
  t,
  vehicles,
}: {
  activeTab: RecordTab;
  availableJobCards: JobCard[];
  customers: Customer[];
  defaultCustomerCity: string;
  formatDate: (value: string) => string;
  formatPhone: (value: string) => string;
  formatMoney: (value: number) => string;
  getDefaultPaidAmountFromJobCard: (
    jobCard: JobCard,
    discount: number,
    taxPercentage: number,
  ) => number;
  invoiceForm: InvoiceForm;
  invoiceSearch: string;
  invoices: Invoice[];
  isEditing: boolean;
  isModalOpen: boolean;
  onArchivedChange: (invoiceId: number, archived: boolean) => void;
  onCloseModal: () => void;
  onCorrectInvoice: (invoice: Invoice) => void;
  onOpenModal: (invoice?: Invoice) => void;
  onPrintInvoice: (invoice: Invoice) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onSearchChange: (value: string) => void;
  onTabChange: (value: RecordTab) => void;
  onUpdateForm: (value: InvoiceForm) => void;
  t: (key: string) => string;
  vehicles: Vehicle[];
}) {
  const pageSize = 50;
  const [currentPage, setCurrentPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(invoices.length / pageSize));
  const safePage = Math.min(currentPage, pageCount);
  const paginatedInvoices = invoices.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  return (
    <>
      <section className="mb-6 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-700">
            {t(activeTab === "archived" ? "invoices.archivedRecordCount" : "invoices.activeRecordCount").replace("{count}", String(invoices.length))}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal">{t("invoices.title")}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">{t("invoices.subtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => onOpenModal()}
          className="h-11 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
        >
          {t("invoices.addButton")}
        </button>
      </section>

      <section className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex-1">
          <label className="sr-only" htmlFor="invoice-search">{t("invoices.searchLabel")}</label>
          <input
            id="invoice-search"
            type="search"
            value={invoiceSearch}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("invoices.searchPlaceholder")}
            className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600"
          />
        </div>
        <RecordTabs activeTab={activeTab} onTabChange={onTabChange} t={t} />
      </section>

      {invoices.length > 0 ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {paginatedInvoices.map((invoice) => (
            <article key={invoice.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-semibold tracking-normal text-slate-950">{invoice.invoiceNumber}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-800">{invoice.customerName}</p>
                  <p className="mt-1 text-sm text-slate-500">{invoice.vehicle} - {invoice.plateNumber}</p>
                </div>
                {invoice.archived ? (
                  <span className="w-fit shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{t("common.archived")}</span>
                ) : (
                  <PaymentStatusBadge status={invoice.paymentStatus} t={t} />
                )}
              </div>
              <dl className="mt-5 grid gap-4 sm:grid-cols-3">
                <CustomerField label={t("invoices.fields.invoiceDate")} value={formatDate(invoice.invoiceDate)} />
                <CustomerField label={t("invoices.fields.jobCardNumber")} value={invoice.jobCardNumber} />
                <CustomerField label={t("invoices.fields.grandTotal")} value={formatMoney(invoice.grandTotal)} />
                <CustomerField label={t("invoices.fields.paidAmount")} value={formatMoney(invoice.paidAmount)} />
                <CustomerField label={t("invoices.fields.remainingBalance")} value={formatMoney(invoice.remainingBalance)} />
                <CustomerField label={t("invoices.fields.customerPhone")} value={formatPhone(invoice.customerPhone)} />
                {invoice.customerCity ? (
                  <CustomerField label={t("invoices.fields.customerCity")} value={invoice.customerCity} />
                ) : null}
              </dl>
              <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => onOpenModal(invoice)} className="h-10 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  {t("common.viewEdit")}
                </button>
                <button type="button" onClick={() => onPrintInvoice(invoice)} className="h-10 rounded-md border border-emerald-200 px-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">
                  {t("invoices.printButton")}
                </button>
                {!invoice.archived && invoice.jobCardId > 0 ? (
                  <button type="button" onClick={() => onCorrectInvoice(invoice)} className="h-10 rounded-md border border-sky-200 px-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-50">
                    {t("invoices.correctButton")}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => onArchivedChange(invoice.id, !invoice.archived)}
                  className={`h-10 rounded-md border px-3 text-sm font-semibold transition ${invoice.archived ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50" : "border-amber-200 text-amber-700 hover:bg-amber-50"}`}
                >
                  {t(invoice.archived ? "common.restore" : "common.archive")}
                </button>
              </div>
              {invoice.correctionStatus ? (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <p className="font-semibold">{t("invoices.correctedLabel")}</p>
                  <p className="mt-1">{invoice.correctionReason || t("common.notAvailable")}</p>
                </div>
              ) : null}
            </article>
          ))}
        </section>
      ) : (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-12 text-center shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">{t(activeTab === "archived" ? "invoices.emptyArchivedTitle" : "invoices.emptyActiveTitle")}</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{t(activeTab === "archived" ? "invoices.emptyArchivedBody" : "invoices.emptyActiveBody")}</p>
        </section>
      )}

      <PaginationControls
        currentPage={safePage}
        onPageChange={setCurrentPage}
        pageCount={pageCount}
        summary={t("common.paginationSummary")
          .replace("{shown}", String(paginatedInvoices.length))
          .replace("{total}", String(invoices.length))}
        t={t}
      />

      {isModalOpen ? (
        <InvoiceModal
          availableJobCards={availableJobCards}
          customers={customers}
          defaultCustomerCity={defaultCustomerCity}
          formatDate={formatDate}
          formatPhone={formatPhone}
          formatMoney={formatMoney}
          getDefaultPaidAmountFromJobCard={getDefaultPaidAmountFromJobCard}
          invoiceForm={invoiceForm}
          isEditing={isEditing}
          onClose={onCloseModal}
          onSave={onSave}
          onUpdateForm={onUpdateForm}
          t={t}
          vehicles={vehicles}
        />
      ) : null}
    </>
  );
}

function InvoiceCorrectionModal({
  invoice,
  onClose,
  onConfirm,
  onReasonChange,
  reason,
  t,
}: {
  invoice?: Invoice;
  onClose: () => void;
  onConfirm: () => void;
  onReasonChange: (value: string) => void;
  reason: string;
  t: (key: string) => string;
}) {
  if (!invoice) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-slate-950/40 px-4 py-4">
      <section className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-xl font-semibold tracking-normal text-slate-950">
            {t("invoices.correction.title")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {t("invoices.correction.warning")}
          </p>
        </div>

        <div className="grid gap-4 p-5">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <CustomerField
              label={t("invoices.fields.invoiceNumber")}
              value={invoice.invoiceNumber}
            />
            <div className="mt-3">
              <CustomerField
                label={t("invoices.fields.jobCardNumber")}
                value={invoice.jobCardNumber}
              />
            </div>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">
              {t("invoices.correction.reasonLabel")}
            </span>
            <textarea
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder={t("invoices.correction.reasonPlaceholder")}
              rows={4}
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600"
            />
          </label>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {t("invoices.form.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-11 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            {t("invoices.correction.confirm")}
          </button>
        </div>
      </section>
    </div>
  );
}

function InvoiceModal({
  availableJobCards,
  customers,
  defaultCustomerCity,
  formatDate,
  formatPhone,
  formatMoney,
  getDefaultPaidAmountFromJobCard,
  invoiceForm,
  isEditing,
  onClose,
  onSave,
  onUpdateForm,
  t,
  vehicles,
}: {
  availableJobCards: JobCard[];
  customers: Customer[];
  defaultCustomerCity: string;
  formatDate: (value: string) => string;
  formatPhone: (value: string) => string;
  formatMoney: (value: number) => string;
  getDefaultPaidAmountFromJobCard: (
    jobCard: JobCard,
    discount: number,
    taxPercentage: number,
  ) => number;
  invoiceForm: InvoiceForm;
  isEditing: boolean;
  onClose: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateForm: (value: InvoiceForm) => void;
  t: (key: string) => string;
  vehicles: Vehicle[];
}) {
  const selectedJobCard =
    invoiceForm.invoiceType === "jobCard"
      ? availableJobCards.find((jobCard) => jobCard.id === Number(invoiceForm.jobCardId))
      : undefined;
  const selectedCustomer = customers.find(
    (customer) => customer.id === Number(invoiceForm.customerId),
  );
  const customerVehicles = selectedCustomer
    ? vehicles.filter(
        (vehicle) =>
          !vehicle.archived &&
          (vehicle.customerId === selectedCustomer.id ||
            vehicle.ownerName === selectedCustomer.name),
      )
    : [];
  const selectedVehicle =
    invoiceForm.vehicleId && invoiceForm.vehicleId !== "__new"
      ? vehicles.find((vehicle) => vehicle.id === Number(invoiceForm.vehicleId))
      : undefined;
  const isQuickInvoice = invoiceForm.invoiceType === "quick";
  const normalizedNewCustomerName = normalizeSearchName(invoiceForm.customerName);
  const normalizedNewCustomerPhone = invoiceForm.customerPhone.trim()
    ? normalizeSaudiPhone(invoiceForm.customerPhone)
    : "";
  const duplicateCustomer =
    isQuickInvoice && !selectedCustomer && normalizedNewCustomerName
      ? customers.find(
          (customer) =>
            !customer.archived &&
            (normalizeSearchName(customer.name) === normalizedNewCustomerName ||
              (normalizedNewCustomerPhone &&
                normalizeSaudiPhone(customer.phone) === normalizedNewCustomerPhone)),
        )
      : undefined;
  const discountValue = parseSafeNumber(invoiceForm.discount);
  const taxPercentageValue = parseSafeNumber(invoiceForm.taxPercentage);
  const paidAmountValue = parseSafeNumber(invoiceForm.paidAmount);
  const manualLaborCostValue = parseSafeNumber(invoiceForm.laborCost);
  const manualPartsCostValue = parseSafeNumber(invoiceForm.partsCost);
  const discount = discountValue !== null && discountValue > 0 ? discountValue : 0;
  const taxPercentage =
    taxPercentageValue !== null && taxPercentageValue > 0 ? taxPercentageValue : 0;
  const paidAmount =
    paidAmountValue !== null && paidAmountValue > 0 ? paidAmountValue : 0;
  const manualLaborCost =
    manualLaborCostValue !== null && manualLaborCostValue > 0 ? manualLaborCostValue : 0;
  const manualPartsCost =
    manualPartsCostValue !== null && manualPartsCostValue > 0 ? manualPartsCostValue : 0;
  const laborCost = selectedJobCard ? selectedJobCard.laborCost : manualLaborCost;
  const partsCost = selectedJobCard ? selectedJobCard.partsCost : manualPartsCost;
  const subtotal = roundMoney(laborCost + partsCost);
  const taxAmount = roundMoney(subtotal * (taxPercentage / 100));
  const grandTotal = roundMoney(Math.max(0, subtotal + taxAmount - discount));
  const remainingBalance = roundMoney(Math.max(0, grandTotal - paidAmount));
  const paymentStatus = getPaymentStatusFromAmounts(paidAmount, grandTotal);
  const discountErrorKey = getInvoiceMoneyInputErrorKey(invoiceForm.discount);
  const taxPercentageErrorKey = getInvoiceMoneyInputErrorKey(
    invoiceForm.taxPercentage,
  );
  const laborCostErrorKey = selectedJobCard
    ? null
    : getInvoiceMoneyInputErrorKey(invoiceForm.laborCost);
  const partsCostErrorKey = selectedJobCard
    ? null
    : getInvoiceMoneyInputErrorKey(invoiceForm.partsCost);
  const invoicePaidAmountErrorKey =
    getInvoiceMoneyInputErrorKey(invoiceForm.paidAmount) ??
    getPaidAmountInputErrorKey(invoiceForm.paidAmount, grandTotal);
  const serviceOrAmountErrorKey =
    isQuickInvoice && !selectedJobCard && !invoiceForm.workPerformed.trim() && subtotal <= 0
      ? "toast.invoiceServiceOrAmountRequired"
      : null;
  const customerRequiredErrorKey =
    isQuickInvoice && !selectedCustomer && !invoiceForm.customerName.trim()
      ? "toast.invoiceCustomerRequired"
      : null;
  const totalErrorKey = subtotal > 0 && grandTotal <= 0 ? "toast.invoiceTotalRequired" : null;
  const hasInvoiceFinancialErrors = Boolean(
    discountErrorKey ||
      taxPercentageErrorKey ||
      laborCostErrorKey ||
      partsCostErrorKey ||
      invoicePaidAmountErrorKey ||
      totalErrorKey,
  );
  const getPaidAmountForStatus = (
    status: PaymentStatus,
    currentPaidAmount: number,
    nextGrandTotal: number,
  ) => {
    if (status === "paid") {
      return nextGrandTotal;
    }

    if (status === "unpaid") {
      return 0;
    }

    return currentPaidAmount;
  };
  const updateInvoiceTotalInput = (
    nextValues: Partial<Pick<InvoiceForm, "discount" | "taxPercentage">>,
  ) => {
    if (isEditing) {
      return;
    }

    const nextDiscountValue = parseSafeNumber(
      nextValues.discount ?? invoiceForm.discount,
    );
    const nextTaxPercentageValue = parseSafeNumber(
      nextValues.taxPercentage ?? invoiceForm.taxPercentage,
    );
    const nextDiscount =
      nextDiscountValue !== null && nextDiscountValue > 0 ? nextDiscountValue : 0;
    const nextTaxPercentage =
      nextTaxPercentageValue !== null && nextTaxPercentageValue > 0
        ? nextTaxPercentageValue
        : 0;
    const nextTaxAmount = subtotal * (nextTaxPercentage / 100);
    const nextGrandTotal = Math.max(0, subtotal + nextTaxAmount - nextDiscount);
    const nextPaidAmount = getPaidAmountForStatus(
      paymentStatus,
      paidAmount,
      nextGrandTotal,
    );

    onUpdateForm({
      ...invoiceForm,
      ...nextValues,
      paidAmount: String(nextPaidAmount),
      paymentStatus: getPaymentStatusFromAmounts(nextPaidAmount, nextGrandTotal),
    });
  };
  const updateInvoicePaidAmount = (value: string) => {
    const parsedPaidAmount = parseSafeNumber(value);
    const nextPaidAmount =
      parsedPaidAmount !== null && parsedPaidAmount > 0 ? parsedPaidAmount : 0;

    onUpdateForm({
      ...invoiceForm,
      paidAmount: value,
      paymentStatus:
        nextPaidAmount <= 0
          ? "unpaid"
          : nextPaidAmount >= grandTotal
            ? "paid"
            : "partial",
    });
  };
  const updateQuickInvoiceAmount = (
    nextValues: Partial<Pick<InvoiceForm, "laborCost" | "partsCost">>,
  ) => {
    if (isEditing || selectedJobCard) {
      return;
    }

    const nextLaborValue = parseSafeNumber(nextValues.laborCost ?? invoiceForm.laborCost);
    const nextPartsValue = parseSafeNumber(nextValues.partsCost ?? invoiceForm.partsCost);
    const nextLaborCost =
      nextLaborValue !== null && nextLaborValue > 0 ? nextLaborValue : 0;
    const nextPartsCost =
      nextPartsValue !== null && nextPartsValue > 0 ? nextPartsValue : 0;
    const nextSubtotal = nextLaborCost + nextPartsCost;
    const nextTaxAmount = nextSubtotal * (taxPercentage / 100);
    const nextGrandTotal = Math.max(0, nextSubtotal + nextTaxAmount - discount);
    const nextPaidAmount = getPaidAmountForStatus(
      paymentStatus,
      paidAmount,
      nextGrandTotal,
    );

    onUpdateForm({
      ...invoiceForm,
      ...nextValues,
      paidAmount: String(nextPaidAmount),
      paymentStatus: getPaymentStatusFromAmounts(nextPaidAmount, nextGrandTotal),
    });
  };
  const updateInvoicePaymentStatus = (status: PaymentStatus) => {
    const nextPaidAmount =
      status === "paid"
        ? grandTotal
        : status === "unpaid"
          ? 0
          : paidAmount > 0 && paidAmount < grandTotal
            ? paidAmount
            : grandTotal > 0
              ? grandTotal / 2
              : 0;

    onUpdateForm({
      ...invoiceForm,
      paidAmount: String(nextPaidAmount),
      paymentStatus:
        nextPaidAmount <= 0
          ? "unpaid"
          : nextPaidAmount >= grandTotal
            ? "paid"
            : "partial",
    });
  };
  const updateSelectedJobCard = (jobCardId: string) => {
    const nextJobCard = availableJobCards.find((jobCard) => jobCard.id === Number(jobCardId));
    const defaultPaidAmount = nextJobCard
      ? getDefaultPaidAmountFromJobCard(nextJobCard, discount, taxPercentage)
      : 0;
    const nextSubtotal = nextJobCard ? nextJobCard.laborCost + nextJobCard.partsCost : 0;
    const nextTaxAmount = nextSubtotal * (taxPercentage / 100);
    const nextGrandTotal = Math.max(0, nextSubtotal + nextTaxAmount - discount);

    onUpdateForm({
      ...invoiceForm,
      jobCardId,
      workPerformed: nextJobCard ? nextJobCard.workPerformed : invoiceForm.workPerformed,
      laborCost: nextJobCard ? String(nextJobCard.laborCost) : invoiceForm.laborCost,
      partsCost: nextJobCard ? String(nextJobCard.partsCost) : invoiceForm.partsCost,
      paidAmount: String(defaultPaidAmount),
      paymentStatus: getPaymentStatusFromAmounts(defaultPaidAmount, nextGrandTotal),
    });
  };
  const updateInvoiceType = (invoiceType: InvoiceForm["invoiceType"]) => {
    if (isEditing) {
      return;
    }

    onUpdateForm({
      ...invoiceForm,
      invoiceType,
      jobCardId: "",
      customerCity:
        invoiceType === "quick"
          ? invoiceForm.customerCity || defaultCustomerCity.trim()
          : invoiceForm.customerCity,
      workPerformed: invoiceType === "quick" ? "" : invoiceForm.workPerformed,
      laborCost: invoiceType === "quick" ? "" : invoiceForm.laborCost,
      partsCost: invoiceType === "quick" ? "" : invoiceForm.partsCost,
      paidAmount: "0",
      paymentStatus: "unpaid",
    });
  };
  const updateSelectedCustomer = (customerId: string) => {
    const nextCustomer = customers.find((customer) => customer.id === Number(customerId));

    onUpdateForm({
      ...invoiceForm,
      customerId,
      customerName: nextCustomer?.name ?? "",
      customerPhone: nextCustomer?.phone ?? "",
      customerCity: nextCustomer?.city ?? defaultCustomerCity.trim(),
      vehicleId: "",
    });
  };
  const updateSelectedVehicle = (vehicleId: string) => {
    const nextVehicle = vehicles.find((vehicle) => vehicle.id === Number(vehicleId));

    onUpdateForm({
      ...invoiceForm,
      vehicleId,
      vehiclePlateNumber: vehicleId === "__new" ? "" : nextVehicle?.plateNumber ?? "",
      vehicleMake: vehicleId === "__new" ? "" : nextVehicle?.make ?? "",
      vehicleModel: vehicleId === "__new" ? "" : nextVehicle?.model ?? "",
      vehicleYear: vehicleId === "__new" ? "" : nextVehicle?.year ?? "",
      vehicleColor: vehicleId === "__new" ? "" : nextVehicle?.colorKey ?? "",
      vehicleType: vehicleId === "__new" ? "" : nextVehicle?.vehicleTypeKey ?? "",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/40 px-4 py-4">
      <form
        onSubmit={onSave}
        noValidate
        className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-lg bg-white shadow-xl sm:max-w-4xl"
      >
        <div className="shrink-0 border-b border-slate-100 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-normal">{t(isEditing ? "invoices.form.editTitle" : "invoices.form.title")}</h2>
              <p className="mt-1 text-sm text-slate-500">{t("invoices.form.subtitle")}</p>
              {isEditing ? (
                <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                  {t("toast.invoiceTotalsLocked")}
                </p>
              ) : null}
            </div>
            <button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-950">{t("invoices.form.close")}</button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="grid gap-4">
            <section className="rounded-lg border border-slate-200 bg-white p-4">
            <label className="block">
              <span className="text-sm font-semibold text-slate-900">{t("invoices.form.invoiceSource")}</span>
              <select
                value={invoiceForm.invoiceType}
                onChange={(event) =>
                  updateInvoiceType(event.target.value as InvoiceForm["invoiceType"])
                }
                disabled={isEditing}
                className="mt-2 h-12 w-full rounded-md border border-slate-200 bg-white px-3 text-sm font-semibold outline-none transition focus:border-emerald-600 disabled:bg-slate-100"
              >
                <option value="quick">{t("invoices.form.quickInvoiceType")}</option>
                <option value="jobCard">{t("invoices.form.jobCardInvoiceType")}</option>
              </select>
            </label>
            </section>

            {invoiceForm.invoiceType === "jobCard" ? (
              <section className="rounded-lg border border-slate-200 bg-white p-4">
              <label className="block">
                <span className="text-sm font-semibold text-slate-900">{t("invoices.form.completedJobCard")}</span>
                <select
                  value={invoiceForm.jobCardId}
                  onChange={(event) => updateSelectedJobCard(event.target.value)}
                  disabled={isEditing}
                  className="mt-2 h-12 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-600 disabled:bg-slate-100"
                >
                  <option value="">{t("invoices.form.jobCardPlaceholder")}</option>
                  {availableJobCards.map((jobCard) => (
                    <option key={jobCard.id} value={jobCard.id}>{jobCard.jobNumber} - {jobCard.customerName} - {jobCard.plateNumber}</option>
                  ))}
                </select>
              </label>
              </section>
            ) : null}

            {selectedJobCard ? (
              <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-3">
                <div className="sm:col-span-3">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {t("invoices.form.serviceDetailsSection")}
                  </h3>
                </div>
                <CustomerField label={t("invoices.fields.customerName")} value={selectedJobCard.customerName} />
                <CustomerField label={t("invoices.fields.vehicle")} value={selectedJobCard.vehicleLabel} />
                <CustomerField label={t("invoices.fields.plateNumber")} value={selectedJobCard.plateNumber} />
                <CustomerField label={t("invoices.fields.jobDate")} value={formatDate(selectedJobCard.date)} />
                <CustomerField label={t("invoices.fields.workPerformed")} value={selectedJobCard.workPerformed} />
                <CustomerField label={t("invoices.fields.subtotal")} value={formatMoney(subtotal)} />
              </section>
            ) : invoiceForm.invoiceType === "quick" ? (
              <>
                <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {t("invoices.form.customerInformationSection")}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {t("invoices.form.quickSubtitle")}
                    </p>
                  </div>
                  <label className="block sm:col-span-2">
                    <span className="text-sm font-medium text-slate-700">
                      {t("invoices.form.selectCustomer")}
                    </span>
                    <select
                      value={invoiceForm.customerId}
                      onChange={(event) => updateSelectedCustomer(event.target.value)}
                      disabled={isEditing}
                      className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-600 disabled:bg-slate-100"
                    >
                      <option value="">{t("invoices.form.newCustomerOption")}</option>
                      {customers.filter((customer) => !customer.archived).map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name} - {formatPhone(customer.phone)}
                        </option>
                      ))}
                    </select>
                  </label>

                  {selectedCustomer ? (
                    <section className="grid gap-3 rounded-lg bg-slate-50 p-3 sm:col-span-2 sm:grid-cols-3">
                      <CustomerField label={t("invoices.fields.customerName")} value={selectedCustomer.name} />
                      <CustomerField label={t("invoices.fields.customerPhone")} value={formatPhone(selectedCustomer.phone)} />
                      <CustomerField label={t("customers.fields.city")} value={selectedCustomer.city || t("common.notAvailable")} />
                    </section>
                  ) : (
                    <>
                      <FormField
                        label={t("invoices.fields.customerName")}
                        value={invoiceForm.customerName}
                        onChange={(value) => onUpdateForm({ ...invoiceForm, customerName: value })}
                        placeholder={t("customers.form.namePlaceholder")}
                        error={customerRequiredErrorKey ? t(customerRequiredErrorKey) : undefined}
                        required
                        disabled={isEditing}
                      />
                      <PhoneField
                        label={t("invoices.fields.customerPhone")}
                        value={invoiceForm.customerPhone}
                        onChange={(value) =>
                          onUpdateForm({
                            ...invoiceForm,
                            customerPhone: value,
                          })
                        }
                        placeholder={t("customers.form.phonePlaceholder")}
                      />
                      <FormField
                        label={t("customers.fields.city")}
                        value={invoiceForm.customerCity}
                        onChange={(value) => onUpdateForm({ ...invoiceForm, customerCity: value })}
                        placeholder={t("customers.form.cityPlaceholder")}
                        disabled={isEditing}
                      />
                      {duplicateCustomer ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 sm:col-span-2">
                          <p className="font-semibold">
                            {t("invoices.form.duplicateCustomerTitle")}
                          </p>
                          <p className="mt-1">
                            {t("invoices.form.duplicateCustomerBody").replace(
                              "{name}",
                              duplicateCustomer.name,
                            )}
                          </p>
                          <button
                            type="button"
                            onClick={() => updateSelectedCustomer(String(duplicateCustomer.id))}
                            className="mt-3 h-10 rounded-md bg-amber-600 px-3 text-sm font-semibold text-white transition hover:bg-amber-700"
                          >
                            {t("invoices.form.useExistingCustomer")}
                          </button>
                        </div>
                      ) : null}
                    </>
                  )}
                </section>

                <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {t("invoices.form.vehicleInformationSection")}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      {t("invoices.form.vehicleOptional")}
                    </p>
                  </div>
                  <label className="block sm:col-span-2">
                    <span className="text-sm font-medium text-slate-700">
                      {t("invoices.form.selectVehicle")}
                    </span>
                    <select
                      value={invoiceForm.vehicleId}
                      onChange={(event) => updateSelectedVehicle(event.target.value)}
                      disabled={isEditing}
                      className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-600 disabled:bg-slate-100"
                    >
                      <option value="">{t("invoices.form.noVehicleOption")}</option>
                      <option value="__new">{t("invoices.form.newVehicleOption")}</option>
                      {customerVehicles.map((vehicle) => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.plateNumber} - {vehicle.make} {vehicle.model}
                        </option>
                      ))}
                    </select>
                  </label>

                  {selectedVehicle ? (
                    <section className="grid gap-3 rounded-lg bg-slate-50 p-3 sm:col-span-2 sm:grid-cols-3">
                      <CustomerField label={t("invoices.fields.vehicle")} value={`${selectedVehicle.make} ${selectedVehicle.model}`} />
                      <CustomerField label={t("invoices.fields.plateNumber")} value={selectedVehicle.plateNumber} />
                      <CustomerField label={t("vehicles.fields.year")} value={selectedVehicle.year || t("common.notAvailable")} />
                    </section>
                  ) : invoiceForm.vehicleId === "__new" ? (
                    <>
                      <FormField
                        label={t("vehicles.fields.plateNumber")}
                        value={invoiceForm.vehiclePlateNumber}
                        onChange={(value) => onUpdateForm({ ...invoiceForm, vehiclePlateNumber: value })}
                        placeholder={t("vehicles.form.platePlaceholder")}
                        required
                        disabled={isEditing}
                      />
                      <FormField
                        label={t("vehicles.fields.make")}
                        value={invoiceForm.vehicleMake}
                        onChange={(value) => onUpdateForm({ ...invoiceForm, vehicleMake: value })}
                        placeholder={t("vehicles.form.makePlaceholder")}
                        disabled={isEditing}
                      />
                      <FormField
                        label={t("vehicles.fields.model")}
                        value={invoiceForm.vehicleModel}
                        onChange={(value) => onUpdateForm({ ...invoiceForm, vehicleModel: value })}
                        placeholder={t("vehicles.form.modelPlaceholder")}
                        disabled={isEditing}
                      />
                      <FormField
                        label={t("vehicles.fields.year")}
                        value={invoiceForm.vehicleYear}
                        onChange={(value) => onUpdateForm({ ...invoiceForm, vehicleYear: value })}
                        placeholder={t("vehicles.form.yearPlaceholder")}
                        disabled={isEditing}
                      />
                    </>
                  ) : null}
                </section>

                <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {t("invoices.form.serviceDetailsSection")}
                    </h3>
                  </div>
                  <FormField
                    label={t("invoices.fields.workPerformed")}
                    value={invoiceForm.workPerformed}
                    onChange={(value) => onUpdateForm({ ...invoiceForm, workPerformed: value })}
                    placeholder={t("invoices.form.workPerformedPlaceholder")}
                    disabled={isEditing}
                  />
                  <FormField
                    inputType="number"
                    inputMode="decimal"
                    label={t("invoices.fields.laborCost")}
                    min="0"
                    step="0.01"
                    value={invoiceForm.laborCost}
                    onChange={(value) => updateQuickInvoiceAmount({ laborCost: value })}
                    placeholder={t("jobCards.form.laborCostPlaceholder")}
                    error={laborCostErrorKey ? t(laborCostErrorKey) : undefined}
                    disabled={isEditing}
                  />
                  <FormField
                    inputType="number"
                    inputMode="decimal"
                    label={t("invoices.fields.partsCost")}
                    min="0"
                    step="0.01"
                    value={invoiceForm.partsCost}
                    onChange={(value) => updateQuickInvoiceAmount({ partsCost: value })}
                    placeholder={t("invoices.form.partsCostPlaceholder")}
                    error={partsCostErrorKey ? t(partsCostErrorKey) : undefined}
                    disabled={isEditing}
                  />
                </section>
              </>
            ) : null}

            <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  {t("invoices.form.paymentDetailsSection")}
                </h3>
              </div>
              <FormField inputType="date" label={t("invoices.fields.invoiceDate")} value={invoiceForm.invoiceDate} onChange={(value) => onUpdateForm({ ...invoiceForm, invoiceDate: value })} placeholder={t("invoices.form.invoiceDatePlaceholder")} required />
              <FormField inputType="date" label={t("invoices.fields.dueDate")} value={invoiceForm.dueDate} onChange={(value) => onUpdateForm({ ...invoiceForm, dueDate: value })} placeholder={t("invoices.form.dueDatePlaceholder")} required />
              <FormField inputType="number" inputMode="decimal" label={t("invoices.fields.discount")} min="0" step="0.01" value={invoiceForm.discount} onChange={(value) => updateInvoiceTotalInput({ discount: value })} placeholder={t("invoices.form.discountPlaceholder")} error={discountErrorKey ? t(discountErrorKey) : undefined} disabled={isEditing} />
              <PercentField label={t("invoices.fields.taxPercentage")} value={invoiceForm.taxPercentage} onChange={(value) => updateInvoiceTotalInput({ taxPercentage: value })} placeholder={t("invoices.form.taxPercentagePlaceholder")} error={taxPercentageErrorKey ? t(taxPercentageErrorKey) : undefined} disabled={isEditing} />
              <FormField inputType="number" inputMode="decimal" label={t("invoices.fields.paidAmount")} min="0" step="0.01" value={invoiceForm.paidAmount} onChange={updateInvoicePaidAmount} placeholder={t("invoices.form.paidPlaceholder")} error={invoicePaidAmountErrorKey ? t(invoicePaidAmountErrorKey) : undefined} />
              <label className="block">
                <span className="text-sm font-medium text-slate-700">{t("invoices.fields.paymentStatus")}</span>
                <select value={paymentStatus} onChange={(event) => updateInvoicePaymentStatus(event.target.value as PaymentStatus)} className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-600">
                  <option value="unpaid">{t("jobCards.paymentStatus.unpaid")}</option>
                  <option value="partial">{t("jobCards.paymentStatus.partial")}</option>
                  <option value="paid">{t("jobCards.paymentStatus.paid")}</option>
                </select>
              </label>
            </section>

            <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-3">
              <div className="sm:col-span-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  {t("invoices.form.invoiceSummarySection")}
                </h3>
              </div>
              <CustomerField label={t("invoices.fields.taxAmount")} value={formatMoney(taxAmount)} />
              <CustomerField label={t("invoices.fields.grandTotal")} value={formatMoney(grandTotal)} />
              <CustomerField label={t("invoices.fields.remainingBalance")} value={formatMoney(remainingBalance)} />
              <div>
                <p className="text-xs font-medium uppercase text-slate-400">{t("invoices.fields.paymentStatus")}</p>
                <div className="mt-1"><PaymentStatusBadge status={paymentStatus} t={t} /></div>
              </div>
              {serviceOrAmountErrorKey || totalErrorKey ? (
                <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 sm:col-span-3">
                  {t(serviceOrAmountErrorKey ?? totalErrorKey ?? "toast.amountInvalid")}
                </p>
              ) : null}
            </section>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">{t("invoices.fields.notes")}</span>
              <textarea value={invoiceForm.notes} onChange={(event) => onUpdateForm({ ...invoiceForm, notes: event.target.value })} placeholder={t("invoices.form.notesPlaceholder")} rows={4} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600" />
            </label>
          </div>
        </div>
        <div className="sticky bottom-0 flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-white p-5 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="h-11 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">{t("invoices.form.cancel")}</button>
          <button type="submit" disabled={hasInvoiceFinancialErrors} className="h-11 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300">{t("invoices.form.save")}</button>
        </div>
      </form>
    </div>
  );
}

function InvoicePrintField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-bold leading-snug text-slate-900">
        {value}
      </dd>
    </div>
  );
}

function InvoicePrintPaymentStatusBadge({
  status,
  t,
}: {
  status: PaymentStatus;
  t: (key: string) => string;
}) {
  const statusClasses: Record<PaymentStatus, string> = {
    paid: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
    partial: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
    unpaid: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  };

  return (
    <span
      className={`inline-flex w-fit items-center rounded-sm px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${statusClasses[status]}`}
    >
      {t(`jobCards.paymentStatus.${status}`)}
    </span>
  );
}

function PrintInvoiceModal({
  formatDate,
  formatPhone,
  formatMoney,
  invoice,
  isPrintRendering = false,
  onClose,
  onPrint,
  settings,
  t,
}: {
  formatDate: (value: string) => string;
  formatPhone: (value: string) => string;
  formatMoney: (value: number) => string;
  invoice?: Invoice;
  isPrintRendering?: boolean;
  onClose: () => void;
  onPrint: () => void;
  settings: WorkshopSettings;
  t: (key: string) => string;
}) {
  if (!invoice) {
    return null;
  }

  return (
    <div
      className={
        isPrintRendering
          ? "invoice-print-backdrop bg-white"
          : "invoice-print-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/50 px-4 py-4"
      }
    >
      <div
        className={
          isPrintRendering
            ? "invoice-print-shell bg-white"
            : "invoice-print-shell flex max-h-[94vh] w-full flex-col overflow-hidden rounded-lg bg-slate-100 shadow-2xl sm:max-w-6xl print:max-h-none print:overflow-visible print:rounded-none print:bg-white print:shadow-none"
        }
      >
        <div className={`shrink-0 border-b border-slate-200 bg-white px-5 py-3 print:hidden ${isPrintRendering ? "hidden" : ""}`}>
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              {t("invoices.printButton")}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={onPrint} className="h-9 rounded bg-slate-900 px-5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-slate-700">{t("invoices.printNow")}</button>
              <button type="button" onClick={onClose} className="h-9 rounded border border-slate-200 px-5 text-xs font-bold uppercase tracking-wider text-slate-600 transition hover:bg-slate-50">{t("invoices.form.close")}</button>
            </div>
          </div>
        </div>
        <div
          className={
            isPrintRendering
              ? "invoice-print-page"
              : "invoice-print-page max-h-[84vh] flex-1 overflow-y-auto p-5 sm:p-8 print:max-h-none print:overflow-visible print:p-0"
          }
        >
          <section
            className={
              isPrintRendering
                ? "invoice-sheet mx-auto w-full bg-white"
                : "invoice-sheet mx-auto w-full max-w-[900px] bg-white p-10 shadow-md ring-1 ring-slate-200 sm:p-12 print:min-h-0 print:max-w-none print:p-0 print:shadow-none print:ring-0"
            }
          >
            <div className="invoice-header flex flex-col gap-6 pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h2 className="text-[34px] font-black leading-none tracking-tight text-slate-950">{settings.workshopName}</h2>
                <div className="mt-3 flex flex-col gap-0.5">
                  <p className="text-sm font-semibold text-slate-600">{settings.englishSubtitle}</p>
                  <p className="text-sm font-semibold text-slate-600" lang="ar" dir="rtl">
                    {settings.arabicSubtitle}
                  </p>
                </div>
                <p className="mt-3 text-sm font-bold tracking-wide text-slate-900" dir="ltr">
                  {formatPhone(settings.phoneNumber)}
                </p>
              </div>
              <div className="invoice-number-card shrink-0 rounded-sm border border-slate-200 bg-slate-50 p-5 text-start sm:min-w-[270px] sm:text-end">
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">{t("invoices.fields.invoiceNumber")}</p>
                <h3 className="mt-1 text-[30px] font-black leading-none tracking-tight text-slate-950">{invoice.invoiceNumber}</h3>
                <div className="mt-3 border-t border-slate-200 pt-3">
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">{t("invoices.fields.invoiceDate")}</p>
                  <p className="mt-0.5 text-sm font-bold text-slate-800">{formatDate(invoice.invoiceDate)}</p>
                </div>
                <div className="mt-3 flex sm:justify-end">
                  <InvoicePrintPaymentStatusBadge status={invoice.paymentStatus} t={t} />
                </div>
              </div>
            </div>

            <div className="invoice-header-rule h-px bg-slate-900" />

            <div className="invoice-detail-grid mt-5 grid gap-4 sm:grid-cols-2">
              <section className="invoice-detail-card rounded-sm border border-slate-200 bg-white p-5">
                <h4 className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">{t("invoices.print.customerDetails")}</h4>
                <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3.5 border-t border-slate-100 pt-3">
                  <InvoicePrintField label={t("invoices.fields.customerName")} value={invoice.customerName} />
                  <InvoicePrintField label={t("invoices.fields.customerPhone")} value={formatPhone(invoice.customerPhone)} />
                  {invoice.customerCity ? (
                    <InvoicePrintField label={t("invoices.fields.customerCity")} value={invoice.customerCity} />
                  ) : null}
                  <InvoicePrintField label={t("invoices.fields.paymentStatus")} value={t(`jobCards.paymentStatus.${invoice.paymentStatus}`)} />
                </dl>
              </section>
              <section className="invoice-detail-card rounded-sm border border-slate-200 bg-white p-5">
                <h4 className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">{t("invoices.print.vehicleDetails")}</h4>
                <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3.5 border-t border-slate-100 pt-3">
                  <InvoicePrintField label={t("invoices.fields.vehicle")} value={invoice.vehicle} />
                  <InvoicePrintField label={t("invoices.fields.plateNumber")} value={invoice.plateNumber} />
                  <InvoicePrintField label={t("invoices.fields.jobCardNumber")} value={invoice.jobCardNumber} />
                </dl>
              </section>
            </div>

            <section className="invoice-work mt-4">
              <div className="rounded-sm border border-slate-200 bg-white p-5">
                <h4 className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">{t("invoices.fields.workPerformed")}</h4>
                <p className="mt-2 border-t border-slate-100 pt-2 text-sm leading-relaxed text-slate-800">{invoice.workPerformed}</p>
              </div>
            </section>

            <section className="invoice-parts mt-4 overflow-hidden rounded-sm border border-slate-200">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="w-[46%] px-5 py-3 text-start text-[9px] font-bold uppercase tracking-[0.18em]">{t("invoices.print.part")}</th>
                    <th className="w-[14%] px-4 py-3 text-center text-[9px] font-bold uppercase tracking-[0.18em]">{t("jobCards.parts.quantity")}</th>
                    <th className="w-[20%] px-4 py-3 text-center text-[9px] font-bold uppercase tracking-[0.18em]">{t("jobCards.parts.unitSellingPrice")}</th>
                    <th className="w-[20%] px-5 py-3 text-end text-[9px] font-bold uppercase tracking-[0.18em]">{t("jobCards.parts.lineTotal")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.parts.length > 0 ? invoice.parts.map((part, index) => (
                    <tr key={part.rowId} className={index % 2 === 1 ? "bg-slate-50/60" : "bg-white"}>
                      <td className="px-5 py-3 align-top">
                        <p className="font-semibold text-slate-900">{part.itemName}</p>
                        {part.arabicItemName ? (
                          <p className="mt-0.5 text-xs text-slate-500" lang="ar" dir="rtl">{part.arabicItemName}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-center align-top text-slate-700">{part.quantity}</td>
                      <td className="px-4 py-3 text-center align-top text-slate-700">{formatMoney(part.unitSellingPrice)}</td>
                      <td className="px-5 py-3 text-end align-top font-bold text-slate-900">{formatMoney(part.lineTotal)}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-5 py-5 text-sm text-slate-400">{t("jobCards.parts.empty")}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>

            <div className="invoice-totals mt-4 grid gap-4 sm:grid-cols-[1fr_400px]">
              <div className="invoice-support grid content-start gap-3">
                {settings.showQrPlaceholder ? (
                  <div className="invoice-qr flex size-28 items-center justify-center rounded-sm border-2 border-dashed border-slate-300 bg-slate-50 p-3 text-center text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    {t("invoices.print.qrPlaceholder")}
                  </div>
                ) : null}
                <section className="invoice-warranty rounded-sm border border-slate-200 bg-slate-50 p-4">
                  <h4 className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">{t("invoices.print.warrantyTitle")}</h4>
                  <p className="mt-2 border-t border-slate-200 pt-2 text-sm leading-relaxed text-slate-700">
                    {invoice.notes || t("invoices.print.warrantyBody")}
                  </p>
                </section>
              </div>
              <dl className="invoice-total-card rounded-sm border border-slate-200 bg-white">
                <div className="divide-y divide-slate-100 px-5 pt-4">
                  <div className="flex justify-between gap-4 pb-2.5"><dt className="text-sm text-slate-600">{t("invoices.fields.laborCost")}</dt><dd className="text-sm font-semibold tabular-nums text-slate-800">{formatMoney(invoice.laborCost)}</dd></div>
                  <div className="flex justify-between gap-4 py-2.5"><dt className="text-sm text-slate-600">{t("invoices.fields.partsCost")}</dt><dd className="text-sm font-semibold tabular-nums text-slate-800">{formatMoney(invoice.partsCost)}</dd></div>
                  <div className="flex justify-between gap-4 py-2.5"><dt className="text-sm text-slate-600">{t("invoices.fields.discount")}</dt><dd className="text-sm font-semibold tabular-nums text-slate-800">{formatMoney(invoice.discount)}</dd></div>
                  <div className="flex justify-between gap-4 py-2.5"><dt className="text-sm text-slate-600">{t("invoices.fields.taxPercentage")}</dt><dd className="text-sm font-semibold tabular-nums text-slate-800">{invoice.taxPercentage}%</dd></div>
                  <div className="flex justify-between gap-4 py-2.5"><dt className="text-sm text-slate-600">{t("invoices.fields.taxAmount")}</dt><dd className="text-sm font-semibold tabular-nums text-slate-800">{formatMoney(invoice.taxAmount)}</dd></div>
                </div>
                <div className="mx-0 mt-0 flex items-center justify-between gap-4 bg-slate-900 px-5 py-4">
                  <dt className="text-sm font-bold uppercase tracking-widest text-slate-300">{t("invoices.fields.grandTotal")}</dt>
                  <dd className="text-2xl font-black tabular-nums tracking-tight text-white">{formatMoney(invoice.grandTotal)}</dd>
                </div>
                <div className="divide-y divide-slate-100 px-5 pb-4">
                  <div className="flex justify-between gap-4 py-2.5"><dt className="text-sm text-slate-600">{t("invoices.fields.paidAmount")}</dt><dd className="text-sm font-semibold tabular-nums text-slate-800">{formatMoney(invoice.paidAmount)}</dd></div>
                  <div className="flex justify-between gap-4 pt-2.5"><dt className="text-sm font-bold text-slate-900">{t("invoices.fields.remainingBalance")}</dt><dd className="text-base font-black tabular-nums text-slate-950">{formatMoney(invoice.remainingBalance)}</dd></div>
                </div>
              </dl>
            </div>

            <div className="invoice-signatures mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-sm border border-slate-200 bg-white px-5 py-4">
                <div className="h-9 border-b border-slate-300" />
                <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">{t("invoices.print.technicianSignature")}</p>
              </div>
              <div className="rounded-sm border border-slate-200 bg-white px-5 py-4">
                <div className="h-9 border-b border-slate-300" />
                <p className="mt-2 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">{t("invoices.print.customerSignature")}</p>
              </div>
            </div>

            <footer className="invoice-footer mt-4 border-t border-slate-900 pt-3 text-center">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-slate-950">{t("invoices.print.thankYou")}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{t("invoices.print.footerNote")}</p>
            </footer>
          </section>
        </div>
      </div>
    </div>
  );
}

function SettingsSection({
  onDownloadBackup,
  onImportBackup,
  onResetDemoData,
  onReset,
  onSave,
  onUpdateSettings,
  savedMessage,
  settings,
  settingsPhoneError,
  t,
}: {
  onDownloadBackup: () => void;
  onImportBackup: (event: ChangeEvent<HTMLInputElement>) => void;
  onResetDemoData: () => void;
  onReset: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateSettings: (value: WorkshopSettings) => void;
  savedMessage: string | null;
  settings: WorkshopSettings;
  settingsPhoneError: boolean;
  t: (key: string) => string;
}) {
  const directionPreview = settings.defaultLanguage === "ar" ? "rtl" : "ltr";
  const hasPhoneValue = Boolean(cleanSaudiPhoneInput(settings.phoneNumber));
  const isCurrentPhoneValid = isValidSaudiPhone(settings.phoneNumber);
  const showPhoneError =
    (settingsPhoneError || hasPhoneValue) && !isCurrentPhoneValid;
  const isCommitInput = (target: EventTarget | null): target is HTMLInputElement =>
    target instanceof HTMLInputElement &&
    ["text", "number", "tel"].includes(target.type);
  const handleSettingsKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key !== "Enter" || !isCommitInput(event.target)) {
      return;
    }

    event.preventDefault();
    event.currentTarget.requestSubmit();
  };
  const handleSettingsBlur = (event: FocusEvent<HTMLFormElement>) => {
    if (!isCommitInput(event.target)) {
      return;
    }

    const nextFocusedElement = event.relatedTarget;
    if (
      nextFocusedElement instanceof Node &&
      event.currentTarget.contains(nextFocusedElement)
    ) {
      return;
    }

    const form = event.currentTarget;
    window.setTimeout(() => form.requestSubmit(), 0);
  };

  return (
    <form onSubmit={onSave} onBlur={handleSettingsBlur} onKeyDown={handleSettingsKeyDown}>
      <section className="mb-6 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-700">{t("settings.kicker")}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal">{t("settings.title")}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">{t("settings.subtitle")}</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onReset}
            className="h-11 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {t("settings.actions.reset")}
          </button>
          <button
            type="submit"
            className="h-11 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
          >
            {t("settings.actions.save")}
          </button>
        </div>
      </section>

      {savedMessage ? (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {t(savedMessage)}
        </div>
      ) : null}

      <section className="mb-6 rounded-lg border border-sky-200 bg-sky-50 p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-sky-900">{t("settings.backup.title")}</p>
            <p className="mt-1 text-sm leading-6 text-sky-700">{t("settings.backup.body")}</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onDownloadBackup}
              className="h-10 rounded-md border border-emerald-200 bg-white px-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              {t("settings.backup.export")}
            </button>
            <label className="flex h-10 cursor-pointer items-center justify-center rounded-md border border-amber-200 bg-white px-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-50">
              {t("settings.backup.import")}
              <input
                type="file"
                aria-label={t("settings.backup.chooseFile")}
                accept="application/json,.json"
                onChange={onImportBackup}
                className="sr-only"
              />
            </label>
            <button
              type="button"
              onClick={onResetDemoData}
              className="h-10 rounded-md border border-rose-200 bg-white px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50"
            >
              {t("settings.demoReset.button")}
            </button>
          </div>
        </div>
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
          {t("settings.backup.warning")}
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <SettingsCard title={t("settings.profile.title")} subtitle={t("settings.profile.subtitle")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t("settings.fields.workshopName")} value={settings.workshopName} onChange={(value) => onUpdateSettings({ ...settings, workshopName: value })} placeholder={t("settings.placeholders.workshopName")} required />
            <FormField label={t("settings.fields.logoInitials")} value={settings.logoInitials} onChange={(value) => onUpdateSettings({ ...settings, logoInitials: value })} placeholder={t("settings.placeholders.logoInitials")} required />
            <FormField label={t("settings.fields.englishSubtitle")} value={settings.englishSubtitle} onChange={(value) => onUpdateSettings({ ...settings, englishSubtitle: value })} placeholder={t("settings.placeholders.englishSubtitle")} required />
            <FormField label={t("settings.fields.arabicSubtitle")} value={settings.arabicSubtitle} onChange={(value) => onUpdateSettings({ ...settings, arabicSubtitle: value })} placeholder={t("settings.placeholders.arabicSubtitle")} required />
            <PhoneField error={showPhoneError ? t("customers.form.phoneInvalid") : undefined} label={t("settings.fields.phoneNumber")} value={formatSaudiPhone(settings.phoneNumber)} onChange={(value) => onUpdateSettings({ ...settings, phoneNumber: normalizeSaudiPhone(value) })} placeholder={t("settings.placeholders.phoneNumber")} required />
            <FormField label={t("settings.fields.city")} value={settings.city} onChange={(value) => onUpdateSettings({ ...settings, city: value })} placeholder={t("settings.placeholders.city")} />
            <FormField label={t("settings.fields.country")} value={settings.country} onChange={(value) => onUpdateSettings({ ...settings, country: value })} placeholder={t("settings.placeholders.country")} />
            <FormField label={t("settings.fields.address")} value={settings.address} onChange={(value) => onUpdateSettings({ ...settings, address: value })} placeholder={t("settings.placeholders.address")} />
          </div>
        </SettingsCard>

        <SettingsCard title={t("settings.invoice.title")} subtitle={t("settings.invoice.subtitle")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t("settings.fields.invoicePrefix")} value={settings.invoicePrefix} onChange={(value) => onUpdateSettings({ ...settings, invoicePrefix: value })} placeholder={t("settings.placeholders.invoicePrefix")} required />
            <FormField label={t("settings.fields.jobCardPrefix")} value={settings.jobCardPrefix} onChange={(value) => onUpdateSettings({ ...settings, jobCardPrefix: value })} placeholder={t("settings.placeholders.jobCardPrefix")} required />
            <FormField label={t("settings.fields.purchaseOrderPrefix")} value={settings.purchaseOrderPrefix} onChange={(value) => onUpdateSettings({ ...settings, purchaseOrderPrefix: value })} placeholder={t("settings.placeholders.purchaseOrderPrefix")} required />
            <FormField inputType="number" min="0" label={t("settings.fields.defaultVatPercentage")} value={settings.defaultVatPercentage} onChange={(value) => onUpdateSettings({ ...settings, defaultVatPercentage: value })} placeholder={t("settings.placeholders.defaultVatPercentage")} />
            <FormField label={t("settings.fields.defaultCurrency")} value={settings.defaultCurrency} onChange={(value) => onUpdateSettings({ ...settings, defaultCurrency: value })} placeholder={t("settings.placeholders.defaultCurrency")} required />
          </div>
          <div className="mt-4">
            <SettingsToggle
              checked={settings.showQrPlaceholder}
              label={t("settings.fields.showQrPlaceholder")}
              onChange={(value) => onUpdateSettings({ ...settings, showQrPlaceholder: value })}
            />
          </div>
        </SettingsCard>

        <SettingsCard title={t("settings.preferences.title")} subtitle={t("settings.preferences.subtitle")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">{t("settings.fields.defaultPaymentMethod")}</span>
              <select value={settings.defaultPaymentMethod} onChange={(event) => onUpdateSettings({ ...settings, defaultPaymentMethod: event.target.value as ExpensePaymentMethod })} className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-600">
                {expensePaymentMethods.map((paymentMethod) => (
                  <option key={paymentMethod} value={paymentMethod}>{t(`expenses.paymentMethod.${paymentMethod}`)}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">{t("settings.fields.defaultPaymentStatus")}</span>
              <select value={settings.defaultPaymentStatus} onChange={(event) => onUpdateSettings({ ...settings, defaultPaymentStatus: event.target.value as PaymentStatus })} className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-600">
                {(["unpaid", "partial", "paid"] as PaymentStatus[]).map((status) => (
                  <option key={status} value={status}>{t(`jobCards.paymentStatus.${status}`)}</option>
                ))}
              </select>
            </label>
            <div className="sm:col-span-2">
              <FormField label={t("settings.fields.defaultCustomerCity")} value={settings.defaultCustomerCity} onChange={(value) => onUpdateSettings({ ...settings, defaultCustomerCity: value })} placeholder={t("settings.placeholders.defaultCustomerCity")} />
              <p className="mt-1 text-xs text-slate-500">{t("settings.helpers.defaultCustomerCity")}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            <SettingsToggle checked={settings.lowStockAlertEnabled} label={t("settings.fields.lowStockAlertEnabled")} onChange={(value) => onUpdateSettings({ ...settings, lowStockAlertEnabled: value })} />
            <SettingsToggle checked={settings.archiveConfirmationEnabled} label={t("settings.fields.archiveConfirmationEnabled")} onChange={(value) => onUpdateSettings({ ...settings, archiveConfirmationEnabled: value })} />
          </div>
        </SettingsCard>

        <SettingsCard title={t("settings.display.title")} subtitle={t("settings.display.subtitle")}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">{t("settings.fields.defaultLanguage")}</span>
              <select value={settings.defaultLanguage} onChange={(event) => onUpdateSettings({ ...settings, defaultLanguage: event.target.value as AppLanguage })} className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-600">
                <option value="en">{t("language.english")}</option>
                <option value="ar">{t("language.arabic")}</option>
              </select>
            </label>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-500">{t("settings.fields.directionPreview")}</p>
              <p className="mt-2 text-lg font-black uppercase text-slate-950">
                {t(`settings.direction.${directionPreview}`)}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <SettingsToggle checked={settings.compactModeEnabled} label={t("settings.fields.compactModeEnabled")} onChange={(value) => onUpdateSettings({ ...settings, compactModeEnabled: value })} />
          </div>
        </SettingsCard>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
          <div>
            <h3 className="text-lg font-semibold tracking-normal text-slate-950">{t("settings.notes.title")}</h3>
            <p className="mt-1 text-sm text-slate-500">{t("settings.notes.subtitle")}</p>
          </div>
          <label className="mt-4 block">
            <span className="text-sm font-medium text-slate-700">{t("settings.fields.systemNotes")}</span>
            <textarea value={settings.systemNotes} onChange={(event) => onUpdateSettings({ ...settings, systemNotes: event.target.value })} placeholder={t("settings.placeholders.systemNotes")} rows={4} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600" />
          </label>
        </section>
      </div>
    </form>
  );
}

function SettingsCard({
  children,
  subtitle,
  title,
}: {
  children: ReactNode;
  subtitle: string;
  title: string;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-semibold tracking-normal text-slate-950">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </div>
      {children}
    </section>
  );
}

function SettingsToggle({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-5 rounded border-slate-300 text-emerald-700 accent-emerald-700"
      />
    </label>
  );
}

function RecycleBinSection({
  activeFilter,
  getDeleteBlockReason,
  onDelete,
  onFilterChange,
  onRestore,
  onSearchChange,
  records,
  searchValue,
  t,
}: {
  activeFilter: RecycleBinFilter;
  getDeleteBlockReason: (record: RecycleBinRecord) => string | null;
  onDelete: (record: RecycleBinRecord) => void;
  onFilterChange: (value: RecycleBinFilter) => void;
  onRestore: (record: RecycleBinRecord) => void;
  onSearchChange: (value: string) => void;
  records: RecycleBinRecord[];
  searchValue: string;
  t: (key: string) => string;
}) {
  return (
    <>
      <section className="mb-6 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-700">
            {t("recycleBin.recordCount").replace("{count}", String(records.length))}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal">
            {t("recycleBin.title")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {t("recycleBin.subtitle")}
          </p>
        </div>
      </section>

      <section className="mb-4 grid gap-3">
        <label className="sr-only" htmlFor="recycle-bin-search">
          {t("recycleBin.searchLabel")}
        </label>
        <input
          id="recycle-bin-search"
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={t("recycleBin.searchPlaceholder")}
          className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600"
        />

        <div className="flex gap-2 overflow-x-auto pb-1">
          {recycleBinFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => onFilterChange(filter)}
              className={`h-10 shrink-0 rounded-md border px-3 text-sm font-semibold transition ${
                activeFilter === filter
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
              aria-pressed={activeFilter === filter}
            >
              {t(`recycleBin.filters.${filter}`)}
            </button>
          ))}
        </div>
      </section>

      {records.length > 0 ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {records.map((record) => {
            const blockReason = getDeleteBlockReason(record);
            const isProtected = Boolean(blockReason);

            return (
              <article
                key={`${record.type}-${record.id}`}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                      {t(`recycleBin.types.${record.type}`)}
                    </span>
                    <h3 className="mt-3 text-xl font-semibold tracking-normal text-slate-950">
                      {record.title}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-slate-600">
                      {record.subtitle}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {record.details}
                    </p>
                  </div>
                  <span className="w-fit shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                    {record.status ?? t("common.archived")}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      isProtected
                        ? "bg-slate-100 text-slate-600"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {t(
                      isProtected
                        ? "recycleBin.delete.protectedStatus"
                        : "recycleBin.delete.safeToDeleteStatus",
                    )}
                  </span>
                </div>

                <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => onRestore(record)}
                    className="h-10 rounded-md border border-emerald-200 px-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                  >
                    {t("common.restore")}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(record)}
                    disabled={Boolean(blockReason)}
                    className="h-10 rounded-md border border-rose-200 px-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400 disabled:hover:bg-transparent"
                  >
                    {t("recycleBin.delete.button")}
                  </button>
                </div>
                {blockReason ? (
                  <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
                    {t(blockReason)}
                  </p>
                ) : (
                  <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                    {t("recycleBin.delete.allowedHelper")}
                  </p>
                )}
              </article>
            );
          })}
        </section>
      ) : (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-12 text-center shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">
            {t("recycleBin.emptyTitle")}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {t("recycleBin.emptyBody")}
          </p>
        </section>
      )}
    </>
  );
}

function PermanentDeleteModal({
  confirmationValue,
  ownerDeleteCodeValue,
  onClose,
  onConfirm,
  onConfirmationChange,
  onOwnerDeleteCodeChange,
  record,
  t,
}: {
  confirmationValue: string;
  ownerDeleteCodeValue: string;
  onClose: () => void;
  onConfirm: () => void;
  onConfirmationChange: (value: string) => void;
  onOwnerDeleteCodeChange: (value: string) => void;
  record: PendingPermanentDelete;
  t: (key: string) => string;
}) {
  const canConfirm =
    confirmationValue === "DELETE" && ownerDeleteCodeValue === OWNER_DELETE_CODE;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-slate-950/40 px-4 py-4">
      <section className="w-full max-w-lg rounded-lg bg-white shadow-xl">
        <div className="border-b border-slate-100 p-5">
          <h2 className="text-xl font-semibold tracking-normal text-slate-950">
            {t("recycleBin.delete.modalTitle")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {t("recycleBin.delete.modalBody").replace("{name}", record.title)}
          </p>
        </div>
        <div className="p-5">
          <div className="grid gap-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                {t("recycleBin.delete.confirmLabel")}
              </span>
              <input
                type="text"
                value={confirmationValue}
                onChange={(event) => onConfirmationChange(event.target.value)}
                placeholder="DELETE"
                className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                {t("recycleBin.delete.ownerCodeLabel")}
              </span>
              <input
                type="password"
                value={ownerDeleteCodeValue}
                onChange={(event) => onOwnerDeleteCodeChange(event.target.value)}
                placeholder={t("recycleBin.delete.ownerCodePlaceholder")}
                className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600"
              />
              <p className="mt-2 text-xs leading-5 text-slate-500">
                {t("recycleBin.delete.ownerCodeHelper")}
              </p>
            </label>
          </div>
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {t("invoices.form.cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm}
            className="h-11 rounded-md bg-rose-700 px-4 text-sm font-semibold text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {t("recycleBin.delete.confirmButton")}
          </button>
        </div>
      </section>
    </div>
  );
}

function ReportsSection({
  completedJobs,
  completedWorkValue,
  estimatedNetProfit,
  expenseCategoryTotals,
  filterRange,
  formatDate,
  formatMoney,
  formatSummaryMoney,
  formatNumber,
  lowStockItems,
  onFilterChange,
  outstandingBalance,
  paidRevenue,
  purchaseCosts,
  purchases,
  t,
  totalExpenses,
  totalRevenue,
  unpaidInvoices,
  uninvoicedCompletedJobs,
  uninvoicedCompletedWorkValue,
}: {
  completedJobs: JobCard[];
  completedWorkValue: number;
  estimatedNetProfit: number;
  expenseCategoryTotals: Array<{ category: ExpenseCategory; total: number }>;
  filterRange: ReportRange;
  formatDate: (value: string) => string;
  formatMoney: (value: number) => string;
  formatSummaryMoney: (value: number) => string;
  formatNumber: (value: number) => string;
  lowStockItems: InventoryItem[];
  onFilterChange: (value: ReportRange) => void;
  outstandingBalance: number;
  paidRevenue: number;
  purchaseCosts: number;
  purchases: Purchase[];
  t: (key: string) => string;
  totalExpenses: number;
  totalRevenue: number;
  unpaidInvoices: Invoice[];
  uninvoicedCompletedJobs: JobCard[];
  uninvoicedCompletedWorkValue: number;
}) {
  const summaryCards = [
    { key: "completedWorkValue", value: formatSummaryMoney(completedWorkValue), tone: "text-slate-950" },
    { key: "uninvoicedCompletedWork", value: formatSummaryMoney(uninvoicedCompletedWorkValue), tone: "text-amber-700" },
    { key: "totalRevenue", value: formatSummaryMoney(totalRevenue), tone: "text-emerald-700" },
    { key: "paidRevenue", value: formatSummaryMoney(paidRevenue), tone: "text-emerald-700" },
    { key: "outstandingBalance", value: formatSummaryMoney(outstandingBalance), tone: "text-amber-700" },
    { key: "totalExpenses", value: formatSummaryMoney(totalExpenses), tone: "text-rose-700" },
    { key: "purchaseCosts", value: formatSummaryMoney(purchaseCosts), tone: "text-slate-950" },
    { key: "estimatedNetProfit", value: formatSummaryMoney(estimatedNetProfit), tone: estimatedNetProfit >= 0 ? "text-emerald-700" : "text-rose-700" },
    { key: "completedJobs", value: formatNumber(completedJobs.length), tone: "text-slate-950" },
    { key: "lowStockItems", value: formatNumber(lowStockItems.length), tone: "text-rose-700" },
  ];
  const recentCompletedJobs = completedJobs
    .toSorted((firstJob, secondJob) => secondJob.date.localeCompare(firstJob.date))
    .slice(0, 5);
  const recentPurchases = purchases
    .toSorted((firstPurchase, secondPurchase) =>
      secondPurchase.purchaseDate.localeCompare(firstPurchase.purchaseDate),
    )
    .slice(0, 4);

  return (
    <>
      <section className="mb-6 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-700">{t("reports.kicker")}</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal">{t("reports.title")}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">{t("reports.subtitle")}</p>
        </div>

        <div className="grid h-auto grid-cols-2 gap-1 rounded-md border border-slate-200 bg-slate-50 p-1 shadow-sm sm:flex sm:h-11">
          {reportRanges.map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => onFilterChange(range)}
              className={`rounded px-4 py-2 text-sm font-semibold transition sm:py-0 ${
                filterRange === range
                  ? "bg-white text-emerald-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
              aria-pressed={filterRange === range}
            >
              {t(`reports.filters.${range}`)}
            </button>
          ))}
        </div>
      </section>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article key={card.key} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{t(`reports.summary.${card.key}`)}</p>
            <p className={`mt-2 text-2xl font-black tracking-normal ${card.tone}`}>{card.value}</p>
          </article>
        ))}
      </section>

      <section className="mb-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold tracking-normal text-slate-950">{t("reports.revenue.title")}</h3>
          <p className="mt-1 text-sm text-slate-500">{t("reports.revenue.subtitle")}</p>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <CustomerField label={t("reports.revenue.completedWork")} value={formatMoney(completedWorkValue)} />
            <CustomerField label={t("reports.revenue.invoicesIssued")} value={formatMoney(totalRevenue)} />
            <CustomerField label={t("reports.revenue.paymentsReceived")} value={formatMoney(paidRevenue)} />
            <CustomerField label={t("reports.summary.outstandingBalance")} value={formatMoney(outstandingBalance)} />
            <CustomerField label={t("reports.summary.uninvoicedCompletedWork")} value={formatMoney(uninvoicedCompletedWorkValue)} />
          </dl>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold tracking-normal text-slate-950">{t("reports.expenses.title")}</h3>
          <p className="mt-1 text-sm text-slate-500">{t("reports.expenses.subtitle")}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {expenseCategoryTotals.map((categoryTotal) => (
              <div key={categoryTotal.category} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-500">
                  {t(`expenses.category.${categoryTotal.category}`)}
                </p>
                <p className="mt-2 text-base font-black text-slate-950">
                  {formatSummaryMoney(categoryTotal.total)}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="mb-6 grid gap-4 xl:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold tracking-normal text-slate-950">{t("reports.purchases.title")}</h3>
              <p className="mt-1 text-sm text-slate-500">{t("reports.purchases.subtitle")}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              {formatSummaryMoney(purchaseCosts)}
            </span>
          </div>
          <div className="mt-5 grid gap-3">
            {recentPurchases.length > 0 ? recentPurchases.map((purchase) => (
              <div key={purchase.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-950">{purchase.purchaseId}</p>
                    <p className="mt-1 text-sm text-slate-500">{purchase.supplierName} - {formatDate(purchase.purchaseDate)}</p>
                  </div>
                  <p className="text-sm font-black text-slate-950">{formatMoney(purchase.totalAmount)}</p>
                </div>
              </div>
            )) : (
              <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">{t("reports.empty")}</p>
            )}
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold tracking-normal text-slate-950">{t("reports.lowStock.title")}</h3>
          <p className="mt-1 text-sm text-slate-500">{t("reports.lowStock.subtitle")}</p>
          <div className="mt-5 grid gap-3">
            {lowStockItems.length > 0 ? lowStockItems.slice(0, 5).map((item) => (
              <div key={item.id} className="rounded-lg border border-rose-100 bg-rose-50/40 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-950">{item.itemName}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.sku} - {item.location}</p>
                  </div>
                  <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700">
                    {t("reports.badges.lowStock")}
                  </span>
                </div>
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                  <CustomerField label={t("inventory.fields.stockQuantity")} value={formatNumber(item.stockQuantity)} />
                  <CustomerField label={t("inventory.fields.minimumStock")} value={formatNumber(item.minimumStock)} />
                </dl>
              </div>
            )) : (
              <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">{t("reports.lowStock.empty")}</p>
            )}
          </div>
        </article>
      </section>

      <section className="mb-6 grid gap-4 xl:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold tracking-normal text-slate-950">{t("reports.invoices.title")}</h3>
          <p className="mt-1 text-sm text-slate-500">{t("reports.invoices.subtitle")}</p>
          <div className="mt-5 grid gap-3">
            {unpaidInvoices.length > 0 ? unpaidInvoices.slice(0, 5).map((invoice) => (
              <div key={invoice.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-950">{invoice.invoiceNumber}</p>
                    <p className="mt-1 text-sm text-slate-500">{invoice.customerName} - {formatDate(invoice.invoiceDate)}</p>
                  </div>
                  <PaymentStatusBadge status={invoice.paymentStatus} t={t} />
                </div>
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                  <CustomerField label={t("invoices.fields.grandTotal")} value={formatMoney(invoice.grandTotal)} />
                  <CustomerField label={t("invoices.fields.remainingBalance")} value={formatMoney(invoice.remainingBalance)} />
                </dl>
              </div>
            )) : (
              <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">{t("reports.invoices.empty")}</p>
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold tracking-normal text-slate-950">{t("reports.uninvoicedJobs.title")}</h3>
              <p className="mt-1 text-sm text-slate-500">{t("reports.uninvoicedJobs.subtitle")}</p>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
              {formatMoney(uninvoicedCompletedWorkValue)}
            </span>
          </div>
          <div className="mt-5 grid gap-3">
            {uninvoicedCompletedJobs.length > 0 ? uninvoicedCompletedJobs.slice(0, 5).map((jobCard) => (
              <div key={jobCard.id} className="rounded-lg border border-amber-100 bg-amber-50/30 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-950">{jobCard.jobNumber}</p>
                    <p className="mt-1 text-sm text-slate-500">{jobCard.customerName} - {jobCard.vehicleLabel}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
                    {t("reports.uninvoicedJobs.createInvoice")}
                  </span>
                </div>
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                  <CustomerField label={t("jobCards.fields.date")} value={formatDate(jobCard.date)} />
                  <CustomerField label={t("jobCards.fields.totalAmount")} value={formatMoney(jobCard.laborCost + jobCard.partsCost)} />
                </dl>
              </div>
            )) : (
              <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">{t("reports.uninvoicedJobs.empty")}</p>
            )}
          </div>
        </article>

        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold tracking-normal text-slate-950">{t("reports.jobs.title")}</h3>
          <p className="mt-1 text-sm text-slate-500">{t("reports.jobs.subtitle")}</p>
          <div className="mt-5 grid gap-3">
            {recentCompletedJobs.length > 0 ? recentCompletedJobs.map((jobCard) => (
              <div key={jobCard.id} className="rounded-lg border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-950">{jobCard.jobNumber}</p>
                    <p className="mt-1 text-sm text-slate-500">{jobCard.customerName} - {jobCard.vehicleLabel}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    {t("jobCards.status.completed")}
                  </span>
                </div>
                <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                  <CustomerField label={t("jobCards.fields.date")} value={formatDate(jobCard.date)} />
                  <CustomerField label={t("jobCards.fields.totalAmount")} value={formatMoney(jobCard.laborCost + jobCard.partsCost)} />
                </dl>
              </div>
            )) : (
              <p className="rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">{t("reports.jobs.empty")}</p>
            )}
          </div>
        </article>
      </section>
    </>
  );
}

function ExpensesSection({
  activeTab,
  categoryTotals,
  expenseCount,
  expenseForm,
  expenses,
  formatDate,
  formatMoney,
  formatSummaryMoney,
  isModalOpen,
  largestExpense,
  monthlyExpenseTotal,
  onArchivedChange,
  onCloseModal,
  onOpenModal,
  onSave,
  onTabChange,
  onUpdateForm,
  t,
  weeklyExpenseTotal,
}: {
  activeTab: RecordTab;
  categoryTotals: Array<{ category: ExpenseCategory; total: number }>;
  expenseCount: number;
  expenseForm: ExpenseForm;
  expenses: Expense[];
  formatDate: (value: string) => string;
  formatMoney: (value: number) => string;
  formatSummaryMoney: (value: number) => string;
  isModalOpen: boolean;
  largestExpense: number;
  monthlyExpenseTotal: number;
  onArchivedChange: (expenseId: number, archived: boolean) => void;
  onCloseModal: () => void;
  onOpenModal: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onTabChange: (value: RecordTab) => void;
  onUpdateForm: (value: ExpenseForm) => void;
  t: (key: string) => string;
  weeklyExpenseTotal: number;
}) {
  const sortedExpenses = expenses.toSorted((firstExpense, secondExpense) =>
    secondExpense.date.localeCompare(firstExpense.date),
  );

  return (
    <>
      <section className="mb-6 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-700">
            {t(activeTab === "archived" ? "expenses.archivedRecordCount" : "expenses.activeRecordCount").replace("{count}", String(expenses.length))}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal">
            {t("expenses.title")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {t("expenses.subtitle")}
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenModal}
          className="h-11 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
        >
          {t("expenses.addButton")}
        </button>
      </section>

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">{t("expenses.totals.monthly")}</p>
          <p className="mt-2 text-2xl font-black tracking-normal text-slate-950">
            {formatSummaryMoney(monthlyExpenseTotal)}
          </p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">{t("expenses.totals.weekly")}</p>
          <p className="mt-2 text-2xl font-black tracking-normal text-slate-950">
            {formatSummaryMoney(weeklyExpenseTotal)}
          </p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">{t("expenses.totals.largest")}</p>
          <p className="mt-2 text-2xl font-black tracking-normal text-slate-950">
            {formatSummaryMoney(largestExpense)}
          </p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">{t("expenses.totals.count")}</p>
          <p className="mt-2 text-2xl font-black tracking-normal text-slate-950">
            {expenseCount}
          </p>
        </article>
      </section>

      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold tracking-normal text-slate-950">
              {t("expenses.categories.title")}
            </h3>
            <p className="mt-1 text-sm text-slate-500">{t("expenses.categories.subtitle")}</p>
          </div>
          <RecordTabs activeTab={activeTab} onTabChange={onTabChange} t={t} />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {categoryTotals.map((categoryTotal) => (
            <article
              key={categoryTotal.category}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-xs font-bold uppercase text-slate-500">
                {t(`expenses.category.${categoryTotal.category}`)}
              </p>
              <p className="mt-2 text-base font-black text-slate-950">
                {formatSummaryMoney(categoryTotal.total)}
              </p>
            </article>
          ))}
        </div>
      </section>

      {sortedExpenses.length > 0 ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {sortedExpenses.map((expense) => (
            <article key={expense.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase text-emerald-700">
                    {t(`expenses.category.${expense.category}`)}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold tracking-normal text-slate-950">
                    {expense.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">{formatDate(expense.date)}</p>
                </div>
                {expense.archived ? (
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                    {t("common.archived")}
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                    {formatMoney(expense.amount)}
                  </span>
                )}
              </div>

              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <CustomerField label={t("expenses.fields.amount")} value={formatMoney(expense.amount)} />
                <CustomerField label={t("expenses.fields.paymentMethod")} value={t(`expenses.paymentMethod.${expense.paymentMethod}`)} />
                <CustomerField label={t("expenses.fields.createdBy")} value={expense.createdBy} />
                <CustomerField label={t("expenses.fields.notes")} value={expense.notes || t("common.notAvailable")} />
              </dl>

              <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => onArchivedChange(expense.id, !expense.archived)}
                  className={`h-10 rounded-md border px-3 text-sm font-semibold transition ${expense.archived ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50" : "border-amber-200 text-amber-700 hover:bg-amber-50"}`}
                >
                  {t(expense.archived ? "common.restore" : "common.archive")}
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-12 text-center shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">
            {t(activeTab === "archived" ? "expenses.emptyArchivedTitle" : "expenses.emptyActiveTitle")}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {t(activeTab === "archived" ? "expenses.emptyArchivedBody" : "expenses.emptyActiveBody")}
          </p>
        </section>
      )}

      {isModalOpen ? (
        <ExpenseModal
          expenseForm={expenseForm}
          onClose={onCloseModal}
          onSave={onSave}
          onUpdateForm={onUpdateForm}
          t={t}
        />
      ) : null}
    </>
  );
}

function ExpenseModal({
  expenseForm,
  onClose,
  onSave,
  onUpdateForm,
  t,
}: {
  expenseForm: ExpenseForm;
  onClose: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateForm: (value: ExpenseForm) => void;
  t: (key: string) => string;
}) {
  const expenseAmountErrorKey = getFinancialInputErrorKey(expenseForm.amount);
  const hasExpenseFinancialErrors = Boolean(expenseAmountErrorKey);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/40 px-4 py-4">
      <form onSubmit={onSave} className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-100 p-5">
          <div>
            <h2 className="text-xl font-semibold tracking-normal">{t("expenses.form.title")}</h2>
            <p className="mt-1 text-sm text-slate-500">{t("expenses.form.subtitle")}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-950">{t("expenses.form.close")}</button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 pb-28">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t("expenses.fields.title")} value={expenseForm.title} onChange={(value) => onUpdateForm({ ...expenseForm, title: value })} placeholder={t("expenses.form.titlePlaceholder")} required />
            <FormField inputType="number" min="0" label={t("expenses.fields.amount")} value={expenseForm.amount} onChange={(value) => onUpdateForm({ ...expenseForm, amount: value })} placeholder={t("expenses.form.amountPlaceholder")} error={expenseAmountErrorKey ? t(expenseAmountErrorKey) : undefined} required />
            <label className="block">
              <span className="text-sm font-medium text-slate-700">{t("expenses.fields.category")}</span>
              <select value={expenseForm.category} onChange={(event) => onUpdateForm({ ...expenseForm, category: event.target.value as ExpenseCategory })} className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-600">
                {expenseCategories.map((category) => (
                  <option key={category} value={category}>{t(`expenses.category.${category}`)}</option>
                ))}
              </select>
            </label>
            <FormField inputType="date" label={t("expenses.fields.date")} value={expenseForm.date} onChange={(value) => onUpdateForm({ ...expenseForm, date: value })} placeholder={t("expenses.form.datePlaceholder")} required />
            <label className="block">
              <span className="text-sm font-medium text-slate-700">{t("expenses.fields.paymentMethod")}</span>
              <select value={expenseForm.paymentMethod} onChange={(event) => onUpdateForm({ ...expenseForm, paymentMethod: event.target.value as ExpensePaymentMethod })} className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-600">
                {expensePaymentMethods.map((paymentMethod) => (
                  <option key={paymentMethod} value={paymentMethod}>{t(`expenses.paymentMethod.${paymentMethod}`)}</option>
                ))}
              </select>
            </label>
            <FormField label={t("expenses.fields.createdBy")} value={expenseForm.createdBy} onChange={(value) => onUpdateForm({ ...expenseForm, createdBy: value })} placeholder={t("expenses.form.createdByPlaceholder")} required />
          </div>

          <label className="mt-4 block">
            <span className="text-sm font-medium text-slate-700">{t("expenses.fields.notes")}</span>
            <textarea value={expenseForm.notes} onChange={(event) => onUpdateForm({ ...expenseForm, notes: event.target.value })} placeholder={t("expenses.form.notesPlaceholder")} rows={4} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600" />
          </label>
        </div>

        <div className="sticky bottom-0 flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="h-11 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">{t("expenses.form.cancel")}</button>
          <button type="submit" disabled={hasExpenseFinancialErrors} className="h-11 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300">{t("expenses.form.save")}</button>
        </div>
      </form>
    </div>
  );
}

function PurchasesSection({
  duplicateRowId,
  expandedPurchaseId,
  formatDate,
  formatMoney,
  formatNumber,
  inventoryItems,
  isModalOpen,
  onCloseModal,
  onDuplicateRowChange,
  onExpandedPurchaseChange,
  onOpenModal,
  onSave,
  onUpdateForm,
  purchaseForm,
  purchases,
  t,
}: {
  duplicateRowId: string | null;
  expandedPurchaseId: number | null;
  formatDate: (value: string) => string;
  formatMoney: (value: number) => string;
  formatNumber: (value: number) => string;
  inventoryItems: InventoryItem[];
  isModalOpen: boolean;
  onCloseModal: () => void;
  onDuplicateRowChange: (rowId: string | null) => void;
  onExpandedPurchaseChange: (purchaseId: number | null) => void;
  onOpenModal: (purchase?: Purchase) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateForm: (value: PurchaseForm) => void;
  purchaseForm: PurchaseForm;
  purchases: Purchase[];
  t: (key: string) => string;
}) {
  const sortedPurchases = purchases.toSorted((firstPurchase, secondPurchase) =>
    secondPurchase.purchaseDate.localeCompare(firstPurchase.purchaseDate),
  );

  return (
    <>
      <section className="mb-6 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-700">
            {t("purchases.recordCount").replace("{count}", String(purchases.length))}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal">
            {t("purchases.title")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {t("purchases.subtitle")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenModal()}
          className="h-11 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
        >
          {t("purchases.addButton")}
        </button>
      </section>

      {sortedPurchases.length > 0 ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {sortedPurchases.map((purchase) => {
            const isExpanded = expandedPurchaseId === purchase.id;

            return (
              <article
                key={purchase.id}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-xl font-semibold tracking-normal text-slate-950">
                      {purchase.purchaseId}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {purchase.supplierName}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatDate(purchase.purchaseDate)}
                    </p>
                  </div>
                  <PaymentStatusBadge status={purchase.paymentStatus} t={t} />
                </div>

                <dl className="mt-5 grid gap-4 sm:grid-cols-3">
                  <CustomerField
                    label={t("purchases.fields.itemsCount")}
                    value={formatNumber(purchase.items.length)}
                  />
                  <CustomerField
                    label={t("purchases.fields.totalQuantity")}
                    value={formatNumber(purchase.totalQuantity)}
                  />
                  <CustomerField
                    label={t("purchases.fields.totalAmount")}
                    value={formatMoney(purchase.totalAmount)}
                  />
                  <CustomerField
                    label={t("purchases.fields.createdBy")}
                    value={purchase.createdBy}
                  />
                  <CustomerField
                    label={t("purchases.fields.notes")}
                    value={purchase.notes || t("common.notAvailable")}
                  />
                </dl>

                {isExpanded ? (
                  <div className="mt-5 overflow-hidden rounded-lg border border-slate-200">
                    <div className="grid grid-cols-[1.6fr_0.8fr_0.8fr_0.9fr] gap-3 bg-slate-100 px-3 py-2 text-xs font-semibold uppercase text-slate-500">
                      <span>{t("purchases.items.inventoryItem")}</span>
                      <span className="text-center">{t("purchases.items.quantity")}</span>
                      <span className="text-center">{t("purchases.items.costPrice")}</span>
                      <span className="text-end">{t("purchases.items.lineTotal")}</span>
                    </div>
                    {purchase.items.map((item) => (
                      <div
                        key={item.rowId}
                        className="grid grid-cols-[1.6fr_0.8fr_0.8fr_0.9fr] gap-3 border-t border-slate-100 px-3 py-3 text-sm"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">{item.itemName}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {item.arabicItemName}
                          </p>
                          <p className="mt-0.5 text-xs font-medium text-slate-500">
                            {item.sku}
                          </p>
                        </div>
                        <p className="text-center font-semibold text-slate-800">
                          {formatNumber(item.quantity)}
                        </p>
                        <p className="text-center font-semibold text-slate-800">
                          {formatMoney(item.costPrice)}
                        </p>
                        <p className="text-end font-bold text-slate-950">
                          {formatMoney(item.lineTotal)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => onOpenModal(purchase)}
                    className="h-10 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {t("common.viewEdit")}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onExpandedPurchaseChange(isExpanded ? null : purchase.id)
                    }
                    className="h-10 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {t(isExpanded ? "purchases.hideDetails" : "purchases.viewDetails")}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-12 text-center shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">
            {t("purchases.emptyTitle")}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {t("purchases.emptyBody")}
          </p>
        </section>
      )}

      {isModalOpen ? (
        <PurchaseModal
          duplicateRowId={duplicateRowId}
          formatMoney={formatMoney}
          formatNumber={formatNumber}
          inventoryItems={inventoryItems}
          onClose={onCloseModal}
          onDuplicateRowChange={onDuplicateRowChange}
          onSave={onSave}
          onUpdateForm={onUpdateForm}
          purchaseForm={purchaseForm}
          t={t}
        />
      ) : null}
    </>
  );
}

function PurchaseModal({
  duplicateRowId,
  formatMoney,
  formatNumber,
  inventoryItems,
  onClose,
  onDuplicateRowChange,
  onSave,
  onUpdateForm,
  purchaseForm,
  t,
}: {
  duplicateRowId: string | null;
  formatMoney: (value: number) => string;
  formatNumber: (value: number) => string;
  inventoryItems: InventoryItem[];
  onClose: () => void;
  onDuplicateRowChange: (rowId: string | null) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateForm: (value: PurchaseForm) => void;
  purchaseForm: PurchaseForm;
  t: (key: string) => string;
}) {
  const activeInventoryItems = inventoryItems.filter((item) => !item.archived);
  const selectedItemIds = purchaseForm.items
    .map((itemLine) => itemLine.inventoryItemId)
    .filter(Boolean);
  const getFormCost = (value: string) => {
    const parsedValue = parseSafeNumber(value);
    return parsedValue !== null && parsedValue > 0 ? parsedValue : 0;
  };
  const getLineTotal = (itemLine: PurchaseItemFormLine) =>
    getFormCost(itemLine.quantity) * getFormCost(itemLine.costPrice);
  const totalQuantity = purchaseForm.items.reduce(
    (total, itemLine) => total + getFormCost(itemLine.quantity),
    0,
  );
  const totalAmount = purchaseForm.items.reduce(
    (total, itemLine) => total + getLineTotal(itemLine),
    0,
  );
  const hasPurchaseFinancialErrors = purchaseForm.items.some((itemLine) =>
    Boolean(
      getFinancialInputErrorKey(itemLine.quantity, "toast.quantityInvalid") ||
        getFinancialInputErrorKey(itemLine.costPrice),
    ),
  );

  const createRowId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `purchase-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const addItemLine = () => {
    onUpdateForm({
      ...purchaseForm,
      items: [
        ...purchaseForm.items,
        {
          rowId: createRowId(),
          inventoryItemId: "",
          quantity: "1",
          costPrice: "0",
        },
      ],
    });
  };

  const updateItemLine = (
    rowId: string,
    nextValues: Partial<Omit<PurchaseItemFormLine, "rowId">>,
  ) => {
    onUpdateForm({
      ...purchaseForm,
      items: purchaseForm.items.map((itemLine) =>
        itemLine.rowId === rowId ? { ...itemLine, ...nextValues } : itemLine,
      ),
    });
  };

  const removeItemLine = (rowId: string) => {
    onUpdateForm({
      ...purchaseForm,
      items: purchaseForm.items.filter((itemLine) => itemLine.rowId !== rowId),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/40 px-4 py-4">
      <form
        onSubmit={onSave}
        className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-lg bg-white shadow-xl sm:max-w-5xl"
      >
        <div className="shrink-0 border-b border-slate-100 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-normal">
                {t("purchases.form.title")}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {t("purchases.form.subtitle")}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-2 py-1 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
            >
              {t("purchases.form.close")}
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 pb-28">
          <div className="grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                label={t("purchases.fields.supplierName")}
                value={purchaseForm.supplierName}
                onChange={(value) =>
                  onUpdateForm({ ...purchaseForm, supplierName: value })
                }
                placeholder={t("purchases.form.supplierPlaceholder")}
                required
              />
              <FormField
                inputType="date"
                label={t("purchases.fields.purchaseDate")}
                value={purchaseForm.purchaseDate}
                onChange={(value) =>
                  onUpdateForm({ ...purchaseForm, purchaseDate: value })
                }
                placeholder={t("purchases.form.datePlaceholder")}
                required
              />
              <label className="block">
                <span className="text-sm font-medium text-slate-700">
                  {t("purchases.fields.paymentStatus")}
                </span>
                <select
                  value={purchaseForm.paymentStatus}
                  onChange={(event) =>
                    onUpdateForm({
                      ...purchaseForm,
                      paymentStatus: event.target.value as PaymentStatus,
                    })
                  }
                  className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-600"
                >
                  <option value="unpaid">{t("jobCards.paymentStatus.unpaid")}</option>
                  <option value="partial">{t("jobCards.paymentStatus.partial")}</option>
                  <option value="paid">{t("jobCards.paymentStatus.paid")}</option>
                </select>
              </label>
            </div>

            <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {t("purchases.items.title")}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {t("purchases.items.subtitle")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addItemLine}
                  className="h-9 rounded-md border border-emerald-200 bg-white px-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                >
                  {t("purchases.items.addItem")}
                </button>
              </div>

              <div className="mt-4">
                {purchaseForm.items.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                    <div className="hidden min-w-[980px] border-b border-slate-200 bg-slate-100 px-4 py-3 text-xs font-semibold uppercase text-slate-500 lg:grid lg:grid-cols-[2.4fr_1.1fr_1fr_1fr_1fr_auto] lg:items-center lg:gap-4">
                      <span>{t("purchases.items.inventoryItem")}</span>
                      <span className="text-center">{t("purchases.items.currentStock")}</span>
                      <span className="text-center">{t("purchases.items.quantity")}</span>
                      <span className="text-center">{t("purchases.items.costPrice")}</span>
                      <span className="text-center">{t("purchases.items.lineTotal")}</span>
                      <span className="text-end">{t("purchases.items.actions")}</span>
                    </div>

                    {purchaseForm.items.map((itemLine) => {
                      const selectedItem = inventoryItems.find(
                        (item) => item.id === Number(itemLine.inventoryItemId),
                      );
                      const quantityErrorKey = getFinancialInputErrorKey(
                        itemLine.quantity,
                        "toast.quantityInvalid",
                      );
                      const costErrorKey = getFinancialInputErrorKey(itemLine.costPrice);
                      const showDuplicateWarning =
                        duplicateRowId === itemLine.rowId ||
                        (Boolean(itemLine.inventoryItemId) &&
                          selectedItemIds.filter(
                            (itemId) => itemId === itemLine.inventoryItemId,
                          ).length > 1);

                      return (
                        <div
                          key={itemLine.rowId}
                          className="min-w-0 border-b border-slate-100 p-4 transition last:border-b-0 hover:bg-slate-50/70 lg:min-w-[980px]"
                        >
                          <div className="grid gap-4 lg:grid-cols-[2.4fr_1.1fr_1fr_1fr_1fr_auto] lg:items-center">
                            <label className="block">
                              <span className="text-sm font-medium text-slate-700 lg:sr-only">
                                {t("purchases.items.inventoryItem")}
                              </span>
                              <select
                                value={itemLine.inventoryItemId}
                                onChange={(event) => {
                                  const nextItemId = event.target.value;
                                  const isDuplicateItem =
                                    Boolean(nextItemId) &&
                                    selectedItemIds.includes(nextItemId) &&
                                    itemLine.inventoryItemId !== nextItemId;

                                  if (isDuplicateItem) {
                                    onDuplicateRowChange(itemLine.rowId);
                                    return;
                                  }

                                  const nextItem = inventoryItems.find(
                                    (item) => item.id === Number(nextItemId),
                                  );
                                  onDuplicateRowChange(null);
                                  updateItemLine(itemLine.rowId, {
                                    inventoryItemId: nextItemId,
                                    costPrice: nextItem ? String(nextItem.costPrice) : "0",
                                  });
                                }}
                                className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-600 lg:mt-0"
                              >
                                <option value="">{t("purchases.items.selectItem")}</option>
                                {activeInventoryItems.map((item) => (
                                  <option
                                    key={item.id}
                                    value={item.id}
                                    disabled={
                                      selectedItemIds.includes(String(item.id)) &&
                                      itemLine.inventoryItemId !== String(item.id)
                                    }
                                  >
                                    {item.itemName} - {item.sku}
                                  </option>
                                ))}
                              </select>
                              {selectedItem ? (
                                <div className="mt-2">
                                  <p className="text-sm font-semibold text-slate-900">
                                    {selectedItem.itemName}
                                  </p>
                                  <p className="mt-0.5 text-xs text-slate-500">
                                    {selectedItem.arabicItemName}
                                  </p>
                                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                                    {selectedItem.sku}
                                  </p>
                                </div>
                              ) : null}
                            </label>

                            <div className="text-sm font-semibold text-slate-700 lg:text-center">
                              <span className="lg:hidden">
                                {t("purchases.items.currentStock")}:{" "}
                              </span>
                              {selectedItem
                                ? formatNumber(selectedItem.stockQuantity)
                                : t("common.notAvailable")}
                            </div>

                            <label className="block">
                              <span className="text-sm font-medium text-slate-700 lg:sr-only">
                                {t("purchases.items.quantity")}
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={itemLine.quantity}
                                onChange={(event) =>
                                  updateItemLine(itemLine.rowId, {
                                    quantity: event.target.value,
                                  })
                                }
                                placeholder={t("purchases.items.quantityPlaceholder")}
                                aria-invalid={Boolean(quantityErrorKey)}
                                className={`mt-1 h-10 w-full rounded-md border bg-white px-3 text-center text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 lg:mt-0 ${
                                  quantityErrorKey ? "border-rose-300" : "border-slate-200"
                                }`}
                              />
                              {quantityErrorKey ? (
                                <p className="mt-1 text-xs font-medium text-rose-600">
                                  {t(quantityErrorKey)}
                                </p>
                              ) : null}
                            </label>

                            <label className="block">
                              <span className="text-sm font-medium text-slate-700 lg:sr-only">
                                {t("purchases.items.costPrice")}
                              </span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={itemLine.costPrice}
                                onChange={(event) =>
                                  updateItemLine(itemLine.rowId, {
                                    costPrice: event.target.value,
                                  })
                                }
                                placeholder={t("purchases.items.costPlaceholder")}
                                aria-invalid={Boolean(costErrorKey)}
                                className={`mt-1 h-10 w-full rounded-md border bg-white px-3 text-center text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 lg:mt-0 ${
                                  costErrorKey ? "border-rose-300" : "border-slate-200"
                                }`}
                              />
                              {costErrorKey ? (
                                <p className="mt-1 text-xs font-medium text-rose-600">
                                  {t(costErrorKey)}
                                </p>
                              ) : null}
                            </label>

                            <p className="text-base font-bold text-slate-950 lg:text-center">
                              {formatMoney(getLineTotal(itemLine))}
                            </p>

                            <button
                              type="button"
                              onClick={() => removeItemLine(itemLine.rowId)}
                              className="h-8 rounded-md border border-rose-200 px-2.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                            >
                              {t("common.remove")}
                            </button>
                          </div>

                          {showDuplicateWarning ? (
                            <div className="mt-3">
                              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                                {t("purchases.items.duplicateWarning")}
                              </span>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-md border border-dashed border-slate-300 bg-white px-3 py-5 text-center text-sm text-slate-500">
                    {t("purchases.items.empty")}
                  </p>
                )}
              </div>
            </section>

            <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-3">
              <CustomerField
                label={t("purchases.summary.totalItems")}
                value={formatNumber(purchaseForm.items.length)}
              />
              <CustomerField
                label={t("purchases.summary.totalQuantity")}
                value={formatNumber(totalQuantity)}
              />
              <div>
                <p className="text-xs font-medium uppercase text-slate-400">
                  {t("purchases.summary.totalAmount")}
                </p>
                <p className="mt-1 text-xl font-bold text-emerald-800">
                  {formatMoney(totalAmount)}
                </p>
              </div>
            </section>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                {t("purchases.fields.notes")}
              </span>
              <textarea
                value={purchaseForm.notes}
                onChange={(event) =>
                  onUpdateForm({ ...purchaseForm, notes: event.target.value })
                }
                placeholder={t("purchases.form.notesPlaceholder")}
                rows={4}
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600"
              />
            </label>
          </div>
        </div>

        <div className="sticky bottom-0 flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-white p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {t("purchases.form.cancel")}
          </button>
          <button
            type="submit"
            disabled={hasPurchaseFinancialErrors}
            className="h-11 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {t("purchases.form.save")}
          </button>
        </div>
      </form>
    </div>
  );
}

function InventorySection({
  activeTab,
  formatMoney,
  formatNumber,
  inventoryForm,
  inventoryItems,
  inventorySearch,
  isEditing,
  isModalOpen,
  onArchivedChange,
  onCloseModal,
  onOpenModal,
  onSave,
  onSearchChange,
  onTabChange,
  onUpdateForm,
  t,
}: {
  activeTab: RecordTab;
  formatMoney: (value: number) => string;
  formatNumber: (value: number) => string;
  inventoryForm: InventoryForm;
  inventoryItems: InventoryItem[];
  inventorySearch: string;
  isEditing: boolean;
  isModalOpen: boolean;
  onArchivedChange: (itemId: number, archived: boolean) => void;
  onCloseModal: () => void;
  onOpenModal: (item?: InventoryItem) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onSearchChange: (value: string) => void;
  onTabChange: (value: RecordTab) => void;
  onUpdateForm: (value: InventoryForm) => void;
  t: (key: string) => string;
}) {
  return (
    <>
      <section className="mb-6 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-700">
            {t(
              activeTab === "archived"
                ? "inventory.archivedRecordCount"
                : "inventory.activeRecordCount",
            ).replace("{count}", String(inventoryItems.length))}
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-normal">
            {t("inventory.title")}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {t("inventory.subtitle")}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onOpenModal()}
          className="h-11 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
        >
          {t("inventory.addButton")}
        </button>
      </section>

      <section className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex-1">
          <label className="sr-only" htmlFor="inventory-search">
            {t("inventory.searchLabel")}
          </label>
          <input
            id="inventory-search"
            type="search"
            value={inventorySearch}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={t("inventory.searchPlaceholder")}
            className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600"
          />
        </div>

        <RecordTabs activeTab={activeTab} onTabChange={onTabChange} t={t} />
      </section>

      {inventoryItems.length > 0 ? (
        <section className="grid gap-4 xl:grid-cols-2">
          {inventoryItems.map((item) => {
            const isLowStock = item.stockQuantity <= item.minimumStock;

            return (
              <article
                key={item.id}
                className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-xl font-semibold tracking-normal text-slate-950">
                      {item.itemName}
                    </h3>
                    <p className="mt-1 text-sm font-semibold text-slate-600">
                      {item.arabicItemName}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {item.category} - {item.sku}
                    </p>
                  </div>
                  <InventoryStatusBadge archived={item.archived} t={t} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {isLowStock ? (
                    <span className="w-fit rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
                      {t("inventory.lowStock")}
                    </span>
                  ) : null}
                  <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {t(`inventory.units.${item.unitType}`)}
                  </span>
                  <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {t(`inventory.itemTypes.${item.itemType}`)}
                  </span>
                </div>

                <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                  <CustomerField
                    label={t("inventory.fields.stockQuantity")}
                    value={formatNumber(item.stockQuantity)}
                  />
                  <CustomerField
                    label={t("inventory.fields.unitType")}
                    value={t(`inventory.units.${item.unitType}`)}
                  />
                  <CustomerField
                    label={t("inventory.fields.itemType")}
                    value={t(`inventory.itemTypes.${item.itemType}`)}
                  />
                  <CustomerField
                    label={t("inventory.fields.costPrice")}
                    value={formatMoney(item.costPrice)}
                  />
                  <CustomerField
                    label={t("inventory.fields.sellingPrice")}
                    value={formatMoney(item.sellingPrice)}
                  />
                  <CustomerField
                    label={t("inventory.fields.supplierName")}
                    value={item.supplierName}
                  />
                  <CustomerField
                    label={t("inventory.fields.brand")}
                    value={item.brand}
                  />
                  <CustomerField
                    label={t("inventory.fields.minimumStock")}
                    value={formatNumber(item.minimumStock)}
                  />
                  <CustomerField
                    label={t("inventory.fields.location")}
                    value={item.location || t("common.notAvailable")}
                  />
                </dl>

                <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => onOpenModal(item)}
                    className="h-10 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    {t("common.viewEdit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => onArchivedChange(item.id, !item.archived)}
                    className={`h-10 rounded-md border px-3 text-sm font-semibold transition ${
                      item.archived
                        ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                        : "border-amber-200 text-amber-700 hover:bg-amber-50"
                    }`}
                  >
                    {t(item.archived ? "common.restore" : "common.archive")}
                  </button>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-12 text-center shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">
            {t(
              activeTab === "archived"
                ? "inventory.emptyArchivedTitle"
                : "inventory.emptyActiveTitle",
            )}
          </h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            {t(
              activeTab === "archived"
                ? "inventory.emptyArchivedBody"
                : "inventory.emptyActiveBody",
            )}
          </p>
        </section>
      )}

      {isModalOpen ? (
        <InventoryModal
          inventoryForm={inventoryForm}
          isEditing={isEditing}
          onClose={onCloseModal}
          onSave={onSave}
          onUpdateForm={onUpdateForm}
          t={t}
        />
      ) : null}
    </>
  );
}

function InventoryStatusBadge({
  archived,
  t,
}: {
  archived: boolean;
  t: (key: string) => string;
}) {
  return (
    <span
      className={`w-fit shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
        archived
          ? "bg-slate-100 text-slate-600"
          : "bg-emerald-50 text-emerald-800"
      }`}
    >
      {t(archived ? "common.archived" : "common.active")}
    </span>
  );
}

function InventoryModal({
  inventoryForm,
  isEditing,
  onClose,
  onSave,
  onUpdateForm,
  t,
}: {
  inventoryForm: InventoryForm;
  isEditing: boolean;
  onClose: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateForm: (value: InventoryForm) => void;
  t: (key: string) => string;
}) {
  const unitTypes: InventoryUnitType[] = ["piece", "liter", "set", "box"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/40 px-4 py-4">
      <form
        onSubmit={onSave}
        className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-lg bg-white shadow-xl sm:max-w-2xl"
      >
        <div className="shrink-0 border-b border-slate-100 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-normal">
                {t(isEditing ? "inventory.form.editTitle" : "inventory.form.title")}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {t(
                  isEditing
                    ? "inventory.form.editSubtitle"
                    : "inventory.form.subtitle",
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-2 py-1 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-950"
            >
              {t("inventory.form.close")}
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid gap-4 p-5 pb-28 sm:grid-cols-2">
            <FormField
              label={t("inventory.fields.itemName")}
              value={inventoryForm.itemName}
              onChange={(value) =>
                onUpdateForm({ ...inventoryForm, itemName: value })
              }
              placeholder={t("inventory.form.itemNamePlaceholder")}
              required
            />
            <FormField
              label={t("inventory.fields.arabicItemName")}
              value={inventoryForm.arabicItemName}
              onChange={(value) =>
                onUpdateForm({ ...inventoryForm, arabicItemName: value })
              }
              placeholder={t("inventory.form.arabicItemNamePlaceholder")}
              required
            />
            <FormField
              label={t("inventory.fields.category")}
              value={inventoryForm.category}
              onChange={(value) =>
                onUpdateForm({ ...inventoryForm, category: value })
              }
              placeholder={t("inventory.form.categoryPlaceholder")}
              required
            />
            <FormField
              label={t("inventory.fields.sku")}
              value={inventoryForm.sku}
              onChange={(value) => onUpdateForm({ ...inventoryForm, sku: value })}
              placeholder={t("inventory.form.skuPlaceholder")}
              required
            />
            <FormField
              label={t("inventory.fields.brand")}
              value={inventoryForm.brand}
              onChange={(value) => onUpdateForm({ ...inventoryForm, brand: value })}
              placeholder={t("inventory.form.brandPlaceholder")}
              required
            />
            <FormField
              label={t("inventory.fields.supplierName")}
              value={inventoryForm.supplierName}
              onChange={(value) =>
                onUpdateForm({ ...inventoryForm, supplierName: value })
              }
              placeholder={t("inventory.form.supplierPlaceholder")}
              required
            />
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                {t("inventory.fields.itemType")}
              </span>
              <select
                value={inventoryForm.itemType}
                onChange={(event) =>
                  onUpdateForm({
                    ...inventoryForm,
                    itemType: event.target.value as InventoryItemType,
                  })
                }
                className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-600"
              >
                <option value="stock">{t("inventory.itemTypes.stock")}</option>
                <option value="service">{t("inventory.itemTypes.service")}</option>
              </select>
            </label>
            <FormField
              inputType="number"
              label={t("inventory.fields.stockQuantity")}
              min="0"
              value={inventoryForm.stockQuantity}
              onChange={(value) =>
                onUpdateForm({ ...inventoryForm, stockQuantity: value })
              }
              placeholder={t("inventory.form.stockPlaceholder")}
              required
            />
            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                {t("inventory.fields.unitType")}
              </span>
              <select
                value={inventoryForm.unitType}
                onChange={(event) =>
                  onUpdateForm({
                    ...inventoryForm,
                    unitType: event.target.value as InventoryUnitType,
                  })
                }
                className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-600"
              >
                {unitTypes.map((unitType) => (
                  <option key={unitType} value={unitType}>
                    {t(`inventory.units.${unitType}`)}
                  </option>
                ))}
              </select>
            </label>
            <FormField
              inputType="number"
              label={t("inventory.fields.costPrice")}
              min="0"
              value={inventoryForm.costPrice}
              onChange={(value) =>
                onUpdateForm({ ...inventoryForm, costPrice: value })
              }
              placeholder={t("inventory.form.costPlaceholder")}
              required
            />
            <FormField
              inputType="number"
              label={t("inventory.fields.sellingPrice")}
              min="0"
              value={inventoryForm.sellingPrice}
              onChange={(value) =>
                onUpdateForm({ ...inventoryForm, sellingPrice: value })
              }
              placeholder={t("inventory.form.sellingPlaceholder")}
              required
            />
            <FormField
              inputType="number"
              label={t("inventory.fields.minimumStock")}
              min="0"
              value={inventoryForm.minimumStock}
              onChange={(value) =>
                onUpdateForm({ ...inventoryForm, minimumStock: value })
              }
              placeholder={t("inventory.form.minimumStockPlaceholder")}
              required
            />
            <FormField
              label={t("inventory.fields.location")}
              value={inventoryForm.location}
              onChange={(value) =>
                onUpdateForm({ ...inventoryForm, location: value })
              }
              placeholder={t("inventory.form.locationPlaceholder")}
            />
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium text-slate-700">
                {t("inventory.fields.notes")}
              </span>
              <textarea
                value={inventoryForm.notes}
                onChange={(event) =>
                  onUpdateForm({ ...inventoryForm, notes: event.target.value })
                }
                placeholder={t("inventory.form.notesPlaceholder")}
                rows={4}
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600"
              />
            </label>
          </div>
        </div>

        <div className="sticky bottom-0 flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-white p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {t("inventory.form.cancel")}
          </button>
          <button
            type="submit"
            className="h-11 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
          >
            {t("inventory.form.save")}
          </button>
        </div>
      </form>
    </div>
  );
}

function RecordTabs({
  activeTab,
  onTabChange,
  t,
}: {
  activeTab: RecordTab;
  onTabChange: (value: RecordTab) => void;
  t: (key: string) => string;
}) {
  const tabs: Array<{ key: RecordTab; label: string }> = [
    { key: "active", label: t("common.active") },
    { key: "archived", label: t("common.archived") },
  ];

  return (
    <div className="grid h-11 grid-cols-2 gap-1 rounded-md border border-slate-200 bg-slate-50 p-1 shadow-sm lg:w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onTabChange(tab.key)}
          className={`rounded px-4 text-sm font-semibold transition ${
            activeTab === tab.key
              ? "bg-white text-emerald-800 shadow-sm"
              : "text-slate-500 hover:text-slate-900"
          }`}
          aria-pressed={activeTab === tab.key}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function FormField({
  disabled,
  error,
  inputMode,
  inputType = "text",
  label,
  min,
  onChange,
  placeholder,
  required,
  step,
  value,
}: {
  disabled?: boolean;
  error?: string;
  inputMode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search";
  inputType?: string;
  label: string;
  min?: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  step?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={inputType}
        inputMode={inputMode}
        min={min}
        step={step ?? (inputType === "number" ? "0.01" : undefined)}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${label.replace(/\s+/g, "-")}-error` : undefined}
        className={`mt-1 h-11 w-full rounded-md border bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 ${
          error ? "border-rose-300" : "border-slate-200"
        }`}
      />
      {error ? (
        <p id={`${label.replace(/\s+/g, "-")}-error`} className="mt-1 text-xs font-medium text-rose-600">
          {error}
        </p>
      ) : null}
    </label>
  );
}

function PhoneField({
  error,
  label,
  onChange,
  placeholder,
  required,
  value,
}: {
  error?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type="tel"
        inputMode="tel"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${label.replace(/\s+/g, "-")}-error` : undefined}
        dir="ltr"
        className={`mt-1 h-11 w-full rounded-md border bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/10 ${
          error ? "border-rose-300" : "border-slate-200"
        }`}
      />
      {error ? (
        <p id={`${label.replace(/\s+/g, "-")}-error`} className="mt-1 text-xs font-medium text-rose-600">
          {error}
        </p>
      ) : null}
    </label>
  );
}

function PercentField({
  disabled,
  error,
  helperText,
  label,
  onChange,
  placeholder,
  step = "1",
  value,
}: {
  disabled?: boolean;
  error?: string;
  helperText?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  step?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className={`mt-1 flex h-11 overflow-hidden rounded-md border bg-white transition focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-600/10 ${
        error ? "border-rose-300" : "border-slate-200"
      }`}>
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          className="min-w-0 flex-1 border-0 bg-transparent px-3 text-sm outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
        />
        <span className="flex w-12 shrink-0 items-center justify-center border-s border-slate-200 bg-slate-50 text-sm font-bold text-slate-700">
          %
        </span>
      </div>
      {error ? (
        <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-xs font-medium text-slate-500">{helperText}</p>
      ) : null}
    </label>
  );
}
