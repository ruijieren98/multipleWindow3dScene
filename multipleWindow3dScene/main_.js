import WindowManager from './WindowManager.js';
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import * as THREE from 'three';


const t = THREE;
let camera, scene, lighting_P, lighting_A, lightHelper_P, background, renderer, world;
let near, far;
let pixR = window.devicePixelRatio ? window.devicePixelRatio : 1;
let material2 = new THREE.MeshStandardMaterial({
	roughness: 0.1,
	metalness: 0,
	color: 0xff69b4
  });
let cube = new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), material2);
cube.position.z = 10;

let cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
let cubeCamera = new THREE.CubeCamera(1, 1000, cubeRenderTarget);
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

		scene = new t.Scene();


		//camera = new t.OrthographicCamera(0, 0, window.innerWidth, window.innerHeight, -10000, 10000);
		camera = new t.PerspectiveCamera(75, window.innerWidth, window.innerHeight, 0.1, 1000);
		
		camera.position.set(0,0,0);//camera.position.z = 2.5;
		//near = 0.1//camera.position.z - .5;
		//far = 1000;//camera.position.z + 0.5;
		scene.add( camera );


		// 加载hdr环境图
		let rgbeLoader_bg = new RGBELoader();
		rgbeLoader_bg.loadAsync("textures/test.hdr").then((texture) => {
		texture.mapping = THREE.EquirectangularReflectionMapping; // 设置映射类型
		scene.background = texture; // 设置背景
		});

		let rgbeLoader_env = new RGBELoader();
		rgbeLoader_env.loadAsync("textures/test_1k.hdr").then((texture) => {
		texture.mapping = THREE.EquirectangularReflectionMapping; // 设置映射类型
		//scene.background = texture; // 设置背景
		scene.environment = texture; // 设置环境贴图
		});

		////scene.background = new t.Color(0.0);
		//let textureLoader = new t.TextureLoader();
		//scene.background = textureLoader.load('123.jpg');

		// realistic reflection on metal
		cubeRenderTarget.texture.type = THREE.HalfFloatType;

		renderer = new t.WebGLRenderer({antialias: true, depthBuffer: true});
		renderer.setPixelRatio(pixR);
	    
	  	world = new t.Object3D();
		scene.add(world);

		//axes helper, not necessary
		let axesHelper = new t.AxesHelper(10);
		axesHelper.position.set(100,100,100);
		scene.add(axesHelper);
		//grid helper, not necessary
		let gridHelper = new t.GridHelper(10,50,0x00ffff,0x004444);
		scene.add(gridHelper);

		/////////pointLight
		lighting_P = new t.PointLight(0xffffff, 60.0);
		lighting_P.decay = .5;
		lighting_P.position.set(400,100,-100);
		scene.add( lighting_P );

		lightHelper_P = new t.PointLightHelper(lighting_P, 10);
		scene.add(lightHelper_P);

		//////////ambientLight
		lighting_A = new t.AmbientLight(0xffffff, 2.0);
		scene.add( lighting_A );

		/////////background
		//background = new t.PlaneGeometry(100, 100);
		//let textureLoader = new t.TextureLoader();
		//let material = new t.MeshBasicMaterial({
		//	map: textureLoader.load('123.jpg')
		//});
		//let mesh = new t.Mesh(background, material);
		//mesh.rotateX(-Math.PI/2);
		//scene.add( mesh );

		// a box to test reflection
		scene.add(cube);

		renderer.domElement.setAttribute("id", "scene");
		document.body.appendChild( renderer.domElement );
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
		updateNumberOfCubes();
		//animation(getTime());
	}

	function updateNumberOfCubes ()
	{
		let wins = windowManager.getWindows();

		// remove all cubes
		spheres.forEach((c) => {
			world.remove(c);
		})

		spheres = [];

		// add new cubes based on the current window setup
		for (let i = 0; i < wins.length; i++)
		{
			let win = wins[i];

			let c = new t.Color();
			c.setHSL(i * .1, 1.0, .5);

			let s = 100 + i * 50;
			
			let sphere = new t.Mesh(new t.SphereGeometry(80,32,32), new t.MeshPhysicalMaterial({envMap: cubeRenderTarget.texture, color: 0xff4444 , roughness: 0.01, metalness: .5,
			transparent: true}));
			sphere.material.opacity = 1;
			sphere.position.x = win.shape.x + (win.shape.w * .5);
			sphere.position.y = win.shape.y + (win.shape.h * .5);

			const gui = new GUI();
			gui.add(sphere.material, "roughness", 0, 1); // roughness
			gui.add(sphere.material, "metalness", 0, 1); // metalness

			let controls = new OrbitControls(camera, renderer.domElement); // view rotation
  			controls.autoRotate = true;

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
			let _t = t;// + i * .2;

			let posTarget = {x: win.shape.x + (win.shape.w * .5), y: win.shape.y + (win.shape.h * .5)}

			sphere.position.x = sphere.position.x + (posTarget.x - sphere.position.x) * falloff;
			sphere.position.y = sphere.position.y + (posTarget.y - sphere.position.y) * falloff;
			sphere.rotation.x = _t * .5;
			sphere.rotation.y = _t * .3;

			cube.position.x = cube.position.x + (posTarget.x - cube.position.x) * falloff;
			cube.position.y = cube.position.y + (posTarget.y - cube.position.y) * falloff;

			lighting_P.position.x = lighting_P.position.x + (posTarget.x - lighting_P.position.x) * falloff;
			lighting_P.position.y = lighting_P.position.y + (posTarget.y - lighting_P.position.y) * falloff;
		};
		

		renderer.render(scene, camera);
		cubeCamera.update(renderer, scene);
		requestAnimationFrame(render);
	}


	// resize the renderer to fit the window size
	function resize ()
	{
		let width = window.innerWidth;
		let height = window.innerHeight
		
		camera = new t.OrthographicCamera(0, width, 0, height, -10000, 10000);
		//camera = new t.PerspectiveCamera(75, window.innerWidth, window.innerHeight, 0.1, 1000);
		camera.updateProjectionMatrix();
		renderer.setSize( width, height );
	}
}