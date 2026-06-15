/*
  Warnings:

  - You are about to drop the `CommunityMedia` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CommunityMedia" DROP CONSTRAINT "CommunityMedia_communityId_fkey";

-- DropTable
DROP TABLE "CommunityMedia";
