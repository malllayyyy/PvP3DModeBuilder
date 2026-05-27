import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { TransformControls } from '@react-three/drei';
import * as THREE from 'three';
import { useWorkspaceStore } from '../store';
import type { SceneObjectData } from '../store';

interface SceneObjectProps {
  data: SceneObjectData;
}

export const SceneObject: React.FC<SceneObjectProps> = ({ data }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const { 
    selectedId, 
    transformMode, 
    isAntiGravityEnabled, 
    selectObject, 
    updateObject,
    gamePhase
  } = useWorkspaceStore();

  const isSelected = selectedId === data.id;

  // Setup Geometry based on type
  let geometry: React.ReactNode = null;
  switch (data.type) {
    case 'Cube':
      geometry = <boxGeometry args={[1, 1, 1]} />;
      break;
    case 'Sphere':
      geometry = <sphereGeometry args={[0.5, 32, 16]} />;
      break;
    case 'Cylinder':
      geometry = <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
      break;
    case 'Cone':
      geometry = <coneGeometry args={[0.5, 1, 32]} />;
      break;
    case 'Torus':
      geometry = <torusGeometry args={[0.4, 0.15, 16, 100]} />;
      break;
  }

  // Anti-gravity logic
  useFrame((state) => {
    if (meshRef.current && isAntiGravityEnabled && !isSelected) {
      const time = state.clock.getElapsedTime();
      // y = originalY + sin(time * freq) * amplitude
      // offset frequency by id hash to make them float independently
      const offset = data.id.charCodeAt(0);
      meshRef.current.position.y = data.originalPosition.y + Math.sin(time * 2 + offset) * 0.5;
    } else if (meshRef.current && !isAntiGravityEnabled && !isSelected) {
      // Snap back to original position
      meshRef.current.position.y = data.originalPosition.y;
    }
  });

  return (
    <>
      <mesh
        ref={meshRef}
        position={[data.position.x, data.position.y, data.position.z]}
        rotation={[data.rotation.x, data.rotation.y, data.rotation.z]}
        scale={[data.scale.x, data.scale.y, data.scale.z]}
        onClick={(e) => {
          e.stopPropagation();
          if (gamePhase === 'building' || gamePhase === 'offline') {
            selectObject(data.id);
          }
        }}
      >
        {geometry}
        <meshStandardMaterial color={data.color} flatShading />
      </mesh>

      {isSelected && (gamePhase === 'building' || gamePhase === 'offline') && (
        <TransformControls
          object={meshRef.current!}
          mode={transformMode}
          onMouseUp={() => {
            if (meshRef.current) {
              updateObject(data.id, {
                position: { 
                  x: meshRef.current.position.x, 
                  y: meshRef.current.position.y, 
                  z: meshRef.current.position.z 
                },
                rotation: { 
                  x: meshRef.current.rotation.x, 
                  y: meshRef.current.rotation.y, 
                  z: meshRef.current.rotation.z 
                },
                scale: { 
                  x: meshRef.current.scale.x, 
                  y: meshRef.current.scale.y, 
                  z: meshRef.current.scale.z 
                },
                // Update originalPosition when translated so anti-gravity centers around new Y
                originalPosition: {
                  x: meshRef.current.position.x, 
                  y: meshRef.current.position.y, 
                  z: meshRef.current.position.z 
                }
              });
            }
          }}
        />
      )}
    </>
  );
};
