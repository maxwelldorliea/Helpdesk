CREATE TABLE "Team" (
    "name" VARCHAR(140) NOT NULL PRIMARY KEY,
    "description" TEXT,
    "escalation_team" VARCHAR(140),
    "last_assigned_agent" UUID,
    "creation" TIMESTAMPTZ DEFAULT NOW(),
    "modified" TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_team_last_agent
        FOREIGN KEY ("last_assigned_agent") REFERENCES auth.users (id),
    CONSTRAINT fk_team_escalation
        FOREIGN KEY ("escalation_team") REFERENCES "Team" (name)
);

CREATE TABLE "Agent_Membership" (
    "id" SERIAL PRIMARY KEY,
    "user_id" UUID NOT NULL,
    "team" VARCHAR(140) NOT NULL,
    "creation" TIMESTAMPTZ DEFAULT NOW(),
    "modified" TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_membership_user
        FOREIGN KEY ("user_id") REFERENCES auth.users (id),
    CONSTRAINT fk_membership_team
        FOREIGN KEY ("team") REFERENCES "Team" (name),
    CONSTRAINT uq_user_team UNIQUE ("user_id", "team")
);

CREATE TABLE "Priority" (
    "name" VARCHAR(140) NOT NULL PRIMARY KEY,
    "description" TEXT,
    "color_code" VARCHAR(7),
    "sort_order" INTEGER,
    "creation" TIMESTAMPTZ DEFAULT NOW(),
    "modified" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "SLA" (
    "name" VARCHAR(140) NOT NULL PRIMARY KEY,
    "priority_name" VARCHAR(140) NOT NULL,
    "description" TEXT,
    "first_response_time" INTERVAL,
    "resolution_time" INTERVAL,
    "applies_to_contract_group" VARCHAR(140),
    "creation" TIMESTAMPTZ DEFAULT NOW(),
    "modified" TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_sla_priority
        FOREIGN KEY ("priority_name") REFERENCES "Priority" (name)
);

CREATE TABLE "Role" (
    "user_id" UUID NOT NULL PRIMARY KEY,
    "name" VARCHAR(50) NOT NULL,
    "creation" TIMESTAMPTZ DEFAULT NOW(),
    "modified" TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_user_roles_user
        FOREIGN KEY ("user_id") REFERENCES auth.users (id) ON DELETE CASCADE,
    CONSTRAINT check_valid_role
        CHECK ("name" IN ('System Manager', 'Agent', 'Customer'))
);

CREATE TABLE "Customer" (
    "name" VARCHAR(140) NOT NULL PRIMARY KEY,
    "full_name" VARCHAR(255),
    "email" VARCHAR(255) UNIQUE,
    "phone" VARCHAR(50) UNIQUE,
    "creation" TIMESTAMPTZ DEFAULT NOW(),
    "modified" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Channel" (
    "name" VARCHAR(50) PRIMARY KEY,
    "description" TEXT,
    "icon_slug" VARCHAR(50),
    "is_active" BOOLEAN DEFAULT TRUE,
    "creation" TIMESTAMPTZ DEFAULT NOW(),
    "modified" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "Customer_Handle" (
    "id" SERIAL PRIMARY KEY,
    "customer" VARCHAR(140) NOT NULL,
    "channel" VARCHAR(50) NOT NULL,
    "handle" VARCHAR(255) NOT NULL,
    "creation" TIMESTAMPTZ DEFAULT NOW(),
    "modified" TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_handle_customer
        FOREIGN KEY ("customer") REFERENCES "Customer" ("name") ON DELETE CASCADE,
    CONSTRAINT fk_handle_channel
        FOREIGN KEY ("channel") REFERENCES "Channel" ("name"),
    CONSTRAINT uq_channel_handle UNIQUE ("channel", "handle")
);

CREATE TABLE "Ticket" (
    "name" VARCHAR(140) NOT NULL PRIMARY KEY,
    "owner" VARCHAR(140) NOT NULL,
    "creation" TIMESTAMPTZ DEFAULT NOW(),
    "modified" TIMESTAMPTZ DEFAULT NOW(),
    "subject" VARCHAR(140) NOT NULL,
    "description" TEXT,
    "raised_by" VARCHAR(140) NOT NULL,
    "status" VARCHAR(140) DEFAULT 'Open',
    "priority" VARCHAR(140),
    "agent_group" VARCHAR(140),
    "external_thread_id" VARCHAR(140),
    "assigned_agent" UUID,
    "channel" VARCHAR(140) NOT NULL,
    "resolution_date" TIMESTAMPTZ,
    "resolved_by_bot" BOOLEAN DEFAULT FALSE,
    "resolved_by_agent" UUID,
    "first_responded_on" TIMESTAMPTZ,
    "customer" VARCHAR(140),
    "sla" VARCHAR(140),
    "agreement_status" VARCHAR(140),
    "response_by" TIMESTAMPTZ,
    "resolution_by" TIMESTAMPTZ,
    "total_hold_time" INTERVAL,
    "first_response_time" INTERVAL,
    "is_merged" BOOLEAN DEFAULT FALSE,
    "merged_with" VARCHAR(140),
    "original_group" VARCHAR(140),
    "escalation_count" INTEGER DEFAULT 0,

    CONSTRAINT fk_ticket_assigned_agent FOREIGN KEY ("assigned_agent") REFERENCES auth.users (id),
    CONSTRAINT fk_ticket_resolved_by_agent FOREIGN KEY ("resolved_by_agent") REFERENCES auth.users (id),
    CONSTRAINT fk_ticket_agent_group FOREIGN KEY ("agent_group") REFERENCES "Team" (name),
    CONSTRAINT fk_ticket_original_group FOREIGN KEY ("original_group") REFERENCES "Team" (name),
    CONSTRAINT fk_ticket_priority FOREIGN KEY ("priority") REFERENCES "Priority" (name),
    CONSTRAINT fk_ticket_sla_name FOREIGN KEY ("sla") REFERENCES "SLA" (name),
    CONSTRAINT fk_ticket_channel FOREIGN KEY ("channel") REFERENCES "Channel" ("name"),
    CONSTRAINT fk_ticket_customer FOREIGN KEY ("customer") REFERENCES "Customer" ("name") ON DELETE SET NULL
);

CREATE TABLE "Communication" (
    "id"  SERIAL PRIMARY KEY,
    "ticket" VARCHAR(140) NOT NULL,
    "creation" TIMESTAMPTZ DEFAULT NOW(),
    "sender" UUID,
    "raised_by" VARCHAR(140) NOT NULL,
    "body" TEXT NOT NULL,
    "direction" VARCHAR(140) NOT NULL,
    "channel" VARCHAR(140) NOT NULL,
    "message_id" VARCHAR(140),
    "raw_headers" JSONB,
    "attachments" JSONB,
    "event_type" VARCHAR(140),

    CONSTRAINT fk_communication_parent_ticket
        FOREIGN KEY ("ticket") REFERENCES "Ticket" (name) ON DELETE CASCADE,
    CONSTRAINT fk_communication_channel
        FOREIGN KEY ("channel") REFERENCES "Channel" ("name"),
    CONSTRAINT fk_communication_sender
        FOREIGN KEY ("sender") REFERENCES auth.users (id)
);

CREATE TABLE "Knowledge_Base" (
    "id" SERIAL PRIMARY KEY,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "category" VARCHAR(100),
    "is_public" BOOLEAN DEFAULT FALSE,
    "author" UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    "creation" TIMESTAMPTZ DEFAULT NOW(),
    "modified" TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE "System_Settings" (
    "name" VARCHAR(10) PRIMARY KEY DEFAULT 'GLOBAL',
    "ticket_prefix" VARCHAR(10) DEFAULT 'TIK',
    "current_count" INTEGER DEFAULT 1,
    "customer_prefix" VARCHAR(10) DEFAULT 'CUST',
    "current_customer_count" INTEGER DEFAULT 1,
    "admin_agent_group" VARCHAR(140) REFERENCES "Team"("name"),
    "last_reset_date" TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT singleton_check CHECK (name = 'GLOBAL')
);

CREATE OR REPLACE FUNCTION is_manager(user_id uuid)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM "Role"
        WHERE "Role".user_id = is_manager.user_id
          AND "Role"."name" = 'System Manager'
    );
$$;

CREATE OR REPLACE FUNCTION is_admin_agent(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM "Agent_Membership" m
        JOIN "System_Settings" s ON m.team = s.admin_agent_group
        WHERE m.user_id = user_uuid AND s.name = 'GLOBAL'
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_agent_teams(user_uuid UUID)
RETURNS SETOF VARCHAR AS $$
BEGIN
    RETURN QUERY SELECT team FROM "Agent_Membership" WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


GRANT EXECUTE ON FUNCTION is_manager(uuid) TO authenticated;

ALTER TABLE "Team" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Agent_Membership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Ticket" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Communication" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Role" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Priority" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SLA" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Channel" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer_Handle" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Knowledge_Base" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "System_Settings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System Manager Bypass" ON "Ticket" AS PERMISSIVE FOR ALL TO authenticated USING ( is_manager(auth.uid()) );

CREATE POLICY "System Manager Bypass" ON "Team" AS PERMISSIVE FOR ALL TO authenticated USING ( is_manager(auth.uid()) );

CREATE POLICY "System Manager Bypass" ON "Agent_Membership" AS PERMISSIVE FOR ALL TO authenticated USING ( is_manager(auth.uid()) );

CREATE POLICY "System Manager Bypass" ON "Communication" AS PERMISSIVE FOR ALL TO authenticated USING ( is_manager(auth.uid()) );
CREATE POLICY "System Manager Bypass" ON "Role" AS PERMISSIVE FOR ALL TO authenticated USING ( is_manager(auth.uid()) );

CREATE POLICY "System Manager Bypass" ON "Priority" AS PERMISSIVE FOR ALL TO authenticated USING ( is_manager(auth.uid()) );

CREATE POLICY "System Manager Bypass" ON "SLA" AS PERMISSIVE FOR ALL TO authenticated USING ( is_manager(auth.uid()) );

CREATE POLICY "Agents can access and modify tickets of their teams" ON "Ticket" AS PERMISSIVE FOR ALL TO authenticated
USING (
    "assigned_agent" = auth.uid()
    OR
    "agent_group" IN (SELECT team FROM "Agent_Membership" WHERE user_id = auth.uid())
)
WITH CHECK (
    "assigned_agent" = auth.uid()
    OR
    "agent_group" IN (SELECT team FROM "Agent_Membership" WHERE user_id = auth.uid())
);

-- CREATE POLICY "Customers can only read their own tickets" ON "Ticket" AS PERMISSIVE FOR SELECT TO authenticated
-- USING ( "raised_by" = (SELECT email FROM auth.users WHERE id = auth.uid()) );
CREATE POLICY "Customers can only read their own tickets" ON "Ticket"
FOR SELECT TO authenticated
USING ( "raised_by" = auth.jwt() ->> 'email' );

-- CREATE POLICY "Customers can insert their own tickets" ON "Ticket" AS PERMISSIVE FOR INSERT TO authenticated
-- WITH CHECK ( "raised_by" = (SELECT email FROM auth.users WHERE id = auth.uid()) );

CREATE POLICY "Customers can insert their own tickets" ON "Ticket"
FOR INSERT TO authenticated
WITH CHECK ( "raised_by" = auth.jwt() ->> 'email' );

-- CREATE POLICY "Agents can only view their own teams" ON "Team" AS PERMISSIVE FOR SELECT TO authenticated
-- USING ( "name" IN (SELECT team FROM "Agent_Membership" WHERE user_id = auth.uid()) );
--
-- CREATE POLICY "Agents can view members of their teams" ON "Agent_Membership" AS PERMISSIVE FOR SELECT TO authenticated
-- USING ( "team" IN (SELECT team FROM "Agent_Membership" WHERE user_id = auth.uid()) );
-- Update this policy as well:

CREATE POLICY "Agents can only view their own teams" ON "Team"
AS PERMISSIVE FOR SELECT TO authenticated
USING ( "name" IN (SELECT get_agent_teams(auth.uid())) );

CREATE POLICY "Agents can view members of their teams" ON "Agent_Membership"
AS PERMISSIVE FOR SELECT TO authenticated
USING ( "team" IN (SELECT get_agent_teams(auth.uid())) );

CREATE POLICY "Agents can view communication on accessible tickets" ON "Communication" AS PERMISSIVE FOR SELECT TO authenticated
USING ( "ticket" IN (
    SELECT name FROM "Ticket"
    WHERE "assigned_agent" = auth.uid()
    OR "agent_group" IN (SELECT team FROM "Agent_Membership" WHERE user_id = auth.uid())
));

-- CREATE POLICY "Customers can view communication on their own tickets" ON "Communication" AS PERMISSIVE FOR SELECT TO authenticated
-- USING ( "ticket" IN (
--     SELECT name
--     FROM "Ticket"
--     WHERE "raised_by" = (SELECT email FROM auth.users WHERE id = auth.uid())
-- ));

CREATE POLICY "Customers can view communication on their own tickets" ON "Communication"
FOR SELECT TO authenticated
USING ( "ticket" IN (
    SELECT name FROM "Ticket" WHERE "raised_by" = auth.jwt() ->> 'email'
));

CREATE POLICY "System Manager Bypass" ON "Channel" AS PERMISSIVE FOR ALL TO authenticated USING ( is_manager(auth.uid()) );
CREATE POLICY "System Manager Bypass" ON "Customer" AS PERMISSIVE FOR ALL TO authenticated USING ( is_manager(auth.uid()) );
CREATE POLICY "System Manager Bypass" ON "Customer_Handle" AS PERMISSIVE FOR ALL TO authenticated USING ( is_manager(auth.uid()) );

CREATE POLICY "Agents can view active channels" ON "Channel"
AS PERMISSIVE FOR SELECT TO authenticated
USING ( "is_active" = TRUE );

CREATE POLICY "Agents can view and update customers" ON "Customer"
AS PERMISSIVE FOR ALL TO authenticated
USING ( EXISTS (SELECT 1 FROM "Role" WHERE user_id = auth.uid() AND name = 'Agent') );

CREATE POLICY "Agents can manage handles" ON "Customer_Handle"
AS PERMISSIVE FOR ALL TO authenticated
USING ( EXISTS (SELECT 1 FROM "Role" WHERE user_id = auth.uid() AND name = 'Agent') );

-- CREATE POLICY "Customers can view their own profile" ON "Customer"
-- AS PERMISSIVE FOR SELECT TO authenticated
-- USING ( "email" = (SELECT email FROM auth.users WHERE id = auth.uid()) );

CREATE POLICY "Customers can view their own profile" ON "Customer"
FOR SELECT TO authenticated
USING ( "email" = auth.jwt() ->> 'email' );

CREATE POLICY "Agents can manage KB" ON "Knowledge_Base"
AS PERMISSIVE FOR ALL TO authenticated
USING ( EXISTS (SELECT 1 FROM "Role" WHERE user_id = auth.uid() AND name = 'Agent') );

CREATE POLICY "Anyone can read public KB" ON "Knowledge_Base"
AS PERMISSIVE FOR SELECT TO authenticated, anon
USING ( "is_public" = TRUE );

CREATE POLICY "System Manager Bypass" ON "Knowledge_Base"
AS PERMISSIVE FOR ALL TO authenticated
USING ( is_manager(auth.uid()) );

CREATE POLICY "Admin Agents View Teams" ON "Team"
FOR SELECT TO authenticated
USING ( is_admin_agent(auth.uid()) );

CREATE POLICY "Admin Agents Create Teams" ON "Team"
FOR INSERT TO authenticated
WITH CHECK ( is_admin_agent(auth.uid()) );

CREATE POLICY "Admin Agents Update Teams" ON "Team"
FOR UPDATE TO authenticated
USING ( is_admin_agent(auth.uid()) )
WITH CHECK ( is_admin_agent(auth.uid()) );

CREATE POLICY "System Manager Bypass" ON "System_Settings"
USING (is_manager(auth.uid()));

CREATE POLICY "Admin Agent Update" ON "System_Settings"
FOR UPDATE TO authenticated
USING (is_admin_agent(auth.uid()));

CREATE POLICY "Everyone Read Settings" ON "System_Settings"
FOR SELECT TO authenticated
USING (true);
