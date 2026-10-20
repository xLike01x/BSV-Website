import * as migration_20261020_085504_initial from './20261020_085504_initial';
import * as migration_20261020_092133_datenschutz_fristen from './20261020_092133_datenschutz_fristen';
import * as migration_20261020_092628_einwilligungen from './20261020_092628_einwilligungen';
import * as migration_20261020_094226_haertung from './20261020_094226_haertung';
import * as migration_20261020_133629_posteingang from './20261020_133629_posteingang';
import * as migration_20261020_151223_hilfe_bereiche from './20261020_151223_hilfe_bereiche';

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
    name: '20261020_151223_hilfe_bereiche'
  },
];
