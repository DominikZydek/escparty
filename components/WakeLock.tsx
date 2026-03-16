"use client";

import { useEffect, useRef } from "react";

export default function WakeLock() {
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    const requestWakeLock = async () => {
      if ("wakeLock" in navigator) {
        try {
          wakeLockRef.current = await (navigator as any).wakeLock.request("screen");
          console.log("Screen will not lock");
        } catch (err: any) {
          console.error(`Wake Lock error: ${err.name}, ${err.message}`);
        }
      } else {
        console.log("Your browser does not support Wake Lock API");
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        requestWakeLock();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().then(() => {
          wakeLockRef.current = null;
        });
      }
    };
  }, []);

  return null;
}