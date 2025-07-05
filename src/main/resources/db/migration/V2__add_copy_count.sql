-- Add copyCount column to print_jobs table
ALTER TABLE print_jobs ADD COLUMN copy_count INT NOT NULL DEFAULT 1; 