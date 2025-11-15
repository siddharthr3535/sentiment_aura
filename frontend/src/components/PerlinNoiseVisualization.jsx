import React, { useEffect, useRef } from "react";
import p5 from "p5";

function PerlinNoiseVisualization({ sentiment, keywords }) {
  const sketchRef = useRef();
  const p5InstanceRef = useRef();

  useEffect(() => {
    const sketch = (p) => {
      let particles = [];
      //starting with blueish hue
      let currentHue = 200;
      let targetHue = 200;
      let flowSpeed = 1;
      let targetFlowSpeed = 1;
      let noiseScale = 0.005;

      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight);
        p.colorMode(p.HSB, 360, 100, 100, 100);
        p.background(0, 0, 0);

        //creating particles here
        for (let i = 0; i < 800; i++) {
          particles.push({
            x: p.random(p.width),
            y: p.random(p.height),
            prevX: 0,
            prevY: 0,
            speed: p.random(0.5, 2),
          });
        }
      };

      p.draw = () => {
        p.background(0, 0, 0, 8);

        currentHue = p.lerp(currentHue, targetHue, 0.02);
        flowSpeed = p.lerp(flowSpeed, targetFlowSpeed, 0.02);

        particles.forEach((particle) => {
          particle.prevX = particle.x;
          particle.prevY = particle.y;

          let angle =
            p.noise(
              particle.x * noiseScale,
              particle.y * noiseScale,
              p.frameCount * 0.001 * flowSpeed
            ) *
            p.TWO_PI *
            4;

          particle.x += p.cos(angle) * particle.speed;
          particle.y += p.sin(angle) * particle.speed;

          if (particle.x < 0) particle.x = p.width;
          if (particle.x > p.width) particle.x = 0;
          if (particle.y < 0) particle.y = p.height;
          if (particle.y > p.height) particle.y = 0;

          let opacity = p.map(flowSpeed, 0.5, 3, 10, 30);

          p.stroke(currentHue, 70, 90, opacity);
          p.strokeWeight(1.5);
          p.line(particle.prevX, particle.prevY, particle.x, particle.y);
        });
      };

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
      };

      p.updateSentiment = (newSentiment) => {
        // Map sentiment (-1 to 1) to hue
        // Negative: cool colors (blue/purple) 200-280
        // Positive: warm colors (orange/pink) 0-60
        if (newSentiment >= 0) {
          targetHue = p.map(newSentiment, 0, 1, 200, 30);
        } else {
          targetHue = p.map(newSentiment, -1, 0, 280, 200);
        }

        targetFlowSpeed = p.map(Math.abs(newSentiment), 0, 1, 0.8, 2.5);
      };
    };

    if (!p5InstanceRef.current) {
      p5InstanceRef.current = new p5(sketch, sketchRef.current);
    }

    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (p5InstanceRef.current && p5InstanceRef.current.updateSentiment) {
      p5InstanceRef.current.updateSentiment(sentiment);
    }
  }, [sentiment]);

  return (
    <div
      ref={sketchRef}
      style={{ position: "fixed", top: 0, left: 0, zIndex: 0 }}
    />
  );
}

export default PerlinNoiseVisualization;
