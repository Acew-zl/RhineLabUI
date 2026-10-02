import * as THREE from 'three';
import { bookmarkQuietZone } from './bookmark-quiet-zones';

/** Native display resolution, outside the optical/postprocessing pipeline.
 * Actual model geometry writes depth only so labels never show through cards.
 * Geometry, textures and instance buffers are borrowed, not duplicated in JS.
 */
export class BookmarkReadableLayer {
  private renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  private scene = new THREE.Scene();
  private depth = new THREE.MeshBasicMaterial({ colorWrite: false, side: THREE.DoubleSide });
  private copies = new Map<THREE.Mesh, THREE.Mesh>();
  private quietRects = { value: Array.from({ length: 5 }, () => new THREE.Vector4(2, 2, 2, 2)) };
  private viewport = { value: new THREE.Vector2(1, 1) };
  private selectedHeight = { value: 12 };
  private feather = { value: new THREE.Vector2(.005, .005) };
  private layoutDirty = true;
  private observedZones: Element[];
  private observer: ResizeObserver;
  private modeObserver: MutationObserver;
  private pointA = new THREE.Vector3();
  private pointB = new THREE.Vector3();
  constructor(private host: HTMLElement, private atlas: THREE.InstancedMesh, private invalidate: () => void) {
    this.renderer.setClearColor(0, 0);
    this.renderer.domElement.className = 'bookmark-readable-layer';
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    host.parentElement!.querySelector('.archive-atmosphere')!.after(this.renderer.domElement);
    this.scene.add(atlas);
    // Only the array atlas fades. The selected/returning spine decals keep their
    // native-resolution text, including when they pass a quiet zone.
    const material = atlas.material as THREE.MeshBasicMaterial;
    const compile = material.onBeforeCompile, cacheKey = material.customProgramCacheKey();
    material.onBeforeCompile = (shader, renderer) => {
      compile.call(material, shader, renderer);
      Object.assign(shader.uniforms, { spineQuietRects: this.quietRects, spineViewport: this.viewport, spineSelectedHeight: this.selectedHeight, spineFeather: this.feather });
      shader.vertexShader = 'uniform vec2 spineViewport; varying float spineHeight;\n' + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('#include <project_vertex>', `#include <project_vertex>
        vec4 spineNear = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position.x, position.y, -.113, 1.0);
        vec4 spineFar = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position.x, position.y, .197, 1.0);
        spineHeight = length((spineNear.xy / spineNear.w - spineFar.xy / spineFar.w) * spineViewport * .5);`);
      shader.fragmentShader = 'uniform vec4 spineQuietRects[5]; uniform vec2 spineViewport; uniform vec2 spineFeather; uniform float spineSelectedHeight; varying float spineHeight;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('#include <opaque_fragment>', `
        vec2 spinePixel = gl_FragCoord.xy / spineViewport;
        float quiet = 0.0;
        for (int q = 0; q < 5; q++) {
          vec4 r = spineQuietRects[q];
          vec2 nearEdge = smoothstep(r.xy - spineFeather, r.xy, spinePixel);
          vec2 farEdge = 1.0 - smoothstep(r.zw, r.zw + spineFeather, spinePixel);
          quiet = max(quiet, nearEdge.x * nearEdge.y * farEdge.x * farEdge.y);
        }
        float foregroundFade = mix(1.0, .25, smoothstep(1.8, 3.3, spineHeight / max(5.0, spineSelectedHeight)));
        diffuseColor.a *= mix(1.0, .08, quiet) * foregroundFade;
        #include <opaque_fragment>`);
    };
    material.customProgramCacheKey = () => cacheKey + '-bookmark-quiet-zones-v1';
    material.needsUpdate = true;
    // The footer's fixed line box is stable while its clock rolls. Observing
    // individual clock/name spans would wake WebGL for small DOM-only changes.
    this.observedZones = [...host.parentElement!.querySelectorAll('.archive-counter, .archive-hint, .system-footer')].slice(0, 5);
    this.observer = new ResizeObserver(() => { this.layoutDirty = true; });
    [host, ...this.observedZones].forEach(node => this.observer.observe(node));
    this.modeObserver = new MutationObserver(() => { this.layoutDirty = true; });
    this.modeObserver.observe(host.parentElement!, { attributes: true, attributeFilter: ['style', 'data-mode', 'data-layout'] });
    this.resize();
  }
  resize() {
    const scale = this.host.getBoundingClientRect().width / Math.max(1, this.host.clientWidth);
    this.renderer.setPixelRatio(devicePixelRatio * scale);
    this.renderer.setSize(this.host.clientWidth, this.host.clientHeight, false);
    this.viewport.value.set(this.renderer.domElement.width, this.renderer.domElement.height);
    this.layoutDirty = true;
  }
  updateFocus(model: THREE.Object3D, camera: THREE.Camera) {
    if (this.layoutDirty) {
      this.layoutDirty = false;
      const bounds = this.host.getBoundingClientRect();
      this.feather.value.set(8 / Math.max(1, bounds.width), 8 / Math.max(1, bounds.height));
      this.observedZones.forEach((node, i) => {
        const rect = bookmarkQuietZone(node.getBoundingClientRect(), bounds);
        const value = this.quietRects.value[i];
        if (rect.some((n, j) => Math.abs(value.getComponent(j) - n) > .00001)) { value.set(...rect); this.invalidate(); }
      });
    }
    this.pointA.set(0, 3.703, -.113).applyMatrix4(model.matrixWorld).project(camera);
    this.pointB.set(0, 3.703, .197).applyMatrix4(model.matrixWorld).project(camera);
    this.selectedHeight.value = Math.hypot((this.pointA.x - this.pointB.x) * this.viewport.value.x / 2, (this.pointA.y - this.pointB.y) * this.viewport.value.y / 2);
  }
  private sync(source: THREE.Scene, opacity: number) {
    const bounds = this.host.getBoundingClientRect();
    if (Math.abs(this.renderer.domElement.width - bounds.width * devicePixelRatio) > 1 || Math.abs(this.renderer.domElement.height - bounds.height * devicePixelRatio) > 1) this.resize();
    this.renderer.domElement.style.opacity = String(opacity);
    this.scene.fog = source.fog;
    const alive = new Set<THREE.Mesh>();
    source.traverseVisible(object => {
      if (!(object instanceof THREE.Mesh)) return;
      // Front printed labels are already rendered with the original material.
      if (object.userData.printedLabel && object.name !== 'bookmark-spine') return;
      alive.add(object);
      let copy = this.copies.get(object);
      if (!copy) {
        const label = object.name === 'bookmark-spine';
        const material = label ? new THREE.MeshBasicMaterial({ map: (object.material as THREE.MeshBasicMaterial).map, toneMapped: false, fog: false, transparent: true, depthWrite: false }) : this.depth;
        copy = object instanceof THREE.InstancedMesh ? new THREE.InstancedMesh(object.geometry, material, object.instanceMatrix.count) : new THREE.Mesh(object.geometry, material);
        copy.matrixAutoUpdate = false; copy.frustumCulled = false;
        copy.renderOrder = label ? 2 : 0;
        this.copies.set(object, copy); this.scene.add(copy);
      }
      copy.matrix.copy(object.matrixWorld);
      if (object.name === 'bookmark-spine') (copy.material as THREE.Material).opacity = (object.material as THREE.Material).opacity;
      if (object instanceof THREE.InstancedMesh && copy instanceof THREE.InstancedMesh) {
        if (copy.instanceMatrix !== object.instanceMatrix) { copy.dispose(); copy.instanceMatrix = object.instanceMatrix; }
        copy.count = object.count;
      }
    });
    for (const [original, copy] of this.copies) if (!alive.has(original)) {
      copy.removeFromParent();
      if (copy.material !== this.depth) (copy.material as THREE.Material).dispose();
      if (copy instanceof THREE.InstancedMesh) copy.dispose();
      this.copies.delete(original);
    }
    const anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    for (const mesh of [this.atlas, ...this.copies.values()]) {
      const texture = (mesh.material as THREE.MeshBasicMaterial).map;
      if (texture && texture.anisotropy !== anisotropy) { texture.anisotropy = anisotropy; texture.needsUpdate = true; }
    }
    this.atlas.renderOrder = 2;
  }
  render(source: THREE.Scene, camera: THREE.Camera, opacity: number) {
    this.sync(source, opacity);
    this.renderer.render(this.scene, camera);
  }
  async prepare(source: THREE.Scene, camera: THREE.Camera) {
    this.sync(source, 0);
    await this.renderer.compileAsync(this.scene, camera);
    this.renderer.render(this.scene, camera);
  }
  dispose() {
    this.observer.disconnect(); this.modeObserver.disconnect();
    for (const copy of this.copies.values()) {
      if (copy.material !== this.depth) (copy.material as THREE.Material).dispose();
      if (copy instanceof THREE.InstancedMesh) copy.dispose();
    }
    this.copies.clear(); this.scene.clear(); this.depth.dispose();
    this.renderer.dispose(); this.renderer.forceContextLoss(); this.renderer.domElement.remove();
  }
}
