import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" ADD COLUMN "einwilligung_nachweis" varchar;
  ALTER TABLE "verein_vorstand" ADD COLUMN "foto_einwilligung_am" timestamp(3) with time zone;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "media" DROP COLUMN "einwilligung_nachweis";
  ALTER TABLE "verein_vorstand" DROP COLUMN "foto_einwilligung_am";`)
}
