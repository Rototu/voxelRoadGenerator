voxelRoadGenerator  
==================
A procedural road generator using voxels

Demo
----
Go to https://rototu.github.io/voxelRoadGenerator/.  
(ES6 compatible browser needed)

Browser usage:
-----
Use *3dGeomBrowser.js*.  
  
  
Two functions are exported:  
1.     
``` javascript
MapGen.getMap(roadLength, roadLinearity, altitudeVariation)
```
returning a procedurally generated road as a `shapeArray[verticesArray[xyzArray[]]]`.
2.    
``` javascript
MapGen.generateJSONMap(roadLength, roadLinearity, altitudeVariation)
``` 
returning same data as above but in JSON format.


Node usage
-----
Use *3dGeomNode.js*.  
  
Same functions as above are exported, plus  
``` javascript
MapGen.writeJSONMapsToFiles(noOfMaps, roadLength, roadLinearity, altitudeVariation)
``` 
which generates a set amount of random maps of given length.
