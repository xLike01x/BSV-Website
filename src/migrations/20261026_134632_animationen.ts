import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "texte" ADD COLUMN "animationen_alle" boolean DEFAULT true;
  ALTER TABLE "texte" ADD COLUMN "animationen_regler_ball" boolean DEFAULT true;
  ALTER TABLE "texte" ADD COLUMN "animationen_countdown" boolean DEFAULT true;
  ALTER TABLE "texte" ADD COLUMN "animationen_pulslinie" boolean DEFAULT true;
  ALTER TABLE "texte" ADD COLUMN "animationen_kreide" boolean DEFAULT true;
  ALTER TABLE "texte" ADD COLUMN "animationen_fehlerseite" boolean DEFAULT true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "texte" DROP COLUMN "animationen_alle";
  ALTER TABLE "texte" DROP COLUMN "animationen_regler_ball";
  ALTER TABLE "texte" DROP COLUMN "animationen_countdown";
  ALTER TABLE "texte" DROP COLUMN "animationen_pulslinie";
  ALTER TABLE "texte" DROP COLUMN "animationen_kreide";
  ALTER TABLE "texte" DROP COLUMN "animationen_fehlerseite";`)
}
