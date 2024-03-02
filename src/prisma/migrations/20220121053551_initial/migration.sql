-- CreateTable
CREATE TABLE `history` (
    `timestamp` DATETIME(3) NOT NULL,
    `device` VARCHAR(191) NOT NULL,
    `event` VARCHAR(191) NOT NULL,
    `reading` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NULL,
    `unit` VARCHAR(191) NULL,
    `syncedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`timestamp`, `device`, `reading`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `execution` (
    `id` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `started` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completed` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
