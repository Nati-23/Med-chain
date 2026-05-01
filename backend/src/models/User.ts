import { supabase } from '../config/supabase.js';
import { logger } from '../utils/logger.js';

export type UserRole = 'doctor' | 'patient' | 'pharmacist' | 'admin';

export interface IUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  approved: boolean;
  walletAddress?: string;
  patientCode?: string;
  facility?: string;
  license?: string;
  createdAt: string;
  updatedAt: string;
}

export class User {
  static mapFromDb(data: any): IUser {
    if (!data) return data;
    return {
      ...data,
      walletAddress: data.wallet_address,
      patientCode: data.patient_code,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  static async findByEmail(email: string): Promise<IUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        logger.error('Database error finding user by email', { error, email });
        return null;
      }
      if (!data) return null;

      return this.mapFromDb(data);
    } catch (error) {
      logger.error('Critical error finding user by email', error);
      return null;
    }
  }

  static async findById(id: string): Promise<IUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error  !data) {
        return null;
      }

      return this.mapFromDb(data);
    } catch (error) {
      logger.error('Error finding user by ID', error);
      return null;
    }
  }

  static async findByPatientCode(patientCode: string): Promise<IUser | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('patient_code', patientCode)
        .single();

      if (error  !data) {
        return null;
      }

      return this.mapFromDb(data);
    } catch (error) {
      logger.error('Error finding user by patient code', error);
      return null;
    }
  }

  static async create(userData: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<IUser> {
    try {
      const dbData = {
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        approved: userData.approved,
        wallet_address: userData.walletAddress,
        patient_code: userData.patientCode,
        facility: userData.facility,
        license: userData.license,
      };

      const { data, error } = await supabase
        .from('users')
        .insert(dbData)
        .select()
        .single();

      if (error) {
        logger.error('Database error creating user', { error, email: userData.email });
        throw new Error(Failed to create user: ${error.message});
      }

      return this.mapFromDb(data);
    } catch (error) {
      logger.error('Error creating user', error);
      throw error;
    }
  }

  static async update(id: string, updates: Partial<IUser>): Promise<IUser> {
    try {
      const dbUpdates: any = { ...updates };
      if (updates.walletAddress !== undefined) {
        dbUpdates.wallet_address = updates.walletAddress;
        delete dbUpdates.walletAddress;
      }
      if (updates.patientCode !== undefined) {
        dbUpdates.patient_code = updates.patientCode;
        delete dbUpdates.patientCode;
      }
      if (updates.updatedAt !== undefined) {
        dbUpdates.updated_at = updates.updatedAt;
        delete dbUpdates.updatedAt;
      } else {
        dbUpdates.updated_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('users')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(Failed to update user: ${error.message});
      }

      return this.mapFromDb(data);
    } catch (error) {
      logger.error('Error updating user', error);
      throw error;
    }
  }
[5/1/2026 10:07 PM] Nati Rep: static async findMany(filter: { role?: UserRole; approved?: boolean } = {}): Promise<IUser[]> {
    try {
      let query = supabase.from('users').select('*');

      if (filter.role) {
        query = query.eq('role', filter.role);
      }
      if (filter.approved !== undefined) {
        query = query.eq('approved', filter.approved);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(Failed to fetch users: ${error.message});
      }

      return data.map((u: any) => this.mapFromDb(u));
    } catch (error) {
      logger.error('Error fetching users', error);
      throw error;
    }
  }

  static async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(Failed to delete user: ${error.message});
      }
    } catch (error) {
      logger.error('Error deleting user', error);
      throw error;
    }
  }

  static async count(filter: { role?: UserRole; approved?: boolean } = {}): Promise<number> {
    try {
      let query = supabase.from('users').select('*', { count: 'exact', head: true });

      if (filter.role) {
        query = query.eq('role', filter.role);
      }
      if (filter.approved !== undefined) {
        query = query.eq('approved', filter.approved);
      }

      const { count, error } = await query;

      if (error) {
        throw new Error(Failed to count users: ${error.message});
      }

      return count || 0;
    } catch (error) {
      logger.error('Error counting users', error);
      throw error;
    }
  }
}
