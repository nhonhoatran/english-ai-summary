"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { CatMood } from "@/lib/cat/compute-cat-mood";

interface CatSpriteProps {
  mood: CatMood;
  size?: number;
  accessories?: string[];
}

export function CatSprite({ mood, size = 120 }: CatSpriteProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const moodRef = useRef<CatMood>(mood);
  moodRef.current = mood;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, WebGL Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.set(0, 1.2, 4.2);
    camera.lookAt(0, 0.8, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(size, size);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // 2. Lights setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(3, 5, 4);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 512;
    dirLight.shadow.mapSize.height = 512;
    scene.add(dirLight);

    const fillLight = new THREE.PointLight(0x60a5fa, 0.8, 10);
    fillLight.position.set(-3, 2, -2);
    scene.add(fillLight);

    // 3. Materials
    const blackMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.4,
      metalness: 0.1,
    });

    const whiteMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.3,
      metalness: 0.05,
    });

    const pinkMat = new THREE.MeshStandardMaterial({
      color: 0xf472b6,
      roughness: 0.4,
    });

    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.1,
      metalness: 0.2,
    });

    const pupilMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
    const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // 4. Cat Base 3D Group
    const catGroup = new THREE.Group();
    scene.add(catGroup);

    // Shadow Plane
    const shadowGeo = new THREE.PlaneGeometry(2.5, 2.5);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.y = 0.01;
    scene.add(shadowMesh);

    // Body
    const bodyGeo = new THREE.SphereGeometry(0.7, 32, 32);
    bodyGeo.scale(0.85, 1, 0.8);
    const bodyMesh = new THREE.Mesh(bodyGeo, blackMat);
    bodyMesh.position.set(0, 0.65, 0);
    catGroup.add(bodyMesh);

    // White Chest Patch
    const chestGeo = new THREE.SphereGeometry(0.55, 32, 32);
    chestGeo.scale(0.7, 0.95, 0.5);
    const chestMesh = new THREE.Mesh(chestGeo, whiteMat);
    chestMesh.position.set(0, 0.65, 0.42);
    catGroup.add(chestMesh);

    // Paws
    const pawGeo = new THREE.SphereGeometry(0.2, 16, 16);
    pawGeo.scale(1, 0.6, 1.2);

    const leftFrontPaw = new THREE.Mesh(pawGeo, whiteMat);
    leftFrontPaw.position.set(-0.32, 0.12, 0.55);
    catGroup.add(leftFrontPaw);

    const rightFrontPaw = new THREE.Mesh(pawGeo, whiteMat);
    rightFrontPaw.position.set(0.32, 0.12, 0.55);
    catGroup.add(rightFrontPaw);

    const leftBackPaw = new THREE.Mesh(pawGeo, whiteMat);
    leftBackPaw.position.set(-0.48, 0.12, -0.1);
    catGroup.add(leftBackPaw);

    const rightBackPaw = new THREE.Mesh(pawGeo, whiteMat);
    rightBackPaw.position.set(0.48, 0.12, -0.1);
    catGroup.add(rightBackPaw);

    // Head Group
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.35, 0.1);
    catGroup.add(headGroup);

    // Head Base
    const headGeo = new THREE.SphereGeometry(0.62, 32, 32);
    headGeo.scale(1.05, 0.92, 0.95);
    const headMesh = new THREE.Mesh(headGeo, blackMat);
    headGroup.add(headMesh);

    // White Muzzle
    const muzzleGeo = new THREE.SphereGeometry(0.42, 24, 24);
    muzzleGeo.scale(1.1, 0.75, 0.65);
    const muzzleMesh = new THREE.Mesh(muzzleGeo, whiteMat);
    muzzleMesh.position.set(0, -0.12, 0.36);
    headGroup.add(muzzleMesh);

    // Nose
    const noseGeo = new THREE.ConeGeometry(0.06, 0.05, 4);
    noseGeo.rotateX(Math.PI);
    const noseMesh = new THREE.Mesh(noseGeo, pinkMat);
    noseMesh.position.set(0, -0.05, 0.61);
    headGroup.add(noseMesh);

    // Ears
    const earGeo = new THREE.ConeGeometry(0.22, 0.45, 16);

    const leftEar = new THREE.Mesh(earGeo, blackMat);
    leftEar.position.set(-0.35, 0.52, 0.05);
    leftEar.rotation.set(-0.1, 0, 0.35);
    headGroup.add(leftEar);

    const leftInnerEar = new THREE.Mesh(earGeo, pinkMat);
    leftInnerEar.scale.set(0.65, 0.65, 0.65);
    leftInnerEar.position.set(-0.35, 0.52, 0.08);
    leftInnerEar.rotation.set(-0.1, 0, 0.35);
    headGroup.add(leftInnerEar);

    const rightEar = new THREE.Mesh(earGeo, blackMat);
    rightEar.position.set(0.35, 0.52, 0.05);
    rightEar.rotation.set(-0.1, 0, -0.35);
    headGroup.add(rightEar);

    const rightInnerEar = new THREE.Mesh(earGeo, pinkMat);
    rightInnerEar.scale.set(0.65, 0.65, 0.65);
    rightInnerEar.position.set(0.35, 0.52, 0.08);
    rightInnerEar.rotation.set(-0.1, 0, -0.35);
    headGroup.add(rightInnerEar);

    // Eyes Group
    const eyesGroup = new THREE.Group();
    headGroup.add(eyesGroup);

    const eyeGeo = new THREE.SphereGeometry(0.14, 24, 24);

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.24, 0.08, 0.51);
    eyesGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.24, 0.08, 0.51);
    eyesGroup.add(rightEye);

    // Pupils
    const pupilGeo = new THREE.SphereGeometry(0.08, 16, 16);
    pupilGeo.scale(0.5, 1, 0.5);

    const leftPupil = new THREE.Mesh(pupilGeo, pupilMat);
    leftPupil.position.set(-0.24, 0.08, 0.62);
    eyesGroup.add(leftPupil);

    const rightPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rightPupil.position.set(0.24, 0.08, 0.62);
    eyesGroup.add(rightPupil);

    // Eye Shine
    const shineGeo = new THREE.SphereGeometry(0.03, 8, 8);
    const leftShine = new THREE.Mesh(shineGeo, shineMat);
    leftShine.position.set(-0.21, 0.12, 0.64);
    eyesGroup.add(leftShine);

    const rightShine = new THREE.Mesh(shineGeo, shineMat);
    rightShine.position.set(0.27, 0.12, 0.64);
    eyesGroup.add(rightShine);

    // Segmented Tail
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, 0.35, -0.6);
    catGroup.add(tailGroup);

    const tailSegments: THREE.Mesh[] = [];
    const numSegments = 6;
    let prevSeg: THREE.Object3D = tailGroup;

    for (let i = 0; i < numSegments; i++) {
      const radius = 0.09 - i * 0.01;
      const segGeo = new THREE.CylinderGeometry(radius, radius + 0.01, 0.25, 16);
      const segMesh = new THREE.Mesh(segGeo, blackMat);
      segMesh.position.set(0, 0.12, -0.1);
      segMesh.rotation.x = 0.3;
      prevSeg.add(segMesh);
      tailSegments.push(segMesh);
      prevSeg = segMesh;
    }

    const tipGeo = new THREE.SphereGeometry(0.05, 12, 12);
    const tipMesh = new THREE.Mesh(tipGeo, whiteMat);
    tipMesh.position.set(0, 0.15, 0);
    prevSeg.add(tipMesh);

    // Interactive Mouse Tracking
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetMouseX = x * 2;
      targetMouseY = -y * 2;
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Animation Loop
    const clock = new THREE.Clock();
    let reqId: number;
    let blinkTimer = 0;

    const animate = () => {
      reqId = requestAnimationFrame(animate);

      const elapsedTime = clock.getElapsedTime();
      const currentMood = moodRef.current;

      // Mouse Head Tracking
      headGroup.rotation.y += (targetMouseX * 0.4 - headGroup.rotation.y) * 0.1;
      headGroup.rotation.x += (targetMouseY * 0.2 - headGroup.rotation.x) * 0.1;

      // Real-time Tail Wave
      tailSegments.forEach((seg, idx) => {
        const waveSpeed = currentMood === "playing" ? 8 : currentMood === "happy" ? 5 : 2;
        const waveAmp = currentMood === "playing" ? 0.25 : 0.12;
        seg.rotation.z = Math.sin(elapsedTime * waveSpeed + idx * 0.4) * waveAmp;
      });

      // Blinking Logic
      blinkTimer += 0.016;
      if (blinkTimer > 3.5) {
        eyesGroup.scale.y = Math.max(0.05, Math.sin((blinkTimer - 3.5) * Math.PI * 10));
        if (blinkTimer > 3.7) {
          blinkTimer = 0;
          eyesGroup.scale.y = 1;
        }
      } else {
        eyesGroup.scale.y = 1;
      }

      // Reset base transformations
      catGroup.position.set(0, 0, 0);
      catGroup.rotation.set(0, 0, 0);
      catGroup.scale.set(1, 1, 1);
      leftEar.rotation.set(-0.1, 0, 0.35);
      rightEar.rotation.set(-0.1, 0, -0.35);

      // Mood 3D Animations
      switch (currentMood) {
        case "happy":
          catGroup.position.y = Math.sin(elapsedTime * 4) * 0.06;
          headGroup.rotation.z = Math.sin(elapsedTime * 3) * 0.05;
          leftEar.rotation.z = 0.35 + Math.sin(elapsedTime * 6) * 0.05;
          rightEar.rotation.z = -0.35 - Math.sin(elapsedTime * 6) * 0.05;
          break;

        case "playing":
          catGroup.position.y = Math.abs(Math.sin(elapsedTime * 6)) * 0.22;
          catGroup.rotation.z = Math.sin(elapsedTime * 5) * 0.1;
          headGroup.rotation.z = Math.sin(elapsedTime * 8) * 0.1;
          break;

        case "sleeping":
          catGroup.position.y = -0.15;
          catGroup.rotation.x = 0.2;
          headGroup.position.set(0, 1.1, 0.2);
          headGroup.rotation.x = 0.3;
          eyesGroup.scale.y = 0.05;
          catGroup.scale.y = 1 + Math.sin(elapsedTime * 2) * 0.03;
          break;

        case "hungry":
          catGroup.position.y = Math.sin(elapsedTime * 3) * 0.03;
          headGroup.rotation.x = -0.25;
          leftPupil.scale.set(1.4, 1.4, 1.4);
          rightPupil.scale.set(1.4, 1.4, 1.4);
          break;

        case "sad":
          catGroup.position.y = -0.08;
          headGroup.rotation.x = 0.25;
          leftEar.rotation.z = 0.6;
          rightEar.rotation.z = -0.6;
          break;

        case "dirty":
          catGroup.rotation.y = Math.sin(elapsedTime * 3) * 0.1;
          break;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(reqId);
      window.removeEventListener("mousemove", handleMouseMove);
      renderer.dispose();
    };
  }, [size]);

  return (
    <div
      ref={mountRef}
      className="relative flex items-center justify-center select-none cursor-pointer"
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
}
