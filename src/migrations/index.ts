import * as migration_20261020_085504_initial from './20261020_085504_initial';
import * as migration_20261020_092133_datenschutz_fristen from './20261020_092133_datenschutz_fristen';
import * as migration_20261020_092628_einwilligungen from './20261020_092628_einwilligungen';

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
    name: '20261020_092628_einwilligungen'
  },
];
