import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "datenschutz" ALTER COLUMN "automatisch" SET DEFAULT true;
  ALTER TABLE "datenschutz" ADD COLUMN "offene_monate" numeric DEFAULT 12;
  ALTER TABLE "datenschutz" ADD COLUMN "austritt_monate" numeric DEFAULT 12;
  ALTER TABLE "datenschutz" ADD COLUMN "suchbegriff_monate" numeric DEFAULT 3;
  ALTER TABLE "datenschutz" ADD COLUMN "pass_offen_monate" numeric DEFAULT 6;
  ALTER TABLE "datenschutz" ADD COLUMN "konten_monate" numeric DEFAULT 24;
  ALTER TABLE "datenschutz" ADD COLUMN "personen_papierkorb_tage" numeric DEFAULT 30;
  ALTER TABLE "datenschutz" ADD COLUMN "standards_oktober2026" boolean DEFAULT false;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "datenschutz" ALTER COLUMN "automatisch" SET DEFAULT false;
  ALTER TABLE "datenschutz" DROP COLUMN "offene_monate";
  ALTER TABLE "datenschutz" DROP COLUMN "austritt_monate";
  ALTER TABLE "datenschutz" DROP COLUMN "suchbegriff_monate";
  ALTER TABLE "datenschutz" DROP COLUMN "pass_offen_monate";
  ALTER TABLE "datenschutz" DROP COLUMN "konten_monate";
  ALTER TABLE "datenschutz" DROP COLUMN "personen_papierkorb_tage";
  ALTER TABLE "datenschutz" DROP COLUMN "standards_oktober2026";`)
}
