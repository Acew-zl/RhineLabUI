import * as THREE from 'three';

/** Native display resolution, outside the optical/postprocessing pipeline.
 * Actual model geometry writes depth only so labels never show through cards.
 * Geometry, textures and instance buffers are borrowed, not duplicated in JS.
 */
export class BookmarkReadableLayer {
  private renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  private scene = new THREE.Scene();
  private depth = new THREE.MeshBasicMaterial({ colorWrite: false, side: THREE.DoubleSide });
  private copies = new Map<THREE.Mesh, THREE.Mesh>();
  constructor(private host: HTMLElement, private atlas: THREE.InstancedMesh) {
    this.renderer.setClearColor(0, 0);
    this.renderer.domElement.className = 'bookmark-readable-layer';
    this.renderer.domElement.setAttribute('aria-hidden', 'true');
    host.parentElement!.querySelector('.archive-atmosphere')!.after(this.renderer.domElement);
    this.scene.add(atlas);
    this.resize();
  }
  resize() {
    const scale = this.host.getBoundingClientRect().width / Math.max(1, this.host.clientWidth);
    this.renderer.setPixelRatio(devicePixelRatio * scale);
    this.renderer.setSize(this.host.clientWidth, this.host.clientHeight, false);
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
    for (const copy of this.copies.values()) {
      if (copy.material !== this.depth) (copy.material as THREE.Material).dispose();
      if (copy instanceof THREE.InstancedMesh) copy.dispose();
    }
    this.copies.clear(); this.scene.clear(); this.depth.dispose();
    this.renderer.dispose(); this.renderer.forceContextLoss(); this.renderer.domElement.remove();
  }
}
