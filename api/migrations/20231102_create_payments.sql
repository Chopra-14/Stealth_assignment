-- 20231102_create_payments.sql
-- Migration to create payments table for the Bill Splitter API

CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount REAL NOT NULL,
  email TEXT NOT NULL,
  external_reference TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING','COMPLETED','FAILED')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (external_reference)
);
