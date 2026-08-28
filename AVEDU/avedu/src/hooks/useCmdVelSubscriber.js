/**
 * useCmdVelSubscriber.js
 *
 * Subscribes to /cmd_vel (geometry_msgs/Twist) and exposes the latest command
 * as a stable ref — safe to read every render frame inside useFrame callbacks
 * without triggering React re-renders.
 *
 * Coordinate conversion:
 *   ROS linear.x  → cmdRef.linX  (same axis, same sign)
 *   ROS angular.z → cmdRef.angY  (same yaw direction, same sign — see coordUtils)
 *
 * The ref values are also zeroed when the ROS connection drops.
 */

import { useEffect, useRef } from 'react';
import ROSLIB from 'roslib';
import { useRos } from './useRosBridge';
import { cmdVelToThree } from '../utils/coordUtils';

const BASE_TOPIC   = 'cmd_vel';
const TYPE         = 'geometry_msgs/Twist';

/**
 * @returns {React.MutableRefObject<{ linX: number, angY: number }>}
 *   linX — forward speed m/s  (positive = forward)
 *   angY — yaw rate  rad/s   (positive = CCW from above = turn left)
 */
export function useCmdVelSubscriber(namespace = '') {
  const { ros, connected } = useRos();
  const cmdRef      = useRef({ linX: 0, angY: 0 });
  const TOPIC = namespace ? `${namespace}/${BASE_TOPIC}` : `/${BASE_TOPIC}`;

  useEffect(() => {
    if (!connected || !ros.current) {
      cmdRef.current.linX = 0;
      cmdRef.current.angY = 0;
      return;
    }

    const topic = new ROSLIB.Topic({
      ros:           ros.current,
      name:          TOPIC,
      messageType:   TYPE,
      throttle_rate: 0,
      queue_size:    1,
      latch:         false,
    });

    const handler = (msg) => {
      const { linX, angY } = cmdVelToThree(msg.linear, msg.angular);
      cmdRef.current.linX = linX;
      cmdRef.current.angY = angY;
    };

    topic.subscribe(handler);

    return () => {
      try { topic.unsubscribe(handler); } catch {}
      try { topic.unsubscribe();        } catch {}
      cmdRef.current.linX = 0;
      cmdRef.current.angY = 0;
    };
  }, [connected, ros, TOPIC]);

  return cmdRef;
}
