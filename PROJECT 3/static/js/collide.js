// collide.js

// This file sets up a helper force for use in force-directed simulations.
function createCollideForce(radiusAccessor = d => d.r) {
  return d3.forceCollide(radiusAccessor).strength(1).iterations(2);
}
