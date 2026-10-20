import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_mitgliedsantraege_status" AS ENUM('neu', 'rueckfrage', 'aufgenommen', 'abgelehnt');
  CREATE TYPE "public"."enum_mitgliedsantraege_mitgliedsart" AS ENUM('jugend', 'aktiv', 'familie', 'passiv');
  CREATE TYPE "public"."enum_kontaktanfragen_status" AS ENUM('neu', 'bearbeitung', 'erledigt');
  CREATE TYPE "public"."enum_probetraining_status" AS ENUM('neu', 'zugesagt', 'alternativ', 'erledigt');
  CREATE TYPE "public"."enum_passantraege_status" AS ENUM('eingereicht', 'pruefung', 'unterlagen_fehlen', 'verband', 'erteilt', 'abgelehnt');
  CREATE TYPE "public"."enum_passantraege_fuer" AS ENUM('selbst', 'kind');
  CREATE TYPE "public"."enum_passantraege_art" AS ENUM('neu', 'wechsel', 'international');
  CREATE TYPE "public"."enum_posts_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__posts_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_termine_wiederholung" AS ENUM('keine', 'woechentlich', 'zweiwoechentlich', 'monatlich');
  CREATE TYPE "public"."enum_termine_bereich" AS ENUM('verein', 'fussball', 'kids', 'erwachsene');
  CREATE TYPE "public"."enum_media_personen" AS ENUM('keine', 'einwilligung');
  CREATE TYPE "public"."enum_sponsoren_stufe" AS ENUM('haupt', 'premium', 'partner', 'foerderer');
  CREATE TYPE "public"."enum_gesuche_symbol" AS ENUM('🙋', '⚽', '🤸', '🧑‍🍳', '🧾', '🧑‍⚖️', '🎉', '📸', '🛠️');
  CREATE TYPE "public"."enum_pages_hero_links_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_pages_hero_links_link_appearance" AS ENUM('default', 'outline');
  CREATE TYPE "public"."enum_pages_blocks_cta_links_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_cta_links_link_appearance" AS ENUM('default', 'outline');
  CREATE TYPE "public"."enum_pages_blocks_content_columns_size" AS ENUM('oneThird', 'half', 'twoThirds', 'full');
  CREATE TYPE "public"."enum_pages_blocks_content_columns_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_pages_blocks_content_columns_link_appearance" AS ENUM('default', 'outline');
  CREATE TYPE "public"."enum_pages_blocks_archive_populate_by" AS ENUM('collection', 'selection');
  CREATE TYPE "public"."enum_pages_blocks_archive_relation_to" AS ENUM('posts');
  CREATE TYPE "public"."enum_pages_hero_type" AS ENUM('none', 'highImpact', 'mediumImpact', 'lowImpact');
  CREATE TYPE "public"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__pages_v_version_hero_links_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__pages_v_version_hero_links_link_appearance" AS ENUM('default', 'outline');
  CREATE TYPE "public"."enum__pages_v_blocks_cta_links_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_cta_links_link_appearance" AS ENUM('default', 'outline');
  CREATE TYPE "public"."enum__pages_v_blocks_content_columns_size" AS ENUM('oneThird', 'half', 'twoThirds', 'full');
  CREATE TYPE "public"."enum__pages_v_blocks_content_columns_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum__pages_v_blocks_content_columns_link_appearance" AS ENUM('default', 'outline');
  CREATE TYPE "public"."enum__pages_v_blocks_archive_populate_by" AS ENUM('collection', 'selection');
  CREATE TYPE "public"."enum__pages_v_blocks_archive_relation_to" AS ENUM('posts');
  CREATE TYPE "public"."enum__pages_v_version_hero_type" AS ENUM('none', 'highImpact', 'mediumImpact', 'lowImpact');
  CREATE TYPE "public"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_angebote_zeiten_tag" AS ENUM('Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag');
  CREATE TYPE "public"."enum_angebote_bereich" AS ENUM('fussball', 'kids', 'erwachsene');
  CREATE TYPE "public"."enum_angebote_untergruppe" AS ENUM('junioren', 'juniorinnen', 'senioren', 'seniorinnen');
  CREATE TYPE "public"."enum_angebote_kategorie" AS ENUM('Fußball', 'Tanzen', 'Turnen', 'Zirkus', 'Fitness', 'Gesundheit', 'Ausdauer', 'Kampfkunst');
  CREATE TYPE "public"."enum_angebote_banner_art" AS ENUM('info', 'wichtig');
  CREATE TYPE "public"."enum_ausfaelle_grund" AS ENUM('Krankheit', 'Halle belegt', 'Ferien / Feiertag', 'Wetter', 'Sonstiges');
  CREATE TYPE "public"."enum_passdokumente_art" AS ENUM('passantrag', 'ausweis', 'passfoto', 'einwilligung', 'abmeldung', 'meldebescheinigung', 'sonstiges');
  CREATE TYPE "public"."enum_users_roles" AS ENUM('webadmin', 'admin', 'redaktion', 'kasse', 'passwesen', 'uebungsleitung', 'teamredaktion', 'mitglied');
  CREATE TYPE "public"."enum_users_registriert_ueber" AS ENUM('verwaltung', 'email', 'google');
  CREATE TYPE "public"."enum_mitgliedschaften_art" AS ENUM('jugend', 'aktiv', 'passiv', 'familie');
  CREATE TYPE "public"."enum_statistik_art" AS ENUM('aufruf', 'schritt', 'suche');
  CREATE TYPE "public"."enum_statistik_geraet" AS ENUM('handy', 'tablet', 'computer');
  CREATE TYPE "public"."enum_redirects_to_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_forms_confirmation_type" AS ENUM('message', 'redirect');
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TYPE "public"."enum_payload_jobs_log_state" AS ENUM('failed', 'succeeded');
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'schedulePublish');
  CREATE TYPE "public"."enum_payload_folders_folder_type" AS ENUM('media');
  CREATE TYPE "public"."enum_header_nav_items_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_footer_nav_items_link_type" AS ENUM('reference', 'custom');
  CREATE TYPE "public"."enum_menue_links_ziel" AS ENUM('seite', 'adresse', 'aufklapp');
  CREATE TYPE "public"."enum_menue_links_aufklapp" AS ENUM('fussball', 'breitensport', 'verein');
  CREATE TYPE "public"."enum_menue_verein_ueber_uns_ziel" AS ENUM('seite', 'adresse');
  CREATE TYPE "public"."enum_menue_verein_mehr_ziel" AS ENUM('seite', 'adresse');
  CREATE TYPE "public"."enum_menue_fusszeile_eintraege_ziel" AS ENUM('seite', 'adresse');
  CREATE TYPE "public"."enum_menue_kontakt_links_ziel" AS ENUM('seite', 'adresse');
  CREATE TYPE "public"."enum_hilfe_bereiche_bereich" AS ENUM('dashboard', 'posts', 'termine', 'media', 'pages', 'categories', 'angebote', 'ausfaelle', 'probetraining', 'mitgliedsantraege', 'passantraege', 'mitgliedschaften', 'kontaktanfragen', 'users', 'menue', 'verein', 'papierkorb', 'statistik', 'sicherheit', 'texte', 'forms', 'form-submissions', 'redirects', 'search', 'rollen', 'sicherung', 'rollenRechte', 'datenschutz', 'dokumente', 'sponsoren', 'alben', 'gesuche', 'hilfe-center', 'hilfe', 'hilfe-feedback', 'account');
  CREATE TYPE "public"."enum_hilfe_faq_bereich" AS ENUM('dashboard', 'posts', 'termine', 'media', 'pages', 'categories', 'angebote', 'ausfaelle', 'probetraining', 'mitgliedsantraege', 'passantraege', 'mitgliedschaften', 'kontaktanfragen', 'users', 'menue', 'verein', 'papierkorb', 'statistik', 'sicherheit', 'texte', 'forms', 'form-submissions', 'redirects', 'search', 'rollen', 'sicherung', 'rollenRechte', 'datenschutz', 'dokumente', 'sponsoren', 'alben', 'gesuche', 'hilfe-center', 'hilfe', 'hilfe-feedback', 'account');
  CREATE TABLE "mitgliedsantraege_familienmitglieder" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"vorname" varchar,
  	"nachname" varchar,
  	"geburtsdatum" timestamp(3) with time zone
  );
  
  CREATE TABLE "mitgliedsantraege" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_mitgliedsantraege_status" DEFAULT 'neu',
  	"vorname" varchar NOT NULL,
  	"nachname" varchar NOT NULL,
  	"geburtsdatum" timestamp(3) with time zone NOT NULL,
  	"email" varchar NOT NULL,
  	"telefon" varchar,
  	"strasse" varchar NOT NULL,
  	"plz" varchar NOT NULL,
  	"ort" varchar NOT NULL,
  	"mitgliedsart" "enum_mitgliedsantraege_mitgliedsart" NOT NULL,
  	"beitrag_quartal" numeric,
  	"kontoinhaber" varchar NOT NULL,
  	"iban" varchar NOT NULL,
  	"sepa_mandat" boolean DEFAULT false NOT NULL,
  	"satzung_akzeptiert" boolean DEFAULT false NOT NULL,
  	"foto_einwilligung" boolean,
  	"notizen" varchar,
  	"endgueltig_am" timestamp(3) with time zone,
  	"endgueltig_von" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "mitgliedsantraege_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"angebote_id" integer
  );
  
  CREATE TABLE "kontaktanfragen" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"status" "enum_kontaktanfragen_status" DEFAULT 'neu',
  	"an" varchar,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"betreff" varchar NOT NULL,
  	"nachricht" varchar NOT NULL,
  	"datenschutz" boolean DEFAULT false NOT NULL,
  	"endgueltig_am" timestamp(3) with time zone,
  	"endgueltig_von" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "probetraining" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"angebot_id" integer NOT NULL,
  	"name" varchar NOT NULL,
  	"email" varchar NOT NULL,
  	"teilnehmer" varchar,
  	"alter" numeric,
  	"wunschtermin" varchar,
  	"nachricht" varchar,
  	"datenschutz" boolean DEFAULT false NOT NULL,
  	"status" "enum_probetraining_status" DEFAULT 'neu',
  	"endgueltig_am" timestamp(3) with time zone,
  	"endgueltig_von" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "passantraege" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"spieler_name" varchar,
  	"status" "enum_passantraege_status" DEFAULT 'eingereicht' NOT NULL,
  	"team_id" integer NOT NULL,
  	"hinweis" varchar,
  	"notiz" varchar,
  	"fuer" "enum_passantraege_fuer" DEFAULT 'selbst',
  	"spieler_vorname" varchar NOT NULL,
  	"spieler_nachname" varchar NOT NULL,
  	"geburtsdatum" timestamp(3) with time zone NOT NULL,
  	"staatsangehoerigkeit" varchar DEFAULT 'deutsch',
  	"erziehungsberechtigte" varchar,
  	"art" "enum_passantraege_art" DEFAULT 'neu' NOT NULL,
  	"bisheriger_verein" varchar,
  	"abmeldedatum" timestamp(3) with time zone,
  	"passantrag_id" integer,
  	"ausweis_id" integer,
  	"passfoto_id" integer,
  	"einwilligung_id" integer,
  	"abmeldung_id" integer,
  	"meldebescheinigung_id" integer,
  	"bestaetigt" boolean,
  	"antragsteller_id" integer,
  	"nachgereicht_am" timestamp(3) with time zone,
  	"abgeschlossen_am" timestamp(3) with time zone,
  	"unterlagen_geloescht_am" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "posts_populated_authors" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar
  );
  
  CREATE TABLE "posts" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"hero_image_id" integer,
  	"content" jsonb,
  	"meta_title" varchar,
  	"meta_image_id" integer,
  	"meta_description" varchar,
  	"team_id" integer,
  	"auf_startseite" boolean DEFAULT true,
  	"published_at" timestamp(3) with time zone,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"endgueltig_am" timestamp(3) with time zone,
  	"endgueltig_von" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone,
  	"_status" "enum_posts_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "posts_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"posts_id" integer,
  	"categories_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "_posts_v_version_populated_authors" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"name" varchar
  );
  
  CREATE TABLE "_posts_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_hero_image_id" integer,
  	"version_content" jsonb,
  	"version_meta_title" varchar,
  	"version_meta_image_id" integer,
  	"version_meta_description" varchar,
  	"version_team_id" integer,
  	"version_auf_startseite" boolean DEFAULT true,
  	"version_published_at" timestamp(3) with time zone,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_endgueltig_am" timestamp(3) with time zone,
  	"version_endgueltig_von" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version_deleted_at" timestamp(3) with time zone,
  	"version__status" "enum__posts_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_posts_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"posts_id" integer,
  	"categories_id" integer,
  	"users_id" integer
  );
  
  CREATE TABLE "termine_auslassen" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"datum" timestamp(3) with time zone
  );
  
  CREATE TABLE "termine" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"beginn" timestamp(3) with time zone NOT NULL,
  	"ende" timestamp(3) with time zone,
  	"wiederholung" "enum_termine_wiederholung" DEFAULT 'keine',
  	"wiederholung_bis" timestamp(3) with time zone,
  	"ort" varchar DEFAULT 'Kutscher-Remy-Sportpark, Schützenstraße 25a, 46487 Wesel',
  	"bereich" "enum_termine_bereich" DEFAULT 'verein',
  	"beschreibung" varchar,
  	"nur_mitglieder" boolean,
  	"anmeldung" boolean,
  	"endgueltig_am" timestamp(3) with time zone,
  	"endgueltig_von" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "alben" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"titel" varchar NOT NULL,
  	"datum" timestamp(3) with time zone NOT NULL,
  	"team_id" integer,
  	"beschreibung" varchar,
  	"aktiv" boolean DEFAULT true,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"endgueltig_am" timestamp(3) with time zone,
  	"endgueltig_von" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "alben_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
  	"personen" "enum_media_personen",
  	"team_id" integer,
  	"allgemein" boolean,
  	"sponsoren" boolean,
  	"in_galerie" boolean,
  	"caption" jsonb,
  	"endgueltig_am" timestamp(3) with time zone,
  	"endgueltig_von" varchar,
  	"folder_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_square_url" varchar,
  	"sizes_square_width" numeric,
  	"sizes_square_height" numeric,
  	"sizes_square_mime_type" varchar,
  	"sizes_square_filesize" numeric,
  	"sizes_square_filename" varchar,
  	"sizes_small_url" varchar,
  	"sizes_small_width" numeric,
  	"sizes_small_height" numeric,
  	"sizes_small_mime_type" varchar,
  	"sizes_small_filesize" numeric,
  	"sizes_small_filename" varchar,
  	"sizes_medium_url" varchar,
  	"sizes_medium_width" numeric,
  	"sizes_medium_height" numeric,
  	"sizes_medium_mime_type" varchar,
  	"sizes_medium_filesize" numeric,
  	"sizes_medium_filename" varchar,
  	"sizes_large_url" varchar,
  	"sizes_large_width" numeric,
  	"sizes_large_height" numeric,
  	"sizes_large_mime_type" varchar,
  	"sizes_large_filesize" numeric,
  	"sizes_large_filename" varchar,
  	"sizes_xlarge_url" varchar,
  	"sizes_xlarge_width" numeric,
  	"sizes_xlarge_height" numeric,
  	"sizes_xlarge_mime_type" varchar,
  	"sizes_xlarge_filesize" numeric,
  	"sizes_xlarge_filename" varchar,
  	"sizes_logo_url" varchar,
  	"sizes_logo_width" numeric,
  	"sizes_logo_height" numeric,
  	"sizes_logo_mime_type" varchar,
  	"sizes_logo_filesize" numeric,
  	"sizes_logo_filename" varchar,
  	"sizes_og_url" varchar,
  	"sizes_og_width" numeric,
  	"sizes_og_height" numeric,
  	"sizes_og_mime_type" varchar,
  	"sizes_og_filesize" numeric,
  	"sizes_og_filename" varchar
  );
  
  CREATE TABLE "sponsoren" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"logo_id" integer,
  	"logo_fusszeile_id" integer,
  	"url" varchar,
  	"text" varchar,
  	"stufe" "enum_sponsoren_stufe" DEFAULT 'partner',
  	"im_laufband" boolean DEFAULT true,
  	"reihenfolge" numeric DEFAULT 100,
  	"aktiv" boolean DEFAULT true,
  	"endgueltig_am" timestamp(3) with time zone,
  	"endgueltig_von" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "gesuche" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"titel" varchar NOT NULL,
  	"text" varchar NOT NULL,
  	"aufwand" varchar,
  	"symbol" "enum_gesuche_symbol" DEFAULT '🙋',
  	"reihenfolge" numeric DEFAULT 100,
  	"aktiv" boolean DEFAULT true,
  	"endgueltig_am" timestamp(3) with time zone,
  	"endgueltig_von" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "pages_hero_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_pages_hero_links_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar,
  	"link_appearance" "enum_pages_hero_links_link_appearance" DEFAULT 'default'
  );
  
  CREATE TABLE "pages_blocks_cta_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_pages_blocks_cta_links_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar,
  	"link_appearance" "enum_pages_blocks_cta_links_link_appearance" DEFAULT 'default'
  );
  
  CREATE TABLE "pages_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"rich_text" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_content_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"size" "enum_pages_blocks_content_columns_size" DEFAULT 'oneThird',
  	"rich_text" jsonb,
  	"enable_link" boolean,
  	"link_type" "enum_pages_blocks_content_columns_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar,
  	"link_appearance" "enum_pages_blocks_content_columns_link_appearance" DEFAULT 'default'
  );
  
  CREATE TABLE "pages_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_media_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_archive" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"intro_content" jsonb,
  	"populate_by" "enum_pages_blocks_archive_populate_by" DEFAULT 'collection',
  	"relation_to" "enum_pages_blocks_archive_relation_to" DEFAULT 'posts',
  	"limit" numeric DEFAULT 10,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_form_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"form_id" integer,
  	"enable_intro" boolean,
  	"intro_content" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"hero_type" "enum_pages_hero_type" DEFAULT 'lowImpact',
  	"hero_rich_text" jsonb,
  	"hero_media_id" integer,
  	"meta_title" varchar,
  	"meta_image_id" integer,
  	"meta_description" varchar,
  	"published_at" timestamp(3) with time zone,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar,
  	"endgueltig_am" timestamp(3) with time zone,
  	"endgueltig_von" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone,
  	"_status" "enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "pages_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"posts_id" integer,
  	"categories_id" integer
  );
  
  CREATE TABLE "_pages_v_version_hero_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"link_type" "enum__pages_v_version_hero_links_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar,
  	"link_appearance" "enum__pages_v_version_hero_links_link_appearance" DEFAULT 'default',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_cta_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"link_type" "enum__pages_v_blocks_cta_links_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar,
  	"link_appearance" "enum__pages_v_blocks_cta_links_link_appearance" DEFAULT 'default',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_cta" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"rich_text" jsonb,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_content_columns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"size" "enum__pages_v_blocks_content_columns_size" DEFAULT 'oneThird',
  	"rich_text" jsonb,
  	"enable_link" boolean,
  	"link_type" "enum__pages_v_blocks_content_columns_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar,
  	"link_appearance" "enum__pages_v_blocks_content_columns_link_appearance" DEFAULT 'default',
  	"_uuid" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_content" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_media_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"media_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_archive" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"intro_content" jsonb,
  	"populate_by" "enum__pages_v_blocks_archive_populate_by" DEFAULT 'collection',
  	"relation_to" "enum__pages_v_blocks_archive_relation_to" DEFAULT 'posts',
  	"limit" numeric DEFAULT 10,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_form_block" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"form_id" integer,
  	"enable_intro" boolean,
  	"intro_content" jsonb,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_hero_type" "enum__pages_v_version_hero_type" DEFAULT 'lowImpact',
  	"version_hero_rich_text" jsonb,
  	"version_hero_media_id" integer,
  	"version_meta_title" varchar,
  	"version_meta_image_id" integer,
  	"version_meta_description" varchar,
  	"version_published_at" timestamp(3) with time zone,
  	"version_generate_slug" boolean DEFAULT true,
  	"version_slug" varchar,
  	"version_endgueltig_am" timestamp(3) with time zone,
  	"version_endgueltig_von" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version_deleted_at" timestamp(3) with time zone,
  	"version__status" "enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean,
  	"autosave" boolean
  );
  
  CREATE TABLE "_pages_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"posts_id" integer,
  	"categories_id" integer
  );
  
  CREATE TABLE "categories_breadcrumbs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"doc_id" integer,
  	"url" varchar,
  	"label" varchar
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"parent_id" integer,
  	"endgueltig_am" timestamp(3) with time zone,
  	"endgueltig_von" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "angebote_zeiten" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"tag" "enum_angebote_zeiten_tag",
  	"von" varchar,
  	"bis" varchar,
  	"ort" varchar,
  	"hinweis" varchar
  );
  
  CREATE TABLE "angebote_team" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"rolle" varchar,
  	"foto_id" integer
  );
  
  CREATE TABLE "angebote" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"bereich" "enum_angebote_bereich" NOT NULL,
  	"untergruppe" "enum_angebote_untergruppe",
  	"kategorie" "enum_angebote_kategorie",
  	"alter_text" varchar,
  	"alter_von" numeric,
  	"alter_bis" numeric,
  	"kurzbeschreibung" varchar,
  	"beschreibung" jsonb,
  	"bild_id" integer,
  	"banner_text" varchar,
  	"banner_bis" timestamp(3) with time zone,
  	"banner_art" "enum_angebote_banner_art" DEFAULT 'info',
  	"plaetze_begrenzt" boolean,
  	"max_plaetze" numeric,
  	"spielklasse" varchar,
  	"fupa_widget_id" varchar,
  	"fussball_de_team_id" varchar,
  	"reihenfolge" numeric DEFAULT 100,
  	"aktiv" boolean DEFAULT true,
  	"generate_slug" boolean DEFAULT true,
  	"slug" varchar NOT NULL,
  	"endgueltig_am" timestamp(3) with time zone,
  	"endgueltig_von" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "angebote_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "ausfaelle" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"angebot_id" integer NOT NULL,
  	"datum" timestamp(3) with time zone NOT NULL,
  	"grund" "enum_ausfaelle_grund" DEFAULT 'Krankheit',
  	"hinweis" varchar,
  	"benachrichtigen" boolean DEFAULT true,
  	"endgueltig_am" timestamp(3) with time zone,
  	"endgueltig_von" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "passdokumente" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"art" "enum_passdokumente_art",
  	"hochgeladen_von_id" integer,
  	"antrag_id" integer,
  	"team_id" integer,
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
  
  CREATE TABLE "users_roles" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_users_roles",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"zusatzrechte_kontaktanfragen" boolean DEFAULT false,
  	"zusatzrechte_probetraining" boolean DEFAULT false,
  	"zusatzrechte_passantraege" boolean DEFAULT false,
  	"zusatzrechte_registrierungen" boolean DEFAULT false,
  	"zusatzrechte_formulare" boolean DEFAULT false,
  	"zusatzrechte_termine" boolean DEFAULT false,
  	"zusatzrechte_gesuche" boolean DEFAULT false,
  	"zusatzrechte_ausfaelle" boolean DEFAULT false,
  	"zusatzrechte_mitgliedschaften" boolean DEFAULT false,
  	"profilbild_id" integer,
  	"freigegeben" boolean DEFAULT true,
  	"registriert_ueber" "enum_users_registriert_ueber",
  	"email_bestaetigt" boolean DEFAULT false,
  	"bestaetigung_hash" varchar,
  	"bestaetigung_bis" timestamp(3) with time zone,
  	"google_id" varchar,
  	"mail_benachrichtigung" boolean DEFAULT true,
  	"zwei_faktor_aktiv" boolean DEFAULT false,
  	"zwei_faktor_geheimnis" varchar,
  	"zwei_faktor_codes" jsonb,
  	"zwei_faktor_sitzungen" jsonb,
  	"zwei_faktor_letzter_schritt" numeric,
  	"testkonto" boolean DEFAULT false,
  	"letzte_anmeldung" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "users_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"angebote_id" integer
  );
  
  CREATE TABLE "mitgliedschaften" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"anzeige_name" varchar,
  	"vorname" varchar NOT NULL,
  	"nachname" varchar NOT NULL,
  	"mitgliedsnummer" varchar,
  	"eintritt" timestamp(3) with time zone,
  	"art" "enum_mitgliedschaften_art" DEFAULT 'aktiv' NOT NULL,
  	"geburtsdatum" timestamp(3) with time zone,
  	"konto_id" integer,
  	"email" varchar NOT NULL,
  	"aktiv" boolean DEFAULT true,
  	"austritt" timestamp(3) with time zone,
  	"antrag_id" integer,
  	"endgueltig_am" timestamp(3) with time zone,
  	"endgueltig_von" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "mitgliedschaften_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"angebote_id" integer
  );
  
  CREATE TABLE "profilbilder" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"besitzer_id" integer,
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
  	"focal_y" numeric,
  	"sizes_klein_url" varchar,
  	"sizes_klein_width" numeric,
  	"sizes_klein_height" numeric,
  	"sizes_klein_mime_type" varchar,
  	"sizes_klein_filesize" numeric,
  	"sizes_klein_filename" varchar
  );
  
  CREATE TABLE "dokumente" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"titel" varchar,
  	"endgueltig_am" timestamp(3) with time zone,
  	"endgueltig_von" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone,
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
  
  CREATE TABLE "hilfe_feedback" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"bereich" varchar NOT NULL,
  	"hilfreich" boolean,
  	"kommentar" varchar,
  	"benutzer_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "statistik" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"tag" varchar NOT NULL,
  	"art" "enum_statistik_art" NOT NULL,
  	"pfad" varchar,
  	"quelle" varchar,
  	"geraet" "enum_statistik_geraet",
  	"besucher" varchar,
  	"schritt" numeric,
  	"suchbegriff" varchar,
  	"treffer" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "redirects" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"from" varchar NOT NULL,
  	"to_type" "enum_redirects_to_type" DEFAULT 'reference',
  	"to_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "redirects_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"posts_id" integer
  );
  
  CREATE TABLE "forms_blocks_checkbox" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"width" numeric,
  	"required" boolean,
  	"default_value" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "forms_blocks_country" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"width" numeric,
  	"required" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "forms_blocks_email" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"width" numeric,
  	"required" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "forms_blocks_message" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"message" jsonb,
  	"block_name" varchar
  );
  
  CREATE TABLE "forms_blocks_number" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"width" numeric,
  	"default_value" numeric,
  	"required" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "forms_blocks_select_options" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "forms_blocks_select" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"width" numeric,
  	"default_value" varchar,
  	"placeholder" varchar,
  	"required" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "forms_blocks_state" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"width" numeric,
  	"required" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "forms_blocks_text" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"width" numeric,
  	"default_value" varchar,
  	"required" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "forms_blocks_textarea" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"label" varchar,
  	"width" numeric,
  	"default_value" varchar,
  	"required" boolean,
  	"block_name" varchar
  );
  
  CREATE TABLE "forms_emails" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"email_to" varchar,
  	"cc" varchar,
  	"bcc" varchar,
  	"reply_to" varchar,
  	"email_from" varchar,
  	"subject" varchar DEFAULT 'You''ve received a new message.' NOT NULL,
  	"message" jsonb
  );
  
  CREATE TABLE "forms" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"submit_button_label" varchar,
  	"confirmation_type" "enum_forms_confirmation_type" DEFAULT 'message',
  	"confirmation_message" jsonb,
  	"redirect_url" varchar,
  	"endgueltig_am" timestamp(3) with time zone,
  	"endgueltig_von" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "form_submissions_submission_data" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"field" varchar NOT NULL,
  	"value" varchar NOT NULL
  );
  
  CREATE TABLE "form_submissions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"form_id" integer NOT NULL,
  	"endgueltig_am" timestamp(3) with time zone,
  	"endgueltig_von" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"deleted_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "search_categories" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"relation_to" varchar,
  	"category_i_d" varchar,
  	"title" varchar
  );
  
  CREATE TABLE "search" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"priority" numeric,
  	"slug" varchar,
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "search_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"posts_id" integer
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_jobs_log" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"executed_at" timestamp(3) with time zone NOT NULL,
  	"completed_at" timestamp(3) with time zone NOT NULL,
  	"task_slug" "enum_payload_jobs_log_task_slug" NOT NULL,
  	"task_i_d" varchar NOT NULL,
  	"input" jsonb,
  	"output" jsonb,
  	"state" "enum_payload_jobs_log_state" NOT NULL,
  	"error" jsonb
  );
  
  CREATE TABLE "payload_jobs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"input" jsonb,
  	"completed_at" timestamp(3) with time zone,
  	"total_tried" numeric DEFAULT 0,
  	"has_error" boolean DEFAULT false,
  	"error" jsonb,
  	"task_slug" "enum_payload_jobs_task_slug",
  	"queue" varchar DEFAULT 'default',
  	"wait_until" timestamp(3) with time zone,
  	"processing" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_folders_folder_type" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_payload_folders_folder_type",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "payload_folders" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"folder_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"mitgliedsantraege_id" integer,
  	"kontaktanfragen_id" integer,
  	"probetraining_id" integer,
  	"passantraege_id" integer,
  	"posts_id" integer,
  	"termine_id" integer,
  	"alben_id" integer,
  	"media_id" integer,
  	"sponsoren_id" integer,
  	"gesuche_id" integer,
  	"pages_id" integer,
  	"categories_id" integer,
  	"angebote_id" integer,
  	"ausfaelle_id" integer,
  	"passdokumente_id" integer,
  	"users_id" integer,
  	"mitgliedschaften_id" integer,
  	"profilbilder_id" integer,
  	"dokumente_id" integer,
  	"hilfe_feedback_id" integer,
  	"statistik_id" integer,
  	"redirects_id" integer,
  	"forms_id" integer,
  	"form_submissions_id" integer,
  	"search_id" integer,
  	"payload_folders_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "header_nav_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_header_nav_items_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar NOT NULL
  );
  
  CREATE TABLE "header" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "header_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"posts_id" integer
  );
  
  CREATE TABLE "footer_nav_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"link_type" "enum_footer_nav_items_link_type" DEFAULT 'reference',
  	"link_new_tab" boolean,
  	"link_url" varchar,
  	"link_label" varchar NOT NULL
  );
  
  CREATE TABLE "footer" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "footer_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"pages_id" integer,
  	"posts_id" integer
  );
  
  CREATE TABLE "menue_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"ziel" "enum_menue_links_ziel" DEFAULT 'seite',
  	"seite_id" integer,
  	"adresse" varchar,
  	"neuer_tab" boolean DEFAULT false,
  	"aufklapp" "enum_menue_links_aufklapp" DEFAULT 'fussball'
  );
  
  CREATE TABLE "menue_verein_ueber_uns" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"ziel" "enum_menue_verein_ueber_uns_ziel" DEFAULT 'seite',
  	"seite_id" integer,
  	"adresse" varchar,
  	"neuer_tab" boolean DEFAULT false
  );
  
  CREATE TABLE "menue_verein_mehr" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"ziel" "enum_menue_verein_mehr_ziel" DEFAULT 'seite',
  	"seite_id" integer,
  	"adresse" varchar,
  	"neuer_tab" boolean DEFAULT false
  );
  
  CREATE TABLE "menue_fusszeile_eintraege" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"ziel" "enum_menue_fusszeile_eintraege_ziel" DEFAULT 'seite',
  	"seite_id" integer,
  	"adresse" varchar,
  	"neuer_tab" boolean DEFAULT false
  );
  
  CREATE TABLE "menue_fusszeile" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"titel" varchar NOT NULL
  );
  
  CREATE TABLE "menue_kontakt_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"ziel" "enum_menue_kontakt_links_ziel" DEFAULT 'adresse',
  	"seite_id" integer,
  	"adresse" varchar,
  	"neuer_tab" boolean DEFAULT true
  );
  
  CREATE TABLE "menue" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"fussball_text" varchar DEFAULT 'Junioren, Juniorinnen, Senioren und Damen. Trainingszeiten, Trainerteams und Spielpläne.',
  	"breitensport_text" varchar DEFAULT 'Tanzen, Turnen, Fitness und Gesundheit – vom Kleinkind bis ins hohe Alter.',
  	"verein_text" varchar DEFAULT 'Seit 1919 in Büderich. Vorstand, Satzung, Beiträge und alles rund um die Mitgliedschaft.',
  	"kontakt_anzeigen" boolean DEFAULT true,
  	"kontakt_titel" varchar DEFAULT 'Kontakt',
  	"kontakt_adresse_zeigen" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "texte" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"bilder_uebernommen" boolean DEFAULT false,
  	"hero_tag1" varchar DEFAULT 'Tanzmäuse · 3–6 J.',
  	"hero_tag2" varchar DEFAULT 'Mädchenfußball',
  	"bild_fussball_id" integer,
  	"bild_kids_id" integer,
  	"bild_fitness_id" integer,
  	"hero_titel" varchar DEFAULT 'Bewegung
für alle.',
  	"hero_hand" varchar DEFAULT 'von 1 bis 99 Jahren',
  	"hero_text" varchar DEFAULT 'Tanzen, Turnen, Fußball, Fitness, Yoga und Walking am Rhein – in Büderich, mit über {mitglieder} Mitgliedern und ganz viel Herz. Schnuppern ist überall erwünscht!',
  	"alter_frage" varchar DEFAULT 'Wie alt bist du?',
  	"alter_kein_treffer" varchar DEFAULT 'Schreib uns – wir finden etwas Passendes.',
  	"zahl_mitglieder" varchar DEFAULT 'Mitglieder',
  	"zahl_angebote" varchar DEFAULT 'Teams und Kurse',
  	"zahl_kinder" varchar DEFAULT 'Kinder in der Fußballjugend',
  	"zahl_gruendung" varchar DEFAULT 'gegründet',
  	"welten_titel" varchar DEFAULT 'Ein Verein.
Drei Welten.',
  	"kachel_fussball_label" varchar DEFAULT 'Fußball',
  	"kachel_fussball_titel" varchar DEFAULT '{teams} Teams. Ein neuer Kunstrasen.',
  	"kachel_fussball_text" varchar DEFAULT 'Von Buddy’s Fußballzwergen ab 3 Jahren bis zu den Alten Herren – dazu Damen und Mädchenteams.',
  	"kachel_fussball_link" varchar DEFAULT 'Teams entdecken ›',
  	"kachel_kids_label" varchar DEFAULT 'BSV Kids',
  	"kachel_kids_titel" varchar DEFAULT 'Hüpfen. Tanzen. Turnen.',
  	"kachel_fitness_label" varchar DEFAULT 'Fitness & Gesundheit',
  	"kachel_fitness_titel" varchar DEFAULT 'Dein Puls. Dein Tempo.',
  	"kachel_fitness_text" varchar DEFAULT 'Step & Burn, Zumba, Pilates, Yoga, Spinning, Rehasport und mehr.',
  	"kachel_mitglieder_label" varchar DEFAULT 'Mitgliederbereich',
  	"kachel_mitglieder_titel" varchar DEFAULT 'Training fällt aus?
Du weißt es zuerst.',
  	"kachel_mitglieder_text" varchar DEFAULT 'Ausfälle deiner Kurse, Vereinstermine und deine Anmeldungen – alles an einem Ort, auch auf dem Handy.',
  	"kachel_mitglieder_link" varchar DEFAULT 'Zum Mitgliederbereich ›',
  	"kachel_mitglieder_handy_titel" varchar DEFAULT 'BSV 1919 · jetzt',
  	"kachel_mitglieder_handy_text" varchar DEFAULT 'Spinning fällt heute aus. Nächster Termin wie gewohnt.',
  	"finder_titel" varchar DEFAULT 'Finde deinen Sport.',
  	"finder_link" varchar DEFAULT 'Probetraining ›',
  	"news_ueberschrift" varchar DEFAULT 'Neues aus dem BSV.',
  	"news_link" varchar DEFAULT 'Alle News ›',
  	"news_automatisch" boolean DEFAULT true,
  	"mitglied_titel" varchar DEFAULT 'In fünf Minuten
Mitglied.',
  	"mitglied_text" varchar DEFAULT 'Ab {abMonat} € im Monat, alle Kurse inklusive. Antrag, Beitragsrechner und SEPA-Mandat – alles online.',
  	"schritte_t1" varchar DEFAULT 'Probetraining',
  	"schritte_d1" varchar DEFAULT 'Angebot wählen, Termin anfragen, vorbeikommen.',
  	"schritte_t2" varchar DEFAULT 'Online-Antrag',
  	"schritte_d2" varchar DEFAULT 'Teams und Kurse auswählen, Beitrag berechnen, fertig.',
  	"schritte_t3" varchar DEFAULT 'Loslegen',
  	"schritte_d3" varchar DEFAULT 'Zugang zum Mitgliederbereich inklusive.',
  	"schritte_button" varchar DEFAULT 'Jetzt Mitglied werden',
  	"aktion_aktiv" boolean DEFAULT true,
  	"aktion_kicker" varchar DEFAULT 'Kunstrasen 2026',
  	"aktion_titel" varchar DEFAULT 'Eröffnet – mit Schalke 04.',
  	"aktion_text" varchar,
  	"aktion_link_text" varchar DEFAULT 'Mehr zum Projekt',
  	"aktion_link_url" varchar DEFAULT '/kunstrasen',
  	"aktion_bild_id" integer,
  	"fussball_titel" varchar DEFAULT '{teams} Teams.
Eine Leidenschaft.',
  	"fussball_text" varchar DEFAULT '{kinder} Kinder in der Jugend, Damen- und Mädchenfußball, und die Erste stand erstmals im Kreispokal-Finale. Trainiert wird im Kutscher-Remy-Sportpark – seit 2026 auf Kunstrasen.',
  	"fussball_mitspielen_titel" varchar DEFAULT 'Lust mitzuspielen?',
  	"breitensport_bild1_id" integer,
  	"breitensport_bild2_id" integer,
  	"breitensport_bild3_id" integer,
  	"breitensport_titel" varchar DEFAULT '{kurse} Kurse.
Für jedes Alter.',
  	"breitensport_text" varchar DEFAULT 'Von den Nappy Dancers ab 1,5 Jahren bis zum Seniorenturnen. Unsere Trainerinnen und Trainer sind zum Teil lizenziert – und Schnuppern ist ausdrücklich erwünscht.',
  	"breitensport_schnupper_titel" varchar DEFAULT 'Erst schnuppern.
Dann entscheiden.',
  	"breitensport_schnupper_text" varchar DEFAULT 'Unsere Angebote richten sich an Mitglieder. Zum Ausprobieren bist du trotzdem jederzeit willkommen – auf jeder Kursseite kannst du ein Probetraining anfragen.',
  	"verein_titelbild_id" integer,
  	"verein_titel" varchar DEFAULT 'Seit {gruendung}
in Büderich.',
  	"verein_text" varchar DEFAULT '{mitglieder} Mitglieder, ein Verein für Fußball und Breitensport – getragen von Ehrenamtlichen, Trainerinnen und Trainern und vielen helfenden Händen.',
  	"verein_vorstand_text" varchar DEFAULT 'Ansprechpersonen für alles rund um den Verein. Kontakt läuft über das Formular – E-Mail-Adressen und Telefonnummern bleiben geschützt.',
  	"verein_beitraege_text" varchar DEFAULT 'Vierteljährlich per Lastschrift, jeweils zum 1. eines Quartals. Alle Kurse und Teams inklusive.',
  	"verein_shop_titel" varchar DEFAULT 'Zeig, wo du hingehörst.',
  	"fusszeile_sponsor" varchar DEFAULT 'Hauptsponsor',
  	"fusszeile_sponsor_link" varchar DEFAULT 'Sponsor werden ›',
  	"news_titel" varchar DEFAULT 'Newsroom',
  	"news_text" varchar DEFAULT 'Was im BSV los ist – auf dem Platz, in der Halle, im Verein.',
  	"termine_titel" varchar DEFAULT 'Termine',
  	"termine_text" varchar DEFAULT 'Feste, Turniere, Versammlungen – alles, was im BSV ansteht.',
  	"kontakt_titel" varchar DEFAULT 'Sag Hallo.',
  	"kontakt_text" varchar DEFAULT 'Fragen zu Teams, Kursen, Mitgliedschaft oder Sponsoring? Schreib uns – die Nachricht landet direkt bei der richtigen Person.',
  	"antrag_titel" varchar DEFAULT 'Anmelden beim BSV.',
  	"antrag_text" varchar DEFAULT 'Wähle deine Teams und Kurse, gib deine Daten ein, fertig. Die Trainer werden automatisch informiert.',
  	"sponsoren_titel" varchar DEFAULT 'Danke an unsere Partner.',
  	"sponsoren_text" varchar DEFAULT 'Ohne sie gäbe es keinen Kunstrasen, keine Trikots und keine Turniere. Du möchtest den BSV auch unterstützen? Wir freuen uns auf dich.',
  	"galerie_titel" varchar DEFAULT 'Momente im BSV.',
  	"galerie_text" varchar DEFAULT 'Feste, Turniere und Training – Fotos aus dem Vereinsleben.',
  	"mitmachen_titel" varchar DEFAULT 'Mach mit!',
  	"mitmachen_text" varchar DEFAULT 'Der BSV lebt vom Ehrenamt. Ob eine Stunde im Monat oder jede Woche auf dem Platz – jede Hilfe zählt. Schau, was gerade gebraucht wird.',
  	"probetraining_titel" varchar DEFAULT 'Einfach mal reinschnuppern.',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "texte_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "startseite" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"uebernommen" boolean DEFAULT false,
  	"aktion_aktiv" boolean DEFAULT true,
  	"aktion_kicker" varchar DEFAULT 'Kunstrasen 2026',
  	"aktion_titel" varchar DEFAULT 'Eröffnet – mit Schalke 04.',
  	"aktion_text" varchar,
  	"aktion_link_text" varchar DEFAULT 'Mehr zum Projekt',
  	"aktion_link_url" varchar DEFAULT '/kunstrasen',
  	"aktion_bild_id" integer,
  	"startseite_hero_tag1" varchar DEFAULT 'Tanzmäuse · 3–6 J.',
  	"startseite_hero_tag2" varchar DEFAULT 'Mädchenfußball',
  	"startseite_bild_fussball_id" integer,
  	"startseite_bild_kids_id" integer,
  	"startseite_bild_fitness_id" integer,
  	"startseite_bild_breitensport1_id" integer,
  	"startseite_bild_breitensport2_id" integer,
  	"startseite_bild_breitensport3_id" integer,
  	"startseite_bild_verein_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "startseite_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "verein_beitraege" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"label" varchar NOT NULL,
  	"zielgruppe" varchar,
  	"quartal" numeric NOT NULL
  );
  
  CREATE TABLE "verein_vorstand" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"rolle" varchar NOT NULL,
  	"konto_id" integer,
  	"foto_aus_konto" boolean,
  	"foto_id" integer
  );
  
  CREATE TABLE "verein_kontakt_anliegen" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"titel" varchar NOT NULL,
  	"empfaenger" varchar
  );
  
  CREATE TABLE "verein_downloads" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"titel" varchar NOT NULL,
  	"hinweis" varchar,
  	"nur_mitglieder" boolean,
  	"datei_id" integer,
  	"dokument_id" integer
  );
  
  CREATE TABLE "verein_dsgvo" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"frage" varchar NOT NULL,
  	"antwort" varchar NOT NULL
  );
  
  CREATE TABLE "verein" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar DEFAULT 'Büdericher Spielverein 1919 e.V.',
  	"mitglieder" numeric DEFAULT 1121,
  	"kinder_fussball" numeric DEFAULT 142,
  	"gruendung" numeric DEFAULT 1919,
  	"sportpark" varchar DEFAULT 'Kutscher-Remy-Sportpark
Schützenstraße 25a
46487 Wesel',
  	"postanschrift" varchar DEFAULT 'Am Weißen Stein 2f
46487 Wesel',
  	"sportpark_lat" numeric DEFAULT 51.62638,
  	"sportpark_lon" numeric DEFAULT 6.58253,
  	"halle_lat" numeric,
  	"halle_lon" numeric,
  	"hauptsponsor_name" varchar,
  	"hauptsponsor_url" varchar,
  	"hauptsponsor_logo_id" integer,
  	"passantrag_vorlage_url" varchar DEFAULT 'https://wdfv.de/download/spielberechtigungen/spielberechtigungsantrag.pdf',
  	"passantrag_vorlage_id" integer,
  	"glaeubiger_id" varchar,
  	"startseite_hero_tag1" varchar DEFAULT 'Tanzmäuse · 3–6 J.',
  	"startseite_hero_tag2" varchar DEFAULT 'Mädchenfußball',
  	"startseite_bild_fussball_id" integer,
  	"startseite_bild_kids_id" integer,
  	"startseite_bild_fitness_id" integer,
  	"startseite_bild_breitensport1_id" integer,
  	"startseite_bild_breitensport2_id" integer,
  	"startseite_bild_breitensport3_id" integer,
  	"startseite_bild_verein_id" integer,
  	"aktion_aktiv" boolean DEFAULT true,
  	"aktion_kicker" varchar DEFAULT 'Kunstrasen 2026',
  	"aktion_titel" varchar DEFAULT 'Eröffnet – mit Schalke 04.',
  	"aktion_text" varchar,
  	"aktion_link_text" varchar DEFAULT 'Mehr zum Projekt',
  	"aktion_link_url" varchar DEFAULT '/kunstrasen',
  	"aktion_bild_id" integer,
  	"social_instagram" varchar DEFAULT 'https://www.instagram.com/buedericher_spielverein/',
  	"social_facebook" varchar DEFAULT 'https://www.facebook.com/bsv1919ev/',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "verein_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "datenschutz" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"probetraining_monate" numeric DEFAULT 6,
  	"kontakt_monate" numeric DEFAULT 6,
  	"antraege_monate" numeric DEFAULT 3,
  	"eingaenge_monate" numeric DEFAULT 12,
  	"statistik_monate" numeric DEFAULT 14,
  	"pass_unterlagen_tage" numeric DEFAULT 30,
  	"pass_antrag_monate" numeric DEFAULT 24,
  	"automatisch" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "hilfe_bereiche_anleitungen" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"titel" varchar NOT NULL,
  	"schritte" varchar NOT NULL,
  	"video_id" integer
  );
  
  CREATE TABLE "hilfe_bereiche" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"bereich" "enum_hilfe_bereiche_bereich" NOT NULL,
  	"kurz" varchar,
  	"tipps" varchar
  );
  
  CREATE TABLE "hilfe_faq" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"frage" varchar NOT NULL,
  	"antwort" varchar NOT NULL,
  	"bereich" "enum_hilfe_faq_bereich"
  );
  
  CREATE TABLE "hilfe" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"ansprechperson" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "rollen_rechte" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"redaktion_kontakt_loeschen" boolean DEFAULT false,
  	"redaktion_probetraining_loeschen" boolean DEFAULT false,
  	"kasse_kontaktanfragen" boolean DEFAULT false,
  	"kasse_datenschutz" boolean DEFAULT false,
  	"passwesen_mitgliedschaften" boolean DEFAULT false,
  	"uebungsleitung_probetraining" boolean DEFAULT true,
  	"uebungsleitung_passantraege" boolean DEFAULT true,
  	"uebungsleitung_mitgliederfotos" boolean DEFAULT true,
  	"teamredaktion_ausfaelle" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "sicherheit" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"minuten" numeric DEFAULT 30 NOT NULL,
  	"warnen_minuten" numeric DEFAULT 5 NOT NULL,
  	"aus" boolean DEFAULT false,
  	"papierkorb_tage" numeric DEFAULT 365 NOT NULL,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "mitgliedsantraege_familienmitglieder" ADD CONSTRAINT "mitgliedsantraege_familienmitglieder_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."mitgliedsantraege"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mitgliedsantraege_rels" ADD CONSTRAINT "mitgliedsantraege_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."mitgliedsantraege"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mitgliedsantraege_rels" ADD CONSTRAINT "mitgliedsantraege_rels_angebote_fk" FOREIGN KEY ("angebote_id") REFERENCES "public"."angebote"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "probetraining" ADD CONSTRAINT "probetraining_angebot_id_angebote_id_fk" FOREIGN KEY ("angebot_id") REFERENCES "public"."angebote"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "passantraege" ADD CONSTRAINT "passantraege_team_id_angebote_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."angebote"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "passantraege" ADD CONSTRAINT "passantraege_passantrag_id_passdokumente_id_fk" FOREIGN KEY ("passantrag_id") REFERENCES "public"."passdokumente"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "passantraege" ADD CONSTRAINT "passantraege_ausweis_id_passdokumente_id_fk" FOREIGN KEY ("ausweis_id") REFERENCES "public"."passdokumente"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "passantraege" ADD CONSTRAINT "passantraege_passfoto_id_passdokumente_id_fk" FOREIGN KEY ("passfoto_id") REFERENCES "public"."passdokumente"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "passantraege" ADD CONSTRAINT "passantraege_einwilligung_id_passdokumente_id_fk" FOREIGN KEY ("einwilligung_id") REFERENCES "public"."passdokumente"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "passantraege" ADD CONSTRAINT "passantraege_abmeldung_id_passdokumente_id_fk" FOREIGN KEY ("abmeldung_id") REFERENCES "public"."passdokumente"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "passantraege" ADD CONSTRAINT "passantraege_meldebescheinigung_id_passdokumente_id_fk" FOREIGN KEY ("meldebescheinigung_id") REFERENCES "public"."passdokumente"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "passantraege" ADD CONSTRAINT "passantraege_antragsteller_id_users_id_fk" FOREIGN KEY ("antragsteller_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_populated_authors" ADD CONSTRAINT "posts_populated_authors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_hero_image_id_media_id_fk" FOREIGN KEY ("hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_team_id_angebote_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."angebote"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "posts_rels" ADD CONSTRAINT "posts_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_version_populated_authors" ADD CONSTRAINT "_posts_v_version_populated_authors_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_parent_id_posts_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_hero_image_id_media_id_fk" FOREIGN KEY ("version_hero_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v" ADD CONSTRAINT "_posts_v_version_team_id_angebote_id_fk" FOREIGN KEY ("version_team_id") REFERENCES "public"."angebote"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_posts_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_posts_v_rels" ADD CONSTRAINT "_posts_v_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "termine_auslassen" ADD CONSTRAINT "termine_auslassen_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."termine"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "alben" ADD CONSTRAINT "alben_team_id_angebote_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."angebote"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "alben_rels" ADD CONSTRAINT "alben_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."alben"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "alben_rels" ADD CONSTRAINT "alben_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "media" ADD CONSTRAINT "media_team_id_angebote_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."angebote"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "media" ADD CONSTRAINT "media_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sponsoren" ADD CONSTRAINT "sponsoren_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sponsoren" ADD CONSTRAINT "sponsoren_logo_fusszeile_id_media_id_fk" FOREIGN KEY ("logo_fusszeile_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_hero_links" ADD CONSTRAINT "pages_hero_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta_links" ADD CONSTRAINT "pages_blocks_cta_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_cta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_cta" ADD CONSTRAINT "pages_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_content_columns" ADD CONSTRAINT "pages_blocks_content_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_content" ADD CONSTRAINT "pages_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_media_block" ADD CONSTRAINT "pages_blocks_media_block_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_media_block" ADD CONSTRAINT "pages_blocks_media_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_archive" ADD CONSTRAINT "pages_blocks_archive_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_form_block" ADD CONSTRAINT "pages_blocks_form_block_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_form_block" ADD CONSTRAINT "pages_blocks_form_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_hero_media_id_media_id_fk" FOREIGN KEY ("hero_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages" ADD CONSTRAINT "pages_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_version_hero_links" ADD CONSTRAINT "_pages_v_version_hero_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta_links" ADD CONSTRAINT "_pages_v_blocks_cta_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_cta"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_cta" ADD CONSTRAINT "_pages_v_blocks_cta_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_content_columns" ADD CONSTRAINT "_pages_v_blocks_content_columns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_content"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_content" ADD CONSTRAINT "_pages_v_blocks_content_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_media_block" ADD CONSTRAINT "_pages_v_blocks_media_block_media_id_media_id_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_media_block" ADD CONSTRAINT "_pages_v_blocks_media_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_archive" ADD CONSTRAINT "_pages_v_blocks_archive_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_form_block" ADD CONSTRAINT "_pages_v_blocks_form_block_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_form_block" ADD CONSTRAINT "_pages_v_blocks_form_block_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_hero_media_id_media_id_fk" FOREIGN KEY ("version_hero_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v" ADD CONSTRAINT "_pages_v_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categories_breadcrumbs" ADD CONSTRAINT "categories_breadcrumbs_doc_id_categories_id_fk" FOREIGN KEY ("doc_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categories_breadcrumbs" ADD CONSTRAINT "categories_breadcrumbs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "angebote_zeiten" ADD CONSTRAINT "angebote_zeiten_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."angebote"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "angebote_team" ADD CONSTRAINT "angebote_team_foto_id_media_id_fk" FOREIGN KEY ("foto_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "angebote_team" ADD CONSTRAINT "angebote_team_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."angebote"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "angebote" ADD CONSTRAINT "angebote_bild_id_media_id_fk" FOREIGN KEY ("bild_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "angebote_rels" ADD CONSTRAINT "angebote_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."angebote"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "angebote_rels" ADD CONSTRAINT "angebote_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ausfaelle" ADD CONSTRAINT "ausfaelle_angebot_id_angebote_id_fk" FOREIGN KEY ("angebot_id") REFERENCES "public"."angebote"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "passdokumente" ADD CONSTRAINT "passdokumente_hochgeladen_von_id_users_id_fk" FOREIGN KEY ("hochgeladen_von_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "passdokumente" ADD CONSTRAINT "passdokumente_antrag_id_passantraege_id_fk" FOREIGN KEY ("antrag_id") REFERENCES "public"."passantraege"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "passdokumente" ADD CONSTRAINT "passdokumente_team_id_angebote_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."angebote"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_roles" ADD CONSTRAINT "users_roles_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users" ADD CONSTRAINT "users_profilbild_id_profilbilder_id_fk" FOREIGN KEY ("profilbild_id") REFERENCES "public"."profilbilder"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "users_rels" ADD CONSTRAINT "users_rels_angebote_fk" FOREIGN KEY ("angebote_id") REFERENCES "public"."angebote"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mitgliedschaften" ADD CONSTRAINT "mitgliedschaften_konto_id_users_id_fk" FOREIGN KEY ("konto_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "mitgliedschaften" ADD CONSTRAINT "mitgliedschaften_antrag_id_mitgliedsantraege_id_fk" FOREIGN KEY ("antrag_id") REFERENCES "public"."mitgliedsantraege"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "mitgliedschaften_rels" ADD CONSTRAINT "mitgliedschaften_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."mitgliedschaften"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "mitgliedschaften_rels" ADD CONSTRAINT "mitgliedschaften_rels_angebote_fk" FOREIGN KEY ("angebote_id") REFERENCES "public"."angebote"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "profilbilder" ADD CONSTRAINT "profilbilder_besitzer_id_users_id_fk" FOREIGN KEY ("besitzer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hilfe_feedback" ADD CONSTRAINT "hilfe_feedback_benutzer_id_users_id_fk" FOREIGN KEY ("benutzer_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."redirects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "redirects_rels" ADD CONSTRAINT "redirects_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_checkbox" ADD CONSTRAINT "forms_blocks_checkbox_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_country" ADD CONSTRAINT "forms_blocks_country_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_email" ADD CONSTRAINT "forms_blocks_email_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_message" ADD CONSTRAINT "forms_blocks_message_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_number" ADD CONSTRAINT "forms_blocks_number_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_select_options" ADD CONSTRAINT "forms_blocks_select_options_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms_blocks_select"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_select" ADD CONSTRAINT "forms_blocks_select_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_state" ADD CONSTRAINT "forms_blocks_state_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_text" ADD CONSTRAINT "forms_blocks_text_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_blocks_textarea" ADD CONSTRAINT "forms_blocks_textarea_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "forms_emails" ADD CONSTRAINT "forms_emails_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "form_submissions_submission_data" ADD CONSTRAINT "form_submissions_submission_data_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."form_submissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_form_id_forms_id_fk" FOREIGN KEY ("form_id") REFERENCES "public"."forms"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "search_categories" ADD CONSTRAINT "search_categories_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."search"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search" ADD CONSTRAINT "search_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."search"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "search_rels" ADD CONSTRAINT "search_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_jobs_log" ADD CONSTRAINT "payload_jobs_log_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_jobs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_folders_folder_type" ADD CONSTRAINT "payload_folders_folder_type_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_folders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_folders" ADD CONSTRAINT "payload_folders_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_mitgliedsantraege_fk" FOREIGN KEY ("mitgliedsantraege_id") REFERENCES "public"."mitgliedsantraege"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_kontaktanfragen_fk" FOREIGN KEY ("kontaktanfragen_id") REFERENCES "public"."kontaktanfragen"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_probetraining_fk" FOREIGN KEY ("probetraining_id") REFERENCES "public"."probetraining"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_passantraege_fk" FOREIGN KEY ("passantraege_id") REFERENCES "public"."passantraege"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_termine_fk" FOREIGN KEY ("termine_id") REFERENCES "public"."termine"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_alben_fk" FOREIGN KEY ("alben_id") REFERENCES "public"."alben"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sponsoren_fk" FOREIGN KEY ("sponsoren_id") REFERENCES "public"."sponsoren"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_gesuche_fk" FOREIGN KEY ("gesuche_id") REFERENCES "public"."gesuche"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_angebote_fk" FOREIGN KEY ("angebote_id") REFERENCES "public"."angebote"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ausfaelle_fk" FOREIGN KEY ("ausfaelle_id") REFERENCES "public"."ausfaelle"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_passdokumente_fk" FOREIGN KEY ("passdokumente_id") REFERENCES "public"."passdokumente"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_mitgliedschaften_fk" FOREIGN KEY ("mitgliedschaften_id") REFERENCES "public"."mitgliedschaften"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_profilbilder_fk" FOREIGN KEY ("profilbilder_id") REFERENCES "public"."profilbilder"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_dokumente_fk" FOREIGN KEY ("dokumente_id") REFERENCES "public"."dokumente"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_hilfe_feedback_fk" FOREIGN KEY ("hilfe_feedback_id") REFERENCES "public"."hilfe_feedback"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_statistik_fk" FOREIGN KEY ("statistik_id") REFERENCES "public"."statistik"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_redirects_fk" FOREIGN KEY ("redirects_id") REFERENCES "public"."redirects"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_forms_fk" FOREIGN KEY ("forms_id") REFERENCES "public"."forms"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_form_submissions_fk" FOREIGN KEY ("form_submissions_id") REFERENCES "public"."form_submissions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_search_fk" FOREIGN KEY ("search_id") REFERENCES "public"."search"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_payload_folders_fk" FOREIGN KEY ("payload_folders_id") REFERENCES "public"."payload_folders"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_nav_items" ADD CONSTRAINT "header_nav_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_rels" ADD CONSTRAINT "header_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."header"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_rels" ADD CONSTRAINT "header_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "header_rels" ADD CONSTRAINT "header_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_nav_items" ADD CONSTRAINT "footer_nav_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_rels" ADD CONSTRAINT "footer_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."footer"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_rels" ADD CONSTRAINT "footer_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "footer_rels" ADD CONSTRAINT "footer_rels_posts_fk" FOREIGN KEY ("posts_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "menue_links" ADD CONSTRAINT "menue_links_seite_id_pages_id_fk" FOREIGN KEY ("seite_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "menue_links" ADD CONSTRAINT "menue_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menue"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "menue_verein_ueber_uns" ADD CONSTRAINT "menue_verein_ueber_uns_seite_id_pages_id_fk" FOREIGN KEY ("seite_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "menue_verein_ueber_uns" ADD CONSTRAINT "menue_verein_ueber_uns_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menue"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "menue_verein_mehr" ADD CONSTRAINT "menue_verein_mehr_seite_id_pages_id_fk" FOREIGN KEY ("seite_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "menue_verein_mehr" ADD CONSTRAINT "menue_verein_mehr_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menue"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "menue_fusszeile_eintraege" ADD CONSTRAINT "menue_fusszeile_eintraege_seite_id_pages_id_fk" FOREIGN KEY ("seite_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "menue_fusszeile_eintraege" ADD CONSTRAINT "menue_fusszeile_eintraege_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menue_fusszeile"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "menue_fusszeile" ADD CONSTRAINT "menue_fusszeile_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menue"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "menue_kontakt_links" ADD CONSTRAINT "menue_kontakt_links_seite_id_pages_id_fk" FOREIGN KEY ("seite_id") REFERENCES "public"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "menue_kontakt_links" ADD CONSTRAINT "menue_kontakt_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."menue"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "texte" ADD CONSTRAINT "texte_bild_fussball_id_media_id_fk" FOREIGN KEY ("bild_fussball_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "texte" ADD CONSTRAINT "texte_bild_kids_id_media_id_fk" FOREIGN KEY ("bild_kids_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "texte" ADD CONSTRAINT "texte_bild_fitness_id_media_id_fk" FOREIGN KEY ("bild_fitness_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "texte" ADD CONSTRAINT "texte_aktion_bild_id_media_id_fk" FOREIGN KEY ("aktion_bild_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "texte" ADD CONSTRAINT "texte_breitensport_bild1_id_media_id_fk" FOREIGN KEY ("breitensport_bild1_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "texte" ADD CONSTRAINT "texte_breitensport_bild2_id_media_id_fk" FOREIGN KEY ("breitensport_bild2_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "texte" ADD CONSTRAINT "texte_breitensport_bild3_id_media_id_fk" FOREIGN KEY ("breitensport_bild3_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "texte" ADD CONSTRAINT "texte_verein_titelbild_id_media_id_fk" FOREIGN KEY ("verein_titelbild_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "texte_rels" ADD CONSTRAINT "texte_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."texte"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "texte_rels" ADD CONSTRAINT "texte_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "startseite" ADD CONSTRAINT "startseite_aktion_bild_id_media_id_fk" FOREIGN KEY ("aktion_bild_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "startseite" ADD CONSTRAINT "startseite_startseite_bild_fussball_id_media_id_fk" FOREIGN KEY ("startseite_bild_fussball_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "startseite" ADD CONSTRAINT "startseite_startseite_bild_kids_id_media_id_fk" FOREIGN KEY ("startseite_bild_kids_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "startseite" ADD CONSTRAINT "startseite_startseite_bild_fitness_id_media_id_fk" FOREIGN KEY ("startseite_bild_fitness_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "startseite" ADD CONSTRAINT "startseite_startseite_bild_breitensport1_id_media_id_fk" FOREIGN KEY ("startseite_bild_breitensport1_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "startseite" ADD CONSTRAINT "startseite_startseite_bild_breitensport2_id_media_id_fk" FOREIGN KEY ("startseite_bild_breitensport2_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "startseite" ADD CONSTRAINT "startseite_startseite_bild_breitensport3_id_media_id_fk" FOREIGN KEY ("startseite_bild_breitensport3_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "startseite" ADD CONSTRAINT "startseite_startseite_bild_verein_id_media_id_fk" FOREIGN KEY ("startseite_bild_verein_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "startseite_rels" ADD CONSTRAINT "startseite_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."startseite"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "startseite_rels" ADD CONSTRAINT "startseite_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "verein_beitraege" ADD CONSTRAINT "verein_beitraege_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."verein"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "verein_vorstand" ADD CONSTRAINT "verein_vorstand_konto_id_users_id_fk" FOREIGN KEY ("konto_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "verein_vorstand" ADD CONSTRAINT "verein_vorstand_foto_id_media_id_fk" FOREIGN KEY ("foto_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "verein_vorstand" ADD CONSTRAINT "verein_vorstand_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."verein"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "verein_kontakt_anliegen" ADD CONSTRAINT "verein_kontakt_anliegen_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."verein"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "verein_downloads" ADD CONSTRAINT "verein_downloads_datei_id_media_id_fk" FOREIGN KEY ("datei_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "verein_downloads" ADD CONSTRAINT "verein_downloads_dokument_id_dokumente_id_fk" FOREIGN KEY ("dokument_id") REFERENCES "public"."dokumente"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "verein_downloads" ADD CONSTRAINT "verein_downloads_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."verein"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "verein_dsgvo" ADD CONSTRAINT "verein_dsgvo_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."verein"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "verein" ADD CONSTRAINT "verein_hauptsponsor_logo_id_media_id_fk" FOREIGN KEY ("hauptsponsor_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "verein" ADD CONSTRAINT "verein_passantrag_vorlage_id_media_id_fk" FOREIGN KEY ("passantrag_vorlage_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "verein" ADD CONSTRAINT "verein_startseite_bild_fussball_id_media_id_fk" FOREIGN KEY ("startseite_bild_fussball_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "verein" ADD CONSTRAINT "verein_startseite_bild_kids_id_media_id_fk" FOREIGN KEY ("startseite_bild_kids_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "verein" ADD CONSTRAINT "verein_startseite_bild_fitness_id_media_id_fk" FOREIGN KEY ("startseite_bild_fitness_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "verein" ADD CONSTRAINT "verein_startseite_bild_breitensport1_id_media_id_fk" FOREIGN KEY ("startseite_bild_breitensport1_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "verein" ADD CONSTRAINT "verein_startseite_bild_breitensport2_id_media_id_fk" FOREIGN KEY ("startseite_bild_breitensport2_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "verein" ADD CONSTRAINT "verein_startseite_bild_breitensport3_id_media_id_fk" FOREIGN KEY ("startseite_bild_breitensport3_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "verein" ADD CONSTRAINT "verein_startseite_bild_verein_id_media_id_fk" FOREIGN KEY ("startseite_bild_verein_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "verein" ADD CONSTRAINT "verein_aktion_bild_id_media_id_fk" FOREIGN KEY ("aktion_bild_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "verein_rels" ADD CONSTRAINT "verein_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."verein"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "verein_rels" ADD CONSTRAINT "verein_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hilfe_bereiche_anleitungen" ADD CONSTRAINT "hilfe_bereiche_anleitungen_video_id_media_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "hilfe_bereiche_anleitungen" ADD CONSTRAINT "hilfe_bereiche_anleitungen_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hilfe_bereiche"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hilfe_bereiche" ADD CONSTRAINT "hilfe_bereiche_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hilfe"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "hilfe_faq" ADD CONSTRAINT "hilfe_faq_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."hilfe"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "mitgliedsantraege_familienmitglieder_order_idx" ON "mitgliedsantraege_familienmitglieder" USING btree ("_order");
  CREATE INDEX "mitgliedsantraege_familienmitglieder_parent_id_idx" ON "mitgliedsantraege_familienmitglieder" USING btree ("_parent_id");
  CREATE INDEX "mitgliedsantraege_endgueltig_am_idx" ON "mitgliedsantraege" USING btree ("endgueltig_am");
  CREATE INDEX "mitgliedsantraege_updated_at_idx" ON "mitgliedsantraege" USING btree ("updated_at");
  CREATE INDEX "mitgliedsantraege_created_at_idx" ON "mitgliedsantraege" USING btree ("created_at");
  CREATE INDEX "mitgliedsantraege_deleted_at_idx" ON "mitgliedsantraege" USING btree ("deleted_at");
  CREATE INDEX "mitgliedsantraege_rels_order_idx" ON "mitgliedsantraege_rels" USING btree ("order");
  CREATE INDEX "mitgliedsantraege_rels_parent_idx" ON "mitgliedsantraege_rels" USING btree ("parent_id");
  CREATE INDEX "mitgliedsantraege_rels_path_idx" ON "mitgliedsantraege_rels" USING btree ("path");
  CREATE INDEX "mitgliedsantraege_rels_angebote_id_idx" ON "mitgliedsantraege_rels" USING btree ("angebote_id");
  CREATE INDEX "kontaktanfragen_endgueltig_am_idx" ON "kontaktanfragen" USING btree ("endgueltig_am");
  CREATE INDEX "kontaktanfragen_updated_at_idx" ON "kontaktanfragen" USING btree ("updated_at");
  CREATE INDEX "kontaktanfragen_created_at_idx" ON "kontaktanfragen" USING btree ("created_at");
  CREATE INDEX "kontaktanfragen_deleted_at_idx" ON "kontaktanfragen" USING btree ("deleted_at");
  CREATE INDEX "probetraining_angebot_idx" ON "probetraining" USING btree ("angebot_id");
  CREATE INDEX "probetraining_endgueltig_am_idx" ON "probetraining" USING btree ("endgueltig_am");
  CREATE INDEX "probetraining_updated_at_idx" ON "probetraining" USING btree ("updated_at");
  CREATE INDEX "probetraining_created_at_idx" ON "probetraining" USING btree ("created_at");
  CREATE INDEX "probetraining_deleted_at_idx" ON "probetraining" USING btree ("deleted_at");
  CREATE INDEX "passantraege_status_idx" ON "passantraege" USING btree ("status");
  CREATE INDEX "passantraege_team_idx" ON "passantraege" USING btree ("team_id");
  CREATE INDEX "passantraege_passantrag_idx" ON "passantraege" USING btree ("passantrag_id");
  CREATE INDEX "passantraege_ausweis_idx" ON "passantraege" USING btree ("ausweis_id");
  CREATE INDEX "passantraege_passfoto_idx" ON "passantraege" USING btree ("passfoto_id");
  CREATE INDEX "passantraege_einwilligung_idx" ON "passantraege" USING btree ("einwilligung_id");
  CREATE INDEX "passantraege_abmeldung_idx" ON "passantraege" USING btree ("abmeldung_id");
  CREATE INDEX "passantraege_meldebescheinigung_idx" ON "passantraege" USING btree ("meldebescheinigung_id");
  CREATE INDEX "passantraege_antragsteller_idx" ON "passantraege" USING btree ("antragsteller_id");
  CREATE INDEX "passantraege_abgeschlossen_am_idx" ON "passantraege" USING btree ("abgeschlossen_am");
  CREATE INDEX "passantraege_updated_at_idx" ON "passantraege" USING btree ("updated_at");
  CREATE INDEX "passantraege_created_at_idx" ON "passantraege" USING btree ("created_at");
  CREATE INDEX "posts_populated_authors_order_idx" ON "posts_populated_authors" USING btree ("_order");
  CREATE INDEX "posts_populated_authors_parent_id_idx" ON "posts_populated_authors" USING btree ("_parent_id");
  CREATE INDEX "posts_hero_image_idx" ON "posts" USING btree ("hero_image_id");
  CREATE INDEX "posts_meta_meta_image_idx" ON "posts" USING btree ("meta_image_id");
  CREATE INDEX "posts_team_idx" ON "posts" USING btree ("team_id");
  CREATE UNIQUE INDEX "posts_slug_idx" ON "posts" USING btree ("slug");
  CREATE INDEX "posts_endgueltig_am_idx" ON "posts" USING btree ("endgueltig_am");
  CREATE INDEX "posts_updated_at_idx" ON "posts" USING btree ("updated_at");
  CREATE INDEX "posts_created_at_idx" ON "posts" USING btree ("created_at");
  CREATE INDEX "posts_deleted_at_idx" ON "posts" USING btree ("deleted_at");
  CREATE INDEX "posts__status_idx" ON "posts" USING btree ("_status");
  CREATE INDEX "posts_rels_order_idx" ON "posts_rels" USING btree ("order");
  CREATE INDEX "posts_rels_parent_idx" ON "posts_rels" USING btree ("parent_id");
  CREATE INDEX "posts_rels_path_idx" ON "posts_rels" USING btree ("path");
  CREATE INDEX "posts_rels_posts_id_idx" ON "posts_rels" USING btree ("posts_id");
  CREATE INDEX "posts_rels_categories_id_idx" ON "posts_rels" USING btree ("categories_id");
  CREATE INDEX "posts_rels_users_id_idx" ON "posts_rels" USING btree ("users_id");
  CREATE INDEX "_posts_v_version_populated_authors_order_idx" ON "_posts_v_version_populated_authors" USING btree ("_order");
  CREATE INDEX "_posts_v_version_populated_authors_parent_id_idx" ON "_posts_v_version_populated_authors" USING btree ("_parent_id");
  CREATE INDEX "_posts_v_parent_idx" ON "_posts_v" USING btree ("parent_id");
  CREATE INDEX "_posts_v_version_version_hero_image_idx" ON "_posts_v" USING btree ("version_hero_image_id");
  CREATE INDEX "_posts_v_version_meta_version_meta_image_idx" ON "_posts_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_posts_v_version_version_team_idx" ON "_posts_v" USING btree ("version_team_id");
  CREATE INDEX "_posts_v_version_version_slug_idx" ON "_posts_v" USING btree ("version_slug");
  CREATE INDEX "_posts_v_version_version_endgueltig_am_idx" ON "_posts_v" USING btree ("version_endgueltig_am");
  CREATE INDEX "_posts_v_version_version_updated_at_idx" ON "_posts_v" USING btree ("version_updated_at");
  CREATE INDEX "_posts_v_version_version_created_at_idx" ON "_posts_v" USING btree ("version_created_at");
  CREATE INDEX "_posts_v_version_version_deleted_at_idx" ON "_posts_v" USING btree ("version_deleted_at");
  CREATE INDEX "_posts_v_version_version__status_idx" ON "_posts_v" USING btree ("version__status");
  CREATE INDEX "_posts_v_created_at_idx" ON "_posts_v" USING btree ("created_at");
  CREATE INDEX "_posts_v_updated_at_idx" ON "_posts_v" USING btree ("updated_at");
  CREATE INDEX "_posts_v_latest_idx" ON "_posts_v" USING btree ("latest");
  CREATE INDEX "_posts_v_rels_order_idx" ON "_posts_v_rels" USING btree ("order");
  CREATE INDEX "_posts_v_rels_parent_idx" ON "_posts_v_rels" USING btree ("parent_id");
  CREATE INDEX "_posts_v_rels_path_idx" ON "_posts_v_rels" USING btree ("path");
  CREATE INDEX "_posts_v_rels_posts_id_idx" ON "_posts_v_rels" USING btree ("posts_id");
  CREATE INDEX "_posts_v_rels_categories_id_idx" ON "_posts_v_rels" USING btree ("categories_id");
  CREATE INDEX "_posts_v_rels_users_id_idx" ON "_posts_v_rels" USING btree ("users_id");
  CREATE INDEX "termine_auslassen_order_idx" ON "termine_auslassen" USING btree ("_order");
  CREATE INDEX "termine_auslassen_parent_id_idx" ON "termine_auslassen" USING btree ("_parent_id");
  CREATE INDEX "termine_endgueltig_am_idx" ON "termine" USING btree ("endgueltig_am");
  CREATE INDEX "termine_updated_at_idx" ON "termine" USING btree ("updated_at");
  CREATE INDEX "termine_created_at_idx" ON "termine" USING btree ("created_at");
  CREATE INDEX "termine_deleted_at_idx" ON "termine" USING btree ("deleted_at");
  CREATE INDEX "alben_team_idx" ON "alben" USING btree ("team_id");
  CREATE UNIQUE INDEX "alben_slug_idx" ON "alben" USING btree ("slug");
  CREATE INDEX "alben_endgueltig_am_idx" ON "alben" USING btree ("endgueltig_am");
  CREATE INDEX "alben_updated_at_idx" ON "alben" USING btree ("updated_at");
  CREATE INDEX "alben_created_at_idx" ON "alben" USING btree ("created_at");
  CREATE INDEX "alben_deleted_at_idx" ON "alben" USING btree ("deleted_at");
  CREATE INDEX "alben_rels_order_idx" ON "alben_rels" USING btree ("order");
  CREATE INDEX "alben_rels_parent_idx" ON "alben_rels" USING btree ("parent_id");
  CREATE INDEX "alben_rels_path_idx" ON "alben_rels" USING btree ("path");
  CREATE INDEX "alben_rels_media_id_idx" ON "alben_rels" USING btree ("media_id");
  CREATE INDEX "media_team_idx" ON "media" USING btree ("team_id");
  CREATE INDEX "media_endgueltig_am_idx" ON "media" USING btree ("endgueltig_am");
  CREATE INDEX "media_folder_idx" ON "media" USING btree ("folder_id");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE INDEX "media_deleted_at_idx" ON "media" USING btree ("deleted_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_square_sizes_square_filename_idx" ON "media" USING btree ("sizes_square_filename");
  CREATE INDEX "media_sizes_small_sizes_small_filename_idx" ON "media" USING btree ("sizes_small_filename");
  CREATE INDEX "media_sizes_medium_sizes_medium_filename_idx" ON "media" USING btree ("sizes_medium_filename");
  CREATE INDEX "media_sizes_large_sizes_large_filename_idx" ON "media" USING btree ("sizes_large_filename");
  CREATE INDEX "media_sizes_xlarge_sizes_xlarge_filename_idx" ON "media" USING btree ("sizes_xlarge_filename");
  CREATE INDEX "media_sizes_logo_sizes_logo_filename_idx" ON "media" USING btree ("sizes_logo_filename");
  CREATE INDEX "media_sizes_og_sizes_og_filename_idx" ON "media" USING btree ("sizes_og_filename");
  CREATE INDEX "sponsoren_logo_idx" ON "sponsoren" USING btree ("logo_id");
  CREATE INDEX "sponsoren_logo_fusszeile_idx" ON "sponsoren" USING btree ("logo_fusszeile_id");
  CREATE INDEX "sponsoren_endgueltig_am_idx" ON "sponsoren" USING btree ("endgueltig_am");
  CREATE INDEX "sponsoren_updated_at_idx" ON "sponsoren" USING btree ("updated_at");
  CREATE INDEX "sponsoren_created_at_idx" ON "sponsoren" USING btree ("created_at");
  CREATE INDEX "sponsoren_deleted_at_idx" ON "sponsoren" USING btree ("deleted_at");
  CREATE INDEX "gesuche_endgueltig_am_idx" ON "gesuche" USING btree ("endgueltig_am");
  CREATE INDEX "gesuche_updated_at_idx" ON "gesuche" USING btree ("updated_at");
  CREATE INDEX "gesuche_created_at_idx" ON "gesuche" USING btree ("created_at");
  CREATE INDEX "gesuche_deleted_at_idx" ON "gesuche" USING btree ("deleted_at");
  CREATE INDEX "pages_hero_links_order_idx" ON "pages_hero_links" USING btree ("_order");
  CREATE INDEX "pages_hero_links_parent_id_idx" ON "pages_hero_links" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_links_order_idx" ON "pages_blocks_cta_links" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_links_parent_id_idx" ON "pages_blocks_cta_links" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_order_idx" ON "pages_blocks_cta" USING btree ("_order");
  CREATE INDEX "pages_blocks_cta_parent_id_idx" ON "pages_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_cta_path_idx" ON "pages_blocks_cta" USING btree ("_path");
  CREATE INDEX "pages_blocks_content_columns_order_idx" ON "pages_blocks_content_columns" USING btree ("_order");
  CREATE INDEX "pages_blocks_content_columns_parent_id_idx" ON "pages_blocks_content_columns" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_content_order_idx" ON "pages_blocks_content" USING btree ("_order");
  CREATE INDEX "pages_blocks_content_parent_id_idx" ON "pages_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_content_path_idx" ON "pages_blocks_content" USING btree ("_path");
  CREATE INDEX "pages_blocks_media_block_order_idx" ON "pages_blocks_media_block" USING btree ("_order");
  CREATE INDEX "pages_blocks_media_block_parent_id_idx" ON "pages_blocks_media_block" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_media_block_path_idx" ON "pages_blocks_media_block" USING btree ("_path");
  CREATE INDEX "pages_blocks_media_block_media_idx" ON "pages_blocks_media_block" USING btree ("media_id");
  CREATE INDEX "pages_blocks_archive_order_idx" ON "pages_blocks_archive" USING btree ("_order");
  CREATE INDEX "pages_blocks_archive_parent_id_idx" ON "pages_blocks_archive" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_archive_path_idx" ON "pages_blocks_archive" USING btree ("_path");
  CREATE INDEX "pages_blocks_form_block_order_idx" ON "pages_blocks_form_block" USING btree ("_order");
  CREATE INDEX "pages_blocks_form_block_parent_id_idx" ON "pages_blocks_form_block" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_form_block_path_idx" ON "pages_blocks_form_block" USING btree ("_path");
  CREATE INDEX "pages_blocks_form_block_form_idx" ON "pages_blocks_form_block" USING btree ("form_id");
  CREATE INDEX "pages_hero_hero_media_idx" ON "pages" USING btree ("hero_media_id");
  CREATE INDEX "pages_meta_meta_image_idx" ON "pages" USING btree ("meta_image_id");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "pages" USING btree ("slug");
  CREATE INDEX "pages_endgueltig_am_idx" ON "pages" USING btree ("endgueltig_am");
  CREATE INDEX "pages_updated_at_idx" ON "pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "pages" USING btree ("created_at");
  CREATE INDEX "pages_deleted_at_idx" ON "pages" USING btree ("deleted_at");
  CREATE INDEX "pages__status_idx" ON "pages" USING btree ("_status");
  CREATE INDEX "pages_rels_order_idx" ON "pages_rels" USING btree ("order");
  CREATE INDEX "pages_rels_parent_idx" ON "pages_rels" USING btree ("parent_id");
  CREATE INDEX "pages_rels_path_idx" ON "pages_rels" USING btree ("path");
  CREATE INDEX "pages_rels_pages_id_idx" ON "pages_rels" USING btree ("pages_id");
  CREATE INDEX "pages_rels_posts_id_idx" ON "pages_rels" USING btree ("posts_id");
  CREATE INDEX "pages_rels_categories_id_idx" ON "pages_rels" USING btree ("categories_id");
  CREATE INDEX "_pages_v_version_hero_links_order_idx" ON "_pages_v_version_hero_links" USING btree ("_order");
  CREATE INDEX "_pages_v_version_hero_links_parent_id_idx" ON "_pages_v_version_hero_links" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_links_order_idx" ON "_pages_v_blocks_cta_links" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cta_links_parent_id_idx" ON "_pages_v_blocks_cta_links" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_order_idx" ON "_pages_v_blocks_cta" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_cta_parent_id_idx" ON "_pages_v_blocks_cta" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_cta_path_idx" ON "_pages_v_blocks_cta" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_content_columns_order_idx" ON "_pages_v_blocks_content_columns" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_content_columns_parent_id_idx" ON "_pages_v_blocks_content_columns" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_content_order_idx" ON "_pages_v_blocks_content" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_content_parent_id_idx" ON "_pages_v_blocks_content" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_content_path_idx" ON "_pages_v_blocks_content" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_media_block_order_idx" ON "_pages_v_blocks_media_block" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_media_block_parent_id_idx" ON "_pages_v_blocks_media_block" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_media_block_path_idx" ON "_pages_v_blocks_media_block" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_media_block_media_idx" ON "_pages_v_blocks_media_block" USING btree ("media_id");
  CREATE INDEX "_pages_v_blocks_archive_order_idx" ON "_pages_v_blocks_archive" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_archive_parent_id_idx" ON "_pages_v_blocks_archive" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_archive_path_idx" ON "_pages_v_blocks_archive" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_form_block_order_idx" ON "_pages_v_blocks_form_block" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_form_block_parent_id_idx" ON "_pages_v_blocks_form_block" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_form_block_path_idx" ON "_pages_v_blocks_form_block" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_form_block_form_idx" ON "_pages_v_blocks_form_block" USING btree ("form_id");
  CREATE INDEX "_pages_v_parent_idx" ON "_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_hero_version_hero_media_idx" ON "_pages_v" USING btree ("version_hero_media_id");
  CREATE INDEX "_pages_v_version_meta_version_meta_image_idx" ON "_pages_v" USING btree ("version_meta_image_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_version_endgueltig_am_idx" ON "_pages_v" USING btree ("version_endgueltig_am");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version_deleted_at_idx" ON "_pages_v" USING btree ("version_deleted_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_latest_idx" ON "_pages_v" USING btree ("latest");
  CREATE INDEX "_pages_v_autosave_idx" ON "_pages_v" USING btree ("autosave");
  CREATE INDEX "_pages_v_rels_order_idx" ON "_pages_v_rels" USING btree ("order");
  CREATE INDEX "_pages_v_rels_parent_idx" ON "_pages_v_rels" USING btree ("parent_id");
  CREATE INDEX "_pages_v_rels_path_idx" ON "_pages_v_rels" USING btree ("path");
  CREATE INDEX "_pages_v_rels_pages_id_idx" ON "_pages_v_rels" USING btree ("pages_id");
  CREATE INDEX "_pages_v_rels_posts_id_idx" ON "_pages_v_rels" USING btree ("posts_id");
  CREATE INDEX "_pages_v_rels_categories_id_idx" ON "_pages_v_rels" USING btree ("categories_id");
  CREATE INDEX "categories_breadcrumbs_order_idx" ON "categories_breadcrumbs" USING btree ("_order");
  CREATE INDEX "categories_breadcrumbs_parent_id_idx" ON "categories_breadcrumbs" USING btree ("_parent_id");
  CREATE INDEX "categories_breadcrumbs_doc_idx" ON "categories_breadcrumbs" USING btree ("doc_id");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");
  CREATE INDEX "categories_endgueltig_am_idx" ON "categories" USING btree ("endgueltig_am");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE INDEX "categories_deleted_at_idx" ON "categories" USING btree ("deleted_at");
  CREATE INDEX "angebote_zeiten_order_idx" ON "angebote_zeiten" USING btree ("_order");
  CREATE INDEX "angebote_zeiten_parent_id_idx" ON "angebote_zeiten" USING btree ("_parent_id");
  CREATE INDEX "angebote_team_order_idx" ON "angebote_team" USING btree ("_order");
  CREATE INDEX "angebote_team_parent_id_idx" ON "angebote_team" USING btree ("_parent_id");
  CREATE INDEX "angebote_team_foto_idx" ON "angebote_team" USING btree ("foto_id");
  CREATE INDEX "angebote_bild_idx" ON "angebote" USING btree ("bild_id");
  CREATE UNIQUE INDEX "angebote_slug_idx" ON "angebote" USING btree ("slug");
  CREATE INDEX "angebote_endgueltig_am_idx" ON "angebote" USING btree ("endgueltig_am");
  CREATE INDEX "angebote_updated_at_idx" ON "angebote" USING btree ("updated_at");
  CREATE INDEX "angebote_created_at_idx" ON "angebote" USING btree ("created_at");
  CREATE INDEX "angebote_deleted_at_idx" ON "angebote" USING btree ("deleted_at");
  CREATE INDEX "angebote_rels_order_idx" ON "angebote_rels" USING btree ("order");
  CREATE INDEX "angebote_rels_parent_idx" ON "angebote_rels" USING btree ("parent_id");
  CREATE INDEX "angebote_rels_path_idx" ON "angebote_rels" USING btree ("path");
  CREATE INDEX "angebote_rels_users_id_idx" ON "angebote_rels" USING btree ("users_id");
  CREATE INDEX "ausfaelle_angebot_idx" ON "ausfaelle" USING btree ("angebot_id");
  CREATE INDEX "ausfaelle_endgueltig_am_idx" ON "ausfaelle" USING btree ("endgueltig_am");
  CREATE INDEX "ausfaelle_updated_at_idx" ON "ausfaelle" USING btree ("updated_at");
  CREATE INDEX "ausfaelle_created_at_idx" ON "ausfaelle" USING btree ("created_at");
  CREATE INDEX "ausfaelle_deleted_at_idx" ON "ausfaelle" USING btree ("deleted_at");
  CREATE INDEX "passdokumente_hochgeladen_von_idx" ON "passdokumente" USING btree ("hochgeladen_von_id");
  CREATE INDEX "passdokumente_antrag_idx" ON "passdokumente" USING btree ("antrag_id");
  CREATE INDEX "passdokumente_team_idx" ON "passdokumente" USING btree ("team_id");
  CREATE INDEX "passdokumente_updated_at_idx" ON "passdokumente" USING btree ("updated_at");
  CREATE INDEX "passdokumente_created_at_idx" ON "passdokumente" USING btree ("created_at");
  CREATE UNIQUE INDEX "passdokumente_filename_idx" ON "passdokumente" USING btree ("filename");
  CREATE INDEX "users_roles_order_idx" ON "users_roles" USING btree ("order");
  CREATE INDEX "users_roles_parent_idx" ON "users_roles" USING btree ("parent_id");
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_profilbild_idx" ON "users" USING btree ("profilbild_id");
  CREATE INDEX "users_bestaetigung_hash_idx" ON "users" USING btree ("bestaetigung_hash");
  CREATE INDEX "users_google_id_idx" ON "users" USING btree ("google_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "users_rels_order_idx" ON "users_rels" USING btree ("order");
  CREATE INDEX "users_rels_parent_idx" ON "users_rels" USING btree ("parent_id");
  CREATE INDEX "users_rels_path_idx" ON "users_rels" USING btree ("path");
  CREATE INDEX "users_rels_angebote_id_idx" ON "users_rels" USING btree ("angebote_id");
  CREATE INDEX "mitgliedschaften_mitgliedsnummer_idx" ON "mitgliedschaften" USING btree ("mitgliedsnummer");
  CREATE INDEX "mitgliedschaften_konto_idx" ON "mitgliedschaften" USING btree ("konto_id");
  CREATE INDEX "mitgliedschaften_email_idx" ON "mitgliedschaften" USING btree ("email");
  CREATE INDEX "mitgliedschaften_antrag_idx" ON "mitgliedschaften" USING btree ("antrag_id");
  CREATE INDEX "mitgliedschaften_endgueltig_am_idx" ON "mitgliedschaften" USING btree ("endgueltig_am");
  CREATE INDEX "mitgliedschaften_updated_at_idx" ON "mitgliedschaften" USING btree ("updated_at");
  CREATE INDEX "mitgliedschaften_created_at_idx" ON "mitgliedschaften" USING btree ("created_at");
  CREATE INDEX "mitgliedschaften_deleted_at_idx" ON "mitgliedschaften" USING btree ("deleted_at");
  CREATE INDEX "mitgliedschaften_rels_order_idx" ON "mitgliedschaften_rels" USING btree ("order");
  CREATE INDEX "mitgliedschaften_rels_parent_idx" ON "mitgliedschaften_rels" USING btree ("parent_id");
  CREATE INDEX "mitgliedschaften_rels_path_idx" ON "mitgliedschaften_rels" USING btree ("path");
  CREATE INDEX "mitgliedschaften_rels_angebote_id_idx" ON "mitgliedschaften_rels" USING btree ("angebote_id");
  CREATE INDEX "profilbilder_besitzer_idx" ON "profilbilder" USING btree ("besitzer_id");
  CREATE INDEX "profilbilder_updated_at_idx" ON "profilbilder" USING btree ("updated_at");
  CREATE INDEX "profilbilder_created_at_idx" ON "profilbilder" USING btree ("created_at");
  CREATE UNIQUE INDEX "profilbilder_filename_idx" ON "profilbilder" USING btree ("filename");
  CREATE INDEX "profilbilder_sizes_klein_sizes_klein_filename_idx" ON "profilbilder" USING btree ("sizes_klein_filename");
  CREATE INDEX "dokumente_endgueltig_am_idx" ON "dokumente" USING btree ("endgueltig_am");
  CREATE INDEX "dokumente_updated_at_idx" ON "dokumente" USING btree ("updated_at");
  CREATE INDEX "dokumente_created_at_idx" ON "dokumente" USING btree ("created_at");
  CREATE INDEX "dokumente_deleted_at_idx" ON "dokumente" USING btree ("deleted_at");
  CREATE UNIQUE INDEX "dokumente_filename_idx" ON "dokumente" USING btree ("filename");
  CREATE INDEX "hilfe_feedback_benutzer_idx" ON "hilfe_feedback" USING btree ("benutzer_id");
  CREATE INDEX "hilfe_feedback_updated_at_idx" ON "hilfe_feedback" USING btree ("updated_at");
  CREATE INDEX "hilfe_feedback_created_at_idx" ON "hilfe_feedback" USING btree ("created_at");
  CREATE INDEX "statistik_tag_idx" ON "statistik" USING btree ("tag");
  CREATE INDEX "statistik_art_idx" ON "statistik" USING btree ("art");
  CREATE INDEX "statistik_pfad_idx" ON "statistik" USING btree ("pfad");
  CREATE INDEX "statistik_besucher_idx" ON "statistik" USING btree ("besucher");
  CREATE INDEX "statistik_updated_at_idx" ON "statistik" USING btree ("updated_at");
  CREATE INDEX "statistik_created_at_idx" ON "statistik" USING btree ("created_at");
  CREATE UNIQUE INDEX "redirects_from_idx" ON "redirects" USING btree ("from");
  CREATE INDEX "redirects_updated_at_idx" ON "redirects" USING btree ("updated_at");
  CREATE INDEX "redirects_created_at_idx" ON "redirects" USING btree ("created_at");
  CREATE INDEX "redirects_rels_order_idx" ON "redirects_rels" USING btree ("order");
  CREATE INDEX "redirects_rels_parent_idx" ON "redirects_rels" USING btree ("parent_id");
  CREATE INDEX "redirects_rels_path_idx" ON "redirects_rels" USING btree ("path");
  CREATE INDEX "redirects_rels_pages_id_idx" ON "redirects_rels" USING btree ("pages_id");
  CREATE INDEX "redirects_rels_posts_id_idx" ON "redirects_rels" USING btree ("posts_id");
  CREATE INDEX "forms_blocks_checkbox_order_idx" ON "forms_blocks_checkbox" USING btree ("_order");
  CREATE INDEX "forms_blocks_checkbox_parent_id_idx" ON "forms_blocks_checkbox" USING btree ("_parent_id");
  CREATE INDEX "forms_blocks_checkbox_path_idx" ON "forms_blocks_checkbox" USING btree ("_path");
  CREATE INDEX "forms_blocks_country_order_idx" ON "forms_blocks_country" USING btree ("_order");
  CREATE INDEX "forms_blocks_country_parent_id_idx" ON "forms_blocks_country" USING btree ("_parent_id");
  CREATE INDEX "forms_blocks_country_path_idx" ON "forms_blocks_country" USING btree ("_path");
  CREATE INDEX "forms_blocks_email_order_idx" ON "forms_blocks_email" USING btree ("_order");
  CREATE INDEX "forms_blocks_email_parent_id_idx" ON "forms_blocks_email" USING btree ("_parent_id");
  CREATE INDEX "forms_blocks_email_path_idx" ON "forms_blocks_email" USING btree ("_path");
  CREATE INDEX "forms_blocks_message_order_idx" ON "forms_blocks_message" USING btree ("_order");
  CREATE INDEX "forms_blocks_message_parent_id_idx" ON "forms_blocks_message" USING btree ("_parent_id");
  CREATE INDEX "forms_blocks_message_path_idx" ON "forms_blocks_message" USING btree ("_path");
  CREATE INDEX "forms_blocks_number_order_idx" ON "forms_blocks_number" USING btree ("_order");
  CREATE INDEX "forms_blocks_number_parent_id_idx" ON "forms_blocks_number" USING btree ("_parent_id");
  CREATE INDEX "forms_blocks_number_path_idx" ON "forms_blocks_number" USING btree ("_path");
  CREATE INDEX "forms_blocks_select_options_order_idx" ON "forms_blocks_select_options" USING btree ("_order");
  CREATE INDEX "forms_blocks_select_options_parent_id_idx" ON "forms_blocks_select_options" USING btree ("_parent_id");
  CREATE INDEX "forms_blocks_select_order_idx" ON "forms_blocks_select" USING btree ("_order");
  CREATE INDEX "forms_blocks_select_parent_id_idx" ON "forms_blocks_select" USING btree ("_parent_id");
  CREATE INDEX "forms_blocks_select_path_idx" ON "forms_blocks_select" USING btree ("_path");
  CREATE INDEX "forms_blocks_state_order_idx" ON "forms_blocks_state" USING btree ("_order");
  CREATE INDEX "forms_blocks_state_parent_id_idx" ON "forms_blocks_state" USING btree ("_parent_id");
  CREATE INDEX "forms_blocks_state_path_idx" ON "forms_blocks_state" USING btree ("_path");
  CREATE INDEX "forms_blocks_text_order_idx" ON "forms_blocks_text" USING btree ("_order");
  CREATE INDEX "forms_blocks_text_parent_id_idx" ON "forms_blocks_text" USING btree ("_parent_id");
  CREATE INDEX "forms_blocks_text_path_idx" ON "forms_blocks_text" USING btree ("_path");
  CREATE INDEX "forms_blocks_textarea_order_idx" ON "forms_blocks_textarea" USING btree ("_order");
  CREATE INDEX "forms_blocks_textarea_parent_id_idx" ON "forms_blocks_textarea" USING btree ("_parent_id");
  CREATE INDEX "forms_blocks_textarea_path_idx" ON "forms_blocks_textarea" USING btree ("_path");
  CREATE INDEX "forms_emails_order_idx" ON "forms_emails" USING btree ("_order");
  CREATE INDEX "forms_emails_parent_id_idx" ON "forms_emails" USING btree ("_parent_id");
  CREATE INDEX "forms_endgueltig_am_idx" ON "forms" USING btree ("endgueltig_am");
  CREATE INDEX "forms_updated_at_idx" ON "forms" USING btree ("updated_at");
  CREATE INDEX "forms_created_at_idx" ON "forms" USING btree ("created_at");
  CREATE INDEX "forms_deleted_at_idx" ON "forms" USING btree ("deleted_at");
  CREATE INDEX "form_submissions_submission_data_order_idx" ON "form_submissions_submission_data" USING btree ("_order");
  CREATE INDEX "form_submissions_submission_data_parent_id_idx" ON "form_submissions_submission_data" USING btree ("_parent_id");
  CREATE INDEX "form_submissions_form_idx" ON "form_submissions" USING btree ("form_id");
  CREATE INDEX "form_submissions_endgueltig_am_idx" ON "form_submissions" USING btree ("endgueltig_am");
  CREATE INDEX "form_submissions_updated_at_idx" ON "form_submissions" USING btree ("updated_at");
  CREATE INDEX "form_submissions_created_at_idx" ON "form_submissions" USING btree ("created_at");
  CREATE INDEX "form_submissions_deleted_at_idx" ON "form_submissions" USING btree ("deleted_at");
  CREATE INDEX "search_categories_order_idx" ON "search_categories" USING btree ("_order");
  CREATE INDEX "search_categories_parent_id_idx" ON "search_categories" USING btree ("_parent_id");
  CREATE INDEX "search_slug_idx" ON "search" USING btree ("slug");
  CREATE INDEX "search_meta_meta_image_idx" ON "search" USING btree ("meta_image_id");
  CREATE INDEX "search_updated_at_idx" ON "search" USING btree ("updated_at");
  CREATE INDEX "search_created_at_idx" ON "search" USING btree ("created_at");
  CREATE INDEX "search_rels_order_idx" ON "search_rels" USING btree ("order");
  CREATE INDEX "search_rels_parent_idx" ON "search_rels" USING btree ("parent_id");
  CREATE INDEX "search_rels_path_idx" ON "search_rels" USING btree ("path");
  CREATE INDEX "search_rels_posts_id_idx" ON "search_rels" USING btree ("posts_id");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_jobs_log_order_idx" ON "payload_jobs_log" USING btree ("_order");
  CREATE INDEX "payload_jobs_log_parent_id_idx" ON "payload_jobs_log" USING btree ("_parent_id");
  CREATE INDEX "payload_jobs_completed_at_idx" ON "payload_jobs" USING btree ("completed_at");
  CREATE INDEX "payload_jobs_total_tried_idx" ON "payload_jobs" USING btree ("total_tried");
  CREATE INDEX "payload_jobs_has_error_idx" ON "payload_jobs" USING btree ("has_error");
  CREATE INDEX "payload_jobs_task_slug_idx" ON "payload_jobs" USING btree ("task_slug");
  CREATE INDEX "payload_jobs_queue_idx" ON "payload_jobs" USING btree ("queue");
  CREATE INDEX "payload_jobs_wait_until_idx" ON "payload_jobs" USING btree ("wait_until");
  CREATE INDEX "payload_jobs_processing_idx" ON "payload_jobs" USING btree ("processing");
  CREATE INDEX "payload_jobs_updated_at_idx" ON "payload_jobs" USING btree ("updated_at");
  CREATE INDEX "payload_jobs_created_at_idx" ON "payload_jobs" USING btree ("created_at");
  CREATE INDEX "payload_folders_folder_type_order_idx" ON "payload_folders_folder_type" USING btree ("order");
  CREATE INDEX "payload_folders_folder_type_parent_idx" ON "payload_folders_folder_type" USING btree ("parent_id");
  CREATE INDEX "payload_folders_name_idx" ON "payload_folders" USING btree ("name");
  CREATE INDEX "payload_folders_folder_idx" ON "payload_folders" USING btree ("folder_id");
  CREATE INDEX "payload_folders_updated_at_idx" ON "payload_folders" USING btree ("updated_at");
  CREATE INDEX "payload_folders_created_at_idx" ON "payload_folders" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_mitgliedsantraege_id_idx" ON "payload_locked_documents_rels" USING btree ("mitgliedsantraege_id");
  CREATE INDEX "payload_locked_documents_rels_kontaktanfragen_id_idx" ON "payload_locked_documents_rels" USING btree ("kontaktanfragen_id");
  CREATE INDEX "payload_locked_documents_rels_probetraining_id_idx" ON "payload_locked_documents_rels" USING btree ("probetraining_id");
  CREATE INDEX "payload_locked_documents_rels_passantraege_id_idx" ON "payload_locked_documents_rels" USING btree ("passantraege_id");
  CREATE INDEX "payload_locked_documents_rels_posts_id_idx" ON "payload_locked_documents_rels" USING btree ("posts_id");
  CREATE INDEX "payload_locked_documents_rels_termine_id_idx" ON "payload_locked_documents_rels" USING btree ("termine_id");
  CREATE INDEX "payload_locked_documents_rels_alben_id_idx" ON "payload_locked_documents_rels" USING btree ("alben_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_sponsoren_id_idx" ON "payload_locked_documents_rels" USING btree ("sponsoren_id");
  CREATE INDEX "payload_locked_documents_rels_gesuche_id_idx" ON "payload_locked_documents_rels" USING btree ("gesuche_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_angebote_id_idx" ON "payload_locked_documents_rels" USING btree ("angebote_id");
  CREATE INDEX "payload_locked_documents_rels_ausfaelle_id_idx" ON "payload_locked_documents_rels" USING btree ("ausfaelle_id");
  CREATE INDEX "payload_locked_documents_rels_passdokumente_id_idx" ON "payload_locked_documents_rels" USING btree ("passdokumente_id");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_mitgliedschaften_id_idx" ON "payload_locked_documents_rels" USING btree ("mitgliedschaften_id");
  CREATE INDEX "payload_locked_documents_rels_profilbilder_id_idx" ON "payload_locked_documents_rels" USING btree ("profilbilder_id");
  CREATE INDEX "payload_locked_documents_rels_dokumente_id_idx" ON "payload_locked_documents_rels" USING btree ("dokumente_id");
  CREATE INDEX "payload_locked_documents_rels_hilfe_feedback_id_idx" ON "payload_locked_documents_rels" USING btree ("hilfe_feedback_id");
  CREATE INDEX "payload_locked_documents_rels_statistik_id_idx" ON "payload_locked_documents_rels" USING btree ("statistik_id");
  CREATE INDEX "payload_locked_documents_rels_redirects_id_idx" ON "payload_locked_documents_rels" USING btree ("redirects_id");
  CREATE INDEX "payload_locked_documents_rels_forms_id_idx" ON "payload_locked_documents_rels" USING btree ("forms_id");
  CREATE INDEX "payload_locked_documents_rels_form_submissions_id_idx" ON "payload_locked_documents_rels" USING btree ("form_submissions_id");
  CREATE INDEX "payload_locked_documents_rels_search_id_idx" ON "payload_locked_documents_rels" USING btree ("search_id");
  CREATE INDEX "payload_locked_documents_rels_payload_folders_id_idx" ON "payload_locked_documents_rels" USING btree ("payload_folders_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "header_nav_items_order_idx" ON "header_nav_items" USING btree ("_order");
  CREATE INDEX "header_nav_items_parent_id_idx" ON "header_nav_items" USING btree ("_parent_id");
  CREATE INDEX "header_rels_order_idx" ON "header_rels" USING btree ("order");
  CREATE INDEX "header_rels_parent_idx" ON "header_rels" USING btree ("parent_id");
  CREATE INDEX "header_rels_path_idx" ON "header_rels" USING btree ("path");
  CREATE INDEX "header_rels_pages_id_idx" ON "header_rels" USING btree ("pages_id");
  CREATE INDEX "header_rels_posts_id_idx" ON "header_rels" USING btree ("posts_id");
  CREATE INDEX "footer_nav_items_order_idx" ON "footer_nav_items" USING btree ("_order");
  CREATE INDEX "footer_nav_items_parent_id_idx" ON "footer_nav_items" USING btree ("_parent_id");
  CREATE INDEX "footer_rels_order_idx" ON "footer_rels" USING btree ("order");
  CREATE INDEX "footer_rels_parent_idx" ON "footer_rels" USING btree ("parent_id");
  CREATE INDEX "footer_rels_path_idx" ON "footer_rels" USING btree ("path");
  CREATE INDEX "footer_rels_pages_id_idx" ON "footer_rels" USING btree ("pages_id");
  CREATE INDEX "footer_rels_posts_id_idx" ON "footer_rels" USING btree ("posts_id");
  CREATE INDEX "menue_links_order_idx" ON "menue_links" USING btree ("_order");
  CREATE INDEX "menue_links_parent_id_idx" ON "menue_links" USING btree ("_parent_id");
  CREATE INDEX "menue_links_seite_idx" ON "menue_links" USING btree ("seite_id");
  CREATE INDEX "menue_verein_ueber_uns_order_idx" ON "menue_verein_ueber_uns" USING btree ("_order");
  CREATE INDEX "menue_verein_ueber_uns_parent_id_idx" ON "menue_verein_ueber_uns" USING btree ("_parent_id");
  CREATE INDEX "menue_verein_ueber_uns_seite_idx" ON "menue_verein_ueber_uns" USING btree ("seite_id");
  CREATE INDEX "menue_verein_mehr_order_idx" ON "menue_verein_mehr" USING btree ("_order");
  CREATE INDEX "menue_verein_mehr_parent_id_idx" ON "menue_verein_mehr" USING btree ("_parent_id");
  CREATE INDEX "menue_verein_mehr_seite_idx" ON "menue_verein_mehr" USING btree ("seite_id");
  CREATE INDEX "menue_fusszeile_eintraege_order_idx" ON "menue_fusszeile_eintraege" USING btree ("_order");
  CREATE INDEX "menue_fusszeile_eintraege_parent_id_idx" ON "menue_fusszeile_eintraege" USING btree ("_parent_id");
  CREATE INDEX "menue_fusszeile_eintraege_seite_idx" ON "menue_fusszeile_eintraege" USING btree ("seite_id");
  CREATE INDEX "menue_fusszeile_order_idx" ON "menue_fusszeile" USING btree ("_order");
  CREATE INDEX "menue_fusszeile_parent_id_idx" ON "menue_fusszeile" USING btree ("_parent_id");
  CREATE INDEX "menue_kontakt_links_order_idx" ON "menue_kontakt_links" USING btree ("_order");
  CREATE INDEX "menue_kontakt_links_parent_id_idx" ON "menue_kontakt_links" USING btree ("_parent_id");
  CREATE INDEX "menue_kontakt_links_seite_idx" ON "menue_kontakt_links" USING btree ("seite_id");
  CREATE INDEX "texte_bild_fussball_idx" ON "texte" USING btree ("bild_fussball_id");
  CREATE INDEX "texte_bild_kids_idx" ON "texte" USING btree ("bild_kids_id");
  CREATE INDEX "texte_bild_fitness_idx" ON "texte" USING btree ("bild_fitness_id");
  CREATE INDEX "texte_aktion_aktion_bild_idx" ON "texte" USING btree ("aktion_bild_id");
  CREATE INDEX "texte_breitensport_breitensport_bild1_idx" ON "texte" USING btree ("breitensport_bild1_id");
  CREATE INDEX "texte_breitensport_breitensport_bild2_idx" ON "texte" USING btree ("breitensport_bild2_id");
  CREATE INDEX "texte_breitensport_breitensport_bild3_idx" ON "texte" USING btree ("breitensport_bild3_id");
  CREATE INDEX "texte_verein_verein_titelbild_idx" ON "texte" USING btree ("verein_titelbild_id");
  CREATE INDEX "texte_rels_order_idx" ON "texte_rels" USING btree ("order");
  CREATE INDEX "texte_rels_parent_idx" ON "texte_rels" USING btree ("parent_id");
  CREATE INDEX "texte_rels_path_idx" ON "texte_rels" USING btree ("path");
  CREATE INDEX "texte_rels_media_id_idx" ON "texte_rels" USING btree ("media_id");
  CREATE INDEX "startseite_aktion_aktion_bild_idx" ON "startseite" USING btree ("aktion_bild_id");
  CREATE INDEX "startseite_startseite_startseite_bild_fussball_idx" ON "startseite" USING btree ("startseite_bild_fussball_id");
  CREATE INDEX "startseite_startseite_startseite_bild_kids_idx" ON "startseite" USING btree ("startseite_bild_kids_id");
  CREATE INDEX "startseite_startseite_startseite_bild_fitness_idx" ON "startseite" USING btree ("startseite_bild_fitness_id");
  CREATE INDEX "startseite_startseite_startseite_bild_breitensport1_idx" ON "startseite" USING btree ("startseite_bild_breitensport1_id");
  CREATE INDEX "startseite_startseite_startseite_bild_breitensport2_idx" ON "startseite" USING btree ("startseite_bild_breitensport2_id");
  CREATE INDEX "startseite_startseite_startseite_bild_breitensport3_idx" ON "startseite" USING btree ("startseite_bild_breitensport3_id");
  CREATE INDEX "startseite_startseite_startseite_bild_verein_idx" ON "startseite" USING btree ("startseite_bild_verein_id");
  CREATE INDEX "startseite_rels_order_idx" ON "startseite_rels" USING btree ("order");
  CREATE INDEX "startseite_rels_parent_idx" ON "startseite_rels" USING btree ("parent_id");
  CREATE INDEX "startseite_rels_path_idx" ON "startseite_rels" USING btree ("path");
  CREATE INDEX "startseite_rels_media_id_idx" ON "startseite_rels" USING btree ("media_id");
  CREATE INDEX "verein_beitraege_order_idx" ON "verein_beitraege" USING btree ("_order");
  CREATE INDEX "verein_beitraege_parent_id_idx" ON "verein_beitraege" USING btree ("_parent_id");
  CREATE INDEX "verein_vorstand_order_idx" ON "verein_vorstand" USING btree ("_order");
  CREATE INDEX "verein_vorstand_parent_id_idx" ON "verein_vorstand" USING btree ("_parent_id");
  CREATE INDEX "verein_vorstand_konto_idx" ON "verein_vorstand" USING btree ("konto_id");
  CREATE INDEX "verein_vorstand_foto_idx" ON "verein_vorstand" USING btree ("foto_id");
  CREATE INDEX "verein_kontakt_anliegen_order_idx" ON "verein_kontakt_anliegen" USING btree ("_order");
  CREATE INDEX "verein_kontakt_anliegen_parent_id_idx" ON "verein_kontakt_anliegen" USING btree ("_parent_id");
  CREATE INDEX "verein_downloads_order_idx" ON "verein_downloads" USING btree ("_order");
  CREATE INDEX "verein_downloads_parent_id_idx" ON "verein_downloads" USING btree ("_parent_id");
  CREATE INDEX "verein_downloads_datei_idx" ON "verein_downloads" USING btree ("datei_id");
  CREATE INDEX "verein_downloads_dokument_idx" ON "verein_downloads" USING btree ("dokument_id");
  CREATE INDEX "verein_dsgvo_order_idx" ON "verein_dsgvo" USING btree ("_order");
  CREATE INDEX "verein_dsgvo_parent_id_idx" ON "verein_dsgvo" USING btree ("_parent_id");
  CREATE INDEX "verein_hauptsponsor_hauptsponsor_logo_idx" ON "verein" USING btree ("hauptsponsor_logo_id");
  CREATE INDEX "verein_passantrag_vorlage_idx" ON "verein" USING btree ("passantrag_vorlage_id");
  CREATE INDEX "verein_startseite_startseite_bild_fussball_idx" ON "verein" USING btree ("startseite_bild_fussball_id");
  CREATE INDEX "verein_startseite_startseite_bild_kids_idx" ON "verein" USING btree ("startseite_bild_kids_id");
  CREATE INDEX "verein_startseite_startseite_bild_fitness_idx" ON "verein" USING btree ("startseite_bild_fitness_id");
  CREATE INDEX "verein_startseite_startseite_bild_breitensport1_idx" ON "verein" USING btree ("startseite_bild_breitensport1_id");
  CREATE INDEX "verein_startseite_startseite_bild_breitensport2_idx" ON "verein" USING btree ("startseite_bild_breitensport2_id");
  CREATE INDEX "verein_startseite_startseite_bild_breitensport3_idx" ON "verein" USING btree ("startseite_bild_breitensport3_id");
  CREATE INDEX "verein_startseite_startseite_bild_verein_idx" ON "verein" USING btree ("startseite_bild_verein_id");
  CREATE INDEX "verein_aktion_aktion_bild_idx" ON "verein" USING btree ("aktion_bild_id");
  CREATE INDEX "verein_rels_order_idx" ON "verein_rels" USING btree ("order");
  CREATE INDEX "verein_rels_parent_idx" ON "verein_rels" USING btree ("parent_id");
  CREATE INDEX "verein_rels_path_idx" ON "verein_rels" USING btree ("path");
  CREATE INDEX "verein_rels_media_id_idx" ON "verein_rels" USING btree ("media_id");
  CREATE INDEX "hilfe_bereiche_anleitungen_order_idx" ON "hilfe_bereiche_anleitungen" USING btree ("_order");
  CREATE INDEX "hilfe_bereiche_anleitungen_parent_id_idx" ON "hilfe_bereiche_anleitungen" USING btree ("_parent_id");
  CREATE INDEX "hilfe_bereiche_anleitungen_video_idx" ON "hilfe_bereiche_anleitungen" USING btree ("video_id");
  CREATE INDEX "hilfe_bereiche_order_idx" ON "hilfe_bereiche" USING btree ("_order");
  CREATE INDEX "hilfe_bereiche_parent_id_idx" ON "hilfe_bereiche" USING btree ("_parent_id");
  CREATE INDEX "hilfe_faq_order_idx" ON "hilfe_faq" USING btree ("_order");
  CREATE INDEX "hilfe_faq_parent_id_idx" ON "hilfe_faq" USING btree ("_parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "mitgliedsantraege_familienmitglieder" CASCADE;
  DROP TABLE "mitgliedsantraege" CASCADE;
  DROP TABLE "mitgliedsantraege_rels" CASCADE;
  DROP TABLE "kontaktanfragen" CASCADE;
  DROP TABLE "probetraining" CASCADE;
  DROP TABLE "passantraege" CASCADE;
  DROP TABLE "posts_populated_authors" CASCADE;
  DROP TABLE "posts" CASCADE;
  DROP TABLE "posts_rels" CASCADE;
  DROP TABLE "_posts_v_version_populated_authors" CASCADE;
  DROP TABLE "_posts_v" CASCADE;
  DROP TABLE "_posts_v_rels" CASCADE;
  DROP TABLE "termine_auslassen" CASCADE;
  DROP TABLE "termine" CASCADE;
  DROP TABLE "alben" CASCADE;
  DROP TABLE "alben_rels" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "sponsoren" CASCADE;
  DROP TABLE "gesuche" CASCADE;
  DROP TABLE "pages_hero_links" CASCADE;
  DROP TABLE "pages_blocks_cta_links" CASCADE;
  DROP TABLE "pages_blocks_cta" CASCADE;
  DROP TABLE "pages_blocks_content_columns" CASCADE;
  DROP TABLE "pages_blocks_content" CASCADE;
  DROP TABLE "pages_blocks_media_block" CASCADE;
  DROP TABLE "pages_blocks_archive" CASCADE;
  DROP TABLE "pages_blocks_form_block" CASCADE;
  DROP TABLE "pages" CASCADE;
  DROP TABLE "pages_rels" CASCADE;
  DROP TABLE "_pages_v_version_hero_links" CASCADE;
  DROP TABLE "_pages_v_blocks_cta_links" CASCADE;
  DROP TABLE "_pages_v_blocks_cta" CASCADE;
  DROP TABLE "_pages_v_blocks_content_columns" CASCADE;
  DROP TABLE "_pages_v_blocks_content" CASCADE;
  DROP TABLE "_pages_v_blocks_media_block" CASCADE;
  DROP TABLE "_pages_v_blocks_archive" CASCADE;
  DROP TABLE "_pages_v_blocks_form_block" CASCADE;
  DROP TABLE "_pages_v" CASCADE;
  DROP TABLE "_pages_v_rels" CASCADE;
  DROP TABLE "categories_breadcrumbs" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "angebote_zeiten" CASCADE;
  DROP TABLE "angebote_team" CASCADE;
  DROP TABLE "angebote" CASCADE;
  DROP TABLE "angebote_rels" CASCADE;
  DROP TABLE "ausfaelle" CASCADE;
  DROP TABLE "passdokumente" CASCADE;
  DROP TABLE "users_roles" CASCADE;
  DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "users_rels" CASCADE;
  DROP TABLE "mitgliedschaften" CASCADE;
  DROP TABLE "mitgliedschaften_rels" CASCADE;
  DROP TABLE "profilbilder" CASCADE;
  DROP TABLE "dokumente" CASCADE;
  DROP TABLE "hilfe_feedback" CASCADE;
  DROP TABLE "statistik" CASCADE;
  DROP TABLE "redirects" CASCADE;
  DROP TABLE "redirects_rels" CASCADE;
  DROP TABLE "forms_blocks_checkbox" CASCADE;
  DROP TABLE "forms_blocks_country" CASCADE;
  DROP TABLE "forms_blocks_email" CASCADE;
  DROP TABLE "forms_blocks_message" CASCADE;
  DROP TABLE "forms_blocks_number" CASCADE;
  DROP TABLE "forms_blocks_select_options" CASCADE;
  DROP TABLE "forms_blocks_select" CASCADE;
  DROP TABLE "forms_blocks_state" CASCADE;
  DROP TABLE "forms_blocks_text" CASCADE;
  DROP TABLE "forms_blocks_textarea" CASCADE;
  DROP TABLE "forms_emails" CASCADE;
  DROP TABLE "forms" CASCADE;
  DROP TABLE "form_submissions_submission_data" CASCADE;
  DROP TABLE "form_submissions" CASCADE;
  DROP TABLE "search_categories" CASCADE;
  DROP TABLE "search" CASCADE;
  DROP TABLE "search_rels" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_jobs_log" CASCADE;
  DROP TABLE "payload_jobs" CASCADE;
  DROP TABLE "payload_folders_folder_type" CASCADE;
  DROP TABLE "payload_folders" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "header_nav_items" CASCADE;
  DROP TABLE "header" CASCADE;
  DROP TABLE "header_rels" CASCADE;
  DROP TABLE "footer_nav_items" CASCADE;
  DROP TABLE "footer" CASCADE;
  DROP TABLE "footer_rels" CASCADE;
  DROP TABLE "menue_links" CASCADE;
  DROP TABLE "menue_verein_ueber_uns" CASCADE;
  DROP TABLE "menue_verein_mehr" CASCADE;
  DROP TABLE "menue_fusszeile_eintraege" CASCADE;
  DROP TABLE "menue_fusszeile" CASCADE;
  DROP TABLE "menue_kontakt_links" CASCADE;
  DROP TABLE "menue" CASCADE;
  DROP TABLE "texte" CASCADE;
  DROP TABLE "texte_rels" CASCADE;
  DROP TABLE "startseite" CASCADE;
  DROP TABLE "startseite_rels" CASCADE;
  DROP TABLE "verein_beitraege" CASCADE;
  DROP TABLE "verein_vorstand" CASCADE;
  DROP TABLE "verein_kontakt_anliegen" CASCADE;
  DROP TABLE "verein_downloads" CASCADE;
  DROP TABLE "verein_dsgvo" CASCADE;
  DROP TABLE "verein" CASCADE;
  DROP TABLE "verein_rels" CASCADE;
  DROP TABLE "datenschutz" CASCADE;
  DROP TABLE "hilfe_bereiche_anleitungen" CASCADE;
  DROP TABLE "hilfe_bereiche" CASCADE;
  DROP TABLE "hilfe_faq" CASCADE;
  DROP TABLE "hilfe" CASCADE;
  DROP TABLE "rollen_rechte" CASCADE;
  DROP TABLE "sicherheit" CASCADE;
  DROP TYPE "public"."enum_mitgliedsantraege_status";
  DROP TYPE "public"."enum_mitgliedsantraege_mitgliedsart";
  DROP TYPE "public"."enum_kontaktanfragen_status";
  DROP TYPE "public"."enum_probetraining_status";
  DROP TYPE "public"."enum_passantraege_status";
  DROP TYPE "public"."enum_passantraege_fuer";
  DROP TYPE "public"."enum_passantraege_art";
  DROP TYPE "public"."enum_posts_status";
  DROP TYPE "public"."enum__posts_v_version_status";
  DROP TYPE "public"."enum_termine_wiederholung";
  DROP TYPE "public"."enum_termine_bereich";
  DROP TYPE "public"."enum_media_personen";
  DROP TYPE "public"."enum_sponsoren_stufe";
  DROP TYPE "public"."enum_gesuche_symbol";
  DROP TYPE "public"."enum_pages_hero_links_link_type";
  DROP TYPE "public"."enum_pages_hero_links_link_appearance";
  DROP TYPE "public"."enum_pages_blocks_cta_links_link_type";
  DROP TYPE "public"."enum_pages_blocks_cta_links_link_appearance";
  DROP TYPE "public"."enum_pages_blocks_content_columns_size";
  DROP TYPE "public"."enum_pages_blocks_content_columns_link_type";
  DROP TYPE "public"."enum_pages_blocks_content_columns_link_appearance";
  DROP TYPE "public"."enum_pages_blocks_archive_populate_by";
  DROP TYPE "public"."enum_pages_blocks_archive_relation_to";
  DROP TYPE "public"."enum_pages_hero_type";
  DROP TYPE "public"."enum_pages_status";
  DROP TYPE "public"."enum__pages_v_version_hero_links_link_type";
  DROP TYPE "public"."enum__pages_v_version_hero_links_link_appearance";
  DROP TYPE "public"."enum__pages_v_blocks_cta_links_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_cta_links_link_appearance";
  DROP TYPE "public"."enum__pages_v_blocks_content_columns_size";
  DROP TYPE "public"."enum__pages_v_blocks_content_columns_link_type";
  DROP TYPE "public"."enum__pages_v_blocks_content_columns_link_appearance";
  DROP TYPE "public"."enum__pages_v_blocks_archive_populate_by";
  DROP TYPE "public"."enum__pages_v_blocks_archive_relation_to";
  DROP TYPE "public"."enum__pages_v_version_hero_type";
  DROP TYPE "public"."enum__pages_v_version_status";
  DROP TYPE "public"."enum_angebote_zeiten_tag";
  DROP TYPE "public"."enum_angebote_bereich";
  DROP TYPE "public"."enum_angebote_untergruppe";
  DROP TYPE "public"."enum_angebote_kategorie";
  DROP TYPE "public"."enum_angebote_banner_art";
  DROP TYPE "public"."enum_ausfaelle_grund";
  DROP TYPE "public"."enum_passdokumente_art";
  DROP TYPE "public"."enum_users_roles";
  DROP TYPE "public"."enum_users_registriert_ueber";
  DROP TYPE "public"."enum_mitgliedschaften_art";
  DROP TYPE "public"."enum_statistik_art";
  DROP TYPE "public"."enum_statistik_geraet";
  DROP TYPE "public"."enum_redirects_to_type";
  DROP TYPE "public"."enum_forms_confirmation_type";
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  DROP TYPE "public"."enum_payload_jobs_log_state";
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  DROP TYPE "public"."enum_payload_folders_folder_type";
  DROP TYPE "public"."enum_header_nav_items_link_type";
  DROP TYPE "public"."enum_footer_nav_items_link_type";
  DROP TYPE "public"."enum_menue_links_ziel";
  DROP TYPE "public"."enum_menue_links_aufklapp";
  DROP TYPE "public"."enum_menue_verein_ueber_uns_ziel";
  DROP TYPE "public"."enum_menue_verein_mehr_ziel";
  DROP TYPE "public"."enum_menue_fusszeile_eintraege_ziel";
  DROP TYPE "public"."enum_menue_kontakt_links_ziel";
  DROP TYPE "public"."enum_hilfe_bereiche_bereich";
  DROP TYPE "public"."enum_hilfe_faq_bereich";`)
}
