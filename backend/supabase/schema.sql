-- MedChain Ethiopia Supabase Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('doctor', 'patient', 'pharmacist', 'admin')),
  approved BOOLEAN DEFAULT false,
  wallet_address VARCHAR(255) UNIQUE,
  patient_code VARCHAR(50) UNIQUE,
  facility VARCHAR(255),
  license VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  prescription_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., "MC-2026-00184"
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  drug VARCHAR(255) NOT NULL,
  dosage VARCHAR(255) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  duration VARCHAR(100) NOT NULL,
  notes TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'used', 'cancelled')),
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  tx_hash VARCHAR(255),
  ipfs_hash VARCHAR(255),
  ipfs_cid VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Verification logs table
CREATE TABLE IF NOT EXISTS verification_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  pharmacist_id UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dispense logs table
CREATE TABLE IF NOT EXISTS dispense_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  pharmacist_id UUID REFERENCES users(id) ON DELETE SET NULL,
  dispensed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fraud alerts table
CREATE TABLE IF NOT EXISTS fraud_alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  alert_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., "FA-441"
  type VARCHAR(100) NOT NULL,
  entity VARCHAR(255) NOT NULL,
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_patient_code ON users(patient_code);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_prescription_id ON prescriptions(prescription_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_prescription_id ON verification_logs(prescription_id);
CREATE INDEX IF NOT EXISTS idx_dispense_logs_prescription_id ON dispense_logs(prescription_id);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_severity ON fraud_alerts(severity);

-- Functions for getting user role (helper for RLS)
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT role FROM users WHERE id = auth.uid()),
    'anonymous'
  );
END;
$$;

-- RLS (Row Level Security) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispense_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_alerts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data (except admins)
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid()::text = id::text);

-- Prescription access policies
CREATE POLICY "Doctors can view their own prescriptions" ON prescriptions FOR SELECT USING (
  get_user_role() = 'doctor' AND doctor_id = auth.uid()
);
CREATE POLICY "Patients can view their own prescriptions" ON prescriptions FOR SELECT USING (
  get_user_role() = 'patient' AND patient_id = auth.uid()
);
CREATE POLICY "Pharmacists can view all prescriptions" ON prescriptions FOR SELECT USING (get_user_role() = 'pharmacist');
CREATE POLICY "Admins can view all prescriptions" ON prescriptions FOR SELECT USING (get_user_role() = 'admin');

-- Doctors can create prescriptions
CREATE POLICY "Doctors can create prescriptions" ON prescriptions FOR INSERT WITH CHECK (
  get_user_role() = 'doctor' AND doctor_id = auth.uid()
);
