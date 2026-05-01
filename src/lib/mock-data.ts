// Shared mock data for all dashboards. Wire to Lovable Cloud later.
export type RxStatus = "active" | "expired" | "used";

export interface Prescription {
  id: string;
  drug: string;
  dosage: string;
  patientId: string;
  patientName: string;
  doctor: string;
  issuedAt: string; // ISO
  expiresAt: string; // ISO
  status: RxStatus;
  notes?: string;
  txHash: string;
  hash?: string; // Blockchain hash
  cid?: string; // IPFS CID
}

export const drugs = [
  "Amoxicillin 500mg",
  "Paracetamol 500mg",
  "Metformin 850mg",
  "Atorvastatin 20mg",
  "Omeprazole 20mg",
  "Salbutamol Inhaler",
  "Azithromycin 250mg",
  "Ibuprofen 400mg",
  "Losartan 50mg",
  "Ciprofloxacin 500mg",
];

const hash = (s: string) =>
  "0x" +
  Array.from(s)
    .reduce((a, c) => (a * 33 + c.charCodeAt(0)) >>> 0, 5381)
    .toString(16)
    .padStart(8, "0") +
  "…a91f";

export const mockPrescriptions: Prescription[] = [
  {
    id: "MC-2026-00184",
    drug: "Amoxicillin 500mg",
    dosage: "1 capsule · 3× daily · 7 days",
    patientId: "ETP-9921",
    patientName: "Selam Tadesse",
    doctor: "Dr. Hanna Bekele",
    issuedAt: "2026-04-22T09:14:00Z",
    expiresAt: "2026-05-06T09:14:00Z",
    status: "active",
    notes: "Take after meals.",
    txHash: hash("MC-2026-00184"),
  },
  {
    id: "MC-2026-00181",
    drug: "Metformin 850mg",
    dosage: "1 tablet · 2× daily",
    patientId: "ETP-9921",
    patientName: "Selam Tadesse",
    doctor: "Dr. Yonas Alemu",
    issuedAt: "2026-04-10T14:02:00Z",
    expiresAt: "2026-07-10T14:02:00Z",
    status: "active",
    txHash: hash("MC-2026-00181"),
  },
  {
    id: "MC-2026-00142",
    drug: "Azithromycin 250mg",
    dosage: "1 tablet · daily · 5 days",
    patientId: "ETP-7740",
    patientName: "Bereket Mengistu",
    doctor: "Dr. Hanna Bekele",
    issuedAt: "2026-03-12T08:00:00Z",
    expiresAt: "2026-03-26T08:00:00Z",
    status: "used",
    txHash: hash("MC-2026-00142"),
  },
  {
    id: "MC-2026-00118",
    drug: "Salbutamol Inhaler",
    dosage: "2 puffs as needed",
    patientId: "ETP-9921",
    patientName: "Selam Tadesse",
    doctor: "Dr. Hanna Bekele",
    issuedAt: "2026-02-20T11:30:00Z",
    expiresAt: "2026-04-20T11:30:00Z",
    status: "expired",
    txHash: hash("MC-2026-00118"),
  },
  {
    id: "MC-2026-00099",
    drug: "Atorvastatin 20mg",
    dosage: "1 tablet · nightly",
    patientId: "ETP-3310",
    patientName: "Marta Kebede",
    doctor: "Dr. Yonas Alemu",
    issuedAt: "2026-02-01T19:45:00Z",
    expiresAt: "2026-08-01T19:45:00Z",
    status: "active",
    txHash: hash("MC-2026-00099"),
  },
];

export const mockPractitioners = [
  { id: "DOC-014", name: "Dr. Hanna Bekele", role: "Doctor", facility: "Black Lion Hospital", status: "approved", joined: "2025-11-12" },
  { id: "DOC-022", name: "Dr. Dawit Girma", role: "Doctor", facility: "St. Paul's", status: "pending", joined: "2026-04-18" },
  { id: "DOC-019", name: "Dr. Yonas Alemu", role: "Doctor", facility: "Tikur Anbessa", status: "approved", joined: "2025-09-30" },
  { id: "PHM-007", name: "Kena Pharmacy", role: "Pharmacist", facility: "Bole Branch", status: "approved", joined: "2025-10-04" },
  { id: "PHM-013", name: "Genet Pharma", role: "Pharmacist", facility: "Piazza", status: "pending", joined: "2026-04-21" },
  { id: "PHM-021", name: "Addis MedPlus", role: "Pharmacist", facility: "CMC", status: "approved", joined: "2026-01-15" },
];

export const mockFraudAlerts = [
  { id: "FA-441", type: "Duplicate scan", entity: "MC-2026-00118", severity: "high", at: "2 min ago" },
  { id: "FA-440", type: "Expired dispense attempt", entity: "MC-2026-00099", severity: "medium", at: "18 min ago" },
  { id: "FA-438", type: "Unverified pharmacist", entity: "PHM-013", severity: "low", at: "1 hr ago" },
];
