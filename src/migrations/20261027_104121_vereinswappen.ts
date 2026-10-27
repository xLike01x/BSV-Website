import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "animationen" ADD COLUMN "wappen_intro" boolean DEFAULT true;
  ALTER TABLE "animationen" ADD COLUMN "wappen_streifen" boolean DEFAULT true;
  ALTER TABLE "animationen" ADD COLUMN "wappen_glanz" boolean DEFAULT true;
  ALTER TABLE "animationen" ADD COLUMN "wappen_fusszeile" boolean DEFAULT true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "animationen" DROP COLUMN "wappen_intro";
  ALTER TABLE "animationen" DROP COLUMN "wappen_streifen";
  ALTER TABLE "animationen" DROP COLUMN "wappen_glanz";
  ALTER TABLE "animationen" DROP COLUMN "wappen_fusszeile";`)
}
