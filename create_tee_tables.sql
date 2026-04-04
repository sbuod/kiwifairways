-- Create course_tees table
CREATE TABLE IF NOT EXISTS course_tees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id TEXT NOT NULL REFERENCES course_info(id) ON DELETE CASCADE,
    tee_name TEXT NOT NULL,
    gender TEXT NOT NULL CHECK (gender IN ('Men', 'Women')),
    num_holes INTEGER NOT NULL CHECK (num_holes IN (9, 18)),
    slope_rating DECIMAL(5,1) NOT NULL CHECK (slope_rating >= 55 AND slope_rating <= 155),
    course_rating DECIMAL(4,1) NOT NULL CHECK (course_rating >= 50 AND course_rating <= 90),
    total_par INTEGER NOT NULL CHECK (total_par >= 27 AND total_par <= 90),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
    added_by_user_id UUID NOT NULL REFERENCES auth.users(id),
    approved_by_user_id UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create course_holes table
CREATE TABLE IF NOT EXISTS course_holes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tee_id UUID NOT NULL REFERENCES course_tees(id) ON DELETE CASCADE,
    hole_number INTEGER NOT NULL CHECK (hole_number >= 1 AND hole_number <= 18),
    par INTEGER NOT NULL CHECK (par >= 3 AND par <= 5),
    UNIQUE(tee_id, hole_number)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_course_tees_course_id ON course_tees(course_id);
CREATE INDEX IF NOT EXISTS idx_course_tees_status ON course_tees(status);
CREATE INDEX IF NOT EXISTS idx_course_tees_added_by ON course_tees(added_by_user_id);
CREATE INDEX IF NOT EXISTS idx_course_holes_tee_id ON course_holes(tee_id);

-- Enable Row Level Security
ALTER TABLE course_tees ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_holes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for course_tees
-- Allow all authenticated users to read approved tees
CREATE POLICY "Anyone can view approved tees"
    ON course_tees FOR SELECT
    USING (status = 'approved' OR auth.uid() = added_by_user_id);

-- Allow users to view their own pending tees
CREATE POLICY "Users can view their own pending tees"
    ON course_tees FOR SELECT
    USING (auth.uid() = added_by_user_id);

-- Allow authenticated users to insert tees
CREATE POLICY "Authenticated users can insert tees"
    ON course_tees FOR INSERT
    WITH CHECK (auth.uid() = added_by_user_id);

-- Allow users to update their own pending tees
CREATE POLICY "Users can update their own pending tees"
    ON course_tees FOR UPDATE
    USING (auth.uid() = added_by_user_id AND status = 'pending')
    WITH CHECK (auth.uid() = added_by_user_id);

-- Allow admin (dannyfitz@gmail.com) to approve tees
CREATE POLICY "Admin can approve tees"
    ON course_tees FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.email = 'dannyfitz@gmail.com'
        )
    );

-- RLS Policies for course_holes
-- Allow viewing holes if user can view the parent tee
CREATE POLICY "Users can view holes for accessible tees"
    ON course_holes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM course_tees
            WHERE course_tees.id = course_holes.tee_id
            AND (course_tees.status = 'approved' OR course_tees.added_by_user_id = auth.uid())
        )
    );

-- Allow inserting holes for tees user created
CREATE POLICY "Users can insert holes for their tees"
    ON course_holes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM course_tees
            WHERE course_tees.id = course_holes.tee_id
            AND course_tees.added_by_user_id = auth.uid()
        )
    );

-- Allow users to update holes for their own pending tees
CREATE POLICY "Users can update holes for their pending tees"
    ON course_holes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM course_tees
            WHERE course_tees.id = course_holes.tee_id
            AND course_tees.added_by_user_id = auth.uid()
            AND course_tees.status = 'pending'
        )
    );

-- Allow users to delete holes for their own pending tees
CREATE POLICY "Users can delete holes for their pending tees"
    ON course_holes FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM course_tees
            WHERE course_tees.id = course_holes.tee_id
            AND course_tees.added_by_user_id = auth.uid()
            AND course_tees.status = 'pending'
        )
    );
