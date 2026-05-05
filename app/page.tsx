"use client";

import { useMemo, useState, type FormEvent } from "react";
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
  paymentStatus: PaymentStatus;
  notes: string;
  archived: boolean;
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
  paymentStatus: PaymentStatus;
  notes: string;
};

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
    paymentStatus: "unpaid",
    notes: "Brake inspection and oil service",
    archived: false,
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
    paymentStatus: "paid",
    notes: "Regular service",
    archived: false,
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
    paymentStatus: "partial",
    notes: "Suspension repair",
    archived: false,
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
    paymentStatus: "paid",
    notes: "AC diagnosis",
    archived: false,
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
    paymentStatus: "unpaid",
    notes: "Transmission check",
    archived: false,
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
    paymentStatus: "paid",
    notes: "Fleet van service",
    archived: false,
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
  paymentStatus: "unpaid",
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
  const [toastMessage, setToastMessage] = useState<ToastMessage | null>(null);

  const isArabic = locale === "ar";
  const numberLocale = isArabic ? "ar-SA" : "en-SA";

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

  const getVehicleJobs = (vehicleId: number) => {
    return jobCards.filter((jobCard) => jobCard.vehicleId === vehicleId);
  };

  const getLatestJob = (vehicleId: number) => {
    return getVehicleJobs(vehicleId).toSorted((firstJob, secondJob) =>
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
    setJobCardForm({
      ...emptyJobCardForm,
      vehicleId: String(vehicle.id),
      jobNumber: `JC-${Date.now().toString().slice(-6)}`,
    });
    setEditingJobCardId(null);
    setActiveSection("jobCards");
    setIsJobCardModalOpen(true);
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
        paymentStatus: jobCard.paymentStatus,
        notes: jobCard.notes,
      });
    } else {
      setEditingJobCardId(null);
      setJobCardForm({
        ...emptyJobCardForm,
        jobNumber: `JC-${Date.now().toString().slice(-6)}`,
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

    const selectedCustomer = customers.find(
      (customer) => customer.id === selectedVehicle.customerId,
    );

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
      partsCost: parsePositiveNumber(jobCardForm.partsCost),
      paymentStatus: jobCardForm.paymentStatus,
      notes: jobCardForm.notes.trim(),
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
      closeJobCardModal();
      return;
    }

    const nextJobCard: JobCard = {
      id: Date.now(),
      ...jobCardValues,
      archived: jobCardValues.status === "cancelled",
    };

    setJobCards((currentJobCards) => [nextJobCard, ...currentJobCards]);
    closeJobCardModal();
  };

  const setJobCardArchived = (jobCardId: number, archived: boolean) => {
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

  const sectionHeaderKeys: Record<SectionKey, { title: string; subtitle: string }> = {
    dashboard: { title: "topbar.title", subtitle: "topbar.subtitle" },
    customers: { title: "customers.title", subtitle: "customers.subtitle" },
    vehicles: { title: "vehicles.title", subtitle: "vehicles.subtitle" },
    jobCards: { title: "jobCards.title", subtitle: "jobCards.subtitle" },
    inventory: { title: "topbar.title", subtitle: "topbar.subtitle" },
    purchases: { title: "topbar.title", subtitle: "topbar.subtitle" },
    expenses: { title: "topbar.title", subtitle: "topbar.subtitle" },
    invoices: { title: "topbar.title", subtitle: "topbar.subtitle" },
    reports: { title: "topbar.title", subtitle: "topbar.subtitle" },
    settings: { title: "topbar.title", subtitle: "topbar.subtitle" },
  };

  const topbarTitleKey = sectionHeaderKeys[activeSection].title;
  const topbarSubtitleKey = sectionHeaderKeys[activeSection].subtitle;

  return (
    <main dir={dir} className="min-h-screen bg-slate-100 text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 shrink-0 border-s border-slate-200 bg-white px-4 py-5 shadow-sm md:flex md:flex-col">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-emerald-700 text-sm font-bold text-white">
              {t("app.shortName")}
            </div>
            <div>
              <p className="text-base font-semibold">{t("app.name")}</p>
              <p className="text-xs text-slate-500">{t("app.location")}</p>
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
                  getLatestJob={getLatestJob}
                  getVehicleJobs={getVehicleJobs}
                  onStartJob={startJobForVehicle}
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
                vehicles={vehicles}
              />
            ) : (
              <DashboardSection formatCardValue={formatCardValue} t={t} />
            )}
          </div>
        </section>
      </div>
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
        className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-lg bg-white shadow-xl sm:max-w-lg"
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
  getLatestJob,
  getVehicleJobs,
  onStartJob,
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
  getLatestJob: (vehicleId: number) => JobCard | undefined;
  getVehicleJobs: (vehicleId: number) => JobCard[];
  onStartJob: (vehicle: Vehicle) => void;
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
            const vehicleJobs = getVehicleJobs(vehicle.id);
            const latestJob = getLatestJob(vehicle.id);

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
                    <VehicleStatusBadge status={latestJob?.status ?? "active"} t={t} />
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
                    value={formatNumber(vehicleJobs.length)}
                  />
                  <CustomerField
                    label={t("vehicles.fields.lastServiceDate")}
                    value={latestJob ? formatDate(latestJob.date) : t("common.notAvailable")}
                  />
                  <CustomerField
                    label={t("vehicles.fields.currentStatus")}
                    value={latestJob ? t(`vehicles.status.${latestJob.status}`) : t("common.notAvailable")}
                  />
                  <CustomerField
                    label={t("vehicles.fields.lastWorkPerformed")}
                    value={latestJob?.workPerformed || t("common.notAvailable")}
                  />
                </dl>
              </section>

              <div className="mt-5 flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                {!vehicle.archived ? (
                  <button
                    type="button"
                    onClick={() => onStartJob(vehicle)}
                    className="h-10 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white transition hover:bg-emerald-800"
                  >
                    {t("vehicles.startJob")}
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
    completed: "bg-slate-100 text-slate-700",
    cancelled: "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusClasses[status]}`}
    >
      {t(`vehicles.status.${status}`)}
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
                    <CustomerField
                      label={t("jobCards.fields.paymentStatus")}
                      value={t(`jobCards.paymentStatus.${jobCard.paymentStatus}`)}
                    />
                    <CustomerField
                      label={t("jobCards.fields.totalAmount")}
                      value={formatMoney(jobCard.laborCost + jobCard.partsCost)}
                    />
                  </dl>
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
                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">
                    {t("jobCards.fields.totalAmount")}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-slate-950">
                    {formatMoney(jobCard.laborCost + jobCard.partsCost)}
                  </p>
                </div>
                <span className="w-fit rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
                  {t(`jobCards.paymentStatus.${jobCard.paymentStatus}`)}
                </span>
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
  isEditing,
  jobCardForm,
  onClose,
  onSave,
  onUpdateForm,
  t,
  vehicles,
}: {
  isEditing: boolean;
  jobCardForm: JobCardForm;
  onClose: () => void;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateForm: (value: JobCardForm) => void;
  t: (key: string) => string;
  vehicles: Vehicle[];
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/40 px-4 py-4">
      <form
        onSubmit={onSave}
        className="flex max-h-[90vh] w-full flex-col overflow-hidden rounded-lg bg-white shadow-xl sm:max-w-lg"
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

            <FormField
              inputType="number"
              label={t("jobCards.fields.partsCost")}
              min="0"
              value={jobCardForm.partsCost}
              onChange={(value) => onUpdateForm({ ...jobCardForm, partsCost: value })}
              placeholder={t("jobCards.form.partsCostPlaceholder")}
              required
            />

            <CustomerField
              label={t("jobCards.fields.totalAmount")}
              value={new Intl.NumberFormat(undefined, {
                style: "currency",
                currency: "SAR",
                maximumFractionDigits: 0,
              }).format(Number(jobCardForm.laborCost || 0) + Number(jobCardForm.partsCost || 0))}
            />

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
