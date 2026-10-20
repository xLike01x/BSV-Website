import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ADD COLUMN "zwei_faktor_fehler" numeric;
  ALTER TABLE "users" ADD COLUMN "zwei_faktor_fehler_seit" timestamp(3) with time zone;
  ALTER TABLE "users" ADD COLUMN "zwei_faktor_einrichtung_seit" timestamp(3) with time zone;
  CREATE INDEX "mitgliedsantraege_status_idx" ON "mitgliedsantraege" USING btree ("status");
  CREATE INDEX "kontaktanfragen_status_idx" ON "kontaktanfragen" USING btree ("status");
  CREATE INDEX "probetraining_status_idx" ON "probetraining" USING btree ("status");
  CREATE INDEX "art_tag_idx" ON "statistik" USING btree ("art","tag");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "mitgliedsantraege_status_idx";
  DROP INDEX "kontaktanfragen_status_idx";
  DROP INDEX "probetraining_status_idx";
  DROP INDEX "art_tag_idx";
  ALTER TABLE "users" DROP COLUMN "zwei_faktor_fehler";
  ALTER TABLE "users" DROP COLUMN "zwei_faktor_fehler_seit";
  ALTER TABLE "users" DROP COLUMN "zwei_faktor_einrichtung_seit";`)
}
