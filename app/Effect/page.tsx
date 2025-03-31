"use client";

import WebGPUCanvas from "@/components/canvas";
import { useTexture } from "@react-three/drei";
import React, { Fragment, useMemo } from "react";
import * as THREE from "three/webgpu";
import TEXTUREMAP from "@/assets/raw-2.png";
import DEPTHMAP from "@/assets/depth-2.png";
import { useGSAP } from "@gsap/react";
import {
  abs,
  blendScreen,
  float,
  Fn,
  max,
  mod,
  mx_cell_noise_float,
  oneMinus,
  select,
  ShaderNodeObject,
  smoothstep,
  sub,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
} from "three/tsl";
import gsap from "gsap";
import { useFrame } from "@react-three/fiber";
import PostProcessing from "@/components/post-processing";

const WIDTH = 1600;
const HEIGHT = 900;

const Scene = () => {
  const [rawMap, depthMap] = useTexture([TEXTUREMAP.src, DEPTHMAP.src], () => {
    rawMap.colorSpace = THREE.SRGBColorSpace;
  });

  const { material, uniforms } = useMemo(() => {
    // cross animation

    // dot animation
    const uPointer = uniform(new THREE.Vector2(0));
    const uProgress = uniform(0);

    const strength = 0.01;

    const uDepthMap = texture(depthMap);

    const uMap = texture(
      rawMap,
      uv().add(uDepthMap.r.mul(uPointer).mul(strength))
    );

    const aspect = float(1, 1.5);
    const tUv = vec2(uv().x.mul(aspect), uv().y);

    const tiling = vec2(120.0);
    const tiledUV = mod(tUv.mul(tiling), 2.0).sub(1.0);

    const brightness = mx_cell_noise_float(tUv.mul(tiling).div(2));

    const dist = float(tiledUV.length());
    const dot = float(smoothstep(0.5, 0.49, dist)).mul(brightness);

    const depth = uDepthMap;

    const flow = oneMinus(smoothstep(0, 0.02, abs(depth.sub(uProgress))));

    const mask = dot.mul(flow).mul(vec3(10, 0.25, 0.25));

    const final = blendScreen(uMap, mask);

    const material = new THREE.MeshBasicNodeMaterial({
      colorNode: final,
    });

    return {
      material,
      uniforms: {
        uPointer,
        uProgress,
      },
    };
  }, [rawMap, depthMap]);

  useGSAP(() => {
    gsap.to(uniforms.uProgress, {
      value: 1.1,
      repeat: -1,
      duration: 4,
      ease: "power2.out",
    });
  }, [uniforms.uProgress]);

  useFrame(({ pointer }) => {
    uniforms.uPointer.value = pointer;
  });

  return (
    <Fragment>
      <mesh scale={[5, 6, 1]} material={material}>
        <planeGeometry />
      </mesh>
    </Fragment>
  );
};

const Home = () => {
  return (
    <WebGPUCanvas>
      <PostProcessing />
      <Scene />
    </WebGPUCanvas>
  );
};

export default Home;
