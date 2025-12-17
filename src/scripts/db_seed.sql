INSERT INTO "Priority" ("name", "description", "color_code", "sort_order") VALUES
('Critical', 'System outage or major security incident.', '#DC3545', 1),
('High', 'Core functionality impaired, high number of users affected.', '#FFC107', 2),
('Medium', 'Non-critical bug or feature request.', '#007BFF', 3),
('Low', 'Minor issue, cosmetic bug, or general inquiry.', '#6C757D', 4);

INSERT INTO "Team" ("name", "description") VALUES
('Level 1 Support', 'Handles basic technical issues, password resets, and FAQs.'),
('Level 2 Support', 'Handles complex software bugs, integrations, and database queries.'),
('Engineering Team', 'Handles code-level fixes, security vulnerabilities, and infrastructure issues.'),
('Billing Team', 'Handles all customer invoicing and payment issues.');

UPDATE "Team" SET "escalation_team" = 'Level 2 Support' WHERE "name" = 'Level 1 Support';
UPDATE "Team" SET "escalation_team" = 'Engineering Team' WHERE "name" = 'Level 2 Support';

INSERT INTO "SLA" ("name", "priority_name", "description", "first_response_time", "resolution_time", "applies_to_contract_group") VALUES
('Gold-Critical', 'Critical', 'Immediate response for business-breaking issues.', '1 hour', '4 hours', 'All'),
('Silver-High', 'High', 'Fast response for major issues.', '4 hours', '1 day', 'All'),
('Bronze-Medium', 'Medium', 'Standard response time for non-critical issues.', '8 hours', '3 days', 'All'),
('Basic-Low', 'Low', 'Best effort response for minor issues.', '1 day', '5 days', 'All'),
('Premium-High', 'High', 'Enhanced response time for Premium customers.', '2 hours', '8 hours', 'Premium');

INSERT INTO "Role" ("user_id", "name") VALUES ('the_system_manager_user_id_from_supabase', 'System Manager');

INSERT INTO "System_Settings" ("name", "ticket_prefix", "current_count", "customer_prefix", "current_customer_count")
VALUES ('GLOBAL', 'TIK', 1, 'CUST', 1)
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "Channel" ("name", "description", "icon_slug", "is_active")
VALUES
    ('Email', 'Tickets received via support email addresses', 'mail', TRUE),
    ('WhatsApp', 'Incoming messages from official WhatsApp Business API', 'whatsapp', TRUE),
ON CONFLICT ("name") DO NOTHING;
