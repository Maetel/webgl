// components/WebGLCanvas.tsx
import React, { useRef, useEffect } from "react";

const WebGLCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const topVertexRef = useRef({ x: 0, y: 1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl");
    if (!gl) {
      console.error("WebGL isn't available");
      return;
    }

    // Vertex shader program
    const vsSource = `
      attribute vec4 aVertexPosition;
      uniform vec2 uTopVertex;
      void main(void) {
        if (aVertexPosition.y == 1.0) {
          gl_Position = vec4(uTopVertex, 0.0, 1.0);
        } else {
          gl_Position = aVertexPosition;
        }
      }
    `;

    // Fragment shader program
    const fsSource = `
      void main(void) {
        gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // Red color
      }
    `;

    // Initialize shader program
    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
    if (!shaderProgram) return;

    // Collect all the info needed to use the shader program
    const programInfo = {
      program: shaderProgram,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
      },
      uniformLocations: {
        topVertex: gl.getUniformLocation(shaderProgram, "uTopVertex"),
      },
    };

    // Build the positions buffer
    const buffers = initBuffers(gl);

    // Draw the scene initially
    drawScene(gl, programInfo, buffers, topVertexRef.current);

    // Mouse move event listener
    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / canvas.width) * 2 - 1;
      const y = 1 - ((event.clientY - rect.top) / canvas.height) * 2;
      topVertexRef.current = { x, y };
      drawScene(gl, programInfo, buffers, topVertexRef.current);
    };

    canvas.addEventListener("mousemove", handleMouseMove);

    // Clean up the event listener
    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} width={640} height={480} />;
};

const initShaderProgram = (
  gl: WebGLRenderingContext,
  vsSource: string,
  fsSource: string
): WebGLProgram | null => {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
  if (!vertexShader || !fragmentShader) return null;

  const shaderProgram = gl.createProgram();
  if (!shaderProgram) return null;

  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error(
      "Unable to initialize the shader program:",
      gl.getProgramInfoLog(shaderProgram)
    );
    return null;
  }

  return shaderProgram;
};

const loadShader = (
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null => {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(
      "An error occurred compiling the shaders:",
      gl.getShaderInfoLog(shader)
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
};

const initBuffers = (gl: WebGLRenderingContext) => {
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Define positions for a triangle
  const positions = [
    0.0,
    1.0, // Top vertex
    -1.0,
    -1.0, // Bottom left vertex
    1.0,
    -1.0, // Bottom right vertex
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
  };
};

const drawScene = (
  gl: WebGLRenderingContext,
  programInfo: any,
  buffers: any,
  topVertex: { x: number; y: number }
) => {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(programInfo.program);

  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);

  gl.vertexAttribPointer(
    programInfo.attribLocations.vertexPosition,
    2,
    gl.FLOAT,
    false,
    0,
    0
  );
  gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);

  gl.uniform2f(
    programInfo.uniformLocations.topVertex,
    topVertex.x,
    topVertex.y
  );

  gl.drawArrays(gl.TRIANGLES, 0, 3);
};

export default WebGLCanvas;
