import React from 'react';
import {Buffer} from 'buffer';

const ImageRenderer = ({ data }) => {
    const base = Buffer.from(new Uint8Array(data)).toString('base64');
    console.log(base, 'base buffer');
    const base64Image = data ? `data:image/jpeg;base64,${base}` : '';

  return (  
    <div>
      {data && <img src={base64Image} alt="Your Description"/>}
    </div>
  );
};

export default ImageRenderer;