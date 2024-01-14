import WindowManager from './WindowManager.js'
import * as THREE from 'three';

import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const t = THREE;
let camera, scene, renderer, world;
let pixR = window.devicePixelRatio ? window.devicePixelRatio : 1;
let spheres = [];

let sceneOffsetTarget = {x: 0, y: 0};
let sceneOffset = {x: 0, y: 0};

let today = new Date();
today.setHours(0);
today.setMinutes(0);
today.setSeconds(0);
today.setMilliseconds(0);
today = today.getTime();

let internalTime = getTime();
let windowManager;
let initialized = false;
let axesHelpers = [];

let cubeCameras = [];
let materials = [];
let controls;

let uiIcons = [];


// get time in seconds since beginning of the day (so that all windows use the same time)
function getTime ()
{
	return (new Date().getTime() - today) / 1000.0;
}


if (new URLSearchParams(window.location.search).get("clear"))
{
	localStorage.clear();
}
else
{	
	// this code is essential to circumvent that some browsers preload the content of some pages before you actually hit the url
	document.addEventListener("visibilitychange", () => 
	{
		if (document.visibilityState != 'hidden' && !initialized)
		{
			init();
		}
	});

	window.onload = () => {
		if (document.visibilityState != 'hidden')
		{
			init();
		}
	};

	function init ()
	{
		initialized = true;

		// add a short timeout because window.offsetX reports wrong values before a short period 
		setTimeout(() => {
			setupScene();
			setupWindowManager();
			resize();
			updateWindowShape(false);
			render();
			window.addEventListener('resize', resize);
		}, 500)	
	}

	function setupScene ()
	{

        camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 10000 );
        camera.position.z = -1000;

		scene = new t.Scene();
		scene.background = new t.Color(0.0);
		scene.add( camera );

		renderer = new t.WebGLRenderer({antialias: true, depthBuffer: true});
		renderer.setPixelRatio(pixR);

	  	world = new t.Object3D();
		scene.add(world);

		renderer.domElement.setAttribute("id", "scene");
		document.body.appendChild( renderer.domElement );

        controls = new OrbitControls( camera, renderer.domElement );
        controls.autoRotate = false;
	}

	function setupWindowManager ()
	{
		windowManager = new WindowManager();
		windowManager.setWinShapeChangeCallback(updateWindowShape);
		windowManager.setWinChangeCallback(windowsUpdated);

		// here you can add your custom metadata to each windows instance
		let metaData = {foo: "bar"};

		// this will init the windowmanager and add this window to the centralised pool of windows
		windowManager.init(metaData);

		// call update windows initially (it will later be called by the win change callback)
		windowsUpdated();

		// // The sphere start togging when the icon is clicked
		// ! I want to add listerner here but failed, need to check the class of windowManager, maybe use meta property
		// let wins = windowManager.getWindows();
		// wins.forEach((win, index) => {
		// 	let icon = document.createElement('div');
		// 	icon.textContent = '⚙️';
		// 	icon.style.position = 'absolute';
		// 	icon.style.top = '10px';
		// 	icon.style.right = '10px';
		// 	icon.style.cursor = 'pointer';
		// 	icon.addEventListener('click', () => toggleSphereMovement(index));
		// 	win.element.appendChild(icon);
		// 	uiIcons.push(icon);
		// });
	}

	function windowsUpdated ()
	{
        updateNumberOfSpheres();
	}

	function toggleSphereMovement(index) {
		let sphere = spheres[index];
		if (sphere) {
			sphere.isMoving = !sphere.isMoving;
		}
	}

    function updateNumberOfSpheres ()
	{
		let wins = windowManager.getWindows();

		// remove all spheres
		spheres.forEach((c) => {
			world.remove(c);
		})

		spheres = [];
        cubeCameras = [];

		// add new spheres based on the current window setup
		for (let i = 0; i < wins.length; i++)
		{
			let win = wins[i];

			let c = new t.Color();
			c.setHSL(i * .1, 1.0, .5);

            // set CubeCameras
            new RGBELoader()
			.setPath( 'textures/' )
			.load( 'test_1k.hdr', function ( texture ) {
				texture.mapping = THREE.EquirectangularReflectionMapping;

				scene.background = texture;
				scene.environment = texture;
			} );

			let cubeRenderTarget = new THREE.WebGLCubeRenderTarget( 256 );
			cubeRenderTarget.texture.type = THREE.HalfFloatType;

			let cubeCamera = new THREE.CubeCamera( 1, 1000, cubeRenderTarget );
            cubeCameras.push(cubeCamera)

            // set material for each shpere
			let material = new THREE.MeshStandardMaterial( {
				envMap: cubeRenderTarget.texture,
				roughness: 0.05,
				metalness: 1
			} );

			let s = 100 + i * 50;

			let sphere = new t.Mesh(new t.SphereGeometry(s / 2, 32, 32), material); //SphereGeometry(radius,width_segments, height_segments)<--segments can be used to change the quality. 
			
			sphere.position.x = win.shape.x + (win.shape.w * .5); // initial sphere in window center
			sphere.position.y = win.shape.y + (win.shape.h * .5);

			sphere.winId = wins[i].id;  // link sphere with window
			sphere.isMoving = false;    // initial sphere movement status
			sphere.velocity = {x: 0, y: 10};  // initial sphere velocity

            //axes helper for debug use
            let axesHelper = new t.AxesHelper(1000);
            axesHelpers.push(axesHelper);
            scene.add(axesHelper);
			
			world.add(sphere);
			spheres.push(sphere);
		}
	}

	function updateWindowShape (easing = true)
	{
		// storing the actual offset in a proxy that we update against in the render function
		sceneOffsetTarget = {x: -window.screenX, y: -window.screenY};
		if (!easing) sceneOffset = sceneOffsetTarget;
	}

	function updateSphereMovement (sphere, win) 
	{
		// position update
		sphere.position.x += sphere.velocity.x;
		sphere.position.y += sphere.velocity.y;
	
		// collision detection and bouncing
		if (sphere.position.y - sphere.geometry.parameters.radius < win.shape.y ||
			sphere.position.y + sphere.geometry.parameters.radius > win.shape.y + win.shape.h) 
			{
				sphere.velocity.y *= -1; // Y-axis Bouncing
			}
		if (sphere.position.x - sphere.geometry.parameters.radius < win.shape.x ||
		sphere.position.x + sphere.geometry.parameters.radius > win.shape.x + win.shape.w) 
			{
				sphere.velocity.x *= -1; // X-axis Bouncing
			}
	}


	function render ()
	{
		let t = getTime();

		windowManager.update();


		// calculate the new position based on the delta between current offset and new offset times a falloff value (to create the nice smoothing effect)
		let falloff = .05;
		sceneOffset.x = sceneOffset.x + ((sceneOffsetTarget.x - sceneOffset.x) * falloff);
		sceneOffset.y = sceneOffset.y + ((sceneOffsetTarget.y - sceneOffset.y) * falloff);

		// set the world position to the offset
		world.position.x = sceneOffset.x;
		world.position.y = sceneOffset.y;

		let wins = windowManager.getWindows();


		// loop through all our cubes and update their positions based on current window positions
		for (let i = 0; i < spheres.length; i++)
		{
			let sphere = spheres[i];
			let win = wins[i];
			let _t = t + i * .2;
			
			if (!sphere.isMoving)
			{
				let posTarget = {x: win.shape.x + (win.shape.w * .5), y: win.shape.y + (win.shape.h * .5)} // center of the the inner window

				sphere.position.x = sphere.position.x + (posTarget.x - sphere.position.x) * falloff;
				sphere.position.y = sphere.position.y + (posTarget.y - sphere.position.y) * falloff;

				sphere.rotation.x = _t * .5;
				sphere.rotation.y = _t * .3;

				axesHelpers[i].position.set(world.position.x + sphere.position.x, world.position.y + sphere.position.y,0);
				axesHelpers[i].rotation.set(sphere.rotation.x,sphere.rotation.y,sphere.rotation.z);

				cubeCameras[i].position.copy(axesHelpers[i].position);
				cubeCameras[i].update( renderer, scene );
			}
			
			if (sphere.isMoving) {
				updateSphereMovement(sphere, win);
			}

		};

        controls.update();
		renderer.render(scene, camera);
		requestAnimationFrame(render);
	}


	// resize the renderer to fit the window size
	function resize ()
	{
		let width = window.innerWidth;
		let height = window.innerHeight

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

		renderer.setSize( width, height );
	}
    
}