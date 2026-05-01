import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

export type PrescriptionStatus = 'active' | 'expired' | 'used' | 'cancelled';

export interface IPrescription {
  id: string;
  prescriptionId: string;
  patientId: string;
  doctorId: string;
  drug: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
  status: PrescriptionStatus;
  issuedAt: string;
  expiresAt: string;
  txHash?: string;
  ipfsHash?: string;
  ipfsCid?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionWithUsers extends IPrescription {
  patient?: {
    id: string;
    name: string;
    email: string;
  };
  doctor?: {
    id: string;
    name: string;
    email: string;
  };
}

export class Prescription {
  static mapFromDb(data: any): IPrescription {
    if (!data) return data;
    return {
      ...data,
      prescriptionId: data.prescription_id,
      patientId: data.patient_id,
      doctorId: data.doctor_id,
      issuedAt: data.issued_at,
      expiresAt: data.expires_at,
      txHash: data.tx_hash,
      ipfsHash: data.ipfs_hash,
      ipfsCid: data.ipfs_cid,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  static async findById(id: string): Promise<IPrescription | null> {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('id', id)
        .single();

      if (error  !data) {
        return null;
      }

      return this.mapFromDb(data);
    } catch (error) {
      logger.error('Error finding prescription by ID', error);
      return null;
    }
  }

  static async findByPrescriptionId(prescriptionId: string): Promise<IPrescription | null> {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('prescription_id', prescriptionId)
        .single();

      if (error  !data) {
        return null;
      }

      return this.mapFromDb(data);
    } catch (error) {
      logger.error('Error finding prescription by prescription ID', error);
      return null;
    }
  }

  static async create(prescriptionData: Omit<IPrescription, 'id' | 'createdAt' | 'updatedAt'>): Promise<IPrescription> {
    try {
      const dbData = {
        prescription_id: prescriptionData.prescriptionId,
        patient_id: prescriptionData.patientId,
        doctor_id: prescriptionData.doctorId,
        drug: prescriptionData.drug,
        dosage: prescriptionData.dosage,
        frequency: prescriptionData.frequency,
        duration: prescriptionData.duration,
        notes: prescriptionData.notes,
        status: prescriptionData.status,
        issued_at: prescriptionData.issuedAt,
        expires_at: prescriptionData.expiresAt,
        tx_hash: prescriptionData.txHash,
        ipfs_hash: prescriptionData.ipfsHash,
        ipfs_cid: prescriptionData.ipfsCid,
      };

      const { data, error } = await supabase
        .from('prescriptions')
        .insert(dbData)
        .select()
        .single();

      if (error) {
        throw new Error(Failed to create prescription: ${error.message});
      }

      return this.mapFromDb(data);
    } catch (error) {
      logger.error('Error creating prescription', error);
      throw error;
    }
  }

  static async update(id: string, updates: Partial<IPrescription>): Promise<IPrescription> {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(Failed to update prescription: ${error.message});
      }

      return this.mapFromDb(data);
    } catch (error) {
      logger.error('Error updating prescription', error);
      throw error;
    }
  }
[5/1/2026 10:07 PM] Nati Rep: static async findMany(filter: {
    patientId?: string;
    doctorId?: string;
    status?: PrescriptionStatus;
  } = {}): Promise<PrescriptionWithUsers[]> {
    try {
      let query = supabase
        .from('prescriptions')
        .select(`
          *,
          patient:users!prescriptions_patient_id_fkey (
            id,
            name,
            email
          ),
          doctor:users!prescriptions_doctor_id_fkey (
            id,
            name,
            email
          )
        `);

      if (filter.patientId) {
        query = query.eq('patient_id', filter.patientId);
      }
      if (filter.doctorId) {
        query = query.eq('doctor_id', filter.doctorId);
      }
      if (filter.status) {
        query = query.eq('status', filter.status);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        throw new Error(Failed to fetch prescriptions: ${error.message});
      }

      return data.map((p: any) => ({
        ...this.mapFromDb(p),
        patient: p.patient,
        doctor: p.doctor
      })) as PrescriptionWithUsers[];
    } catch (error) {
      logger.error('Error fetching prescriptions', error);
      throw error;
    }
  }

  static async findByHash(hash: string): Promise<IPrescription | null> {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('ipfs_hash', hash)
        .single();

      if (error  !data) {
        return null;
      }

      return this.mapFromDb(data);
    } catch (error) {
      logger.error('Error finding prescription by hash', error);
      return null;
    }
  }

  static async findByCid(cid: string): Promise<IPrescription | null> {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('ipfs_cid', cid)
        .single();

      if (error  !data) {
        return null;
      }

      return this.mapFromDb(data);
    } catch (error) {
      logger.error('Error finding prescription by CID', error);
      return null;
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('prescriptions')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(Failed to delete prescription: ${error.message});
      }
    } catch (error) {
      logger.error('Error deleting prescription', error);
      throw error;
    }
  }

  static async count(filter: {
    patientId?: string;
    doctorId?: string;
    status?: PrescriptionStatus;
  } = {}): Promise<number> {
    try {
      let query = supabase.from('prescriptions').select('*', { count: 'exact', head: true });

      if (filter.patientId) {
        query = query.eq('patient_id', filter.patientId);
      }
      if (filter.doctorId) {
        query = query.eq('doctor_id', filter.doctorId);
      }
      if (filter.status) {
        query = query.eq('status', filter.status);
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(Failed to count prescriptions: ${error.message});
      }

      return count || 0;
    } catch (error) {
      logger.error('Error counting prescriptions', error);
      throw error;
    }
  }

  static async updateStatus(id: string, status: PrescriptionStatus): Promise<IPrescription> {
    return this.update(id, { status });
  }

  static async findActivePrescriptions(patientId: string): Promise<PrescriptionWithUsers[]> {
    return this.findMany({ 
      patientId, 
      status: 'active' 
    });
  }

  static async findExpiredPrescriptions(): Promise<IPrescription[]> {
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('status', 'active')
        .lt('expires_at', new Date().toISOString());

      if (error) {
        throw new Error(Failed to find expired prescriptions: ${error.message});
      }
[5/1/2026 10:07 PM] Nati Rep: return data.map((p: any) => this.mapFromDb(p));
    } catch (error) {
      logger.error('Error finding expired prescriptions', error);
      throw error;
    }
  }
}
