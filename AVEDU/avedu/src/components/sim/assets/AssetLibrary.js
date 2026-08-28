import { StraightStreet, Turn, Roundabout, Intersection, Crosswalk } from './Streets';
import {
  PlaceholderPedestrian, TrafficLight, Wall,
  StopSign, YieldSign, RoundaboutSign, TrafficCone,
} from './Obstacles';

export const ASSET_REGISTRY = {
  straight:       { name: 'Straight Street', component: StraightStreet,        type: 'street' },
  intersection:   { name: 'Intersection',    component: Intersection,          type: 'street' },
  turn:           { name: 'Turn Corner',     component: Turn,                  type: 'street' },
  roundabout:     { name: 'Roundabout',      component: Roundabout,            type: 'street' },
  crosswalk:      { name: 'Crosswalk',       component: Crosswalk,             type: 'street' },
  pedestrian:     { name: 'Pedestrian',      component: PlaceholderPedestrian, type: 'obstacle' },
  light:          { name: 'Traffic Light',   component: TrafficLight,          type: 'obstacle' },
  wall:           { name: 'Wall Bound',      component: Wall,                  type: 'obstacle' },
  stopSign:       { name: 'Stop Sign',       component: StopSign,              type: 'obstacle' },
  yieldSign:      { name: 'Yield Sign',      component: YieldSign,             type: 'obstacle' },
  roundaboutSign: { name: 'Roundabout Sign', component: RoundaboutSign,        type: 'obstacle' },
  cone:           { name: 'Traffic Cone',    component: TrafficCone,           type: 'obstacle' },
};
