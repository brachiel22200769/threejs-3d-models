import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

const manager = new THREE.LoadingManager();
let camera, scene, renderer, stats, object, loader, mixer;
let animations = [];
const clock = new THREE.Clock();
let currentAnimationIndex = 0;

const params = {
    asset: 'Samba Dancing',
    animation: 'Samba Dancing'
};

const assets = ['Samba Dancing', 'Capoeira', 'Arm Stretching', 'Jump', 'Kick To The Groin', 'Kneeling Pointing', 'Reaction'];

init();

function init() {
    const container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.set(100, 200, 300);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0a0a0);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 5);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 5);
    dirLight.position.set(0, 200, 100);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false }));
    mesh.rotation.x = -Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const grid = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add(grid);

    loader = new FBXLoader(manager);
    loadAsset(params.asset);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animate);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 100, 0);
    controls.update();

    window.addEventListener('resize', onWindowResize);

    stats = new Stats();
    container.appendChild(stats.dom);

    const gui = new GUI();
    gui.add(params, 'asset', assets).onChange(loadAsset);

    window.addEventListener('keydown', handleKeyDown);
}

function loadAsset(asset) {
    loader.load('../models/fbx/' + asset + '.fbx', function (group) {
        if (object) {
            object.traverse(child => {
                if (child.material) {
                    const materials = Array.isArray(child.material) ? child.material : [child.material];
                    materials.forEach(material => {
                        if (material.map) material.map.dispose();
                        material.dispose();
                    });
                }
                if (child.geometry) child.geometry.dispose();
            });
            scene.remove(object);
        }

        object = group;
        scene.add(object);

        if (object.animations.length) {
            mixer = new THREE.AnimationMixer(object);
            animations = object.animations;

            const action = mixer.clipAction(animations[0]);
            action.reset().fadeIn(0.5).play();
        }
    });
}

function switchAnimationByAssetIndex(index) {
    if (index < 0 || index >= assets.length) return;

    currentAnimationIndex = index;
    params.asset = assets[index];
    loadAsset(params.asset);
}

function handleKeyDown(event) {
    if (event.key === 'ArrowRight') {
        let nextIndex = (currentAnimationIndex + 1) % assets.length;
        switchAnimationByAssetIndex(nextIndex);
    } else if (event.key === 'ArrowLeft') {
        let prevIndex = (currentAnimationIndex - 1 + assets.length) % assets.length;
        switchAnimationByAssetIndex(prevIndex);
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    const delta = clock.getDelta();
    if (mixer) mixer.update(delta);
    renderer.render(scene, camera);
    stats.update();
}