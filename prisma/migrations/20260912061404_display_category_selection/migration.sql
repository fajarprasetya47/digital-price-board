-- AlterTable
ALTER TABLE `display_devices` ADD COLUMN `show_all_categories` BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE `_CategoryToDisplayDevice` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_CategoryToDisplayDevice_AB_unique`(`A`, `B`),
    INDEX `_CategoryToDisplayDevice_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_CategoryToDisplayDevice` ADD CONSTRAINT `_CategoryToDisplayDevice_A_fkey` FOREIGN KEY (`A`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_CategoryToDisplayDevice` ADD CONSTRAINT `_CategoryToDisplayDevice_B_fkey` FOREIGN KEY (`B`) REFERENCES `display_devices`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
