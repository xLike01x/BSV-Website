import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_kuendigungen_verlauf_art" AS ENUM('notiz', 'status');
  CREATE TYPE "public"."enum_kuendigungen_status" AS ENUM('neu', 'rueckfrage', 'bestaetigt', 'erledigt', 'abgelehnt', 'zurueckgezogen');
  CREATE TABLE "kuendigungen_verlauf" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar NOT NULL,
  	"von_id" integer,
  	"von_name" varchar,
  	"am" timestamp(3) with time zone NOT NULL,
  	"art" "enum_kuendigungen_verlauf_art" DEFAULT 'notiz'
  );
  
  CREATE TABLE "kuendigungen" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"zustaendig_id" integer,
  	"zustaendig_name" varchar,
  	"status" "enum_kuendigungen_status" DEFAULT 'neu',
  	"namen" varchar,
  	"eingang_am" timestamp(3) with time zone,
  	"wirksam_zum" timestamp(3) with time zone,
  	"dokument_id" integer,
  	"grund" varchar,
  	"konto_id" integer,
  	"email" varchar,
  	"vorname" varchar,
  	"bestaetigt_am" timestamp(3) with time zone,
  	"wirksam_geworden" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "kuendigungen_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"mitgliedschaften_id" integer
  );
  
  CREATE TABLE "kuendigungsdokumente" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"hochgeladen_von_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "kuendigungen_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "kuendigungsdokumente_id" integer;
  ALTER TABLE "datenschutz" ADD COLUMN "kuendigungen_monate" numeric DEFAULT 12;
  ALTER TABLE "mail_vorlagen" ADD COLUMN "kuendigung_bestaetigt_betreff" varchar DEFAULT 'Bestätigung deiner Kündigung beim BSV 1919' NOT NULL;
  ALTER TABLE "mail_vorlagen" ADD COLUMN "kuendigung_bestaetigt_text" varchar DEFAULT 'Hallo {vorname},

wir bestätigen die Kündigung der Mitgliedschaft von {namen}. Sie endet laut Satzung zum {wirksamZum}. Bis dahin bleibt alles wie gewohnt; danach werden keine Beiträge mehr eingezogen.

Schade, dass du gehst – du bist jederzeit wieder willkommen!

Sportliche Grüße
{meinName}
BSV 1919 e.V.' NOT NULL;
  ALTER TABLE "mail_vorlagen" ADD COLUMN "kuendigung_rueckfrage_betreff" varchar DEFAULT 'Rückfrage zu deiner Kündigung' NOT NULL;
  ALTER TABLE "mail_vorlagen" ADD COLUMN "kuendigung_rueckfrage_text" varchar DEFAULT 'Hallo {vorname},

vielen Dank für deine Kündigung. Bevor wir sie bestätigen können, haben wir noch eine Frage:

[HIER DEINE FRAGE]

Antworte einfach auf diese E-Mail.

Sportliche Grüße
{meinName}
BSV 1919 e.V.' NOT NULL;
  ALTER TABLE "mail_vorlagen" ADD COLUMN "kuendigung_abgelehnt_betreff" varchar DEFAULT 'Deine Kündigung beim BSV 1919' NOT NULL;
  ALTER TABLE "mail_vorlagen" ADD COLUMN "kuendigung_abgelehnt_text" varchar DEFAULT 'Hallo {vorname},

leider können wir deine Kündigung so nicht annehmen:

[GRUND]

Bitte lade im Mitgliederbereich (Mein BSV → Mitgliedschaft kündigen) ein neues, unterschriebenes Kündigungsschreiben hoch oder antworte auf diese E-Mail.

Sportliche Grüße
{meinName}
BSV 1919 e.V.' NOT NULL;
  ALTER TABLE "kuendigungen_verlauf" ADD CONSTRAINT "kuendigungen_verlauf_von_id_users_id_fk" FOREIGN KEY ("von_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "kuendigungen_verlauf" ADD CONSTRAINT "kuendigungen_verlauf_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."kuendigungen"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "kuendigungen" ADD CONSTRAINT "kuendigungen_zustaendig_id_users_id_fk" FOREIGN KEY ("zustaendig_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "kuendigungen" ADD CONSTRAINT "kuendigungen_dokument_id_kuendigungsdokumente_id_fk" FOREIGN KEY ("dokument_id") REFERENCES "public"."kuendigungsdokumente"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "kuendigungen" ADD CONSTRAINT "kuendigungen_konto_id_users_id_fk" FOREIGN KEY ("konto_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "kuendigungen_rels" ADD CONSTRAINT "kuendigungen_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."kuendigungen"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "kuendigungen_rels" ADD CONSTRAINT "kuendigungen_rels_mitgliedschaften_fk" FOREIGN KEY ("mitgliedschaften_id") REFERENCES "public"."mitgliedschaften"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "kuendigungsdokumente" ADD CONSTRAINT "kuendigungsdokumente_hochgeladen_von_id_users_id_fk" FOREIGN KEY ("hochgeladen_von_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "kuendigungen_verlauf_order_idx" ON "kuendigungen_verlauf" USING btree ("_order");
  CREATE INDEX "kuendigungen_verlauf_parent_id_idx" ON "kuendigungen_verlauf" USING btree ("_parent_id");
  CREATE INDEX "kuendigungen_verlauf_von_idx" ON "kuendigungen_verlauf" USING btree ("von_id");
  CREATE INDEX "kuendigungen_zustaendig_idx" ON "kuendigungen" USING btree ("zustaendig_id");
  CREATE INDEX "kuendigungen_status_idx" ON "kuendigungen" USING btree ("status");
  CREATE INDEX "kuendigungen_eingang_am_idx" ON "kuendigungen" USING btree ("eingang_am");
  CREATE INDEX "kuendigungen_wirksam_zum_idx" ON "kuendigungen" USING btree ("wirksam_zum");
  CREATE INDEX "kuendigungen_dokument_idx" ON "kuendigungen" USING btree ("dokument_id");
  CREATE INDEX "kuendigungen_konto_idx" ON "kuendigungen" USING btree ("konto_id");
  CREATE INDEX "kuendigungen_updated_at_idx" ON "kuendigungen" USING btree ("updated_at");
  CREATE INDEX "kuendigungen_created_at_idx" ON "kuendigungen" USING btree ("created_at");
  CREATE INDEX "kuendigungen_rels_order_idx" ON "kuendigungen_rels" USING btree ("order");
  CREATE INDEX "kuendigungen_rels_parent_idx" ON "kuendigungen_rels" USING btree ("parent_id");
  CREATE INDEX "kuendigungen_rels_path_idx" ON "kuendigungen_rels" USING btree ("path");
  CREATE INDEX "kuendigungen_rels_mitgliedschaften_id_idx" ON "kuendigungen_rels" USING btree ("mitgliedschaften_id");
  CREATE INDEX "kuendigungsdokumente_hochgeladen_von_idx" ON "kuendigungsdokumente" USING btree ("hochgeladen_von_id");
  CREATE INDEX "kuendigungsdokumente_updated_at_idx" ON "kuendigungsdokumente" USING btree ("updated_at");
  CREATE INDEX "kuendigungsdokumente_created_at_idx" ON "kuendigungsdokumente" USING btree ("created_at");
  CREATE UNIQUE INDEX "kuendigungsdokumente_filename_idx" ON "kuendigungsdokumente" USING btree ("filename");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_kuendigungen_fk" FOREIGN KEY ("kuendigungen_id") REFERENCES "public"."kuendigungen"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_kuendigungsdokumente_fk" FOREIGN KEY ("kuendigungsdokumente_id") REFERENCES "public"."kuendigungsdokumente"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_kuendigungen_id_idx" ON "payload_locked_documents_rels" USING btree ("kuendigungen_id");
  CREATE INDEX "payload_locked_documents_rels_kuendigungsdokumente_id_idx" ON "payload_locked_documents_rels" USING btree ("kuendigungsdokumente_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "kuendigungen_verlauf" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "kuendigungen" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "kuendigungen_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "kuendigungsdokumente" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "kuendigungen_verlauf" CASCADE;
  DROP TABLE "kuendigungen" CASCADE;
  DROP TABLE "kuendigungen_rels" CASCADE;
  DROP TABLE "kuendigungsdokumente" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_kuendigungen_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_kuendigungsdokumente_fk";
  
  DROP INDEX IF EXISTS "payload_locked_documents_rels_kuendigungen_id_idx";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_kuendigungsdokumente_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "kuendigungen_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "kuendigungsdokumente_id";
  ALTER TABLE "datenschutz" DROP COLUMN "kuendigungen_monate";
  ALTER TABLE "mail_vorlagen" DROP COLUMN "kuendigung_bestaetigt_betreff";
  ALTER TABLE "mail_vorlagen" DROP COLUMN "kuendigung_bestaetigt_text";
  ALTER TABLE "mail_vorlagen" DROP COLUMN "kuendigung_rueckfrage_betreff";
  ALTER TABLE "mail_vorlagen" DROP COLUMN "kuendigung_rueckfrage_text";
  ALTER TABLE "mail_vorlagen" DROP COLUMN "kuendigung_abgelehnt_betreff";
  ALTER TABLE "mail_vorlagen" DROP COLUMN "kuendigung_abgelehnt_text";
  DROP TYPE "public"."enum_kuendigungen_verlauf_art";
  DROP TYPE "public"."enum_kuendigungen_status";`)
}
