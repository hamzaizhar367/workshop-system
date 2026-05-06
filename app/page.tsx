"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useLanguage } from "./language-provider";

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
  customerName: string;
  customerPhone: string;
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
  taxAmount: number;
  grandTotal: number;
  paidAmount: number;
  remainingBalance: number;
  paymentStatus: PaymentStatus;
  notes: string;
  archived: boolean;
};

type InvoiceForm = {
  jobCardId: string;
  invoiceDate: string;
  dueDate: string;
  discount: string;
  taxAmount: string;
  paidAmount: string;
  notes: string;
};

const activeJobStatuses: JobCardStatus[] = ["inWorkshop"];

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
  { key: "settings", translationKey: "nav.settings" },
];

const dashboardCards = [
  { key: "activeJobs", translationKey: "cards.activeJobs", value: 18 },
  { key: "todaysRevenue", translationKey: "cards.todaysRevenue", value: 12840, currency: true },
  { key: "pendingPayments", translationKey: "cards.pendingPayments", value: 7 },
  { key: "lowStockItems", translationKey: "cards.lowStockItems", value: 14 },
  { key: "monthlyExpenses", translationKey: "cards.monthlyExpenses", value: 38500, currency: true },
  { key: "completedJobs", translationKey: "cards.completedJobs", value: 126 },
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
    ownerName: "Abdullah Al-Ghamdi",
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
  jobCardId: "",
  invoiceDate: "",
  dueDate: "",
  discount: "0",
  taxAmount: "0",
  paidAmount: "0",
  notes: "",
};

export default function Home() {
  const { dir, locale, setLocale, t } = useLanguage();
  const [activeSection, setActiveSection] = useState<SectionKey>("dashboard");
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [customerSearch, setCustomerSearch] = useState("");
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerForm, setCustomerForm] = useState<CustomerForm>(emptyCustomerForm);
  const [editingCustomerId, setEditingCustomerId] = useState<number | null>(null);
  const [customerTab, setCustomerTab] = useState<RecordTab>("active");
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [vehicleForm, setVehicleForm] = useState<VehicleForm>(emptyVehicleForm);
  const [editingVehicleId, setEditingVehicleId] = useState<number | null>(null);
  const [historyVehicleId, setHistoryVehicleId] = useState<number | null>(null);
  const [vehicleTab, setVehicleTab] = useState<RecordTab>("active");
  const [jobCards, setJobCards] = useState<JobCard[]>(initialJobCards);
  const [isJobCardModalOpen, setIsJobCardModalOpen] = useState(false);
  const [jobCardForm, setJobCardForm] = useState<JobCardForm>(emptyJobCardForm);
  const [editingJobCardId, setEditingJobCardId] = useState<number | null>(null);
  const [jobCardTab, setJobCardTab] = useState<RecordTab>("active");
  const [jobCardSearch, setJobCardSearch] = useState("");
  const [inventoryItems, setInventoryItems] =
    useState<InventoryItem[]>(initialInventoryItems);
  const [inventorySearch, setInventorySearch] = useState("");
  const [inventoryTab, setInventoryTab] = useState<RecordTab>("active");
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [inventoryForm, setInventoryForm] =
    useState<InventoryForm>(emptyInventoryForm);
  const [editingInventoryItemId, setEditingInventoryItemId] =
    useState<number | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>(initialPurchases);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState<PurchaseForm>(emptyPurchaseForm);
  const [expandedPurchaseId, setExpandedPurchaseId] = useState<number | null>(null);
  const [duplicatePurchaseRowId, setDuplicatePurchaseRowId] = useState<string | null>(
    null,
  );
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [expenseTab, setExpenseTab] = useState<RecordTab>("active");
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState<ExpenseForm>(emptyExpenseForm);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [invoiceTab, setInvoiceTab] = useState<RecordTab>("active");
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState<InvoiceForm>(emptyInvoiceForm);
  const [editingInvoiceId, setEditingInvoiceId] = useState<number | null>(null);
  const [printInvoiceId, setPrintInvoiceId] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);

  const isArabic = locale === "ar";
  const numberLocale = isArabic ? "ar-SA" : "en-SA";

  useEffect(() => {
    document.body.classList.toggle("invoice-printing", printInvoiceId !== null);

    return () => {
      document.body.classList.remove("invoice-printing");
    };
  }, [printInvoiceId]);

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();

    return customers.filter((customer) => {
      if (customer.archived !== (customerTab === "archived")) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [customer.name, customer.phone, customer.city].some((value) =>
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

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat(numberLocale).format(value);
  };

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat(numberLocale, {
      style: "currency",
      currency: "SAR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (value: string) => {
    return new Intl.DateTimeFormat(numberLocale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(value));
  };

  const formatCardValue = (value: number, currency?: boolean) => {
    return currency ? formatMoney(value) : formatNumber(value);
  };

  const parsePositiveNumber = (value: string) => {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
  };

  const parseWholeNumber = (value: string) => {
    const parsedValue = Math.floor(Number(value));
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
  };

  const getTodayInputValue = () => new Date().toISOString().slice(0, 10);

  const getNextJobNumber = () => {
    const highestJobNumber = jobCards.reduce((highestNumber, jobCard) => {
      const parsedNumber = Number(jobCard.jobNumber.replace("JC-", ""));
      return Number.isFinite(parsedNumber)
        ? Math.max(highestNumber, parsedNumber)
        : highestNumber;
    }, 1000);

    return `JC-${highestJobNumber + 1}`;
  };

  const getNextPurchaseId = () => {
    const highestPurchaseNumber = purchases.reduce((highestNumber, purchase) => {
      const parsedNumber = Number(purchase.purchaseId.replace("PO-", ""));
      return Number.isFinite(parsedNumber)
        ? Math.max(highestNumber, parsedNumber)
        : highestNumber;
    }, 1000);

    return `PO-${highestPurchaseNumber + 1}`;
  };

  const getNextInvoiceNumber = () => {
    const highestInvoiceNumber = invoices.reduce((highestNumber, invoice) => {
      const parsedNumber = Number(invoice.invoiceNumber.replace("INV-", ""));
      return Number.isFinite(parsedNumber)
        ? Math.max(highestNumber, parsedNumber)
        : highestNumber;
    }, 1000);

    return `INV-${highestInvoiceNumber + 1}`;
  };

  const getPaymentStatusFromAmounts = (paidAmount: number, grandTotal: number) => {
    if (paidAmount <= 0) {
      return "unpaid" as const;
    }

    return paidAmount >= grandTotal ? ("paid" as const) : ("partial" as const);
  };

  const getInvoiceCalculations = (
    laborCost: number,
    partsCost: number,
    discount: number,
    taxAmount: number,
    paidAmount: number,
  ) => {
    const subtotal = laborCost + partsCost;
    const grandTotal = Math.max(0, subtotal + taxAmount - discount);
    const remainingBalance = Math.max(0, grandTotal - paidAmount);

    return {
      subtotal,
      grandTotal,
      remainingBalance,
      paymentStatus: getPaymentStatusFromAmounts(paidAmount, grandTotal),
    };
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

  const getInsufficientStockItemName = (partsUsed: JobPart[]) => {
    const usedQuantities = partsUsed.reduce<Record<number, number>>((quantities, part) => {
      if (part.itemType === "service") {
        return quantities;
      }

      return {
        ...quantities,
        [part.inventoryItemId]:
          (quantities[part.inventoryItemId] ?? 0) + part.quantity,
      };
    }, {});

    const insufficientItemId = Object.entries(usedQuantities).find(
      ([itemId, quantity]) => {
        const inventoryItem = inventoryItems.find((item) => item.id === Number(itemId));
        return inventoryItem ? quantity > inventoryItem.stockQuantity : false;
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

  const deductJobPartsFromStock = (partsUsed: JobPart[]) => {
    const usedQuantities = getStockDeductionQuantities(partsUsed);

    setInventoryItems((currentItems) =>
      currentItems.map((item) => ({
        ...item,
        stockQuantity: Math.max(
          0,
          item.stockQuantity - (usedQuantities[item.id] ?? 0),
        ),
      })),
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
      setCustomerForm(emptyCustomerForm);
    }

    setIsCustomerModalOpen(true);
  };

  const closeCustomerModal = () => {
    setIsCustomerModalOpen(false);
    setCustomerForm(emptyCustomerForm);
    setEditingCustomerId(null);
  };

  const saveCustomer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editingCustomerId) {
      setCustomers((currentCustomers) =>
        currentCustomers.map((customer) =>
          customer.id === editingCustomerId
            ? {
                ...customer,
                name: customerForm.name.trim(),
                phone: customerForm.phone.trim(),
                city: customerForm.city.trim(),
                type: customerForm.type,
                notes: customerForm.notes.trim(),
              }
            : customer,
        ),
      );
      closeCustomerModal();
      return;
    }

    const nextCustomer: Customer = {
      id: Date.now(),
      name: customerForm.name.trim(),
      phone: customerForm.phone.trim(),
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

  const closeVehicleModal = () => {
    setIsVehicleModalOpen(false);
    setVehicleForm(emptyVehicleForm);
    setEditingVehicleId(null);
  };

  const saveVehicle = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (editingVehicleId) {
      setVehicles((currentVehicles) =>
        currentVehicles.map((vehicle) =>
          vehicle.id === editingVehicleId
            ? {
                ...vehicle,
                customerId:
                  customers.find(
                    (customer) =>
                      customer.name.toLowerCase() ===
                      vehicleForm.ownerName.trim().toLowerCase(),
                  )?.id ?? vehicle.customerId,
                ownerName: vehicleForm.ownerName.trim(),
                plateNumber: vehicleForm.plateNumber.trim(),
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
      closeVehicleModal();
      return;
    }

    const nextVehicle: Vehicle = {
      id: Date.now(),
      customerId:
        customers.find(
          (customer) =>
            customer.name.toLowerCase() === vehicleForm.ownerName.trim().toLowerCase(),
        )?.id ?? 0,
      ownerName: vehicleForm.ownerName.trim(),
      plateNumber: vehicleForm.plateNumber.trim(),
      make: vehicleForm.make.trim(),
      model: vehicleForm.model.trim(),
      year: vehicleForm.year.trim(),
      colorKey: vehicleForm.color.trim(),
      vehicleTypeKey: vehicleForm.vehicleType.trim(),
      notes: vehicleForm.notes.trim(),
      archived: false,
    };

    setVehicles((currentVehicles) => [nextVehicle, ...currentVehicles]);
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
        paymentStatus: jobCard.paymentStatus,
        notes: jobCard.notes,
      });
    } else {
      setEditingJobCardId(null);
      setJobCardForm({
        ...emptyJobCardForm,
        jobNumber: getNextJobNumber(),
        date: getTodayInputValue(),
      });
    }

    setIsJobCardModalOpen(true);
  };

  const closeJobCardModal = () => {
    setIsJobCardModalOpen(false);
    setEditingJobCardId(null);
    setJobCardForm(emptyJobCardForm);
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
    const partsUsed = getJobPartsFromForm();
    const partsCost = partsUsed.reduce((total, part) => total + part.lineTotal, 0);
    const isSavingCompletedJob = jobCardForm.status === "completed";
    const shouldDeductStock =
      isSavingCompletedJob && existingJobCard?.stockDeducted !== true;
    const insufficientStockItemName = isSavingCompletedJob
      ? getInsufficientStockItemName(partsUsed)
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
      customerId: selectedVehicle.customerId,
      date: jobCardForm.date,
      status: jobCardForm.status,
      customerName: selectedCustomer?.name ?? selectedVehicle.ownerName,
      vehicleLabel: `${selectedVehicle.make} ${selectedVehicle.model}`,
      plateNumber: selectedVehicle.plateNumber,
      complaint: jobCardForm.complaint.trim(),
      workPerformed: jobCardForm.workPerformed.trim(),
      mechanic: jobCardForm.mechanic.trim(),
      laborCost: parsePositiveNumber(jobCardForm.laborCost),
      partsCost,
      partsUsed,
      paymentStatus: jobCardForm.paymentStatus,
      notes: jobCardForm.notes.trim(),
      stockDeducted: existingJobCard?.stockDeducted === true || shouldDeductStock,
      deductedParts: shouldDeductStock
        ? partsUsed.filter((part) => part.itemType === "stock")
        : existingJobCard?.deductedParts ?? [],
    };

    if (editingJobCardId) {
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
      if (shouldDeductStock) {
        deductJobPartsFromStock(partsUsed);
      }
      closeJobCardModal();
      return;
    }

    const nextJobCard: JobCard = {
      id: Date.now(),
      ...jobCardValues,
      archived: jobCardValues.status === "cancelled",
    };

    setJobCards((currentJobCards) => [nextJobCard, ...currentJobCards]);
    if (shouldDeductStock) {
      deductJobPartsFromStock(partsUsed);
    }
    closeJobCardModal();
  };

  const setJobCardArchived = (jobCardId: number, archived: boolean) => {
    const targetJobCard = jobCards.find((jobCard) => jobCard.id === jobCardId);
    const activeJob = targetJobCard ? getActiveJob(targetJobCard.vehicleId) : undefined;

    if (!archived && activeJob && activeJob.id !== jobCardId) {
      showToast("toast.activeJobExists");
      return;
    }

    setJobCards((currentJobCards) =>
      currentJobCards.map((jobCard) =>
        jobCard.id === jobCardId
          ? {
              ...jobCard,
              archived,
              status: archived ? "cancelled" : "inWorkshop",
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

  const saveInventoryItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

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

  const openPurchaseModal = () => {
    setPurchaseForm({
      ...emptyPurchaseForm,
      purchaseDate: getTodayInputValue(),
    });
    setDuplicatePurchaseRowId(null);
    setIsPurchaseModalOpen(true);
  };

  const closePurchaseModal = () => {
    setIsPurchaseModalOpen(false);
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

  const increaseInventoryStockFromPurchase = (purchaseItems: PurchaseItem[]) => {
    const purchasedQuantities = purchaseItems.reduce<Record<number, number>>(
      (quantities, item) => ({
        ...quantities,
        [item.inventoryItemId]:
          (quantities[item.inventoryItemId] ?? 0) + item.quantity,
      }),
      {},
    );

    setInventoryItems((currentItems) =>
      currentItems.map((item) => ({
        ...item,
        stockQuantity:
          item.stockQuantity + (purchasedQuantities[item.id] ?? 0),
      })),
    );
  };

  const savePurchase = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

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

    const nextPurchase: Purchase = {
      id: Date.now(),
      purchaseId: getNextPurchaseId(),
      supplierName: purchaseForm.supplierName.trim(),
      purchaseDate: purchaseForm.purchaseDate,
      items: purchaseItems,
      totalQuantity: purchaseItems.reduce((total, item) => total + item.quantity, 0),
      totalAmount: purchaseItems.reduce((total, item) => total + item.lineTotal, 0),
      paymentStatus: purchaseForm.paymentStatus,
      notes: purchaseForm.notes.trim(),
      createdBy: "Hamza",
    };

    setPurchases((currentPurchases) => [nextPurchase, ...currentPurchases]);
    increaseInventoryStockFromPurchase(purchaseItems);
    closePurchaseModal();
  };

  const openExpenseModal = () => {
    setExpenseForm({
      ...emptyExpenseForm,
      date: getTodayInputValue(),
    });
    setIsExpenseModalOpen(true);
  };

  const closeExpenseModal = () => {
    setIsExpenseModalOpen(false);
    setExpenseForm(emptyExpenseForm);
  };

  const saveExpense = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const amount = parsePositiveNumber(expenseForm.amount);

    if (amount <= 0) {
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
        jobCardId: String(invoice.jobCardId),
        invoiceDate: invoice.invoiceDate,
        dueDate: invoice.dueDate,
        discount: String(invoice.discount),
        taxAmount: String(invoice.taxAmount),
        paidAmount: String(invoice.paidAmount),
        notes: invoice.notes,
      });
    } else {
      setEditingInvoiceId(null);
      setInvoiceForm({
        ...emptyInvoiceForm,
        invoiceDate: getTodayInputValue(),
        dueDate: getTodayInputValue(),
      });
    }

    setIsInvoiceModalOpen(true);
  };

  const closeInvoiceModal = () => {
    setIsInvoiceModalOpen(false);
    setEditingInvoiceId(null);
    setInvoiceForm(emptyInvoiceForm);
  };

  const buildInvoiceValues = (jobCard: JobCard, existingInvoice?: Invoice) => {
    const customer = customers.find((customerRecord) => customerRecord.id === jobCard.customerId);
    const discount = parsePositiveNumber(invoiceForm.discount);
    const taxAmount = parsePositiveNumber(invoiceForm.taxAmount);
    const paidAmount = parsePositiveNumber(invoiceForm.paidAmount);
    const calculations = getInvoiceCalculations(
      jobCard.laborCost,
      jobCard.partsCost,
      discount,
      taxAmount,
      paidAmount,
    );

    return {
      invoiceNumber: existingInvoice?.invoiceNumber ?? getNextInvoiceNumber(),
      invoiceDate: invoiceForm.invoiceDate,
      dueDate: invoiceForm.dueDate,
      customerName: jobCard.customerName,
      customerPhone: customer?.phone ?? "",
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
      taxAmount,
      grandTotal: calculations.grandTotal,
      paidAmount,
      remainingBalance: calculations.remainingBalance,
      paymentStatus: calculations.paymentStatus,
      notes: invoiceForm.notes.trim(),
    };
  };

  const saveInvoice = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const selectedJobCard = jobCards.find(
      (jobCard) => jobCard.id === Number(invoiceForm.jobCardId),
    );

    if (!selectedJobCard || selectedJobCard.status !== "completed") {
      return;
    }

    if (editingInvoiceId) {
      const existingInvoice = invoices.find((invoice) => invoice.id === editingInvoiceId);
      const invoiceValues = buildInvoiceValues(selectedJobCard, existingInvoice);

      setInvoices((currentInvoices) =>
        currentInvoices.map((invoice) =>
          invoice.id === editingInvoiceId ? { ...invoice, ...invoiceValues } : invoice,
        ),
      );
      closeInvoiceModal();
      return;
    }

    const invoiceValues = buildInvoiceValues(selectedJobCard);
    const nextInvoice: Invoice = {
      id: Date.now(),
      ...invoiceValues,
      archived: false,
    };

    setInvoices((currentInvoices) => [nextInvoice, ...currentInvoices]);
    closeInvoiceModal();
  };

  const setInvoiceArchived = (invoiceId: number, archived: boolean) => {
    setInvoices((currentInvoices) =>
      currentInvoices.map((invoice) =>
        invoice.id === invoiceId ? { ...invoice, archived } : invoice,
      ),
    );
    showToast(archived ? "toast.recordArchived" : "toast.recordRestored");
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
    reports: { title: "topbar.title", subtitle: "topbar.subtitle" },
    settings: { title: "topbar.title", subtitle: "topbar.subtitle" },
  };

  const topbarTitleKey = sectionHeaderKeys[activeSection].title;
  const topbarSubtitleKey = sectionHeaderKeys[activeSection].subtitle;

  return (
    <main dir={dir} className="min-h-screen bg-slate-100 text-slate-950">
      <div className="app-shell flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-s border-slate-200 bg-white px-4 py-5 shadow-sm md:flex md:flex-col">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-emerald-700 text-sm font-bold text-white">
              {t("app.shortName")}
            </div>
            <div>
              <p className="text-base font-semibold">{t("app.name")}</p>
              <p className="text-xs text-slate-500">{t("app.subtitle")}</p>
              <p className="mt-0.5 text-xs font-medium text-slate-600" dir="ltr">
                {t("app.phone")}
              </p>
            </div>
          </div>

          <nav className="flex flex-1 flex-col gap-1">
            {navigationItems.map((item) => (
              <NavigationButton
                key={item.key}
                isActive={item.key === activeSection}
                label={t(item.translationKey)}
                onClick={() => setActiveSection(item.key)}
              />
            ))}
          </nav>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
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
                  {t("app.shortName")}
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="hidden text-end text-xs text-slate-500 xl:block">
                  <p className="font-medium text-slate-700">{t("app.name")}</p>
                  <p dir="ltr">{t("app.phone")}</p>
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
                    onClick={() => setLocale("ar")}
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
                    onClick={() => setLocale("en")}
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

          <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            {activeSection === "customers" ? (
              <CustomersSection
                customerForm={customerForm}
                customerSearch={customerSearch}
                customers={filteredCustomers}
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
                onUpdateForm={setCustomerForm}
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
                isModalOpen={isJobCardModalOpen}
                isEditing={editingJobCardId !== null}
                jobCardForm={jobCardForm}
                jobCardSearch={jobCardSearch}
                jobCardTab={jobCardTab}
                jobCards={filteredJobCards}
                onArchivedChange={setJobCardArchived}
                onCloseModal={closeJobCardModal}
                onOpenModal={openJobCardModal}
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
                  formatDate={formatDate}
                  formatMoney={formatMoney}
                  invoiceForm={invoiceForm}
                  invoiceSearch={invoiceSearch}
                  invoices={filteredInvoices}
                  isEditing={editingInvoiceId !== null}
                  isModalOpen={isInvoiceModalOpen}
                  onArchivedChange={setInvoiceArchived}
                  onCloseModal={closeInvoiceModal}
                  onOpenModal={openInvoiceModal}
                  onPrintInvoice={(invoice) => setPrintInvoiceId(invoice.id)}
                  onSave={saveInvoice}
                  onSearchChange={setInvoiceSearch}
                  onTabChange={setInvoiceTab}
                  onUpdateForm={setInvoiceForm}
                  t={t}
                />
              </>
            ) : (
              <DashboardSection formatCardValue={formatCardValue} t={t} />
            )}
          </div>
        </section>
      </div>
      {printInvoiceId ? (
        <PrintInvoiceModal
          formatDate={formatDate}
          formatMoney={formatMoney}
          invoice={invoices.find((invoice) => invoice.id === printInvoiceId)}
          onClose={() => setPrintInvoiceId(null)}
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
      className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition ${
        isActive
          ? "bg-emerald-50 text-emerald-800"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
      }`}
    >
      <span
        className={`size-2 rounded-full ${
          isActive ? "bg-emerald-700" : "bg-slate-300"
        }`}
      />
      <span>{label}</span>
    </button>
  );
}

function DashboardSection({
  formatCardValue,
  t,
}: {
  formatCardValue: (value: number, currency?: boolean) => string;
  t: (key: string) => string;
}) {
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
            className="h-11 rounded-md bg-white px-4 text-sm font-semibold text-emerald-900 shadow-sm transition hover:bg-emerald-50"
          >
            {t("dashboard.quickAction")}
          </button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {dashboardCards.map((card) => (
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
    </>
  );
}

function CustomersSection({
  activeTab,
  customerForm,
  customerSearch,
  customers,
  formatDate,
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
  customerSearch: string;
  customers: Customer[];
  formatDate: (value: string) => string;
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
          {customers.map((customer) => {
            const customerVehicles = getCustomerVehicles(customer.id);
            const customerJobs = getCustomerJobs(customer.id);
            const lastCustomerJob = customerJobs.toSorted((firstJob, secondJob) =>
              secondJob.date.localeCompare(firstJob.date),
            )[0];
            const outstandingBalance = customerJobs
              .filter((jobCard) => jobCard.status !== "completed")
              .filter((jobCard) => jobCard.paymentStatus !== "paid")
              .reduce((total, jobCard) => total + jobCard.laborCost + jobCard.partsCost, 0);

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
                    <p className="mt-1 text-sm text-slate-500">{customer.phone}</p>
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

      {isModalOpen ? (
        <CustomerModal
          customerForm={customerForm}
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
      <dt className="text-xs font-medium uppercase text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-800">{value}</dd>
    </div>
  );
}

function CustomerModal({
  customerForm,
  isEditing,
  onClose,
  onSave,
  onUpdateForm,
  t,
}: {
  customerForm: CustomerForm;
  isEditing: boolean;
  onClose: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateForm: (value: CustomerForm) => void;
  t: (key: string) => string;
}) {
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

        <div className="max-h-[70vh] flex-1 overflow-y-auto p-5">
          <div className="grid gap-4">
            <FormField
              label={t("customers.fields.name")}
              value={customerForm.name}
              onChange={(value) => onUpdateForm({ ...customerForm, name: value })}
              placeholder={t("customers.form.namePlaceholder")}
              required
            />
            <FormField
              label={t("customers.fields.phone")}
              value={customerForm.phone}
              onChange={(value) => onUpdateForm({ ...customerForm, phone: value })}
              placeholder={t("customers.form.phonePlaceholder")}
              required
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
            className="h-11 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
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
          {vehicles.map((vehicle) => {
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

        <div className="max-h-[70vh] flex-1 overflow-y-auto p-5">
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

        <div className="max-h-[70vh] flex-1 overflow-y-auto p-5">
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
  isModalOpen,
  jobCardForm,
  jobCardSearch,
  jobCardTab,
  jobCards,
  onArchivedChange,
  onCloseModal,
  onOpenModal,
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
  isModalOpen: boolean;
  jobCardForm: JobCardForm;
  jobCardSearch: string;
  jobCardTab: RecordTab;
  jobCards: JobCard[];
  onArchivedChange: (jobCardId: number, archived: boolean) => void;
  onCloseModal: () => void;
  onOpenModal: (jobCard?: JobCard) => void;
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
          jobCardForm={jobCardForm}
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

function JobCardModal({
  formatMoney,
  inventoryItems,
  isEditing,
  jobCardForm,
  onClose,
  onSave,
  onUpdateForm,
  t,
  vehicles,
}: {
  formatMoney: (value: number) => string;
  inventoryItems: InventoryItem[];
  isEditing: boolean;
  jobCardForm: JobCardForm;
  onClose: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateForm: (value: JobCardForm) => void;
  t: (key: string) => string;
  vehicles: Vehicle[];
}) {
  const [duplicatePartRowId, setDuplicatePartRowId] = useState<string | null>(null);
  const selectedVehicle = vehicles.find(
    (vehicle) => vehicle.id === Number(jobCardForm.vehicleId),
  );
  const getFormCost = (value: string) => {
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
  };
  const activeInventoryItems = inventoryItems.filter((item) => !item.archived);
  const getPartLineTotal = (partLine: JobPartFormLine) =>
    getFormCost(partLine.quantity) * getFormCost(partLine.unitSellingPrice);
  const partsTotal = jobCardForm.partsUsed.reduce(
    (total, partLine) => total + getPartLineTotal(partLine),
    0,
  );
  const totalAmount = getFormCost(jobCardForm.laborCost) + partsTotal;
  const selectedInventoryItemIds = jobCardForm.partsUsed
    .map((partLine) => partLine.inventoryItemId)
    .filter(Boolean);
  const createPartRowId = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `part-${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const addPartLine = () => {
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

        <div className="max-h-[70vh] flex-1 overflow-y-auto p-5">
          <div className="grid gap-4">
            <FormField
              label={t("jobCards.fields.jobNumber")}
              value={jobCardForm.jobNumber}
              onChange={(value) => onUpdateForm({ ...jobCardForm, jobNumber: value })}
              placeholder={t("jobCards.form.jobNumberPlaceholder")}
              required
            />

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                {t("jobCards.fields.vehicle")}
              </span>
              <select
                value={jobCardForm.vehicleId}
                onChange={(event) =>
                  onUpdateForm({ ...jobCardForm, vehicleId: event.target.value })
                }
                required
                className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-600"
              >
                <option value="">{t("jobCards.form.vehiclePlaceholder")}</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.plateNumber} - {vehicle.make} {vehicle.model}
                  </option>
                ))}
              </select>
            </label>

            {selectedVehicle ? (
              <section className="grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-3">
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
              </section>
            ) : null}

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
                className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-600"
              >
                <option value="inWorkshop">{t("vehicles.status.inWorkshop")}</option>
                <option value="completed">{t("vehicles.status.completed")}</option>
                <option value="cancelled">{t("vehicles.status.cancelled")}</option>
              </select>
            </label>

            <FormField
              label={t("jobCards.fields.complaint")}
              value={jobCardForm.complaint}
              onChange={(value) => onUpdateForm({ ...jobCardForm, complaint: value })}
              placeholder={t("jobCards.form.complaintPlaceholder")}
              required
            />

            <FormField
              label={t("jobCards.fields.workPerformed")}
              value={jobCardForm.workPerformed}
              onChange={(value) => onUpdateForm({ ...jobCardForm, workPerformed: value })}
              placeholder={t("jobCards.form.workPlaceholder")}
              required
            />

            <FormField
              label={t("jobCards.fields.mechanic")}
              value={jobCardForm.mechanic}
              onChange={(value) => onUpdateForm({ ...jobCardForm, mechanic: value })}
              placeholder={t("jobCards.form.mechanicPlaceholder")}
              required
            />

            <FormField
              inputType="number"
              label={t("jobCards.fields.laborCost")}
              min="0"
              value={jobCardForm.laborCost}
              onChange={(value) => onUpdateForm({ ...jobCardForm, laborCost: value })}
              placeholder={t("jobCards.form.laborCostPlaceholder")}
              required
            />

            <section className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {t("jobCards.parts.title")}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {t("jobCards.parts.subtitle")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addPartLine}
                  className="h-9 rounded-md border border-emerald-200 bg-white px-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                >
                  {t("jobCards.parts.addPart")}
                </button>
              </div>

              <div className="mt-4">
                {jobCardForm.partsUsed.length > 0 ? (
                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <div className="hidden border-b border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold uppercase text-slate-500 lg:grid lg:grid-cols-[2.2fr_1.2fr_1fr_1fr_1fr_auto] lg:items-center lg:gap-3">
                      <span>{t("jobCards.parts.inventoryItem")}</span>
                      <span className="text-center">{t("jobCards.parts.availableStockLabel")}</span>
                      <span className="text-center">{t("jobCards.parts.quantity")}</span>
                      <span className="text-center">{t("jobCards.parts.unitSellingPrice")}</span>
                      <span className="text-center">{t("jobCards.parts.lineTotal")}</span>
                      <span className="text-end">{t("jobCards.parts.actions")}</span>
                    </div>

                    {jobCardForm.partsUsed.map((partLine) => {
                      const selectedItem = inventoryItems.find(
                        (item) => item.id === Number(partLine.inventoryItemId),
                      );
                      const quantity = getFormCost(partLine.quantity);
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
                          className="border-b border-slate-100 p-3 transition last:border-b-0 hover:bg-slate-50/70"
                        >
                          <div className="mb-3 flex flex-col gap-2 lg:hidden">
                            <div>
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

                          <div className="grid gap-3 lg:grid-cols-[2.2fr_1.2fr_1fr_1fr_1fr_auto] lg:items-center">
                            <label className="block">
                              <span className="text-sm font-medium text-slate-700 lg:sr-only">
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
                                className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-600 lg:mt-0"
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
                              {selectedItem ? (
                                <div className="mt-2 hidden lg:block">
                                  <p className="text-sm font-semibold text-slate-900">
                                    {selectedItem.itemName}
                                  </p>
                                  <p className="mt-0.5 text-xs text-slate-500">
                                    {selectedItem.arabicItemName || t("common.notAvailable")}
                                  </p>
                                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                                    {selectedItem.sku}
                                  </p>
                                </div>
                              ) : null}
                            </label>

                            <div>
                              <p className="text-xs font-medium uppercase text-slate-400 lg:sr-only">
                                {t("jobCards.parts.availableStockLabel")}
                              </p>
                              <div className="mt-1 flex flex-wrap gap-2 lg:mt-0 lg:flex-col lg:items-center">
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
                              <span className="text-sm font-medium text-slate-700 lg:sr-only">
                                {t("jobCards.parts.quantity")}
                              </span>
                              <input
                                type="number"
                                min="0"
                                value={partLine.quantity}
                                onChange={(event) =>
                                  updatePartLine(partLine.rowId, {
                                    quantity: event.target.value,
                                  })
                                }
                                placeholder={t("jobCards.parts.quantityPlaceholder")}
                                className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-center text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 lg:mt-0"
                              />
                            </label>

                            <label className="block">
                              <span className="text-sm font-medium text-slate-700 lg:sr-only">
                                {t("jobCards.parts.unitSellingPrice")}
                              </span>
                              <input
                                type="number"
                                min="0"
                                value={partLine.unitSellingPrice}
                                onChange={(event) =>
                                  updatePartLine(partLine.rowId, {
                                    unitSellingPrice: event.target.value,
                                  })
                                }
                                placeholder={t("jobCards.parts.pricePlaceholder")}
                                className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-center text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 lg:mt-0"
                              />
                            </label>

                            <div>
                              <p className="text-xs font-medium uppercase text-slate-400 lg:sr-only">
                                {t("jobCards.parts.lineTotal")}
                              </p>
                              <p className="mt-1 text-base font-bold text-slate-950 lg:mt-0 lg:text-center">
                                {formatMoney(getPartLineTotal(partLine))}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() => removePartLine(partLine.rowId)}
                              className="h-8 rounded-md border border-rose-200 px-2.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                            >
                              {t("common.remove")}
                            </button>
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
                  <p className="rounded-md border border-dashed border-slate-300 bg-white px-3 py-5 text-center text-sm text-slate-500">
                    {t("jobCards.parts.empty")}
                  </p>
                )}
              </div>
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

            <label className="block">
              <span className="text-sm font-medium text-slate-700">
                {t("jobCards.fields.paymentStatus")}
              </span>
              <select
                value={jobCardForm.paymentStatus}
                onChange={(event) =>
                  onUpdateForm({
                    ...jobCardForm,
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
            {t("jobCards.form.cancel")}
          </button>
          <button
            type="submit"
            className="h-11 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
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
  formatDate,
  formatMoney,
  invoiceForm,
  invoiceSearch,
  invoices,
  isEditing,
  isModalOpen,
  onArchivedChange,
  onCloseModal,
  onOpenModal,
  onPrintInvoice,
  onSave,
  onSearchChange,
  onTabChange,
  onUpdateForm,
  t,
}: {
  activeTab: RecordTab;
  availableJobCards: JobCard[];
  formatDate: (value: string) => string;
  formatMoney: (value: number) => string;
  invoiceForm: InvoiceForm;
  invoiceSearch: string;
  invoices: Invoice[];
  isEditing: boolean;
  isModalOpen: boolean;
  onArchivedChange: (invoiceId: number, archived: boolean) => void;
  onCloseModal: () => void;
  onOpenModal: (invoice?: Invoice) => void;
  onPrintInvoice: (invoice: Invoice) => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onSearchChange: (value: string) => void;
  onTabChange: (value: RecordTab) => void;
  onUpdateForm: (value: InvoiceForm) => void;
  t: (key: string) => string;
}) {
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
          {invoices.map((invoice) => (
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
                <CustomerField label={t("invoices.fields.customerPhone")} value={invoice.customerPhone || t("common.notAvailable")} />
              </dl>
              <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => onOpenModal(invoice)} className="h-10 rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  {t("common.viewEdit")}
                </button>
                <button type="button" onClick={() => onPrintInvoice(invoice)} className="h-10 rounded-md border border-emerald-200 px-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">
                  {t("invoices.printButton")}
                </button>
                <button
                  type="button"
                  onClick={() => onArchivedChange(invoice.id, !invoice.archived)}
                  className={`h-10 rounded-md border px-3 text-sm font-semibold transition ${invoice.archived ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50" : "border-amber-200 text-amber-700 hover:bg-amber-50"}`}
                >
                  {t(invoice.archived ? "common.restore" : "common.archive")}
                </button>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="rounded-lg border border-dashed border-slate-300 bg-white px-5 py-12 text-center shadow-sm">
          <h3 className="text-lg font-semibold text-slate-950">{t(activeTab === "archived" ? "invoices.emptyArchivedTitle" : "invoices.emptyActiveTitle")}</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{t(activeTab === "archived" ? "invoices.emptyArchivedBody" : "invoices.emptyActiveBody")}</p>
        </section>
      )}

      {isModalOpen ? (
        <InvoiceModal
          availableJobCards={availableJobCards}
          formatDate={formatDate}
          formatMoney={formatMoney}
          invoiceForm={invoiceForm}
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

function InvoiceModal({
  availableJobCards,
  formatDate,
  formatMoney,
  invoiceForm,
  isEditing,
  onClose,
  onSave,
  onUpdateForm,
  t,
}: {
  availableJobCards: JobCard[];
  formatDate: (value: string) => string;
  formatMoney: (value: number) => string;
  invoiceForm: InvoiceForm;
  isEditing: boolean;
  onClose: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateForm: (value: InvoiceForm) => void;
  t: (key: string) => string;
}) {
  const selectedJobCard = availableJobCards.find((jobCard) => jobCard.id === Number(invoiceForm.jobCardId));
  const discount = Number(invoiceForm.discount) > 0 ? Number(invoiceForm.discount) : 0;
  const taxAmount = Number(invoiceForm.taxAmount) > 0 ? Number(invoiceForm.taxAmount) : 0;
  const paidAmount = Number(invoiceForm.paidAmount) > 0 ? Number(invoiceForm.paidAmount) : 0;
  const subtotal = selectedJobCard ? selectedJobCard.laborCost + selectedJobCard.partsCost : 0;
  const grandTotal = Math.max(0, subtotal + taxAmount - discount);
  const remainingBalance = Math.max(0, grandTotal - paidAmount);
  const paymentStatus = paidAmount <= 0 ? "unpaid" : paidAmount >= grandTotal ? "paid" : "partial";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/40 px-4 py-4">
      <form onSubmit={onSave} className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-lg bg-white shadow-xl sm:max-w-4xl">
        <div className="shrink-0 border-b border-slate-100 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold tracking-normal">{t(isEditing ? "invoices.form.editTitle" : "invoices.form.title")}</h2>
              <p className="mt-1 text-sm text-slate-500">{t("invoices.form.subtitle")}</p>
            </div>
            <button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-950">{t("invoices.form.close")}</button>
          </div>
        </div>
        <div className="max-h-[70vh] flex-1 overflow-y-auto p-5">
          <div className="grid gap-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">{t("invoices.fields.jobCardNumber")}</span>
              <select
                value={invoiceForm.jobCardId}
                onChange={(event) => onUpdateForm({ ...invoiceForm, jobCardId: event.target.value })}
                disabled={isEditing}
                required
                className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-emerald-600 disabled:bg-slate-100"
              >
                <option value="">{t("invoices.form.jobCardPlaceholder")}</option>
                {availableJobCards.map((jobCard) => (
                  <option key={jobCard.id} value={jobCard.id}>{jobCard.jobNumber} - {jobCard.customerName} - {jobCard.plateNumber}</option>
                ))}
              </select>
            </label>

            {selectedJobCard ? (
              <section className="grid gap-4 rounded-lg bg-slate-50 p-4 sm:grid-cols-3">
                <CustomerField label={t("invoices.fields.customerName")} value={selectedJobCard.customerName} />
                <CustomerField label={t("invoices.fields.vehicle")} value={selectedJobCard.vehicleLabel} />
                <CustomerField label={t("invoices.fields.plateNumber")} value={selectedJobCard.plateNumber} />
                <CustomerField label={t("invoices.fields.jobDate")} value={formatDate(selectedJobCard.date)} />
                <CustomerField label={t("invoices.fields.workPerformed")} value={selectedJobCard.workPerformed} />
                <CustomerField label={t("invoices.fields.subtotal")} value={formatMoney(subtotal)} />
              </section>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField inputType="date" label={t("invoices.fields.invoiceDate")} value={invoiceForm.invoiceDate} onChange={(value) => onUpdateForm({ ...invoiceForm, invoiceDate: value })} placeholder={t("invoices.form.invoiceDatePlaceholder")} required />
              <FormField inputType="date" label={t("invoices.fields.dueDate")} value={invoiceForm.dueDate} onChange={(value) => onUpdateForm({ ...invoiceForm, dueDate: value })} placeholder={t("invoices.form.dueDatePlaceholder")} required />
              <FormField inputType="number" label={t("invoices.fields.discount")} min="0" value={invoiceForm.discount} onChange={(value) => onUpdateForm({ ...invoiceForm, discount: value })} placeholder={t("invoices.form.discountPlaceholder")} />
              <FormField inputType="number" label={t("invoices.fields.taxAmount")} min="0" value={invoiceForm.taxAmount} onChange={(value) => onUpdateForm({ ...invoiceForm, taxAmount: value })} placeholder={t("invoices.form.taxPlaceholder")} />
              <FormField inputType="number" label={t("invoices.fields.paidAmount")} min="0" value={invoiceForm.paidAmount} onChange={(value) => onUpdateForm({ ...invoiceForm, paidAmount: value })} placeholder={t("invoices.form.paidPlaceholder")} />
            </div>

            <section className="grid gap-3 rounded-lg border border-slate-200 bg-white p-4 sm:grid-cols-3">
              <CustomerField label={t("invoices.fields.grandTotal")} value={formatMoney(grandTotal)} />
              <CustomerField label={t("invoices.fields.remainingBalance")} value={formatMoney(remainingBalance)} />
              <div>
                <p className="text-xs font-medium uppercase text-slate-400">{t("invoices.fields.paymentStatus")}</p>
                <div className="mt-1"><PaymentStatusBadge status={paymentStatus} t={t} /></div>
              </div>
            </section>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">{t("invoices.fields.notes")}</span>
              <textarea value={invoiceForm.notes} onChange={(event) => onUpdateForm({ ...invoiceForm, notes: event.target.value })} placeholder={t("invoices.form.notesPlaceholder")} rows={4} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600" />
            </label>
          </div>
        </div>
        <div className="sticky bottom-0 flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-white p-5 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="h-11 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">{t("invoices.form.cancel")}</button>
          <button type="submit" className="h-11 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800">{t("invoices.form.save")}</button>
        </div>
      </form>
    </div>
  );
}

function PrintInvoiceModal({
  formatDate,
  formatMoney,
  invoice,
  onClose,
  t,
}: {
  formatDate: (value: string) => string;
  formatMoney: (value: number) => string;
  invoice?: Invoice;
  onClose: () => void;
  t: (key: string) => string;
}) {
  if (!invoice) {
    return null;
  }

  return (
    <div className="invoice-print-backdrop fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/40 px-4 py-4">
      <div className="invoice-print-shell flex max-h-[94vh] w-full flex-col overflow-hidden rounded-lg bg-slate-100 shadow-xl sm:max-w-5xl print:max-h-none print:overflow-visible print:rounded-none print:bg-white print:shadow-none">
        <div className="shrink-0 border-b border-slate-100 bg-white p-4 print:hidden">
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => window.print()} className="h-10 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800">{t("invoices.printNow")}</button>
            <button type="button" onClick={onClose} className="h-10 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">{t("invoices.form.close")}</button>
          </div>
        </div>
        <div className="invoice-print-page max-h-[84vh] flex-1 overflow-y-auto p-4 sm:p-6 print:max-h-none print:overflow-visible print:p-0">
          <section className="invoice-sheet mx-auto min-h-[1120px] w-full max-w-[820px] bg-white p-8 shadow-sm ring-1 ring-slate-200 sm:p-10 print:min-h-0 print:max-w-none print:p-0 print:shadow-none print:ring-0">
            <div className="invoice-header flex flex-col gap-6 border-b-2 border-slate-900 pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-normal text-slate-950">{t("app.name")}</h2>
                <p className="mt-2 text-base font-semibold text-slate-700">{t("app.subtitle")}</p>
                <p className="mt-1 text-base font-semibold text-slate-700" lang="ar" dir="rtl">
                  {"\u0645\u064a\u0632\u0627\u0646 \u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u0648\u062e\u062f\u0645\u0627\u062a \u0633\u064a\u0627\u0631\u0627\u062a"}
                </p>
                <p className="mt-3 text-sm font-bold text-slate-900" dir="ltr">{t("app.phone")}</p>
              </div>
              <div className="invoice-number-card rounded-lg border border-slate-200 bg-slate-50 p-4 text-start sm:min-w-64 sm:text-end">
                <p className="text-xs font-medium uppercase text-slate-400">{t("invoices.fields.invoiceNumber")}</p>
                <h3 className="mt-1 text-2xl font-black text-slate-950">{invoice.invoiceNumber}</h3>
                <p className="mt-2 text-sm font-semibold text-slate-700">{formatDate(invoice.invoiceDate)}</p>
                <div className="mt-3 flex sm:justify-end">
                  <PaymentStatusBadge status={invoice.paymentStatus} t={t} />
                </div>
              </div>
            </div>

            <div className="invoice-detail-grid mt-6 grid gap-4 sm:grid-cols-2">
              <section className="invoice-detail-card rounded-lg border border-slate-200 p-5">
                <h4 className="border-b border-slate-100 pb-2 text-base font-bold text-slate-900">{t("invoices.print.customerDetails")}</h4>
                <dl className="mt-3 grid gap-2 text-sm">
                  <CustomerField label={t("invoices.fields.customerName")} value={invoice.customerName} />
                  <CustomerField label={t("invoices.fields.customerPhone")} value={invoice.customerPhone || t("common.notAvailable")} />
                  <CustomerField label={t("invoices.fields.paymentStatus")} value={t(`jobCards.paymentStatus.${invoice.paymentStatus}`)} />
                </dl>
              </section>
              <section className="invoice-detail-card rounded-lg border border-slate-200 p-5">
                <h4 className="border-b border-slate-100 pb-2 text-base font-bold text-slate-900">{t("invoices.print.vehicleDetails")}</h4>
                <dl className="mt-3 grid gap-2 text-sm">
                  <CustomerField label={t("invoices.fields.vehicle")} value={invoice.vehicle} />
                  <CustomerField label={t("invoices.fields.plateNumber")} value={invoice.plateNumber} />
                  <CustomerField label={t("invoices.fields.jobCardNumber")} value={invoice.jobCardNumber} />
                </dl>
              </section>
            </div>

            <section className="invoice-work mt-6">
              <h4 className="text-base font-bold text-slate-900">{t("invoices.fields.workPerformed")}</h4>
              <p className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">{invoice.workPerformed}</p>
            </section>

            <section className="invoice-parts mt-6 overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-slate-900 text-xs font-bold uppercase text-white">
                  <tr>
                    <th className="w-[48%] px-4 py-3 text-start">{t("invoices.print.part")}</th>
                    <th className="w-[14%] px-4 py-3 text-center">{t("jobCards.parts.quantity")}</th>
                    <th className="w-[19%] px-4 py-3 text-center">{t("jobCards.parts.unitSellingPrice")}</th>
                    <th className="w-[19%] px-4 py-3 text-end">{t("jobCards.parts.lineTotal")}</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.parts.length > 0 ? invoice.parts.map((part) => (
                    <tr key={part.rowId} className="border-t border-slate-100">
                      <td className="px-4 py-3 align-top">
                        <p className="font-semibold text-slate-900">{part.itemName}</p>
                        {part.arabicItemName ? (
                          <p className="text-xs text-slate-500">{part.arabicItemName}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-center align-top">{part.quantity}</td>
                      <td className="px-4 py-3 text-center align-top">{formatMoney(part.unitSellingPrice)}</td>
                      <td className="px-4 py-3 text-end font-semibold align-top">{formatMoney(part.lineTotal)}</td>
                    </tr>
                  )) : (
                    <tr className="border-t border-slate-100">
                      <td colSpan={4} className="px-4 py-4 text-sm text-slate-500">{t("jobCards.parts.empty")}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </section>

            <div className="invoice-totals mt-6 grid gap-6 sm:grid-cols-[1fr_320px]">
              <div className="invoice-qr flex size-36 items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs font-bold uppercase text-slate-400">
                {t("invoices.print.qrPlaceholder")}
              </div>
              <dl className="invoice-total-card grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
                <div className="flex justify-between gap-4"><dt>{t("invoices.fields.laborCost")}</dt><dd className="font-semibold">{formatMoney(invoice.laborCost)}</dd></div>
                <div className="flex justify-between gap-4"><dt>{t("invoices.fields.partsCost")}</dt><dd className="font-semibold">{formatMoney(invoice.partsCost)}</dd></div>
                <div className="flex justify-between gap-4"><dt>{t("invoices.fields.discount")}</dt><dd className="font-semibold">{formatMoney(invoice.discount)}</dd></div>
                <div className="flex justify-between gap-4"><dt>{t("invoices.fields.taxAmount")}</dt><dd className="font-semibold">{formatMoney(invoice.taxAmount)}</dd></div>
                <div className="flex justify-between gap-4 border-y border-slate-300 py-3 text-xl font-black text-slate-950"><dt>{t("invoices.fields.grandTotal")}</dt><dd>{formatMoney(invoice.grandTotal)}</dd></div>
                <div className="flex justify-between gap-4"><dt>{t("invoices.fields.paidAmount")}</dt><dd className="font-semibold">{formatMoney(invoice.paidAmount)}</dd></div>
                <div className="flex justify-between gap-4 text-base font-black text-emerald-800"><dt>{t("invoices.fields.remainingBalance")}</dt><dd>{formatMoney(invoice.remainingBalance)}</dd></div>
              </dl>
            </div>
          </section>
        </div>
      </div>
    </div>
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
            {formatMoney(monthlyExpenseTotal)}
          </p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">{t("expenses.totals.weekly")}</p>
          <p className="mt-2 text-2xl font-black tracking-normal text-slate-950">
            {formatMoney(weeklyExpenseTotal)}
          </p>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">{t("expenses.totals.largest")}</p>
          <p className="mt-2 text-2xl font-black tracking-normal text-slate-950">
            {formatMoney(largestExpense)}
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
                {formatMoney(categoryTotal.total)}
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

        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label={t("expenses.fields.title")} value={expenseForm.title} onChange={(value) => onUpdateForm({ ...expenseForm, title: value })} placeholder={t("expenses.form.titlePlaceholder")} required />
            <FormField inputType="number" min="0" label={t("expenses.fields.amount")} value={expenseForm.amount} onChange={(value) => onUpdateForm({ ...expenseForm, amount: value })} placeholder={t("expenses.form.amountPlaceholder")} required />
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

        <div className="sticky bottom-0 flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-white p-5 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="h-11 rounded-md border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">{t("expenses.form.cancel")}</button>
          <button type="submit" className="h-11 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800">{t("expenses.form.save")}</button>
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
  onOpenModal: () => void;
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
          onClick={onOpenModal}
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
    const parsedValue = Number(value);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
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

        <div className="max-h-[70vh] flex-1 overflow-y-auto p-5">
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
                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                    <div className="hidden border-b border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold uppercase text-slate-500 lg:grid lg:grid-cols-[2.2fr_1.1fr_1fr_1fr_1fr_auto] lg:items-center lg:gap-3">
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
                      const showDuplicateWarning =
                        duplicateRowId === itemLine.rowId ||
                        (Boolean(itemLine.inventoryItemId) &&
                          selectedItemIds.filter(
                            (itemId) => itemId === itemLine.inventoryItemId,
                          ).length > 1);

                      return (
                        <div
                          key={itemLine.rowId}
                          className="border-b border-slate-100 p-3 transition last:border-b-0 hover:bg-slate-50/70"
                        >
                          <div className="grid gap-3 lg:grid-cols-[2.2fr_1.1fr_1fr_1fr_1fr_auto] lg:items-center">
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
                                value={itemLine.quantity}
                                onChange={(event) =>
                                  updateItemLine(itemLine.rowId, {
                                    quantity: event.target.value,
                                  })
                                }
                                placeholder={t("purchases.items.quantityPlaceholder")}
                                className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-center text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 lg:mt-0"
                              />
                            </label>

                            <label className="block">
                              <span className="text-sm font-medium text-slate-700 lg:sr-only">
                                {t("purchases.items.costPrice")}
                              </span>
                              <input
                                type="number"
                                min="0"
                                value={itemLine.costPrice}
                                onChange={(event) =>
                                  updateItemLine(itemLine.rowId, {
                                    costPrice: event.target.value,
                                  })
                                }
                                placeholder={t("purchases.items.costPlaceholder")}
                                className="mt-1 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-center text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600 lg:mt-0"
                              />
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
            className="h-11 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
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
          <div className="grid gap-4 p-5 sm:grid-cols-2">
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
  inputType = "text",
  label,
  min,
  onChange,
  placeholder,
  required,
  value,
}: {
  inputType?: string;
  label: string;
  min?: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={inputType}
        min={min}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="mt-1 h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-emerald-600"
      />
    </label>
  );
}
