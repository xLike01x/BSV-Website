import * as migration_20261020_085504_initial from './20261020_085504_initial';
import * as migration_20261020_092133_datenschutz_fristen from './20261020_092133_datenschutz_fristen';
import * as migration_20261020_092628_einwilligungen from './20261020_092628_einwilligungen';
import * as migration_20261020_094226_haertung from './20261020_094226_haertung';
import * as migration_20261020_133629_posteingang from './20261020_133629_posteingang';
import * as migration_20261020_151223_hilfe_bereiche from './20261020_151223_hilfe_bereiche';
import * as migration_20261020_173527_ohne_payload_ordner from './20261020_173527_ohne_payload_ordner';
import * as migration_20261020_191522_wartung_saison from './20261020_191522_wartung_saison';
import * as migration_20261021_071751_passt_noch from './20261021_071751_passt_noch';
import * as migration_20261021_105048_zusatzrechte_bereiche from './20261021_105048_zusatzrechte_bereiche';
import * as migration_20261022_192800_nur_ansehen from './20261022_192800_nur_ansehen';
import * as migration_20261023_071149_hilfe_updates from './20261023_071149_hilfe_updates';
import * as migration_20261023_124424_webapp from './20261023_124424_webapp';
import * as migration_20261026_095157_countdown from './20261026_095157_countdown';
import * as migration_20261026_110853_countdown_seite from './20261026_110853_countdown_seite';
import * as migration_20261026_112744_countdown_termine from './20261026_112744_countdown_termine';
import * as migration_20261026_120559_termin_zusagen from './20261026_120559_termin_zusagen';
import * as migration_20261026_134632_animationen from './20261026_134632_animationen';
import * as migration_20261026_151441_animationen_global from './20261026_151441_animationen_global';
import * as migration_20261026_153216_spielecke_statistik from './20261026_153216_spielecke_statistik';
import * as migration_20261026_164436_memory from './20261026_164436_memory';
import * as migration_20261026_203917_rangliste from './20261026_203917_rangliste';
import * as migration_20261027_085945_huetchenspiel from './20261027_085945_huetchenspiel';
import * as migration_20261027_101150_rangliste_huetchen from './20261027_101150_rangliste_huetchen';
import * as migration_20261027_104121_vereinswappen from './20261027_104121_vereinswappen';
import * as migration_20261027_123248_kuendigungen from './20261027_123248_kuendigungen';
import * as migration_20261027_145506_hilfe_bereiche_kuendigungen from './20261027_145506_hilfe_bereiche_kuendigungen';
import * as migration_20261027_174802_konto_geschuetzt from './20261027_174802_konto_geschuetzt';
import * as migration_20261027_183018_beitrittserklaerung from './20261027_183018_beitrittserklaerung';
import * as migration_20261027_183317_antrag_text from './20261027_183317_antrag_text';
import * as migration_20261027_185309_vereinsdokumente from './20261027_185309_vereinsdokumente';
import * as migration_20261030_180237_altersangaben from './20261030_180237_altersangaben';

export const migrations = [
  {
    up: migration_20261020_085504_initial.up,
    down: migration_20261020_085504_initial.down,
    name: '20261020_085504_initial',
  },
  {
    up: migration_20261020_092133_datenschutz_fristen.up,
    down: migration_20261020_092133_datenschutz_fristen.down,
    name: '20261020_092133_datenschutz_fristen',
  },
  {
    up: migration_20261020_092628_einwilligungen.up,
    down: migration_20261020_092628_einwilligungen.down,
    name: '20261020_092628_einwilligungen',
  },
  {
    up: migration_20261020_094226_haertung.up,
    down: migration_20261020_094226_haertung.down,
    name: '20261020_094226_haertung',
  },
  {
    up: migration_20261020_133629_posteingang.up,
    down: migration_20261020_133629_posteingang.down,
    name: '20261020_133629_posteingang',
  },
  {
    up: migration_20261020_151223_hilfe_bereiche.up,
    down: migration_20261020_151223_hilfe_bereiche.down,
    name: '20261020_151223_hilfe_bereiche',
  },
  {
    up: migration_20261020_173527_ohne_payload_ordner.up,
    down: migration_20261020_173527_ohne_payload_ordner.down,
    name: '20261020_173527_ohne_payload_ordner',
  },
  {
    up: migration_20261020_191522_wartung_saison.up,
    down: migration_20261020_191522_wartung_saison.down,
    name: '20261020_191522_wartung_saison',
  },
  {
    up: migration_20261021_071751_passt_noch.up,
    down: migration_20261021_071751_passt_noch.down,
    name: '20261021_071751_passt_noch',
  },
  {
    up: migration_20261021_105048_zusatzrechte_bereiche.up,
    down: migration_20261021_105048_zusatzrechte_bereiche.down,
    name: '20261021_105048_zusatzrechte_bereiche',
  },
  {
    up: migration_20261022_192800_nur_ansehen.up,
    down: migration_20261022_192800_nur_ansehen.down,
    name: '20261022_192800_nur_ansehen',
  },
  {
    up: migration_20261023_071149_hilfe_updates.up,
    down: migration_20261023_071149_hilfe_updates.down,
    name: '20261023_071149_hilfe_updates',
  },
  {
    up: migration_20261023_124424_webapp.up,
    down: migration_20261023_124424_webapp.down,
    name: '20261023_124424_webapp',
  },
  {
    up: migration_20261026_095157_countdown.up,
    down: migration_20261026_095157_countdown.down,
    name: '20261026_095157_countdown',
  },
  {
    up: migration_20261026_110853_countdown_seite.up,
    down: migration_20261026_110853_countdown_seite.down,
    name: '20261026_110853_countdown_seite',
  },
  {
    up: migration_20261026_112744_countdown_termine.up,
    down: migration_20261026_112744_countdown_termine.down,
    name: '20261026_112744_countdown_termine',
  },
  {
    up: migration_20261026_120559_termin_zusagen.up,
    down: migration_20261026_120559_termin_zusagen.down,
    name: '20261026_120559_termin_zusagen',
  },
  {
    up: migration_20261026_134632_animationen.up,
    down: migration_20261026_134632_animationen.down,
    name: '20261026_134632_animationen',
  },
  {
    up: migration_20261026_151441_animationen_global.up,
    down: migration_20261026_151441_animationen_global.down,
    name: '20261026_151441_animationen_global',
  },
  {
    up: migration_20261026_153216_spielecke_statistik.up,
    down: migration_20261026_153216_spielecke_statistik.down,
    name: '20261026_153216_spielecke_statistik',
  },
  {
    up: migration_20261026_164436_memory.up,
    down: migration_20261026_164436_memory.down,
    name: '20261026_164436_memory',
  },
  {
    up: migration_20261026_203917_rangliste.up,
    down: migration_20261026_203917_rangliste.down,
    name: '20261026_203917_rangliste',
  },
  {
    up: migration_20261027_085945_huetchenspiel.up,
    down: migration_20261027_085945_huetchenspiel.down,
    name: '20261027_085945_huetchenspiel',
  },
  {
    up: migration_20261027_101150_rangliste_huetchen.up,
    down: migration_20261027_101150_rangliste_huetchen.down,
    name: '20261027_101150_rangliste_huetchen',
  },
  {
    up: migration_20261027_104121_vereinswappen.up,
    down: migration_20261027_104121_vereinswappen.down,
    name: '20261027_104121_vereinswappen',
  },
  {
    up: migration_20261027_123248_kuendigungen.up,
    down: migration_20261027_123248_kuendigungen.down,
    name: '20261027_123248_kuendigungen',
  },
  {
    up: migration_20261027_145506_hilfe_bereiche_kuendigungen.up,
    down: migration_20261027_145506_hilfe_bereiche_kuendigungen.down,
    name: '20261027_145506_hilfe_bereiche_kuendigungen',
  },
  {
    up: migration_20261027_174802_konto_geschuetzt.up,
    down: migration_20261027_174802_konto_geschuetzt.down,
    name: '20261027_174802_konto_geschuetzt',
  },
  {
    up: migration_20261027_183018_beitrittserklaerung.up,
    down: migration_20261027_183018_beitrittserklaerung.down,
    name: '20261027_183018_beitrittserklaerung',
  },
  {
    up: migration_20261027_183317_antrag_text.up,
    down: migration_20261027_183317_antrag_text.down,
    name: '20261027_183317_antrag_text',
  },
  {
    up: migration_20261027_185309_vereinsdokumente.up,
    down: migration_20261027_185309_vereinsdokumente.down,
    name: '20261027_185309_vereinsdokumente',
  },
  {
    up: migration_20261030_180237_altersangaben.up,
    down: migration_20261030_180237_altersangaben.down,
    name: '20261030_180237_altersangaben'
  },
];
