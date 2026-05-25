CREATE TABLE IF NOT EXISTS "__EFMigrationsHistory" (
    "MigrationId" character varying(150) NOT NULL,
    "ProductVersion" character varying(32) NOT NULL,
    CONSTRAINT "PK___EFMigrationsHistory" PRIMARY KEY ("MigrationId")
);

START TRANSACTION;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE TABLE admins (
        "Id" uuid NOT NULL,
        "Email" character varying(180) NOT NULL,
        "PasswordHash" character varying(200) NOT NULL,
        "FullName" character varying(150) NOT NULL,
        "Role" integer NOT NULL,
        "IsActive" boolean NOT NULL,
        "PreferredLanguage" character varying(5) NOT NULL,
        "LastLoginAt" timestamp with time zone,
        "LastLoginIp" character varying(45),
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        "CreatedBy" text,
        "UpdatedBy" text,
        CONSTRAINT "PK_admins" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE TABLE brands (
        "Id" uuid NOT NULL,
        "Name" character varying(120) NOT NULL,
        "Slug" character varying(150) NOT NULL,
        "LogoUrl" character varying(500),
        "Description" character varying(2000),
        "IsActive" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        "CreatedBy" text,
        "UpdatedBy" text,
        CONSTRAINT "PK_brands" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE TABLE categories (
        "Id" uuid NOT NULL,
        "Slug" character varying(150) NOT NULL,
        "ParentId" uuid,
        "SortOrder" integer NOT NULL,
        "ImageUrl" character varying(500),
        "IsActive" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        "CreatedBy" text,
        "UpdatedBy" text,
        CONSTRAINT "PK_categories" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_categories_categories_ParentId" FOREIGN KEY ("ParentId") REFERENCES categories ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE TABLE customers (
        "Id" uuid NOT NULL,
        "Email" character varying(180) NOT NULL,
        "Phone" character varying(30) NOT NULL,
        "FirstName" character varying(80) NOT NULL,
        "LastName" character varying(80) NOT NULL,
        "PasswordHash" character varying(200),
        "AuthProvider" integer NOT NULL,
        "ExternalUserId" character varying(200),
        "EmailVerified" boolean NOT NULL,
        "PhoneVerified" boolean NOT NULL,
        "IsActive" boolean NOT NULL,
        "PreferredLanguage" character varying(5) NOT NULL,
        "LastLoginAt" timestamp with time zone,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        "CreatedBy" text,
        "UpdatedBy" text,
        CONSTRAINT "PK_customers" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE TABLE notifications (
        "Id" uuid NOT NULL,
        "RecipientType" integer NOT NULL,
        "RecipientId" uuid NOT NULL,
        "Type" integer NOT NULL,
        "Channel" integer NOT NULL,
        "Title" character varying(200) NOT NULL,
        "Body" character varying(2000) NOT NULL,
        "PayloadJson" jsonb,
        "IsRead" boolean NOT NULL,
        "ReadAt" timestamp with time zone,
        "IsSent" boolean NOT NULL,
        "SentAt" timestamp with time zone,
        "FailureReason" character varying(500),
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_notifications" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE TABLE shipping_zones (
        "Id" uuid NOT NULL,
        "Name" character varying(120) NOT NULL,
        "Code" character varying(40) NOT NULL,
        "CountryCodes" text[] NOT NULL,
        "IsActive" boolean NOT NULL,
        "SortOrder" integer NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        "CreatedBy" text,
        "UpdatedBy" text,
        CONSTRAINT "PK_shipping_zones" PRIMARY KEY ("Id")
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE TABLE category_translations (
        "Id" uuid NOT NULL,
        "CategoryId" uuid NOT NULL,
        "LanguageCode" character varying(5) NOT NULL,
        "Name" character varying(200) NOT NULL,
        "Description" character varying(2000),
        "MetaTitle" character varying(200),
        "MetaDescription" character varying(500),
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_category_translations" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_category_translations_categories_CategoryId" FOREIGN KEY ("CategoryId") REFERENCES categories ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE TABLE products (
        "Id" uuid NOT NULL,
        "Sku" character varying(60) NOT NULL,
        "Slug" character varying(200) NOT NULL,
        "CategoryId" uuid NOT NULL,
        "BrandId" uuid,
        "BasePrice" numeric(12,2) NOT NULL,
        "CompareAtPrice" numeric(12,2),
        "Currency" character varying(3) NOT NULL,
        "StockQuantity" integer NOT NULL,
        "LowStockThreshold" integer NOT NULL,
        "WeightKg" numeric(8,3),
        "Barcode" character varying(60),
        "Attributes" jsonb,
        "IsActive" boolean NOT NULL,
        "IsFeatured" boolean NOT NULL,
        "ViewCount" integer NOT NULL,
        "PublishedAt" timestamp with time zone,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        "CreatedBy" text,
        "UpdatedBy" text,
        CONSTRAINT "PK_products" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_products_brands_BrandId" FOREIGN KEY ("BrandId") REFERENCES brands ("Id") ON DELETE SET NULL,
        CONSTRAINT "FK_products_categories_CategoryId" FOREIGN KEY ("CategoryId") REFERENCES categories ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE TABLE addresses (
        "Id" uuid NOT NULL,
        "CustomerId" uuid NOT NULL,
        "FullName" character varying(200) NOT NULL,
        "Phone" character varying(30) NOT NULL,
        "Street" character varying(250) NOT NULL,
        "StreetComplement" character varying(250),
        "City" character varying(120) NOT NULL,
        "Region" character varying(120),
        "PostalCode" character varying(20),
        "CountryCode" character varying(2) NOT NULL,
        "IsDefault" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_addresses" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_addresses_customers_CustomerId" FOREIGN KEY ("CustomerId") REFERENCES customers ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE TABLE push_subscriptions (
        "Id" uuid NOT NULL,
        "CustomerId" uuid,
        "AdminId" uuid,
        "Endpoint" character varying(500) NOT NULL,
        "P256dh" character varying(200) NOT NULL,
        "Auth" character varying(200) NOT NULL,
        "UserAgent" character varying(500),
        "LastUsedAt" timestamp with time zone,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_push_subscriptions" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_push_subscriptions_admins_AdminId" FOREIGN KEY ("AdminId") REFERENCES admins ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_push_subscriptions_customers_CustomerId" FOREIGN KEY ("CustomerId") REFERENCES customers ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE TABLE refresh_tokens (
        "Id" uuid NOT NULL,
        "CustomerId" uuid,
        "AdminId" uuid,
        "TokenHash" character varying(200) NOT NULL,
        "ExpiresAt" timestamp with time zone NOT NULL,
        "RevokedAt" timestamp with time zone,
        "ReplacedByTokenHash" character varying(200),
        "RevokedReason" character varying(250),
        "IpAddress" character varying(45),
        "UserAgent" character varying(500),
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_refresh_tokens_admins_AdminId" FOREIGN KEY ("AdminId") REFERENCES admins ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_refresh_tokens_customers_CustomerId" FOREIGN KEY ("CustomerId") REFERENCES customers ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE TABLE shipping_methods (
        "Id" uuid NOT NULL,
        "ZoneId" uuid NOT NULL,
        "Name" character varying(150) NOT NULL,
        "Description" character varying(500),
        "BaseFee" numeric(12,2) NOT NULL,
        "FreeShippingThreshold" numeric(12,2),
        "EstimatedMinDays" integer NOT NULL,
        "EstimatedMaxDays" integer NOT NULL,
        "IsActive" boolean NOT NULL,
        "SortOrder" integer NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        "CreatedBy" text,
        "UpdatedBy" text,
        CONSTRAINT "PK_shipping_methods" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_shipping_methods_shipping_zones_ZoneId" FOREIGN KEY ("ZoneId") REFERENCES shipping_zones ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE TABLE product_images (
        "Id" uuid NOT NULL,
        "ProductId" uuid NOT NULL,
        "Url" character varying(500) NOT NULL,
        "AltText" character varying(250),
        "SortOrder" integer NOT NULL,
        "IsPrimary" boolean NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_product_images" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_product_images_products_ProductId" FOREIGN KEY ("ProductId") REFERENCES products ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE TABLE product_translations (
        "Id" uuid NOT NULL,
        "ProductId" uuid NOT NULL,
        "LanguageCode" character varying(5) NOT NULL,
        "Name" character varying(250) NOT NULL,
        "ShortDescription" character varying(500),
        "Description" text,
        "MetaTitle" character varying(200),
        "MetaDescription" character varying(500),
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_product_translations" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_product_translations_products_ProductId" FOREIGN KEY ("ProductId") REFERENCES products ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE TABLE orders (
        "Id" uuid NOT NULL,
        "OrderNumber" character varying(30) NOT NULL,
        "CustomerId" uuid,
        "GuestEmail" character varying(180) NOT NULL,
        "GuestPhone" character varying(30) NOT NULL,
        "GuestFirstName" character varying(80) NOT NULL,
        "GuestLastName" character varying(80) NOT NULL,
        "Status" integer NOT NULL,
        "PaymentMethod" integer NOT NULL,
        "PaymentStatus" integer NOT NULL,
        "ShippingFullName" character varying(200) NOT NULL,
        "ShippingPhone" character varying(30) NOT NULL,
        "ShippingStreet" character varying(250) NOT NULL,
        "ShippingStreetComplement" character varying(250),
        "ShippingCity" character varying(120) NOT NULL,
        "ShippingRegion" character varying(120),
        "ShippingPostalCode" character varying(20),
        "ShippingCountryCode" character varying(2) NOT NULL,
        "ShippingMethodId" uuid,
        "ShippingMethodName" character varying(150),
        "Subtotal" numeric(12,2) NOT NULL,
        "ShippingFee" numeric(12,2) NOT NULL,
        "TaxAmount" numeric(12,2) NOT NULL,
        "DiscountAmount" numeric(12,2) NOT NULL,
        "Total" numeric(12,2) NOT NULL,
        "Currency" character varying(3) NOT NULL,
        "CustomerNotes" character varying(2000),
        "InternalNotes" character varying(2000),
        "BankTransferReference" character varying(150),
        "PaymentReceivedAt" timestamp with time zone,
        "ConfirmedAt" timestamp with time zone,
        "ShippedAt" timestamp with time zone,
        "DeliveredAt" timestamp with time zone,
        "CancelledAt" timestamp with time zone,
        "CancellationReason" character varying(500),
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        "CreatedBy" text,
        "UpdatedBy" text,
        CONSTRAINT "PK_orders" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_orders_customers_CustomerId" FOREIGN KEY ("CustomerId") REFERENCES customers ("Id") ON DELETE SET NULL,
        CONSTRAINT "FK_orders_shipping_methods_ShippingMethodId" FOREIGN KEY ("ShippingMethodId") REFERENCES shipping_methods ("Id") ON DELETE SET NULL
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE TABLE order_items (
        "Id" uuid NOT NULL,
        "OrderId" uuid NOT NULL,
        "ProductId" uuid NOT NULL,
        "ProductSku" character varying(60) NOT NULL,
        "ProductNameSnapshot" character varying(250) NOT NULL,
        "ProductImageSnapshot" character varying(500),
        "UnitPrice" numeric(12,2) NOT NULL,
        "Quantity" integer NOT NULL,
        "LineTotal" numeric(12,2) NOT NULL,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_order_items" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_order_items_orders_OrderId" FOREIGN KEY ("OrderId") REFERENCES orders ("Id") ON DELETE CASCADE,
        CONSTRAINT "FK_order_items_products_ProductId" FOREIGN KEY ("ProductId") REFERENCES products ("Id") ON DELETE RESTRICT
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE TABLE order_status_history (
        "Id" uuid NOT NULL,
        "OrderId" uuid NOT NULL,
        "FromStatus" integer NOT NULL,
        "ToStatus" integer NOT NULL,
        "Notes" character varying(1000),
        "ChangedBy" character varying(150),
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_order_status_history" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_order_status_history_orders_OrderId" FOREIGN KEY ("OrderId") REFERENCES orders ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE TABLE stock_movements (
        "Id" uuid NOT NULL,
        "ProductId" uuid NOT NULL,
        "MovementType" integer NOT NULL,
        "Quantity" integer NOT NULL,
        "StockBefore" integer NOT NULL,
        "StockAfter" integer NOT NULL,
        "Reason" character varying(250),
        "OrderId" uuid,
        "AdminId" uuid,
        "CreatedAt" timestamp with time zone NOT NULL,
        "UpdatedAt" timestamp with time zone,
        CONSTRAINT "PK_stock_movements" PRIMARY KEY ("Id"),
        CONSTRAINT "FK_stock_movements_admins_AdminId" FOREIGN KEY ("AdminId") REFERENCES admins ("Id") ON DELETE SET NULL,
        CONSTRAINT "FK_stock_movements_orders_OrderId" FOREIGN KEY ("OrderId") REFERENCES orders ("Id") ON DELETE SET NULL,
        CONSTRAINT "FK_stock_movements_products_ProductId" FOREIGN KEY ("ProductId") REFERENCES products ("Id") ON DELETE CASCADE
    );
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_addresses_CustomerId" ON addresses ("CustomerId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_admins_Email" ON admins ("Email");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_admins_IsActive" ON admins ("IsActive");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_brands_IsActive" ON brands ("IsActive");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_brands_Slug" ON brands ("Slug");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_categories_IsActive" ON categories ("IsActive");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_categories_ParentId" ON categories ("ParentId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_categories_Slug" ON categories ("Slug");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_category_translations_CategoryId_LanguageCode" ON category_translations ("CategoryId", "LanguageCode");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_customers_AuthProvider_ExternalUserId" ON customers ("AuthProvider", "ExternalUserId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_customers_Email" ON customers ("Email");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_customers_IsActive" ON customers ("IsActive");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_customers_Phone" ON customers ("Phone");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_notifications_CreatedAt" ON notifications ("CreatedAt");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_notifications_RecipientType_RecipientId_IsRead" ON notifications ("RecipientType", "RecipientId", "IsRead");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_order_items_OrderId" ON order_items ("OrderId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_order_items_ProductId" ON order_items ("ProductId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_order_status_history_OrderId" ON order_status_history ("OrderId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_orders_CreatedAt" ON orders ("CreatedAt");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_orders_CustomerId" ON orders ("CustomerId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_orders_GuestEmail" ON orders ("GuestEmail");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_orders_OrderNumber" ON orders ("OrderNumber");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_orders_PaymentStatus" ON orders ("PaymentStatus");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_orders_ShippingMethodId" ON orders ("ShippingMethodId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_orders_Status" ON orders ("Status");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_product_images_ProductId" ON product_images ("ProductId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_product_translations_Name" ON product_translations ("Name");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_product_translations_ProductId_LanguageCode" ON product_translations ("ProductId", "LanguageCode");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_products_BrandId" ON products ("BrandId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_products_CategoryId" ON products ("CategoryId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_products_IsActive" ON products ("IsActive");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_products_IsFeatured" ON products ("IsFeatured");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_products_PublishedAt" ON products ("PublishedAt");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_products_Sku" ON products ("Sku");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_products_Slug" ON products ("Slug");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_push_subscriptions_AdminId" ON push_subscriptions ("AdminId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_push_subscriptions_CustomerId" ON push_subscriptions ("CustomerId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_push_subscriptions_Endpoint" ON push_subscriptions ("Endpoint");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_refresh_tokens_AdminId" ON refresh_tokens ("AdminId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_refresh_tokens_CustomerId" ON refresh_tokens ("CustomerId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_refresh_tokens_ExpiresAt" ON refresh_tokens ("ExpiresAt");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_refresh_tokens_TokenHash" ON refresh_tokens ("TokenHash");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_shipping_methods_ZoneId" ON shipping_methods ("ZoneId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE UNIQUE INDEX "IX_shipping_zones_Code" ON shipping_zones ("Code");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_stock_movements_AdminId" ON stock_movements ("AdminId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_stock_movements_CreatedAt" ON stock_movements ("CreatedAt");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_stock_movements_OrderId" ON stock_movements ("OrderId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    CREATE INDEX "IX_stock_movements_ProductId" ON stock_movements ("ProductId");
    END IF;
END $EF$;

DO $EF$
BEGIN
    IF NOT EXISTS(SELECT 1 FROM "__EFMigrationsHistory" WHERE "MigrationId" = '20260525180121_InitialCreate') THEN
    INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion")
    VALUES ('20260525180121_InitialCreate', '9.0.16');
    END IF;
END $EF$;
COMMIT;

