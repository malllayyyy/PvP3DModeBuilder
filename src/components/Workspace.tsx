import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Grid, OrbitControls } from '@react-three/drei';
import { useWorkspaceStore } from '../store';
import { SceneObject } from './SceneObject';

export const Workspace: React.FC = () => {
  const { objects, selectObject } = useWorkspaceStore();

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas
        camera={{ position: [5, 5, 5], fov: 50 }}
        onPointerMissed={() => selectObject(null)}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} castShadow />
        <OrbitControls makeDefault />
        
        <Grid 
          infiniteGrid 
          fadeDistance={30} 
          sectionColor="#555" 
          cellColor="#333" 
          position={[0, -0.01, 0]} // slightly below zero to prevent z-fighting with objects at y=0
        />

        {objects.map((obj) => (
          <SceneObject key={obj.id} data={obj} />
        ))}
      </Canvas>
    </div>
  );
};
