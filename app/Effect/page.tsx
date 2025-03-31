"use client";

import WebGPUCanvas from "@/components/canvas";
import { useAspect, useTexture } from "@react-three/drei";
import React, { Fragment, useMemo } from "react";
import * as THREE from "three/webgpu";
import TEXTUREMAP from "@/assets/raw-1.png";
import DEPTHMAP from "@/assets/depth-1.png";
import { useGSAP } from "@gsap/react";
import {
  abs,
  blendScreen,
  float,
  mod,
  mx_cell_noise_float,
  oneMinus,
  smoothstep,
  texture,
  uniform,
  uv,
  vec2,
  vec3,
} from "three/tsl";
import gsap from "gsap";
import { useFrame } from "@react-three/fiber";

const WIDTH = 1600;
const HEIGHT = 900;

const Scene = () => {
  const [rawMap, depthMap] = useTexture([TEXTUREMAP.src, DEPTHMAP.src], () => {
    rawMap.colorSpace = THREE.SRGBColorSpace;
  });

  const { material, uniforms } = useMemo(() => {
    const uPointer = uniform(new THREE.Vector2(0));
    const uProgress = uniform(0);

    const strength = 0.01;

    const uDepthMap = texture(depthMap);

    const uMap = texture(
      rawMap,
      uv().add(uDepthMap.r.mul(uPointer).mul(strength))
    );

    const aspect = float(WIDTH, HEIGHT);
    const tUv = vec2(uv().x.mul(aspect), uv().y);

    const tiling = vec2(120.0);
    const tiledUV = mod(tUv.mul(tiling), 2.0).sub(1.0);

    const brightness = mx_cell_noise_float(tUv.mul(tiling).div(2));

    const dist = float(tiledUV.length());
    const dot = float(smoothstep(0.5, 0.49, dist)).mul(brightness);

    const depth = uDepthMap;

    const flow = oneMinus(smoothstep(0, 0.02, abs(depth.sub(uProgress))));

    const mask = dot.mul(flow).mul(vec3(10, 0, 0));

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

  const [w, h] = useAspect(WIDTH, HEIGHT);

  useGSAP(() => {
    gsap.to(uniforms.uProgress, {
      value: 1,
      repeat: -1,
      duration: 3,
      ease: "power1.out",
    });
  }, [uniforms.uProgress]);

  useFrame(({ pointer }) => {
    uniforms.uPointer.value = pointer;
  });

  return (
    <Fragment>
      <mesh scale={[4, 5, 1]} material={material}>
        <planeGeometry />
      </mesh>
    </Fragment>
  );
};

const Home = () => {
  return (
    <WebGPUCanvas>
      <Scene />
    </WebGPUCanvas>
  );
};

export default Home;
