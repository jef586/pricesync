-- Create table for bulk pricing tiers per article and UoM (UH-ART-19)
CREATE TABLE IF NOT EXISTS `article_bulk_pricing` (
  `id` varchar(191) NOT NULL,
  `article_id` varchar(191) NOT NULL,
  `uom_code` ENUM('UN','BU','KG','LT') NOT NULL,
  `min_qty` DECIMAL(12,3) NOT NULL,
  `mode` ENUM('UNIT_PRICE','PERCENT_OFF') NOT NULL,
  `unit_price` DECIMAL(12,2) NULL,
  `percent_off` DECIMAL(5,2) NULL,
  `priority` INT NOT NULL DEFAULT 0,
  `active` BOOLEAN NOT NULL DEFAULT TRUE,
  `valid_from` DATETIME NULL,
  `valid_to` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `deleted_at` DATETIME NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_abp_article` FOREIGN KEY (`article_id`) REFERENCES `articles`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Composite index to speed up resolution: choose max(min_qty), then priority
CREATE INDEX `idx_article_bulk_pricing_rule`
  ON `article_bulk_pricing` (`article_id`, `uom_code`, `min_qty` DESC, `priority` DESC);