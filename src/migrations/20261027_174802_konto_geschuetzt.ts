import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "users" ADD COLUMN "konto_geschuetzt" boolean DEFAULT false;
  CREATE INDEX "users_konto_geschuetzt_idx" ON "users" USING btree ("konto_geschuetzt");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX IF EXISTS "users_konto_geschuetzt_idx";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "konto_geschuetzt";`)
}
