'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Transformer } from 'react-konva';
import useImage from 'use-image';

interface KonvaCanvasProps {
  modelImageSrc: string;
  shirtColor: string;
  uploadedLogo: string | null;
  width: number;
  height: number;
  stageRef?: React.RefObject<any>;
}

export default function KonvaCanvas({
  modelImageSrc,
  shirtColor,
  uploadedLogo,
  width,
  height,
  stageRef,
}: KonvaCanvasProps) {
  const [modelImage] = useImage(modelImageSrc, 'anonymous');
  const [logoImage] = useImage(uploadedLogo || '', 'anonymous');
  
  const logoRef = useRef<any>(null);
  const trRef = useRef<any>(null);
  const [isSelected, setIsSelected] = useState(false);

  // When a logo is newly uploaded or unselected, we show its transformer if we click it
  useEffect(() => {
    if (isSelected && logoRef.current && trRef.current) {
      trRef.current.nodes([logoRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, logoImage]);

  const handleDragEnd = (e: any) => {
    // We could lift this state up if we want to save the user's design,
    // but for now local drag is fine.
  };

  const scaleToFit = Math.min(
    width / (modelImage?.width || 1),
    height / (modelImage?.height || 1)
  );

  const imgWidth = (modelImage?.width || width) * scaleToFit;
  const imgHeight = (modelImage?.height || height) * scaleToFit;
  
  const stageWidth = width;
  const stageHeight = height;

  // Center the image inside the stage
  const offsetX = (stageWidth - imgWidth) / 2;
  const offsetY = (stageHeight - imgHeight) / 2;

  return (
    <Stage
      ref={stageRef}
      width={stageWidth}
      height={stageHeight}
      onMouseDown={(e) => {
        // Deselect when clicking on empty area
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
          setIsSelected(false);
        }
      }}
      onTouchStart={(e) => {
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
          setIsSelected(false);
        }
      }}
    >
      <Layer>
        {/* Step 1: Base Product Model */}
        {modelImage && (
          <KonvaImage
            image={modelImage}
            x={offsetX}
            y={offsetY}
            width={imgWidth}
            height={imgHeight}
          />
        )}

        {/* Step 2: Color tint disabled — no mask cutouts yet.
            The logo below retains its own multiply blend for realism. */}

        {/* Step 3: Uploaded Logo (Draggable and Resizable) */}
        {logoImage && (
          <>
            <KonvaImage
              ref={logoRef}
              image={logoImage}
              x={offsetX + imgWidth / 2 - 100}
              y={offsetY + imgHeight / 2 - 150}
              width={200}
              height={200 * (logoImage.height / logoImage.width)}
              draggable
              globalCompositeOperation="multiply" // <--- CRITICAL for photorealistic blend!
              onDragEnd={handleDragEnd}
              onClick={() => setIsSelected(true)}
              onTap={() => setIsSelected(true)}
            />
            {isSelected && (
              <Transformer
                ref={trRef}
                boundBoxFunc={(oldBox, newBox) => {
                  // limit resize
                  if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) {
                    return oldBox;
                  }
                  return newBox;
                }}
              />
            )}
          </>
        )}
      </Layer>
    </Stage>
  );
}