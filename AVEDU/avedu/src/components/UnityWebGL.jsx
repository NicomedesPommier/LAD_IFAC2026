// src/components/UnityWebGL.jsx
import { useEffect, useRef } from 'react';
import { Unity, useUnityContext } from 'react-unity-webgl';
import './UnityWebGL.scss';

/**
 * Unity WebGL Container Component (using react-unity-webgl)
 * Loads and displays Unity WebGL games
 *
 * @param {string} gamePath - Path to the game folder in public/unity-games/ (e.g., "RickTest")
 * @param {string} gameName - Name of the Unity build files (e.g., "RickTest")
 * @param {number} width - Canvas width (default: 960)
 * @param {number} height - Canvas height (default: 600)
 * @param {function} onLoaded - Callback when game is loaded
 * @param {function} onProgress - Callback for loading progress (0-1)
 */
export default function UnityWebGL({
  gamePath,
  gameName,
  width = 960,
  height = 600,
  onLoaded,
  onProgress,
  className = '',
}) {
  const basePath = `${process.env.PUBLIC_URL}/unity-games/${gamePath}`;
  const hasCalledOnLoaded = useRef(false);

  // Initialize Unity context with react-unity-webgl
  const {
    unityProvider,
    isLoaded,
    loadingProgression,
    unityInstance,
  } = useUnityContext({
    loaderUrl: `${basePath}/Build/${gameName}.loader.js`,
    dataUrl: `${basePath}/Build/${gameName}.data`,
    frameworkUrl: `${basePath}/Build/${gameName}.framework.js`,
    codeUrl: `${basePath}/Build/${gameName}.wasm`,
    streamingAssetsUrl: `${basePath}/StreamingAssets`,
    companyName: "L.A.D Platform",
    productName: gameName,
    productVersion: "1.0.0",
  });

  // Handle loading progress
  useEffect(() => {
    if (onProgress) {
      onProgress(loadingProgression);
    }
  }, [loadingProgression, onProgress]);

  // Handle game loaded - only call once
  useEffect(() => {
    if (isLoaded && onLoaded && !hasCalledOnLoaded.current) {
      console.log('[UnityWebGL] Unity game loaded successfully!');
      hasCalledOnLoaded.current = true;
      onLoaded(unityInstance);
    }
  }, [isLoaded, onLoaded, unityInstance]);

  const progressPercentage = Math.round(loadingProgression * 100);

  return (
    <div className={`unity-webgl-container ${className}`}>
      {!isLoaded && (
        <div className="unity-loading">
          <div className="unity-loading__spinner"></div>
          <div className="unity-loading__text">
            Loading Unity Game... {progressPercentage}%
          </div>
          <div className="unity-loading__bar">
            <div
              className="unity-loading__bar-fill"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}

      <Unity
        unityProvider={unityProvider}
        style={{
          width: width,
          height: height,
          display: isLoaded ? 'block' : 'none',
        }}
        tabIndex={-1}
      />
    </div>
  );
}
