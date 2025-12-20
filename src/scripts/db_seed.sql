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

INSERT INTO "SLA" ("name", "priority", "description", "first_response_time", "resolution_time", "applies_to_contract_group") VALUES
('Gold-Critical', 'Critical', 'Immediate response for business-breaking issues.', '1 hour', '4 hours', 'All'),
('Silver-High', 'High', 'Fast response for major issues.', '4 hours', '1 day', 'All'),
('Bronze-Medium', 'Medium', 'Standard response time for non-critical issues.', '8 hours', '3 days', 'All'),
('Basic-Low', 'Low', 'Best effort response for minor issues.', '1 day', '5 days', 'All'),
('Premium-High', 'High', 'Enhanced response time for Premium customers.', '2 hours', '8 hours', 'Premium');

INSERT INTO "Role" ("user", "name") VALUES ('the_system_manager_user_from_supabase', 'System Manager');

INSERT INTO "System_Settings" ("name", "ticket_prefix", "current_count", "customer_prefix", "current_customer_count")
VALUES ('GLOBAL', 'TIK', 1, 'CUST', 1)
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "Channel" ("name", "description", "icon_slug", "is_active")
VALUES
    ('Email', 'Tickets received via support email addresses', 'mail', TRUE),
    ('WhatsApp', 'Incoming messages from official WhatsApp Business API', 'whatsapp', TRUE),
    ('System', 'For logging status, priority, etc.. changes', NULL, TRUE),
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "Knowledge_Base" (title, content, category, is_public)
VALUES
('How to Reset Your Password', 'To reset your password, go to the login page and click on "Forgot Password". Enter your registered email address, and you will receive a link to create a new password. If you do not receive the email within 5 minutes, please check your spam folder.', 'Account Management', true),

('VPN Connection Troubleshooting', 'If you are unable to connect to the company VPN, please ensure that:
1. You have a stable internet connection.
2. Your VPN client is updated to the latest version.
3. You are using the correct server address: vpn.maxtechsolutions.com.
4. Your credentials are correct.
If the issue persists, try restarting your computer.', 'Network', true),

('Setting Up Company Email on Mobile', 'To set up your company email on your mobile device:
1. Open your mail app (Outlook recommended).
2. Add a new account and select "Exchange" or "Office 365".
3. Enter your full email address and password.
4. If prompted for server settings, use: outlook.office365.com.
5. Enable synchronization for Mail, Calendar, and Contacts.', 'Email', true),

('Requesting New Software Installation', 'To request new software:
1. Visit the IT Self-Service Portal.
2. Search for the software in the "Software Catalog".
3. Click "Request Access" and provide a brief justification.
4. Your manager will receive an approval request. Once approved, the software will be deployed to your machine within 24 hours.', 'Software', true),

('Connecting to Office Printers', 'To connect to an office printer:
1. Open "Printers & Scanners" in your system settings.
2. Click "Add a printer or scanner".
3. Select the printer named "MAX-OFFICE-PRINTER-01" (for Floor 1) or "MAX-OFFICE-PRINTER-02" (for Floor 2).
4. Click "Add device". The drivers will install automatically.', 'Hardware', true);
