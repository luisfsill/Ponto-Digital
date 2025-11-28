-- Add schedule fields to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS works_saturday boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS part_time boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS work_start_time time,
ADD COLUMN IF NOT EXISTS work_end_time time;
