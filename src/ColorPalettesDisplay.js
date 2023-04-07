import React from 'react';

const ColorBox = ({ color, name }) => (
  <div
    style={{
      backgroundColor: color,
      width: '50px',
      height: '50px',
      display: 'inline-block',
      border: '1px solid black',
    }}
    title={name}
  />
);

const ColorPalette = ({ baseColor, palette }) => (
  <div style={{ marginBottom: '20px' }}>
    <h3>Base Color: {baseColor.name}</h3>
    <ColorBox color={baseColor.hex} name={baseColor.name} />
    <h4>Palette:</h4>
    <div>
      {palette.map((color, index) => (
        <ColorBox key={index} color={color.hex} name={color.name} />
      ))}
    </div>
  </div>
);

const ColorPalettesDisplay = ({ palettes }) => (
  <div>
    {palettes.map((palette, index) => (
      <ColorPalette key={index} baseColor={palette.baseColor} palette={palette.palette} />
    ))}
  </div>
);

export default ColorPalettesDisplay;
