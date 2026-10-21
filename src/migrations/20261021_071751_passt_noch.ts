import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "angebote" ADD COLUMN "bestaetigt_am" timestamp(3) with time zone;
  ALTER TABLE "angebote" ADD COLUMN "bestaetigt_von" varchar;
  ALTER TABLE "angebote" ADD COLUMN "erinnert_am" timestamp(3) with time zone;
  ALTER TABLE "wartung" ADD COLUMN "monatsbericht_am" timestamp(3) with time zone;`)
  // Bestehende Teams gelten zum Zeitpunkt ihrer letzten Änderung als bestätigt – sonst bekämen alle Trainer am
  // ersten Tag gleichzeitig eine „Passt noch?“-Mail.
  await db.execute(sql`UPDATE "angebote" SET "bestaetigt_am" = "updated_at" WHERE "bestaetigt_am" IS NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "angebote" DROP COLUMN "bestaetigt_am";
  ALTER TABLE "angebote" DROP COLUMN "bestaetigt_von";
  ALTER TABLE "angebote" DROP COLUMN "erinnert_am";
  ALTER TABLE "wartung" DROP COLUMN "monatsbericht_am";`)
}
