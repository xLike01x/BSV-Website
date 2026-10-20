import * as migration_20261020_085504_initial from './20261020_085504_initial';

export const migrations = [
  {
    up: migration_20261020_085504_initial.up,
    down: migration_20261020_085504_initial.down,
    name: '20261020_085504_initial'
  },
];
