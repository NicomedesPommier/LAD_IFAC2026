/**
 * useTfPublisher.js
 *
 * Publishes the odom → base_link transform to /tf at a fixed rate (default 20 Hz).
 * This is the minimum required for ROS navigation stacks (nav2, AMCL, etc.) to
 * locate the robot in the odom frame.
 *
 * Message type: tf2_msgs/TFMessage  (array of geometry_msgs/TransformStamped)
 *
 * Transform layout:
 *   header.frame_id  = "odom"
 *   child_frame_id   = "base_link"
 *   transform        = { translation, rotation }  — in ROS (Z-up) frame
 *
 * Call this hook inside a Canvas component (needs useFrame).
 */

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import ROSLIB from 'roslib';
import { useRos } from './useRosBridge';
import { posThreeToRos, quatThreeToRos } from '../utils/coordUtils';

const BASE_TOPIC = 'tf';
const TYPE       = 'tf2_msgs/TFMessage';
const PUBLISH_HZ = 20;

/**
 * @param {React.MutableRefObject} carRef — ref to the Rapier RigidBody
 * @param {number} [hz=20]               — publish rate in Hz
 */
export function useTfPublisher(carRef, hz = PUBLISH_HZ, namespace = '') {
  const { ros, connected } = useRos();
  const TOPIC = namespace ? `${namespace}/${BASE_TOPIC}` : `/${BASE_TOPIC}`;
  const topicRef   = useRef(null);
  const frameCount = useRef(0);
  const frameSkip  = useRef(Math.round(60 / hz));

  useEffect(() => {
    frameSkip.current = Math.round(60 / hz);
  }, [hz]);

  useEffect(() => {
    if (!connected || !ros.current) return;

    const topic = new ROSLIB.Topic({
      ros:         ros.current,
      name:        TOPIC,
      messageType: TYPE,
      queue_size:  1,
      latch:       false,
    });
    topic.advertise();
    topicRef.current = topic;

    return () => {
      try { topic.unadvertise(); } catch {}
      topicRef.current = null;
    };
  }, [connected, ros, TOPIC]);

  useFrame(() => {
    if (!topicRef.current || !carRef?.current) return;
    frameCount.current++;
    if (frameCount.current % frameSkip.current !== 0) return;

    let t, q;
    try {
      t = carRef.current.translation();
      q = carRef.current.rotation();
    } catch { return; }

    const translation = posThreeToRos(t.x, t.y, t.z);
    const rotation    = quatThreeToRos(q.x, q.y, q.z, q.w);

    const nowMs   = performance.now();
    const sec     = Math.floor(nowMs / 1000);
    const nanosec = Math.round((nowMs % 1000) * 1e6);

    topicRef.current.publish(new ROSLIB.Message({
      transforms: [
        {
          header: {
            stamp:    { sec, nanosec },
            frame_id: 'odom',
          },
          child_frame_id: 'base_link',
          transform: { translation, rotation },
        },
      ],
    }));
  });
}
