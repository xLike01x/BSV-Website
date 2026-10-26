import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "spielstatistik" ADD COLUMN "memory_spiele" numeric DEFAULT 0;
  ALTER TABLE "spielstatistik" ADD COLUMN "memory_bester" numeric;
  ALTER TABLE "animationen" ADD COLUMN "memory" boolean DEFAULT true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "spielstatistik" DROP COLUMN "memory_spiele";
  ALTER TABLE "spielstatistik" DROP COLUMN "memory_bester";
  ALTER TABLE "animationen" DROP COLUMN "memory";`)
}
