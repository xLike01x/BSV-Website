import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_users_roles" ADD VALUE 'lesen' BEFORE 'mitglied';
  ALTER TABLE "rollen_rechte" ADD COLUMN "lesen_posteingang" boolean DEFAULT true;
  ALTER TABLE "rollen_rechte" ADD COLUMN "lesen_passantraege" boolean DEFAULT true;
  ALTER TABLE "rollen_rechte" ADD COLUMN "lesen_mitgliedsantraege" boolean DEFAULT true;
  ALTER TABLE "rollen_rechte" ADD COLUMN "lesen_bankdaten" boolean DEFAULT true;
  ALTER TABLE "rollen_rechte" ADD COLUMN "lesen_mitgliedschaften" boolean DEFAULT true;
  ALTER TABLE "rollen_rechte" ADD COLUMN "lesen_benutzer" boolean DEFAULT true;
  ALTER TABLE "rollen_rechte" ADD COLUMN "lesen_statistik" boolean DEFAULT true;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Konten mit „Nur ansehen“ verlieren diese Rolle (sonst scheitert die Umwandlung zurück)
  await db.execute(sql`
   DELETE FROM "users_roles" WHERE "value" = 'lesen';
   ALTER TABLE "users_roles" ALTER COLUMN "value" SET DATA TYPE text;
  DROP TYPE "public"."enum_users_roles";
  CREATE TYPE "public"."enum_users_roles" AS ENUM('webadmin', 'admin', 'redaktion', 'kasse', 'passwesen', 'uebungsleitung', 'teamredaktion', 'mitglied');
  ALTER TABLE "users_roles" ALTER COLUMN "value" SET DATA TYPE "public"."enum_users_roles" USING "value"::"public"."enum_users_roles";
  ALTER TABLE "rollen_rechte" DROP COLUMN "lesen_posteingang";
  ALTER TABLE "rollen_rechte" DROP COLUMN "lesen_passantraege";
  ALTER TABLE "rollen_rechte" DROP COLUMN "lesen_mitgliedsantraege";
  ALTER TABLE "rollen_rechte" DROP COLUMN "lesen_bankdaten";
  ALTER TABLE "rollen_rechte" DROP COLUMN "lesen_mitgliedschaften";
  ALTER TABLE "rollen_rechte" DROP COLUMN "lesen_benutzer";
  ALTER TABLE "rollen_rechte" DROP COLUMN "lesen_statistik";`)
}
