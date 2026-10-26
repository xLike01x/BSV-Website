import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "texte" ADD COLUMN "countdown_seite_id" integer;
  ALTER TABLE "texte" ADD CONSTRAINT "texte_countdown_seite_id_pages_id_fk" FOREIGN KEY ("countdown_seite_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "texte_countdown_countdown_seite_idx" ON "texte" USING btree ("countdown_seite_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "texte" DROP CONSTRAINT "texte_countdown_seite_id_pages_id_fk";
  
  DROP INDEX "texte_countdown_countdown_seite_idx";
  ALTER TABLE "texte" DROP COLUMN "countdown_seite_id";`)
}
