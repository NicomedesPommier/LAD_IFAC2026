/**
 * useOdomPublisher.js
 *
 * Reads the QCar Rapier rigid body pose + velocity every frame and publishes
 * nav_msgs/Odometry to /odom at a fixed rate (default 20 Hz).
 *
 * Call this hook inside a component that lives inside <Canvas> so useFrame
 * is available.  It reads the ROS connection from RosBridgeContext, which is
 * provided by <RosBridgeProvider> outside the canvas.
 *
 * Published message layout:
 *   header.frame_id  = "odom"
 *   child_frame_id   = "base_link"
 *   pose.pose        = {position, orientation}  — in ROS (Z-up) frame
 *   twist.twist      = {linear, angular}        — in ROS (Z-up) frame
 *   covariance arrays set to zeros (no uncertainty model)
 */

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import ROSLIB from 'roslib';
import { useRos } from './useRosBridge';
import {
  posThreeToRos,
  quatThreeToRos,
  linvelThreeToRos,
  angvelThreeToRos,
} from '../utils/coordUtils';

const BASE_TOPIC = 'odom';
const TYPE       = 'nav_msgs/Odometry';
const PUBLISH_HZ = 20;

// Pre-allocate the covariance arrays (36 zeros each) once — ROSLIB will
// serialise them by reference so we can reuse the same arrays every publish.
const ZERO_COV = Object.freeze(new Array(36).fill(0));

/**
 * @param {React.MutableRefObject} carRef — ref to the Rapier RigidBody
 * @param {number} [hz=20]               — publish rate in Hz
 */
export function useOdomPublisher(carRef, hz = PUBLISH_HZ, namespace = '') {
  const { ros, connected } = useRos();
  const TOPIC = namespace ? `${namespace}/${BASE_TOPIC}` : `/${BASE_TOPIC}`;
  const topicRef    = useRef(null);
  const frameCount  = useRef(0);
  const frameSkip   = useRef(Math.round(60 / hz));

  // Update skip rate if hz prop changes
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

    let t, q, lv, av;
    try {
      t  = carRef.current.translation();
      q  = carRef.current.rotation();
      lv = carRef.current.linvel();
      av = carRef.current.angvel();
    } catch { return; }

    const pos  = posThreeToRos(t.x, t.y, t.z);
    const ori  = quatThreeToRos(q.x, q.y, q.z, q.w);
    const linv = linvelThreeToRos(lv.x, lv.y, lv.z);
    const angv = angvelThreeToRos(av.x, av.y, av.z);

    const nowMs   = performance.now();
    const sec     = Math.floor(nowMs / 1000);
    const nanosec = Math.round((nowMs % 1000) * 1e6);

    topicRef.current.publish(new ROSLIB.Message({
      header: {
        stamp:    { sec, nanosec },
        frame_id: 'odom',
      },
      child_frame_id: 'base_link',
      pose: {
        pose: { position: pos, orientation: ori },
        covariance: ZERO_COV,
      },
      twist: {
        twist: { linear: linv, angular: angv },
        covariance: ZERO_COV,
      },
    }));
  });
}
