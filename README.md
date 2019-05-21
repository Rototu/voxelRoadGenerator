voxelRoadGenerator  
==================
A procedural road generator using voxels

Browser usage:
-----
Use *3dGeomBrowser.js*.
Two functions are exported:  
1. `MapGen.getMap(roadLength)` returning a procedurally generated road as a `shapeArray[verticesArray[xyzArray[]]]`
2. `MapGen.generateJSONMap(roadLength)` returning data above in JSON format 


Node usage
-----
Use *3dGeomNode.js*  
Same functions as above are exported, plus  
`MapGen.writeJSONMapsToFiles(noOfMaps, roadLength)` which generates a set amount of random maps of given length
