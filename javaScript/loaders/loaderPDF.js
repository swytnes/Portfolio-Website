// js/loaders/loaderPDF.js
import * as THREE from 'three';


const PDFJS_VERSION = '3.11.174';

// ---- load pdf.js (UMD) and set worker --------------------------------------
async function loadPdfJs() {
  try {
    await import(`https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.js`);
  } catch {
    await import(`https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.js`);
  }
  const lib = globalThis.pdfjsLib;
  if (!lib) throw new Error('[loaderPDF] pdfjsLib global not found');
  lib.GlobalWorkerOptions.workerSrc =
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.js`;
  return lib;
}
const pdfjsLib = await loadPdfJs();

/**
 * Render a PDF page to a CanvasTexture and place it on a plane.
 *
 * addToWorld: (obj:THREE.Object3D) => void   // you pass world.add
 *
 * opts:
 *  - url: string (required)
 *  - pageNumber: number = 1
 *  - width: number = 120        // world units across X (ignored if height only)
 *  - height?: number            // world units across Y (if set, width auto-computed)
 *  - position: [x,y,z] = [0,0,0.1]  // slight +Z to sit in front of the grid
 *  - rotation: [rx,ry,rz] = [0,0,0] // e.g. [-Math.PI/2,0,0] to lay flat
 *  - upscale: number ≈ devicePixelRatio (texture sharpness)
 *  - doubleSided: boolean = false
 *  - maxTexWidth: number = 2048    // texture cap
 */
export async function load(addToWorld, opts = {}) {
  const {
    url,
    pageNumber = 1,
    width = 120,
    height = null,                    // <- NEW: specify height to size vertically
    position = [0, 0, 0.1],           // slight Z-forward to avoid z-fighting
    rotation = [0, 0, 0],
    upscale = Math.min(2.5, window.devicePixelRatio || 1.5),
    doubleSided = false,
    maxTexWidth = 2048,
  } = opts;

  if (!url) throw new Error('[loaderPDF] "url" is required');

  // Wrapper group you can move/rotate as one
  const group = new THREE.Group();
  group.name = `pdf:${(url.split('/').pop() || 'file')}`;
  // Ensure this renders in front of helpers/grid
  group.renderOrder = 10;

  addToWorld(group);

  // ---- load & rasterize the PDF page ---------------------------------------
  const task = pdfjsLib.getDocument(url);
  const pdf = await task.promise;
  const page = await pdf.getPage(pageNumber);

  const baseVp = page.getViewport({ scale: 1 });
  const targetPxW = Math.min(maxTexWidth, Math.ceil(baseVp.width * upscale));
  const scale = targetPxW / baseVp.width;
  const vp = page.getViewport({ scale });

  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(vp.width);
  canvas.height = Math.ceil(vp.height);

  const ctx = canvas.getContext('2d', { alpha: true });
  await page.render({ canvasContext: ctx, viewport: vp, intent: 'display' }).promise;

  // ---- canvas -> texture ----------------------------------------------------
  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.generateMipmaps = true;

  // Maintain page aspect unless both width & height are explicitly set
  const aspect = canvas.height / canvas.width; // H/W
  let planeW, planeH;
  if (height != null && width != null) {
    // stretch to exactly these values
    planeW = width;
    planeH = height;
  } else if (height != null) {
    planeH = height;
    planeW = height / aspect;
  } else {
    planeW = width;
    planeH = width * aspect;
  }

  const geo = new THREE.PlaneGeometry(planeW, planeH);
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    side: doubleSided ? THREE.DoubleSide : THREE.FrontSide,
    depthTest: false,                 // keep in front of grid
  });

  const plane = new THREE.Mesh(geo, mat);
  plane.name = 'pdf-plane';
  plane.renderOrder = 11;             // above the frame
  group.add(plane);

  // Subtle backdrop to lift the page over background/grid
  const frameGeo = new THREE.PlaneGeometry(planeW * 1.02, planeH * 1.02);
  const frameMat = new THREE.MeshBasicMaterial({
    color: 0x0b0f1a,
    transparent: true,
    opacity: 0.4,
    depthTest: false,
  });
  const frame = new THREE.Mesh(frameGeo, frameMat);
  frame.renderOrder = 10;
  frame.position.z = -0.001;          // just behind the page
  group.add(frame);

  // Place it
  group.position.set(...position);
  group.rotation.set(...rotation);

  // Cleanup hook (call before removeAndDispose)
  group.__cleanup = () => {
    tex.dispose();
    mat.dispose(); geo.dispose();
    frameMat.dispose(); frameGeo.dispose();
    page.cleanup?.();
    pdf.cleanup?.();
    pdf.destroy?.();
    task.destroy?.();
  };

  return group;
}





