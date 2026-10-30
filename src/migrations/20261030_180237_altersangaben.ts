import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "texte" ALTER COLUMN "hero_tag1" SET DEFAULT 'Tanzmäuse · 3–6 Jahre';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "texte" ALTER COLUMN "hero_tag1" SET DEFAULT 'Tanzmäuse · 3–6 J.';`)
}
