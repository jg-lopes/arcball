var containers;
var camera, scene, raycaster, renderer;
var mouse = new THREE.Vector2();
var isClicking;
var frustumSize = 2;
init();
animate();



function init() {

    var aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 1, 1000 );
    //camera = new THREE.OrthographicCamera( -1, 1, 1, -1, - 500, 500); 
    camera.translateZ(500); 

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xf0f0f0 );

    raycaster = new THREE.Raycaster();

    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );


    // Introducing the cube + arcball visualization object
    var object = new THREE.Object3D();

    // Cube
    var geometry = new THREE.BoxGeometry( 1, 1, 1);
    // Colors of the face of the cube (following a Rubik's Cube model)
    // Blue - FRONT // Green - BACK // Yellow - UP // White - DOWN // Red - RIGHT // Orange - LEFT
    var colors = [ 'red', 'orange', 'yellow', 'white', 'blue', 'green'];
    for ( var i = 0; i < geometry.faces.length; i += 2 ) {
        var color = new THREE.Color( colors[i/2] );
        geometry.faces[ i ].color.set(color);
        geometry.faces[ i + 1 ].color.set( color);
    }
    var material = new THREE.MeshBasicMaterial( { color: 0xffffff, vertexColors: THREE.FaceColors } );
    var cube = new THREE.Mesh( geometry, material );
    object.add( cube );

    // Sphere
    var sphereGeom = new THREE.SphereGeometry(1, 100, 100);
    var blueMaterial = new THREE.MeshBasicMaterial( { color: 0x000000, transparent: true, opacity: 0.3 } );
    var sphere = new THREE.Mesh( sphereGeom, blueMaterial );
    object.add(sphere);
    
    
    
    scene.add(object);



    document.body.appendChild( renderer.domElement );

    document.addEventListener( 'mousedown', onDocumentMouseDown, false);
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    window.addEventListener( 'resize', onWindowResize, false );
}


function experimentalBall(mouseEvent, offset, scale) {
    P = new THREE.Vector3();
    windowCoord = new THREE.Vector2();

    windowMinSize = Math.min(window.innerWidth, window.innerHeight);

    // windowCoord.x = ( mouseEvent.x / window.innerWidth ) * 2 - 1
    // windowCoord.y = - (
    //console.log((vector2.x) - 0.5 * (window.innerWidth / 1000) );
    ouseEvent.y / window.innerHeight ) * 2 + 1

    windowCoord.x = - window.innerWidth / 2;
    windowCoord.y = - window.innerHeight / 2; 

    windowCoord.x += mouseEvent.x;
    windowCoord.y += mouseEvent.y;

    windowCoord.x = (windowCoord.x * 2 / windowMinSize);
    windowCoord.y = (windowCoord.y * 2 / windowMinSize);
    
    P.set(
        (windowCoord.x - offset.x) / scale.x,
        (windowCoord.y - offset.y) / scale.y,
        0 ); 

    OP_length = P.length();

    if (OP_length <= 1 ){
        P.z = Math.sqrt(1 - OP_length * OP_length);
    } else {
        P = P.normalize();
    }

    return P;
}

function onDocumentMouseDown(event) {
    event.preventDefault();

    isClicking = true;

    var mouseEvent = new THREE.Vector2();
    mouseEvent.set( event.clientX, event.clientY);

    var offset = new THREE.Vector3();
    offset.set(0, 0, 0);

    var scale = new THREE.Vector2();
    scale.set(1, 1);

    //experimentalBall(mouseEvent, offset, scale);
    console.log(experimentalBall(mouseEvent, offset, scale));
}

function onWindowResize() {

    var aspect = window.innerWidth / window.innerHeight;
    camera.left = - frustumSize * aspect / 2;
    camera.right = frustumSize * aspect / 2;
    camera.top = frustumSize / 2;
    camera.bottom = - frustumSize / 2;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );
}

function onDocumentMouseMove( event ) {
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
}

