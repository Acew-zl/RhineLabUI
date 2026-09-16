import * as THREE from 'three';
import { archiveColumns } from './data.ts';

// Muted glass tints; order follows the actual folder columns, including the bar.
export function bookmarkColumnColor(category: string) {
  const lane = Math.max(0, archiveColumns.indexOf(category));
  return new THREE.Color().setHSL((.1 + lane * .381966) % 1, .34, .71);
}
export function bookmarkTintMaterial(material: THREE.Material, instanced: boolean) {
  const tint = { value: new THREE.Color('white') };
  const before = material.onBeforeCompile;
  const key = material.customProgramCacheKey.bind(material)();
  material.onBeforeCompile = (shader, renderer) => {
    before.call(material, shader, renderer);
    shader.uniforms.bookmarkTint = tint;
    if (instanced) {
      shader.vertexShader = 'attribute vec3 archiveTint; varying vec3 vArchiveTint;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvArchiveTint = archiveTint;');
      shader.fragmentShader = 'varying vec3 vArchiveTint;\n' + shader.fragmentShader;
    }
    shader.fragmentShader = 'uniform vec3 bookmarkTint;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `outgoingLight *= mix(vec3(1.0), ${instanced ? 'vArchiveTint' : 'bookmarkTint'}, .42);\n#include <opaque_fragment>`);
  };
  material.customProgramCacheKey = () => `${key}-bookmark-tint-${instanced}`;
  return tint;
}
