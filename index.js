const size = 100;

let camera, scene, renderer;
let geom, material, mesh, object, spotLight, light, zMax;
let map = MapGen.getMap(size);

init();

let angle = 0;
let finishedInit = false;
animate();

function init() {

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.z = 1;

    scene = new THREE.Scene();

    const loader = new THREE.CubeTextureLoader();
    loader.setPath('img/');

    // for skybox
    const textureCube = loader.load([
        'sky.jpg', 'sky.jpg',
        'sky.jpg', 'sky.jpg',
        'sky.jpg', 'sky.jpg'
    ]);

    scene.background = textureCube;
    scene.fog = new THREE.FogExp2(0xcccccc, 0.002);

    geom = new THREE.Geometry();

    // create geometry for road
    let vertexIndex = 0
    for (let shape of map) {
        for (let pos of shape) {
            geom.vertices.push(new THREE.Vector3(pos[0], pos[1], pos[2]));
        }
        if (shape.length === 4) {
            // 4 vertices -> square
            // need to triangulate
            geom.faces.push(new THREE.Face3(vertexIndex, vertexIndex + 1, vertexIndex + 2));
            geom.faces.push(new THREE.Face3(vertexIndex + 2, vertexIndex + 3, vertexIndex));
            vertexIndex += 4;
        } else {
            // triangle with 3 vertices
            geom.faces.push(new THREE.Face3(vertexIndex, vertexIndex + 1, vertexIndex + 2));
            vertexIndex += 3;
        }
    }

    geom.computeFaceNormals();
    geom.drawMode = THREE.TriangleStripDrawMode;

    object = new THREE.Mesh(geom, new THREE.MeshStandardMaterial({
        wireframe: false,
        flatShading: false,
        side: THREE.DoubleSide,
        envMap: textureCube,
        color: 0x333333,
        roughness: 0,
        metalness: 0.5
    }));

    // get bounding box size of generated road
    const bbox = new THREE.Box3().setFromObject(object);
    const xSize = bbox.max.x - bbox.min.x;
    const ySize = bbox.max.y - bbox.min.y;
    zMax = bbox.max.z;

    // init camera pos
    camera.position.z = 2 * size;
    camera.position.y += ySize * 4;

    // center obj
    object.position.y = -size / 2;
    object.position.x = (size - xSize) / 2;

    scene.add(object);

    // add edges
    const edges = new THREE.EdgesGeometry(object.geometry);
    const eColor = new THREE.LineBasicMaterial({
        color: 0x00
    });
    const wireframe = new THREE.LineSegments(edges, eColor);
    
    wireframe.position.y = -size / 2;
    wireframe.position.x = (size - xSize) / 2;
    
    scene.add(wireframe);

    // moving source of light
    spotLight = new THREE.SpotLight(0xAA33FF, 6);
    scene.add(spotLight);

    // static source of light
    light = new THREE.AmbientLight(0xff44ff, 2);
    scene.add(light);

    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setSize(window.innerWidth * 0.75, window.innerHeight * 0.75);
    document.body.appendChild(renderer.domElement);
    renderer.render(scene, camera);

    // control camera with mouse
    controls = new THREE.TrackballControls(camera);
    controls.target.set(size, 0, 0);
    controls.rotateSpeed = 1.0;
    controls.zoomSpeed = 1;
    controls.panSpeed = 1;
    controls.dynamicDampingFactor = 0.3;

}

function animate() {

    requestAnimationFrame(animate);

    controls.update();

    spotLight.position.set(3 * size * Math.cos(angle), size, 3 * size * Math.sin(angle));

    angle += 0.02;
    if (angle >= 2 * Math.PI) angle = 0;

    if (camera.position.z > zMax && !finishedInit) camera.position.z--;
    else finishedInit = true;

    renderer.render(scene, camera);

}