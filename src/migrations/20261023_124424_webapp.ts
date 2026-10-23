import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "texte" ADD COLUMN "web_app_label" varchar DEFAULT 'Web-App';
  ALTER TABLE "texte" ADD COLUMN "web_app_titel" varchar DEFAULT 'Der BSV auf
deinem Startbildschirm.';
  ALTER TABLE "texte" ADD COLUMN "web_app_text" varchar DEFAULT 'Trainingszeiten, Termine und News mit einem Tipp – kostenlos, ohne App-Store und ohne Anmeldung. Benachrichtigungen bei Ausfällen folgen in Kürze.';
  ALTER TABLE "texte" ADD COLUMN "web_app_knopf" varchar DEFAULT 'App installieren';
  ALTER TABLE "texte" ADD COLUMN "web_app_fusszeile" varchar DEFAULT 'Als App installieren';
  ALTER TABLE "texte" ADD COLUMN "web_app_trainingszeiten" varchar DEFAULT 'Immer griffbereit: Trainingszeiten als App auf dem Startbildschirm.';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "texte" DROP COLUMN "web_app_label";
  ALTER TABLE "texte" DROP COLUMN "web_app_titel";
  ALTER TABLE "texte" DROP COLUMN "web_app_text";
  ALTER TABLE "texte" DROP COLUMN "web_app_knopf";
  ALTER TABLE "texte" DROP COLUMN "web_app_fusszeile";
  ALTER TABLE "texte" DROP COLUMN "web_app_trainingszeiten";`)
}
