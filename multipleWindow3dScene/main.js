import WindowManager from './WindowManager.js'
import * as THREE from 'three';
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { LightProbeHelper } from 'three/addons/helpers/LightProbeHelper.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const t = THREE;
let camera, scene, renderer, world;
let ambientLight;
let pixR = window.devicePixelRatio ? window.devicePixelRatio : 1;
let spheres = [];
let satellites = [];

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
let axesHelpers_satellites = [];


let cubeCameras = [];
let materials = [];
let controls;

let uiIcons = [];

let satellite_r = 120; 
let satellite_angle = 0;	

let orth_camera = true;

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
		if (orth_camera) {
			camera = new t.OrthographicCamera(0, 0, window.innerWidth, window.innerHeight, -10000, 10000);
			camera.position.z = 2.5;
		}
		else {
			camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 10000 );
			camera.position.z = -1000;
			camera.position.x = window.innerWidth;
			camera.position.y = window.innerHeight;
		}

        


		scene = new t.Scene();
		scene.background = new t.Color(0.0);
		scene.add( camera );

		ambientLight = new t.AmbientLight( 0x404040 ); // soft white light
		//scene.add( ambientLight );


		////////////////////////////////////////////////
		let starGeometry = new t.BufferGeometry();
		let vertices = [];
		for (let i = 0; i < 5000; i++) {
				let x = Math.random() * 5000 - 2000;
				let y = Math.random() * 5000 - 2000;
				let z = Math.random() * 5000 - 2000;
			//let star = new THREE.Vector3();
			vertices.push( x, y, z );
		}
		starGeometry.setAttribute( 'position', new t.Float32BufferAttribute( vertices, 3 ) );
		
		var starMaterial = new THREE.PointsMaterial({
			size: 10,
			vertexColors: THREE.VertexColors
		});
		
		var starField = new THREE.Points(starGeometry, starMaterial);
		scene.add(starField);

		////////////////////////////////////////////



		renderer = new t.WebGLRenderer({antialias: true, depthBuffer: true});
		renderer.setPixelRatio(pixR);

	  	world = new t.Object3D();
		scene.add(world);

		renderer.domElement.setAttribute("id", "scene");
		document.body.appendChild( renderer.domElement );

        controls = new OrbitControls( camera, renderer.domElement );
        controls.autoRotate = false;
		controls.enableRotate = true;
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
	}

	function windowsUpdated ()
	{
        updateNumberOfSpheres();
	}


    function updateNumberOfSpheres ()
	{
		let wins = windowManager.getWindows();

		// remove all spheres
		spheres.forEach((c) => {
			world.remove(c);
		})

		satellites.forEach((c) => {
			world.remove(c);
		})

		spheres = [];
        cubeCameras = [];
		satellites = [];

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

			const textureLoader = new THREE.TextureLoader();
			const texture_sphere = textureLoader.load('textures/texture_ball.png');

            // set material for each shpere
			let material = new THREE.MeshStandardMaterial( {
				envMap: cubeRenderTarget.texture,
				//map: texture_sphere,
				roughness: 0.05,
				metalness: 1,
				color: 0xffffff,
			} );
			let material_T = new THREE.MeshStandardMaterial( {
				color: 0xfff000, // 金属的颜色
				metalness: 0.8, // 金属度 0.0 到 1.0 之间
				roughness: 0.3  // 粗糙度 0.0 到 1.0 之间
			} );

			let s = 100 + i * 50;

			let sphere = new t.Mesh(new t.SphereGeometry(s / 2, 32, 32), material); //SphereGeometry(radius,width_segments, height_segments)<--segments can be used to change the quality. 
			
			sphere.position.x = win.shape.x + (win.shape.w * .5); // initial sphere in window center
			sphere.position.y = win.shape.y + (win.shape.h * .5);

			sphere.winId = wins[i].id;  // link sphere with window
			sphere.radius = s / 2;

			world.add(sphere);
			spheres.push(sphere);


			const gui = new GUI();
			gui.add(sphere.material, "roughness", 0, 1); // roughness
			gui.add(sphere.material, "metalness", 0, 1); // metalness

            //axes helper for debug use
            let axesHelper = new t.AxesHelper(1000);
            axesHelpers.push(axesHelper);
            scene.add(axesHelper);

			let axesHelpers_satellite = new t.AxesHelper(100);
            axesHelpers_satellites.push(axesHelpers_satellite);
            scene.add(axesHelpers_satellite);


			let satellite = new THREE.Mesh( new t.SphereGeometry(16, 16, 16), new THREE.MeshBasicMaterial({color: c , wireframe: true}) );
			satellites.push(satellite);
			
			world.add(satellite);

		}
	}

	function createParticles(size, color) {
		let geometry = new THREE.Geometry();
		for (let i = 0; i < 35000; i++) {
			let x = -1 + Math.random() * 2;
			let y = -1 + Math.random() * 2;
			let z = -1 + Math.random() * 2;
			let d = 1 / Math.sqrt(x * x + y * y + z * z);
			x *= d * size;
			y *= d * size;
			z *= d * size;
			geometry.vertices.push(new THREE.Vector3(x, y, z));
		}
		let material = new THREE.PointsMaterial({
			size: 0.1,
			color: color,
			transparent: true
		});
		return new THREE.Points(geometry, material);
	}

	function updateWindowShape (easing = true)
	{
		// storing the actual offset in a proxy that we update against in the render function
		sceneOffsetTarget = {x: -window.screenX, y: -window.screenY};
		if (!easing) sceneOffset = sceneOffsetTarget;
	}


	function calculateAttraction(sphere) {
		// 假设吸引力场的大小与sphere的半径成正比
		return sphere.radius * 2; // 或者其他基于半径的公式
	}
	
	function findMostAttractiveSphere(satellite, spheres) {
		let maxAttraction = 0;
		let mostAttractiveSphere = null;
	
		spheres.forEach(sphere => {
			let distance = satellite.position.distanceTo(sphere.position);
			let attractionField = calculateAttraction(sphere);
	
			if (distance < attractionField && attractionField > maxAttraction) {
				maxAttraction = attractionField;
				mostAttractiveSphere = sphere;
			}
		});
	
		return mostAttractiveSphere;
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

			let posTarget = {x: win.shape.x + (win.shape.w * .5), y: win.shape.y + (win.shape.h * .5)} // center of the the inner window

			// Update the position of the sphere towards a target position (posTarget)
			// This creates a smooth transition effect, controlled by the 'falloff' factor
			sphere.position.x += (posTarget.x - sphere.position.x) * falloff;
			sphere.position.y += (posTarget.y - sphere.position.y) * falloff;

			// Update the rotation of the sphere based on a time variable (_t)
			// The rotations are scaled by different factors for x and y axes
			// sphere.rotation.x = _t * 0.5;
			// sphere.rotation.y = _t * 0.3;

			// Update the position and rotation of an axes helper to match the sphere
			// This axes helper is likely used to visualize the orientation of the sphere
			axesHelpers[i].position.set(
				world.position.x + sphere.position.x,
				world.position.y + sphere.position.y,
				0
			);
			axesHelpers[i].rotation.set(
				sphere.rotation.x,
				sphere.rotation.y,
				sphere.rotation.z
			);

			// Update the position of a satellite object
			// The satellite orbits around the sphere in a circular path
			// 'satellite_r' is the radius of the orbit
			let satellite = satellites[i];
			let mostAttractiveSphere = findMostAttractiveSphere(satellite, spheres);

			if (!mostAttractiveSphere) {
				mostAttractiveSphere = sphere;
			}

			//_t = 0;
			satellite.position.x += ( (Math.cos(_t) * satellite_r + mostAttractiveSphere.position.x) - satellite.position.x ) * falloff;
			satellite.position.y += ( (Math.sin(_t) * satellite_r + mostAttractiveSphere.position.y) - satellite.position.y ) * falloff;
			satellite.position.z += ( (Math.sin(_t) * satellite_r + mostAttractiveSphere.position.z) - satellite.position.z ) * falloff;
			
			

			// Update the position and rotation of an axes helper for the satellite
			// This is likely for visualizing the orientation of the satellite
			axesHelpers_satellites[i].position.set(
				world.position.x + satellite.position.x,
				world.position.y + satellite.position.y,
				satellite.position.z
			);
			axesHelpers_satellites[i].rotation.set(
				satellite.rotation.x,
				satellite.rotation.y,
				satellite.rotation.z
			);

			// Update the position of cube cameras to match the position of axes helpers
			// This suggests that each cube camera is associated with an axes helper
			// cubeCameras are likely used for rendering or environmental mapping
			cubeCameras[i].position.x = world.position.x + sphere.position.x;
			cubeCameras[i].position.y = world.position.y + sphere.position.y;
			cubeCameras[i].position.z = world.position.z + sphere.position.z;
			
			if (orth_camera)
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

				//cursor event
				const raycaster = new THREE.Raycaster();
				const mouse = new THREE.Vector2();
				function onMouseMove(event) {
				// 将鼠标位置转换为归一化设备坐标(-1 到 +1)
				mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
				mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
				}
				window.addEventListener('mousemove', onMouseMove, false);

				raycaster.setFromCamera(mouse, camera);
    			const intersects = raycaster.intersectObjects([sphere]);
    			// 处理相交对象
				if (intersects.length > 0) {
					// 鼠标在球体上
					console.log("鼠标在球体上");
					//sphere.material.color.set( 0x00ff00 );
				}
			}
			
			if (orth_camera)
			{
				cubeCameras[i].rotation.x = Math.PI ;
				cubeCameras[i].rotation.y = Math.PI ;
			}



			// Update the cube camera with the current renderer and scene
			// This is typically done to render the scene from the camera's perspective
			cubeCameras[i].update(renderer, scene);





		};

		const time = Date.now() * 0.00005;
		for ( let i = 0; i < scene.children.length; i ++ ) {

			const object = scene.children[ i ];

			if ( object instanceof THREE.Points ) {

				object.rotation.y = time * ( i < 4 ? i + 1 : - ( i + 1 ) );

			}

		}

        controls.update();
		renderer.render(scene, camera);
		requestAnimationFrame(render);
	}


	// resize the renderer to fit the window size
	function resize ()
	{
		let width = window.innerWidth;
		let height = window.innerHeight

        if (orth_camera) {
			camera = new t.OrthographicCamera(0, width, 0, height, -10000, 10000);
			camera.updateProjectionMatrix();
		}
		else {
			camera.position.x = width / 2;
			camera.position.y = height / 2;

			camera.position.z = -1000;

			// camera.aspect = window.innerWidth / window.innerHeight;
			camera.updateProjectionMatrix();
		}


		renderer.setSize( width, height );
	}
    
}