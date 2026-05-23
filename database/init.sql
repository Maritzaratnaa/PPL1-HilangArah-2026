CREATE TABLE "guides" (
    "employee_id" varchar(50) NOT NULL,
    "full_name" varchar(255) NOT NULL,
    "phone_number" varchar(20) DEFAULT NULL,
    "domicile" varchar(50) DEFAULT NULL,
    "is_available" tinyint(1) DEFAULT '1',
    "gender" enum('Laki-laki', 'Perempuan') DEFAULT NULL,
    "age" int DEFAULT NULL,
    "detail" text,
    PRIMARY KEY ("employee_id")
);

CREATE TABLE "payments" (
    "payment_id" char(36) NOT NULL,
    "subs_id" char(36) DEFAULT NULL,
    "user_id" char(36) DEFAULT NULL,
    "amount" decimal(10, 2) DEFAULT NULL,
    "payment_proof" varchar(255) DEFAULT NULL,
    "status" enum(
        'Pending',
        'Verified',
        'Rejected'
    ) DEFAULT 'Pending',
    "verified_by" char(36) DEFAULT NULL,
    "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("payment_id"),
    KEY "subs_id" ("subs_id"),
    KEY "user_id" ("user_id"),
    KEY "verified_by" ("verified_by"),
    CONSTRAINT "payments_ibfk_1" FOREIGN KEY ("subs_id") REFERENCES "subs" ("subs_id"),
    CONSTRAINT "payments_ibfk_2" FOREIGN KEY ("user_id") REFERENCES "users" ("user_id"),
    CONSTRAINT "payments_ibfk_3" FOREIGN KEY ("verified_by") REFERENCES "users" ("user_id")
);

CREATE TABLE "profiles" (
    "profile_id" char(36) NOT NULL,
    "user_id" char(36) DEFAULT NULL,
    "full_name" varchar(255) NOT NULL,
    "phone_number" varchar(20) DEFAULT NULL,
    "category_status" enum(
        'disability',
        'elderly',
        'pregnant',
        'vulnerable-illness',
        'children',
        'women',
        'general'
    ) DEFAULT NULL,
    "font_size_pref" enum('Small', 'Medium', 'Large') DEFAULT 'Medium',
    PRIMARY KEY ("profile_id"),
    UNIQUE KEY "user_id" ("user_id"),
    CONSTRAINT "profiles_ibfk_1" FOREIGN KEY ("user_id") REFERENCES "users" ("user_id") ON DELETE CASCADE
);

CREATE TABLE "reports" (
    "report_id" char(36) NOT NULL,
    "reporter_id" char(36) DEFAULT NULL,
    "category" enum('Fasilitas', 'Pemandu') DEFAULT NULL,
    "stop_id" char(36) DEFAULT NULL,
    "subs_id" char(36) DEFAULT NULL,
    "description" text,
    "status" enum(
        'Pending',
        'Processed',
        'Resolved'
    ) DEFAULT 'Pending',
    "resolved_by" char(36) DEFAULT NULL,
    "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY ("report_id"),
    KEY "reporter_id" ("reporter_id"),
    KEY "stop_id" ("stop_id"),
    KEY "subs_id" ("subs_id"),
    KEY "resolved_by" ("resolved_by"),
    CONSTRAINT "reports_ibfk_1" FOREIGN KEY ("reporter_id") REFERENCES "users" ("user_id"),
    CONSTRAINT "reports_ibfk_2" FOREIGN KEY ("stop_id") REFERENCES "stops" ("stop_id"),
    CONSTRAINT "reports_ibfk_3" FOREIGN KEY ("subs_id") REFERENCES "subs" ("subs_id"),
    CONSTRAINT "reports_ibfk_4" FOREIGN KEY ("resolved_by") REFERENCES "users" ("user_id")
);

CREATE TABLE "route_stops" (
    "route_stop_id" int NOT NULL AUTO_INCREMENT,
    "route_id" char(36) DEFAULT NULL,
    "stop_id" char(36) DEFAULT NULL,
    "stop_order" int DEFAULT NULL,
    "est_time_minutes" int DEFAULT NULL,
    PRIMARY KEY ("route_stop_id"),
    KEY "route_id" ("route_id"),
    KEY "stop_id" ("stop_id"),
    CONSTRAINT "route_stops_ibfk_1" FOREIGN KEY ("route_id") REFERENCES "routes" ("route_id"),
    CONSTRAINT "route_stops_ibfk_2" FOREIGN KEY ("stop_id") REFERENCES "stops" ("stop_id")
);

CREATE TABLE "routes" (
    "route_id" char(36) NOT NULL,
    "route_name" varchar(255) DEFAULT NULL,
    "origin_stop_id" char(36) DEFAULT NULL,
    "destination_stop_id" char(36) DEFAULT NULL,
    "is_active" tinyint(1) DEFAULT '1',
    "trans_id" varchar(50) DEFAULT NULL,
    PRIMARY KEY ("route_id"),
    KEY "origin_stop_id" ("origin_stop_id"),
    KEY "destination_stop_id" ("destination_stop_id"),
    KEY "fk_route_transport" ("trans_id"),
    CONSTRAINT "fk_route_transport" FOREIGN KEY ("trans_id") REFERENCES "trans" ("trans_id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "routes_ibfk_2" FOREIGN KEY ("origin_stop_id") REFERENCES "stops" ("stop_id"),
    CONSTRAINT "routes_ibfk_3" FOREIGN KEY ("destination_stop_id") REFERENCES "stops" ("stop_id")
);

CREATE TABLE "stops" (
    "stop_id" char(36) NOT NULL,
    "name" varchar(255) NOT NULL,
    "address" text,
    "latitude" decimal(10, 8) DEFAULT NULL,
    "longitude" decimal(11, 8) DEFAULT NULL,
    "has_ramp" tinyint(1) DEFAULT '0',
    "has_elevator" tinyint(1) DEFAULT '0',
    "is_active" tinyint(1) DEFAULT '1',
    "hub_id" varchar(50) DEFAULT NULL,
    PRIMARY KEY ("stop_id"),
    KEY "idx_stops_name" ("name")
);

CREATE TABLE "subs" (
    "subs_id" char(36) NOT NULL,
    "user_id" char(36) DEFAULT NULL,
    "employee_id" varchar(50) DEFAULT NULL,
    "phone_number" varchar(20) DEFAULT NULL,
    "emergency_contact_name" varchar(255) DEFAULT NULL,
    "emergency_contact_phone" varchar(20) DEFAULT NULL,
    "domicile" varchar(50) DEFAULT NULL,
    "specific_needs" text,
    "status" enum(
        'Pending',
        'Active',
        'Expired'
    ) DEFAULT 'Pending',
    "start_date" date DEFAULT NULL,
    "end_date" date DEFAULT NULL,
    "duration" enum(
        'Daily',
        'Weekly',
        'Monthly',
        'Yearly'
    ) NOT NULL DEFAULT 'Monthly',
    PRIMARY KEY ("subs_id"),
    KEY "user_id" ("user_id"),
    KEY "employee_id" ("employee_id"),
    CONSTRAINT "subs_ibfk_1" FOREIGN KEY ("user_id") REFERENCES "users" ("user_id"),
    CONSTRAINT "subs_ibfk_2" FOREIGN KEY ("employee_id") REFERENCES "guides" ("employee_id")
);

CREATE TABLE "trans" (
    "trans_id" char(36) NOT NULL,
    "name" varchar(255) NOT NULL,
    "type" enum('Bus', 'Train', 'LRT', 'MRT') DEFAULT NULL,
    "is_low_entry" tinyint(1) DEFAULT '0',
    "has_wheelchair_slot" tinyint(1) DEFAULT '0',
    "has_priority_seat" tinyint(1) DEFAULT '0',
    "has_women_area" tinyint(1) DEFAULT '0',
    "is_active" tinyint(1) DEFAULT '1',
    PRIMARY KEY ("trans_id")
);

CREATE TABLE "users" (
    "user_id" char(36) NOT NULL,
    "email" varchar(255) NOT NULL,
    "username" varchar(100) NOT NULL,
    "password" varchar(255) NOT NULL,
    "role" enum('Admin', 'Pengguna') NOT NULL,
    "is_Active" tinyint(1) DEFAULT '1',
    "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
    "is_verified" tinyint(1) DEFAULT '0',
    "otp_code" varchar(6) DEFAULT NULL,
    PRIMARY KEY ("user_id"),
    UNIQUE KEY "email" ("email")
);