// src/hooks/useRoslib.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ROSLIB from "roslib";
import { getRosbridgeUrl } from "../ip";

const isValidWsUrl = (u) => /^wss?:\/\/[^:\/\s]+(:\d+)?(\/.*)?$/i.test(String(u || ""));

export function useRoslib() {
  const rosRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const url = getRosbridgeUrl();

    const ros = new ROSLIB.Ros();
    rosRef.current = ros;

    const sinkError = () => {};
    const onConn = () => setConnected(true);
    const onClose = () => setConnected(false);
    const onErr = (e) => {
      // eslint-disable-next-line no-console
      console.error("[roslib] error:", e?.message || e);
      setConnected(false);
    };

    ros.on("error", sinkError);
    ros.on("connection", onConn);
    ros.on("close", onClose);
    ros.on("error", onErr);

    const t = setTimeout(() => {
      try {
        if (!isValidWsUrl(url)) throw new Error(`Invalid WebSocket URL: ${url}`);
        ros.connect(url);
      } catch (e) {
        onErr(e);
      }
    }, 0);

    return () => {
      clearTimeout(t);
      try { ros.close(); } catch {}
      try {
        if (typeof ros.removeAllListeners === "function") {
          ros.removeAllListeners("connection");
          ros.removeAllListeners("close");
          ros.removeAllListeners("error");
        }
      } catch {}
      rosRef.current = null;
    };
  }, []); // URL fija al montar (viene del único punto de verdad)

  const subscribeTopic = useCallback((name, messageType, onMessage, opts = {}) => {
    const ros = rosRef.current;
    if (!ros) return () => {};

    const topic = new ROSLIB.Topic({
      ros,
      name,
      messageType,
      throttle_rate: opts.throttle_rate ?? 50,
      queue_size: opts.queue_size ?? 1,
      queue_length: opts.queue_length,
    });

    const handler = (msg) => { try { onMessage?.(msg); } catch {} };
    try { topic.subscribe(handler); } catch {}

    return () => {
      try { topic.unsubscribe(handler); } catch {}
      try { topic.unsubscribe(); } catch {}
    };
  }, []);

  const advertise = useCallback((name, messageType, opts = {}) => {
    const ros = rosRef.current;
    if (!ros) return { publish: () => {}, unadvertise: () => {} };

    const topic = new ROSLIB.Topic({
      ros,
      name,
      messageType,
      queue_size: opts.queue_size ?? 1,
    });

    try { topic.advertise(); } catch {}

    return {
      publish: (msg) => {
        try { topic.publish(new ROSLIB.Message(msg)); } catch {}
      },
      unadvertise: () => { try { topic.unadvertise(); } catch {} },
    };
  }, []);

  const callService = useCallback((name, serviceType, request = {}) => {
    const ros = rosRef.current;
    if (!ros) return Promise.reject(new Error("ROS not connected"));

    const svc = new ROSLIB.Service({ ros, name, serviceType });
    const req = new ROSLIB.ServiceRequest(request);

    return new Promise((resolve, reject) => {
      try { svc.callService(req, resolve, reject); } catch (e) { reject(e); }
    });
  }, []);

  return useMemo(
    () => ({ ros: rosRef, connected, subscribeTopic, advertise, callService }),
    [connected, subscribeTopic, advertise, callService]
  );
}
