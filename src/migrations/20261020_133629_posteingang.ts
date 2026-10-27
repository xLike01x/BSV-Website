import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_mitgliedsantraege_verlauf_art" AS ENUM('notiz', 'status');
  CREATE TYPE "public"."enum_kontaktanfragen_verlauf_art" AS ENUM('notiz', 'status');
  CREATE TYPE "public"."enum_probetraining_verlauf_art" AS ENUM('notiz', 'status');
  CREATE TABLE "mitgliedsantraege_verlauf" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"von_id" integer,
  	"von_name" varchar,
  	"am" timestamp(3) with time zone NOT NULL,
  	"art" "enum_mitgliedsantraege_verlauf_art" DEFAULT 'notiz'
  );
  
  CREATE TABLE "kontaktanfragen_verlauf" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"von_id" integer,
  	"von_name" varchar,
  	"am" timestamp(3) with time zone NOT NULL,
  	"art" "enum_kontaktanfragen_verlauf_art" DEFAULT 'notiz'
  );
  
  CREATE TABLE "probetraining_verlauf" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"von_id" integer,
  	"von_name" varchar,
  	"am" timestamp(3) with time zone NOT NULL,
  	"art" "enum_probetraining_verlauf_art" DEFAULT 'notiz'
  );
  
  CREATE TABLE "mail_vorlagen" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"aufgenommen_betreff" varchar DEFAULT 'Willkommen beim BSV 1919!' NOT NULL,
  	"aufgenommen_text" varchar DEFAULT 'Hallo {vorname},

vielen Dank für deinen Mitgliedsantrag. Wir freuen uns sehr, dich als Mitglied ({mitgliedsart}) im Büdericher Spielverein 1919 e.V. begrüßen zu dürfen!

Der Beitrag wird wie im Antrag vereinbart per SEPA-Lastschrift eingezogen.

Bei Fragen antworte einfach auf diese E-Mail.

Sportliche Grüße
{meinName}
BSV 1919 e.V.' NOT NULL,
  	"rueckfrage_betreff" varchar DEFAULT 'Rückfrage zu deinem Mitgliedsantrag' NOT NULL,
  	"rueckfrage_text" varchar DEFAULT 'Hallo {vorname},

vielen Dank für deinen Mitgliedsantrag beim BSV 1919. Bevor wir ihn bearbeiten können, haben wir noch eine Frage:

[HIER DEINE FRAGE]

Antworte einfach auf diese E-Mail.

Sportliche Grüße
{meinName}
BSV 1919 e.V.' NOT NULL,
  	"abgelehnt_betreff" varchar DEFAULT 'Dein Mitgliedsantrag beim BSV 1919' NOT NULL,
  	"abgelehnt_text" varchar DEFAULT 'Hallo {vorname},

vielen Dank für dein Interesse am BSV 1919. Leider können wir deinen Mitgliedsantrag nicht annehmen:

[GRUND]

Deine Angaben (auch die Bankdaten) werden nach Ablauf der Aufbewahrungsfrist gelöscht. Bei Fragen antworte einfach auf diese E-Mail.

Sportliche Grüße
{meinName}
BSV 1919 e.V.' NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "mitgliedsantraege" ADD COLUMN "zustaendig_id" integer;
  ALTER TABLE "mitgliedsantraege" ADD COLUMN "zustaendig_name" varchar;
  ALTER TABLE "mitgliedsantraege" ADD COLUMN "aufgenommen_am" timestamp(3) with time zone;
  ALTER TABLE "mitgliedsantraege" ADD COLUMN "exportiert_am" timestamp(3) with time zone;
  ALTER TABLE "kontaktanfragen" ADD COLUMN "zustaendig_id" integer;
  ALTER TABLE "kontaktanfragen" ADD COLUMN "zustaendig_name" varchar;
  ALTER TABLE "probetraining" ADD COLUMN "zustaendig_id" integer;
  ALTER TABLE "probetraining" ADD COLUMN "zustaendig_name" varchar;
  ALTER TABLE "posts" ADD COLUMN "startseite_vorschlag" boolean;
  ALTER TABLE "_posts_v" ADD COLUMN "version_startseite_vorschlag" boolean;
  ALTER TABLE "mitgliedsantraege_verlauf" ADD CONSTRAINT "mitgliedsantraege_verlauf_von_id_users_id_fk" FOREIGN KEY ("von_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "mitgliedsantraege_verlauf" ADD CONSTRAINT "mitgliedsantraege_verlauf_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."mitgliedsantraege"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "kontaktanfragen_verlauf" ADD CONSTRAINT "kontaktanfragen_verlauf_von_id_users_id_fk" FOREIGN KEY ("von_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "kontaktanfragen_verlauf" ADD CONSTRAINT "kontaktanfragen_verlauf_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."kontaktanfragen"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "probetraining_verlauf" ADD CONSTRAINT "probetraining_verlauf_von_id_users_id_fk" FOREIGN KEY ("von_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "probetraining_verlauf" ADD CONSTRAINT "probetraining_verlauf_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."probetraining"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "mitgliedsantraege_verlauf_order_idx" ON "mitgliedsantraege_verlauf" USING btree ("_order");
  CREATE INDEX "mitgliedsantraege_verlauf_parent_id_idx" ON "mitgliedsantraege_verlauf" USING btree ("_parent_id");
  CREATE INDEX "mitgliedsantraege_verlauf_von_idx" ON "mitgliedsantraege_verlauf" USING btree ("von_id");
  CREATE INDEX "kontaktanfragen_verlauf_order_idx" ON "kontaktanfragen_verlauf" USING btree ("_order");
  CREATE INDEX "kontaktanfragen_verlauf_parent_id_idx" ON "kontaktanfragen_verlauf" USING btree ("_parent_id");
  CREATE INDEX "kontaktanfragen_verlauf_von_idx" ON "kontaktanfragen_verlauf" USING btree ("von_id");
  CREATE INDEX "probetraining_verlauf_order_idx" ON "probetraining_verlauf" USING btree ("_order");
  CREATE INDEX "probetraining_verlauf_parent_id_idx" ON "probetraining_verlauf" USING btree ("_parent_id");
  CREATE INDEX "probetraining_verlauf_von_idx" ON "probetraining_verlauf" USING btree ("von_id");
  ALTER TABLE "mitgliedsantraege" ADD CONSTRAINT "mitgliedsantraege_zustaendig_id_users_id_fk" FOREIGN KEY ("zustaendig_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "kontaktanfragen" ADD CONSTRAINT "kontaktanfragen_zustaendig_id_users_id_fk" FOREIGN KEY ("zustaendig_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "probetraining" ADD CONSTRAINT "probetraining_zustaendig_id_users_id_fk" FOREIGN KEY ("zustaendig_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "mitgliedsantraege_zustaendig_idx" ON "mitgliedsantraege" USING btree ("zustaendig_id");
  CREATE INDEX "mitgliedsantraege_exportiert_am_idx" ON "mitgliedsantraege" USING btree ("exportiert_am");
  CREATE INDEX "kontaktanfragen_zustaendig_idx" ON "kontaktanfragen" USING btree ("zustaendig_id");
  CREATE INDEX "probetraining_zustaendig_idx" ON "probetraining" USING btree ("zustaendig_id");
  CREATE INDEX "posts_startseite_vorschlag_idx" ON "posts" USING btree ("startseite_vorschlag");
  CREATE INDEX "_posts_v_version_version_startseite_vorschlag_idx" ON "_posts_v" USING btree ("version_startseite_vorschlag");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "mitgliedsantraege_verlauf" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "kontaktanfragen_verlauf" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "probetraining_verlauf" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "mail_vorlagen" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "mitgliedsantraege_verlauf" CASCADE;
  DROP TABLE "kontaktanfragen_verlauf" CASCADE;
  DROP TABLE "probetraining_verlauf" CASCADE;
  DROP TABLE "mail_vorlagen" CASCADE;
  ALTER TABLE "mitgliedsantraege" DROP CONSTRAINT IF EXISTS "mitgliedsantraege_zustaendig_id_users_id_fk";
  
  ALTER TABLE "kontaktanfragen" DROP CONSTRAINT IF EXISTS "kontaktanfragen_zustaendig_id_users_id_fk";
  
  ALTER TABLE "probetraining" DROP CONSTRAINT IF EXISTS "probetraining_zustaendig_id_users_id_fk";
  
  DROP INDEX IF EXISTS "mitgliedsantraege_zustaendig_idx";
  DROP INDEX IF EXISTS "mitgliedsantraege_exportiert_am_idx";
  DROP INDEX IF EXISTS "kontaktanfragen_zustaendig_idx";
  DROP INDEX IF EXISTS "probetraining_zustaendig_idx";
  DROP INDEX IF EXISTS "posts_startseite_vorschlag_idx";
  DROP INDEX IF EXISTS "_posts_v_version_version_startseite_vorschlag_idx";
  ALTER TABLE "mitgliedsantraege" DROP COLUMN "zustaendig_id";
  ALTER TABLE "mitgliedsantraege" DROP COLUMN "zustaendig_name";
  ALTER TABLE "mitgliedsantraege" DROP COLUMN "aufgenommen_am";
  ALTER TABLE "mitgliedsantraege" DROP COLUMN "exportiert_am";
  ALTER TABLE "kontaktanfragen" DROP COLUMN "zustaendig_id";
  ALTER TABLE "kontaktanfragen" DROP COLUMN "zustaendig_name";
  ALTER TABLE "probetraining" DROP COLUMN "zustaendig_id";
  ALTER TABLE "probetraining" DROP COLUMN "zustaendig_name";
  ALTER TABLE "posts" DROP COLUMN "startseite_vorschlag";
  ALTER TABLE "_posts_v" DROP COLUMN "version_startseite_vorschlag";
  DROP TYPE "public"."enum_mitgliedsantraege_verlauf_art";
  DROP TYPE "public"."enum_kontaktanfragen_verlauf_art";
  DROP TYPE "public"."enum_probetraining_verlauf_art";`)
}
