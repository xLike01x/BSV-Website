import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "texte" ALTER COLUMN "antrag_text" SET DEFAULT 'Wähle deine Teams und Kurse, gib deine Daten ein, fertig. Wir melden uns schnellstmöglich bei dir.';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "texte" ALTER COLUMN "antrag_text" SET DEFAULT 'Wähle deine Teams und Kurse, gib deine Daten ein, fertig. Die Trainer werden automatisch informiert.';`)
}
