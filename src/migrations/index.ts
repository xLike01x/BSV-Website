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
    name: '20261023_071149_hilfe_updates'
  },
];
