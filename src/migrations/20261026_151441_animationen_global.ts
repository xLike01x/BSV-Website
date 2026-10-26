import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "animationen" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alle" boolean DEFAULT true,
  	"regler_ball" boolean DEFAULT true,
  	"countdown" boolean DEFAULT true,
  	"pulslinie" boolean DEFAULT true,
  	"kreide" boolean DEFAULT true,
  	"fehlerseite" boolean DEFAULT true,
  	"elfmeter" boolean DEFAULT true,
  	"hochhalten" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "texte" DROP COLUMN "animationen_alle";
  ALTER TABLE "texte" DROP COLUMN "animationen_regler_ball";
  ALTER TABLE "texte" DROP COLUMN "animationen_countdown";
  ALTER TABLE "texte" DROP COLUMN "animationen_pulslinie";
  ALTER TABLE "texte" DROP COLUMN "animationen_kreide";
  ALTER TABLE "texte" DROP COLUMN "animationen_fehlerseite";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "animationen" CASCADE;
  ALTER TABLE "texte" ADD COLUMN "animationen_alle" boolean DEFAULT true;
  ALTER TABLE "texte" ADD COLUMN "animationen_regler_ball" boolean DEFAULT true;
  ALTER TABLE "texte" ADD COLUMN "animationen_countdown" boolean DEFAULT true;
  ALTER TABLE "texte" ADD COLUMN "animationen_pulslinie" boolean DEFAULT true;
  ALTER TABLE "texte" ADD COLUMN "animationen_kreide" boolean DEFAULT true;
  ALTER TABLE "texte" ADD COLUMN "animationen_fehlerseite" boolean DEFAULT true;`)
}
