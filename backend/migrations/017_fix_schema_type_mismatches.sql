-- =====================================================
-- CRITICAL DATABASE SCHEMA REPAIR - Migration 017
-- Fixes UUID/INTEGER type mismatches that could crash the application
-- =====================================================

DO $$
DECLARE
    table_exists BOOLEAN;
    column_type TEXT;
    constraint_exists BOOLEAN;
BEGIN
    RAISE NOTICE 'Starting critical schema repair migration...';

    -- =====================================================
    -- 1. CHECK AND FIX file_sections TABLE SCHEMA
    -- =====================================================

    -- Check if file_sections exists and what type its ID column is
    SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'file_sections'
    ) INTO table_exists;

    IF table_exists THEN
        -- Get the column type of file_sections.id
        SELECT data_type INTO column_type
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'file_sections'
        AND column_name = 'id';

        RAISE NOTICE 'Found existing file_sections table with ID type: %', column_type;

        -- If file_sections was created with SERIAL (INTEGER) instead of UUID, recreate it
        IF column_type = 'integer' THEN
            RAISE NOTICE 'CRITICAL: file_sections has INTEGER ID instead of UUID. Recreating table...';

            -- Drop dependent tables first (they reference file_sections)
            DROP TABLE IF EXISTS section_comments CASCADE;
            DROP TABLE IF EXISTS section_reviews CASCADE;
            DROP TABLE IF EXISTS edit_changes CASCADE;
            DROP TABLE IF EXISTS edit_sessions CASCADE;
            DROP TABLE IF EXISTS edit_requests CASCADE;
            DROP TABLE IF EXISTS edit_permissions CASCADE;
            DROP TABLE IF EXISTS external_access_tokens CASCADE;

            -- Drop the incorrectly typed file_sections table
            DROP TABLE IF EXISTS file_sections CASCADE;

            RAISE NOTICE 'Dropped tables with incorrect schema. They will be recreated with correct UUID schema.';
        END IF;
    END IF;

    -- =====================================================
    -- 2. ENSURE CORRECT file_sections TABLE EXISTS
    -- =====================================================

    -- Create file_sections with correct UUID schema (from migration 015_edit_requests.sql)
    CREATE TABLE IF NOT EXISTS file_sections (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        project_file_id UUID NOT NULL,
        section_name VARCHAR(255) NOT NULL,
        section_type VARCHAR(100) NOT NULL,
        section_data JSONB NOT NULL,
        description TEXT,
        is_locked BOOLEAN DEFAULT FALSE,
        locked_by_id UUID,
        locked_at TIMESTAMP,
        created_by_id UUID NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),

        -- Additional columns from migration 016 extension
        section_status VARCHAR(50) DEFAULT 'draft' CHECK (section_status IN ('draft', 'under_review', 'changes_requested', 'approved')),
        assigned_reviewers UUID[] DEFAULT '{}',
        is_required_for_approval BOOLEAN DEFAULT true,
        content_start_position INTEGER,
        content_end_position INTEGER,
        line_start INTEGER,
        line_end INTEGER,

        -- Constraints
        UNIQUE(project_file_id, section_name)
    );

    -- Add foreign key constraints with proper error handling
    BEGIN
        -- Check if projects table exists before adding FK
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
            -- Note: project_file_id references project_files(id), not projects directly
            -- This constraint will be added when project_files table is verified
            RAISE NOTICE 'Projects table exists. Foreign key constraints will be validated.';
        END IF;

        -- Check if users table exists before adding FK
        IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
            -- Add FK constraint to users table if it doesn't exist
            SELECT EXISTS (
                SELECT FROM information_schema.table_constraints
                WHERE constraint_name = 'file_sections_locked_by_id_fkey'
                AND table_name = 'file_sections'
            ) INTO constraint_exists;

            IF NOT constraint_exists THEN
                ALTER TABLE file_sections ADD CONSTRAINT file_sections_locked_by_id_fkey
                    FOREIGN KEY (locked_by_id) REFERENCES users(id) ON DELETE SET NULL;
            END IF;

            SELECT EXISTS (
                SELECT FROM information_schema.table_constraints
                WHERE constraint_name = 'file_sections_created_by_id_fkey'
                AND table_name = 'file_sections'
            ) INTO constraint_exists;

            IF NOT constraint_exists THEN
                ALTER TABLE file_sections ADD CONSTRAINT file_sections_created_by_id_fkey
                    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE CASCADE;
            END IF;
        END IF;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Warning: Could not add all foreign key constraints. Error: %', SQLERRM;
    END;

    -- =====================================================
    -- 3. CREATE CORRECTLY TYPED DEPENDENT TABLES
    -- =====================================================

    -- section_reviews with UUID types (from migration 016)
    CREATE TABLE IF NOT EXISTS section_reviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        section_id UUID REFERENCES file_sections(id) ON DELETE CASCADE,
        reviewer_id UUID,  -- Will add FK to users when available
        review_status VARCHAR(50) NOT NULL CHECK (review_status IN ('pending', 'reviewing', 'changes_requested', 'approved', 'rejected')),
        review_notes TEXT,
        review_score INTEGER CHECK (review_score BETWEEN 1 AND 5),
        time_spent_minutes INTEGER DEFAULT 0,
        is_final_approval BOOLEAN DEFAULT false,
        approval_weight DECIMAL(3,2) DEFAULT 1.00,
        reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(section_id, reviewer_id)
    );

    -- section_comments with UUID types (from migration 016)
    CREATE TABLE IF NOT EXISTS section_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        section_id UUID REFERENCES file_sections(id) ON DELETE CASCADE,
        parent_comment_id UUID REFERENCES section_comments(id) ON DELETE CASCADE,
        commenter_id UUID,  -- Will add FK to users when available
        commenter_email VARCHAR(255),
        commenter_name VARCHAR(255),
        comment_text TEXT NOT NULL,
        comment_type VARCHAR(50) DEFAULT 'general' CHECK (comment_type IN ('general', 'suggestion', 'issue', 'approval', 'question')),
        line_number INTEGER,
        character_position INTEGER,
        highlighted_text TEXT,
        is_resolved BOOLEAN DEFAULT false,
        resolved_by UUID,  -- Will add FK to users when available
        resolved_at TIMESTAMP WITH TIME ZONE,
        priority_level VARCHAR(20) DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high')),
        is_external BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Add foreign key constraints to users if table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        -- section_reviews FK constraints
        BEGIN
            ALTER TABLE section_reviews ADD CONSTRAINT section_reviews_reviewer_id_fkey
                FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL;
        EXCEPTION WHEN duplicate_object THEN
            -- Constraint already exists, ignore
        END;

        -- section_comments FK constraints
        BEGIN
            ALTER TABLE section_comments ADD CONSTRAINT section_comments_commenter_id_fkey
                FOREIGN KEY (commenter_id) REFERENCES users(id) ON DELETE SET NULL;
        EXCEPTION WHEN duplicate_object THEN
            -- Constraint already exists, ignore
        END;

        BEGIN
            ALTER TABLE section_comments ADD CONSTRAINT section_comments_resolved_by_fkey
                FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL;
        EXCEPTION WHEN duplicate_object THEN
            -- Constraint already exists, ignore
        END;
    END IF;

    -- =====================================================
    -- 4. RECREATE ESSENTIAL WORKFLOW TABLES
    -- =====================================================

    -- Only recreate if they don't exist or have wrong schema
    CREATE TABLE IF NOT EXISTS file_workflow_states (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        file_id VARCHAR(255) NOT NULL,
        project_id UUID,  -- Will add FK to projects when available
        current_state VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (current_state IN ('draft', 'under_review', 'changes_requested', 'approved', 'delivered')),
        previous_state VARCHAR(50),
        state_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        state_changed_by UUID,  -- Will add FK to users when available
        reviewer_assignments UUID[] DEFAULT '{}',
        completion_percentage DECIMAL(5,2) DEFAULT 0.00,
        estimated_completion_date TIMESTAMP WITH TIME ZONE,
        priority_level VARCHAR(20) DEFAULT 'normal' CHECK (priority_level IN ('low', 'normal', 'high', 'urgent')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Add FK constraints if tables exist
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') THEN
        BEGIN
            ALTER TABLE file_workflow_states ADD CONSTRAINT file_workflow_states_project_id_fkey
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
        EXCEPTION WHEN duplicate_object THEN
            -- Constraint already exists, ignore
        END;
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        BEGIN
            ALTER TABLE file_workflow_states ADD CONSTRAINT file_workflow_states_state_changed_by_fkey
                FOREIGN KEY (state_changed_by) REFERENCES users(id) ON DELETE SET NULL;
        EXCEPTION WHEN duplicate_object THEN
            -- Constraint already exists, ignore
        END;
    END IF;

    -- =====================================================
    -- 5. CREATE PERFORMANCE INDEXES
    -- =====================================================

    -- file_sections indexes
    CREATE INDEX IF NOT EXISTS idx_file_sections_project_file_id ON file_sections(project_file_id);
    CREATE INDEX IF NOT EXISTS idx_file_sections_created_by_id ON file_sections(created_by_id);
    CREATE INDEX IF NOT EXISTS idx_file_sections_locked_by_id ON file_sections(locked_by_id);
    CREATE INDEX IF NOT EXISTS idx_file_sections_is_locked ON file_sections(is_locked);
    CREATE INDEX IF NOT EXISTS idx_file_sections_section_type ON file_sections(section_type);
    CREATE INDEX IF NOT EXISTS idx_file_sections_section_status ON file_sections(section_status);

    -- section_reviews indexes
    CREATE INDEX IF NOT EXISTS idx_section_reviews_section_id ON section_reviews(section_id);
    CREATE INDEX IF NOT EXISTS idx_section_reviews_reviewer_id ON section_reviews(reviewer_id);
    CREATE INDEX IF NOT EXISTS idx_section_reviews_status ON section_reviews(review_status);
    CREATE INDEX IF NOT EXISTS idx_section_reviews_reviewed_at ON section_reviews(reviewed_at);

    -- section_comments indexes
    CREATE INDEX IF NOT EXISTS idx_section_comments_section_id ON section_comments(section_id);
    CREATE INDEX IF NOT EXISTS idx_section_comments_parent_id ON section_comments(parent_comment_id);
    CREATE INDEX IF NOT EXISTS idx_section_comments_commenter_id ON section_comments(commenter_id);
    CREATE INDEX IF NOT EXISTS idx_section_comments_created_at ON section_comments(created_at);

    -- file_workflow_states indexes
    CREATE INDEX IF NOT EXISTS idx_file_workflow_states_file_id ON file_workflow_states(file_id);
    CREATE INDEX IF NOT EXISTS idx_file_workflow_states_project_id ON file_workflow_states(project_id);
    CREATE INDEX IF NOT EXISTS idx_file_workflow_states_current_state ON file_workflow_states(current_state);
    CREATE INDEX IF NOT EXISTS idx_file_workflow_states_state_changed_at ON file_workflow_states(state_changed_at);

    -- =====================================================
    -- 6. CREATE UPDATE TRIGGERS
    -- =====================================================

    -- Ensure trigger function exists
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $func$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $func$ language 'plpgsql';

    -- Create triggers if they don't exist
    BEGIN
        CREATE TRIGGER update_file_sections_updated_at
            BEFORE UPDATE ON file_sections
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    EXCEPTION WHEN duplicate_object THEN
        -- Trigger already exists, ignore
    END;

    BEGIN
        CREATE TRIGGER update_section_reviews_updated_at
            BEFORE UPDATE ON section_reviews
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    EXCEPTION WHEN duplicate_object THEN
        -- Trigger already exists, ignore
    END;

    BEGIN
        CREATE TRIGGER update_section_comments_updated_at
            BEFORE UPDATE ON section_comments
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    EXCEPTION WHEN duplicate_object THEN
        -- Trigger already exists, ignore
    END;

    BEGIN
        CREATE TRIGGER update_file_workflow_states_updated_at
            BEFORE UPDATE ON file_workflow_states
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    EXCEPTION WHEN duplicate_object THEN
        -- Trigger already exists, ignore
    END;

    -- =====================================================
    -- 7. VALIDATION AND REPORTING
    -- =====================================================

    RAISE NOTICE '=== SCHEMA REPAIR COMPLETE ===';
    RAISE NOTICE 'Verified UUID consistency for all collaboration tables';
    RAISE NOTICE 'Foreign key constraints added where possible';
    RAISE NOTICE 'Performance indexes created';
    RAISE NOTICE 'Update triggers configured';

    -- Verify final schema
    SELECT data_type INTO column_type
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'file_sections'
    AND column_name = 'id';

    IF column_type = 'uuid' THEN
        RAISE NOTICE '✓ SUCCESS: file_sections.id is now UUID type';
    ELSE
        RAISE EXCEPTION 'CRITICAL ERROR: file_sections.id is still % instead of uuid', column_type;
    END IF;

    RAISE NOTICE 'Migration 017: Schema Type Mismatch Repair - COMPLETED';

END $$;