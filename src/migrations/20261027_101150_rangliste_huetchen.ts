import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_spielergebnisse_spiel" ADD VALUE 'huetchen';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DELETE FROM "spielergebnisse" WHERE "spiel" = 'huetchen';
  ALTER TABLE "spielergebnisse" ALTER COLUMN "spiel" SET DATA TYPE text;
  DROP TYPE "public"."enum_spielergebnisse_spiel";
  CREATE TYPE "public"."enum_spielergebnisse_spiel" AS ENUM('hochhalten', 'memory', 'elfmeterSerie');
  ALTER TABLE "spielergebnisse" ALTER COLUMN "spiel" SET DATA TYPE "public"."enum_spielergebnisse_spiel" USING "spiel"::"public"."enum_spielergebnisse_spiel";`)
}
