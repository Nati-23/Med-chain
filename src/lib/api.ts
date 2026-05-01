/**
 * MedChain Ethiopia — Real API Service Integration
 * This file replaces the previous mock implementation with real fetch() calls to the backend.
 */

import type { Prescription, RxStatus } from "./mock-data";

// Re-export types for components
export type { Prescription, RxStatus };

export type Role = "Doctor" | "Patient" | "Pharmacist" | "Admin";

export interface User {
  id: string;
  name: string;
  role: Role;
  facility: string;
  email: string;
  avatarInitials: string;
  patientId?: string;
}

export interface VerificationResult {
  prescription: Prescription | null;
  status: "valid" | "expired" | "used" | "not_found";
  verifiedAt: string;
  verifiedBy: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}

const ROLE_ROUTES: Record<Role, string> = {
  Doctor: "/doctor",
  Patient: "/patient",
  Pharmacist: "/pharmacist",
  Admin: "/admin",
};

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ── Helpers ───────────────────────────────────────────────────────────────────

const getToken = () => {
  const sessionData = sessionStorage.getItem("medchain_session");
  if (!sessionData) return null;
  try {
    const session = JSON.parse(sessionData) as AuthSession;
    return session.token;
  } catch {
    return null;
  }
};

// Enhanced error handling
const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: { ...headers, ...options.headers },
    });
    
    // Handle non-JSON responses
    const contentType = res.headers.get("content-type");
    let data;
    if (contentType && contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = { message: text };
    }
    
    if (!res.ok) {
      // Log detailed error for debugging
      console.error(`API Error ${res.status} on ${endpoint}:`, data);
      
      // Handle specific error cases
      if (res.status === 401) {
        if (endpoint === "/auth/login") {
          throw new Error("Invalid email or password. Please try again.");
        }
        // Clear invalid session
        sessionStorage.removeItem("medchain_session");
        window.location.href = "/login";
        throw new Error("Session expired. Please login again.");
      }
      if (res.status === 403) {
        throw new Error("Access denied. Insufficient permissions.");
      }
      if (res.status === 404) {
        throw new Error("Resource not found.");
      }
      if (res.status === 429) {
        throw new Error("Too many requests. Please try again later.");
      }
      
      // For 400 errors, show detailed validation errors
      if (res.status === 400 && data.details) {
        const validationErrors = data.details.map((d: any) => `${d.field}: ${d.message}`).join(', ');
        throw new Error(`Validation failed: ${validationErrors}`);
      }
      
      throw new Error(data.error || data.message || `API request failed: ${res.status}`);
    }
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Network error. Please check your connection.");
  }
};

// ── Auth API ──────────────────────────────────────────────────────────────────

export const authApi = {
  login: async (email: string, password: string): Promise<{ session: AuthSession; redirectTo: string }> => {
    const data = await fetchApi("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    
    const u = data.user;
    const r = u.role.charAt(0).toUpperCase() + u.role.slice(1) as Role;
    
    const user: User = {
      id: u.id || u._id,
      name: u.name,
      role: r,
      facility: u.facility || "Hospital",
      email: u.email,
      avatarInitials: u.name.substring(0, 2).toUpperCase(),
      patientId: r === "Patient" ? (u.patientCode || u.id || u._id) : undefined,
    };
    
    const session: AuthSession = {
      user,
      token: data.token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };
    
    return { session, redirectTo: ROLE_ROUTES[user.role] };
  },

  logout: async (): Promise<void> => {
    // Only local cleanup required since JWT is stateless
  },
  
  register: async (payload: {
    name: string;
    email: string;
    password: string;
    role: string;
    license?: string;
    facility?: string;
    walletAddress?: string;
  }): Promise<{ message: string; user: any; token?: string }> => {
    const data = await fetchApi("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        role: payload.role.toLowerCase(),
      }),
    });
    return data;
  },
};

// ── Prescription API ──────────────────────────────────────────────────────────

export const prescriptionApi = {
  list: async (opts?: { patientId?: string; doctor?: string; status?: RxStatus }): Promise<Prescription[]> => {
    const data = await fetchApi("/prescriptions");
    let items = data.prescriptions || [];
    
    // Map backend model to frontend UI model with expiry logic
    items = items.map((p: any) => {
      const expiryDate = new Date(p.expiryDate);
      const now = new Date();
      let status: RxStatus = p.status || "active";
      
      // Override status to EXPIRED if current date > expiryDate
      if (status === "active" && now > expiryDate) {
        status = "expired";
      }

      return {
        id: p.id || p._id,
        drug: p.drugs?.[0]?.name || "Unknown Drug",
        dosage: p.drugs?.[0]?.dosage || "-",
        patientId: p.patient?.patientCode || p.patient?._id || p.patientId || "—",
        patientName: p.patient?.name || "—",
        doctor: p.doctor?.name || "Doctor",
        issuedAt: p.createdAt || new Date().toISOString(),
        expiresAt: p.expiryDate || new Date().toISOString(),
        status,
        notes: p.notes,
        txHash: p.txHash || p.hash || "0x...",
        cid: p.cid,
        hash: p.hash,
      };
    });
    
    if (opts?.status) items = items.filter((r: any) => r.status === opts.status);
    return items;
  },

  create: async (payload: {
    patientId: string;
    drug: string;
    dosage: string;
    expiresAt: string;
    notes?: string;
    doctor: string;
  }): Promise<Prescription> => {
    // Convert date to ISO format if needed
    const expiryDate = new Date(payload.expiresAt).toISOString();
    
    const data = await fetchApi("/prescriptions", {
      method: "POST",
      body: JSON.stringify({
        patientId: payload.patientId, 
        drugs: [
          {
            name: payload.drug,
            dosage: payload.dosage,
            frequency: "Three times daily",
            duration: "7 days"
          }
        ],
        expiryDate: expiryDate,
        notes: payload.notes
      })
    });
    
    const p = data.prescription;
    return {
      id: p.id || p._id,
      drug: payload.drug,
      dosage: payload.dosage,
      patientId: payload.patientId,
      patientName: "—",
      doctor: payload.doctor,
      issuedAt: new Date().toISOString(),
      expiresAt: p.expiryDate,
      status: p.status || "active",
      notes: payload.notes,
      txHash: p.txHash,
      cid: p.cid,
      hash: p.hash,
    };
  },

  verify: async (id: string): Promise<VerificationResult> => {
    // 1. Fetch full details to get the IPFS CID and Blockchain Hash
    const detailsData = await fetchApi(`/prescriptions/${id}`);
    const p = detailsData.prescription;
    
    // 2. Perform the actual cryptographic verify against Base blockchain
    const data = await fetchApi("/prescriptions/verify", {
      method: "POST",
      body: JSON.stringify({
        hash: p.hash,
        cid: p.cid
      })
    });
    
    const mappedP: Prescription = {
      id: p.id || p._id,
      drug: p.drugs?.[0]?.name || "-",
      dosage: p.drugs?.[0]?.dosage || "-",
      patientId: p.patient?.id || p.patient?._id || "-",
      patientName: p.patient?.name || "-",
      doctor: p.doctor?.name || "-",
      issuedAt: p.createdAt || new Date().toISOString(),
      expiresAt: p.expiryDate || new Date().toISOString(),
      status: p.status || "active",
      notes: p.notes,
      txHash: p.txHash || p.hash,
      hash: p.hash,
      cid: p.cid,
    };

    let mappedStatus: "valid" | "expired" | "used" | "not_found" = "valid";
    if (data.reason === "USED") mappedStatus = "used";
    else if (data.reason === "EXPIRED") mappedStatus = "expired";
    else if (data.reason === "INVALID") mappedStatus = "not_found";

    return {
      prescription: mappedP,
      status: mappedStatus,
      verifiedAt: new Date().toISOString(),
      verifiedBy: "Pharmacist",
    };
  },

  verifyByHashAndCid: async ({ hash, cid }: { hash: string; cid: string }): Promise<VerificationResult> => {
    // Perform the actual cryptographic verify against Base blockchain
    const data = await fetchApi("/prescriptions/verify", {
      method: "POST",
      body: JSON.stringify({ hash, cid })
    });
    
    let mappedStatus: "valid" | "expired" | "used" | "not_found" = "valid";
    
    const p = data.prescription;
    const now = new Date();
    const expiryDate = new Date(p.expiryDate);
    
    if (data.reason === "USED" || p.status === "used") mappedStatus = "used";
    else if (data.reason === "EXPIRED" || p.status === "expired" || now > expiryDate) mappedStatus = "expired";
    else if (data.reason === "INVALID") mappedStatus = "not_found";
    else if (data.reason === "IPFS_ERROR") mappedStatus = "not_found";

    const mappedP: Prescription = {
      id: p.id || p._id || "-",
      drug: p.drugs?.[0]?.name || "-",
      dosage: p.drugs?.[0]?.dosage || "-",
      patientId: p.patient?.id || p.patient?._id || p.patientId || "-",
      patientName: p.patient?.name || p.patientName || "-",
      doctor: p.doctor?.name || "-",
      issuedAt: p.createdAt || new Date().toISOString(),
      expiresAt: p.expiryDate || new Date().toISOString(),
      status: mappedStatus === "used" ? "used" : (mappedStatus === "expired" ? "expired" : "active"),
      notes: p.notes,
      txHash: p.txHash || p.hash,
      hash: p.hash,
      cid: p.cid,
    };

    return {
      prescription: mappedP,
      status: mappedStatus,
      verifiedAt: new Date().toISOString(),
      verifiedBy: "System",
    };
  },

  dispense: async (id: string): Promise<Prescription> => {
    const detailsData = await fetchApi(`/prescriptions/${id}`);
    const p = detailsData.prescription;

    const data = await fetchApi("/prescriptions/dispense", {
      method: "POST",
      body: JSON.stringify({
        prescriptionId: id,
        hash: p.hash
      })
    });
    
    return {
      id: p.id || p._id,
      drug: p.drugs?.[0]?.name || "-",
      dosage: p.drugs?.[0]?.dosage || "-",
      patientId: p.patient?.id || "-",
      patientName: p.patient?.name || "-",
      doctor: p.doctor?.name || "-",
      issuedAt: p.createdAt || new Date().toISOString(),
      expiresAt: p.expiryDate || new Date().toISOString(),
      status: "used",
      notes: p.notes,
      txHash: data.dispensed.blockchainTx || p.txHash || p.hash,
    };
  },
};

// ── Admin API ─────────────────────────────────────────────────────────────────

export const adminApi = {
  listPractitioners: async () => {
    const data = await fetchApi("/admin/users");
    return (data.users || []).map((u: any) => ({
      id: u.id || u._id,
      name: u.name,
      role: u.role.charAt(0).toUpperCase() + u.role.slice(1),
      facility: u.facility || "Hospital",
      joined: new Date(u.createdAt).toLocaleDateString(),
      status: u.approved ? "approved" : "pending"
    }));
  },
  
  approve: async (id: string): Promise<void> => {
    await fetchApi("/admin/users/approve", {
      method: "POST",
      body: JSON.stringify({ userId: id, approved: true })
    });
  },
  
  reject: async (id: string): Promise<void> => {
    await fetchApi("/admin/users/approve", {
      method: "POST",
      body: JSON.stringify({ userId: id, approved: false })
    });
  },
  
  listFraudAlerts: async () => {
    return []; 
  },
  
  getStats: async () => {
    const data = await fetchApi("/admin/stats");
    return {
      doctors: data.users?.byRole?.find((r:any) => r._id === "doctor")?.count || 0,
      pharmacists: data.users?.byRole?.find((r:any) => r._id === "pharmacist")?.count || 0,
      scriptsToday: data.prescriptions?.active || 0,
      fraudAlerts: 0,
    };
  },
};

export { ROLE_ROUTES };
