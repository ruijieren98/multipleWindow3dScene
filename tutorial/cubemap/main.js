import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';

let camera, scene, renderer, stats;
let cube, sphere, torus, material, sphere_2;

let cubeCamera, cubeRenderTarget;
let cubeCamera2, cubeRenderTarget2;

let controls;

init();

function init() {

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setAnimationLoop( animation );
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    document.body.appendChild( renderer.domElement );

    window.addEventListener( 'resize', onWindowResized );

    stats = new Stats();
    document.body.appendChild( stats.dom );

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.z = 75;

    scene = new THREE.Scene();
    scene.rotation.y = 0.5; // avoid flying objects occluding the sun

    new RGBELoader()
        .setPath( 'textures/' )
        .load( 'test_1k.hdr', function ( texture ) {

            texture.mapping = THREE.EquirectangularReflectionMapping;

            scene.background = texture;
            scene.environment = texture;

        } );

    //

    cubeRenderTarget = new THREE.WebGLCubeRenderTarget( 256 );
    cubeRenderTarget.texture.type = THREE.HalfFloatType;

    cubeCamera = new THREE.CubeCamera( 1, 1000, cubeRenderTarget );

    //

    material = new THREE.MeshStandardMaterial( {
        envMap: cubeRenderTarget.texture,
        roughness: 0.05,
        metalness: 1
    } );

    cubeRenderTarget2 = new THREE.WebGLCubeRenderTarget( 256 );
    cubeRenderTarget2.texture.type = THREE.HalfFloatType;
    cubeCamera2 = new THREE.CubeCamera( 1, 1000, cubeRenderTarget2 );

    // 修改 sphere_2 的材质，使用新的环境贴图
    const materialForSphere2 = new THREE.MeshStandardMaterial({
        envMap: cubeRenderTarget2.texture,
        roughness: 0.05,
        metalness: 1
    });
    

    const gui = new GUI();
    gui.add( material, 'roughness', 0, 1 );
    gui.add( material, 'metalness', 0, 1 );
    gui.add( renderer, 'toneMappingExposure', 0, 2 ).name( 'exposure' );

    sphere = new THREE.Mesh( new THREE.IcosahedronGeometry( 15, 8 ), material );
    scene.add( sphere );

    sphere_2 = new THREE.Mesh( new THREE.IcosahedronGeometry( 15, 8 ), materialForSphere2 );
    scene.add( sphere_2 );

    const material2 = new THREE.MeshStandardMaterial( {
        roughness: 0.1,
        metalness: 0
    } );

    cube = new THREE.Mesh( new THREE.BoxGeometry( 25, 15, 15 ), material2 );
    scene.add( cube );

    torus = new THREE.Mesh( new THREE.TorusKnotGeometry( 8, 3, 128, 16 ), material2 );
    scene.add( torus );

    //

    controls = new OrbitControls( camera, renderer.domElement );
    controls.autoRotate = true;

}

function onWindowResized() {

    renderer.setSize( window.innerWidth, window.innerHeight );

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

}

function animation( msTime ) {

    const time = msTime / 1000;

    cube.position.x = Math.cos( time ) * 30;
    cube.position.y = Math.sin( time ) * 30;
    cube.position.z = Math.sin( time ) * 30;

    cube.rotation.x += 0.02;
    cube.rotation.y += 0.03;

    torus.position.x = Math.cos( time + 10 ) * 30;
    torus.position.y = Math.sin( time + 10 ) * 30;
    torus.position.z = Math.sin( time + 10 ) * 30;

    torus.rotation.x += 0.02;
    torus.rotation.y += 0.03;

    sphere_2.position.x = 20;
    sphere_2.position.y = 20;
    sphere_2.position.z = 20;


    cubeCamera.update( renderer, scene );

    cubeCamera2.position.copy(sphere_2.position);
    cubeCamera2.update( renderer, scene );


    controls.update();

    renderer.render( scene, camera );

    stats.update();

}
