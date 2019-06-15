var containers;
var camera, scene, raycaster, renderer;
var mouse = new THREE.Vector2();
var isClicking;
var frustumSize = 2;

var mouseVector = new THREE.Vector3();
var quaternion = new THREE.Quaternion();
var curIntersection = new THREE.Vector2();
var lastIntersection = new THREE.Vector2();

var interactiveBoxes;

var currentClicked;
var activeArcball;

var box;


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
    interactiveBoxes = new THREE.Group();

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
    box = new THREE.Mesh( geometry, material );

    box.scale.set(0.5, 0.5, 0.5);
    box.translateX(-0.5);
    box.translateY(-0.5);
    box.translateZ(-10);

    box.rotateX(Math.PI/5);
    box.rotateY(Math.PI/5);

    interactiveBoxes.add( box );

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
    var box2 = new THREE.Mesh( geometry, material );

    box2.scale.set(0.75, 0.75, 0.75);
    box2.translateX(0.3);
    box2.translateY(-0.2);
    box2.translateZ(-5);


    box2.rotateY(Math.PI/5);
    box2.rotateZ(Math.PI/5);

    interactiveBoxes.add( box2 );

    scene.add( interactiveBoxes );

    // // Sphere
    // var sphereGeom = new THREE.SphereGeometry(1, 100, 100);
    // var blueMaterial = new THREE.MeshBasicMaterial( { color: 0x000000, transparent: true, opacity: 0.3 } );
    // var sphere = new THREE.Mesh( sphereGeom, blueMaterial );
    // interactiveBox.add(sphere);
    
    // scene.add(interactiveBox);




    document.addEventListener( 'mousedown', onDocumentMouseDown, false);
    document.addEventListener( 'mouseup', onDocumentMouseUp, false);
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    window.addEventListener( 'resize', onWindowResize, false );
    document.addEventListener( 'mousewheel', onDocumentMouseWheel, false);



    document.body.appendChild( renderer.domElement );
}


function getArcballVector(mouseEvent) {
    P = new THREE.Vector3();
    windowCoord = new THREE.Vector2();
    P.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    P.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    P.z = 0; 

    OP_length = P.length();

    if (OP_length <= 1 ){
        P.z = Math.sqrt(1 - OP_length * OP_length);
    } else {
        P = P.normalize();
    }

    return P;
}

function experimentalBall(uv) {
    P = new THREE.Vector3;

    P.set(
        uv.x,
        uv.y,
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
    isClicking = true;

    // for (var i = 0; i < interactiveBoxes.children.length; i++) {
    //     var box = interactiveBoxes.children[i];
    //     if (! isEmpty (box.children)) {
    //         scene.remove(box.children[0]);
    //     }
    //     console.log(interactiveBoxes.children[i]);
    // }


    raycaster.setFromCamera(mouseVector, camera);

    var intersects = raycaster.intersectObjects(scene.children, true);

    if (! isEmpty(intersects)) {
        

        var sphereGeom = new THREE.SphereGeometry(1, 100, 100);
        var blueMaterial = new THREE.MeshBasicMaterial( { color: 0x000000, transparent: true, opacity: 0.3 } );
        activeArcball = new THREE.Mesh( sphereGeom, blueMaterial );
        
        activeArcball.name = 'arcball';
        objScale = intersects[0].object.scale;
        objPosition = intersects[0].object.position;
        activeArcball.scale.set(objScale.x, objScale.y, objScale.z);
        activeArcball.position.set(objPosition.x, objPosition.y, objPosition.z);

        scene.remove(scene.getObjectByName('arcball'));
        scene.add(activeArcball);
        
    } else {
        scene.remove(scene.getObjectByName('arcball'));
    }

    //console.log(intersects);

}

function onDocumentMouseUp(event) {
    isClicking = false;
}

function onDocumentMouseMove( event ) {

    mouseVector.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouseVector.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    

   
    raycaster.setFromCamera(mouseVector, camera);
    if (activeArcball != undefined) {
        var intersects = raycaster.intersectObject(activeArcball);
    }

    if (! isEmpty(intersects)){  
        curIntersection.x = intersects[0].point.x
        curIntersection.y = intersects[0].point.y;

        if (isClicking) {
            va = experimentalBall(lastIntersection);
            vb = experimentalBall(curIntersection);

            var angle = Math.acos(Math.min(1, va.dot(vb) / va.length() / vb.length()));
            var axis = va.cross(vb).normalize();

            quaternion.setFromAxisAngle(axis, angle);
            box.quaternion.multiplyQuaternions(quaternion, box.quaternion);
        }

        lastIntersection.x = curIntersection.x;
        lastIntersection.y = curIntersection.y;
    } 
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

zoomDirection = new THREE.Vector3();
function onDocumentMouseWheel(event) {

    if (event.deltaY < 0) { 
        camera.zoom -= 0.1
    };
    
    if (event.deltaY > 0) { 
        camera.zoom += 0.1 
    };
    camera.updateProjectionMatrix();

}

function animate() {
    requestAnimationFrame( animate );
    renderer.render( scene, camera );
}

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}