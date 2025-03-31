/* eslint-disable @typescript-eslint/no-explicit-any */
import { Canvas, CanvasProps } from "@react-three/fiber";
import React from "react";
import * as THREE from "three/webgpu";

const WebGPUCanvas = (props: CanvasProps) => {
  return (
    <Canvas
      {...props}
      flat
      gl={async (props) => {
        const renderer = new THREE.WebGPURenderer(props as any);
        await renderer.init();
        return renderer;
      }}
      className='canvas-container'
      style={{ position: "fixed", top: "0", left: "0" }}>
      {props.children}
    </Canvas>
  );
};

export default WebGPUCanvas;
