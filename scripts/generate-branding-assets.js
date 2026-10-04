const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function createFaviconAndOg() {
  const sfLogoPath = path.join('public', 'brand', 'sf-monogram.png');

  // 1. Create a high-res square icon with dark/navy background matching Sergio Florez branding
  const iconSize = 512;
  const padding = 64;
  const sfResized = await sharp(sfLogoPath)
    .resize(iconSize - (padding * 2), iconSize - (padding * 2), { fit: 'contain' })
    .toBuffer();

  const iconBuffer = await sharp({
    create: {
      width: iconSize,
      height: iconSize,
      channels: 4,
      background: { r: 15, g: 23, b: 42, alpha: 1 } // #0f172a slate-900 / ink
    }
  })
  .composite([
    {
      input: sfResized,
      gravity: 'centre'
    }
  ])
  .png()
  .toBuffer();

  // Save app icon (Next.js automatically uses icon.png in app directory)
  fs.writeFileSync(path.join('src', 'app', 'icon.png'), iconBuffer);
  fs.writeFileSync(path.join('public', 'icon.png'), iconBuffer);
  fs.writeFileSync(path.join('public', 'apple-touch-icon.png'), iconBuffer);

  // 2. Also replace favicon.ico so browsers/crawlers get the SF icon
  const icoSize = 64;
  const icoResized = await sharp(sfLogoPath)
    .resize(48, 48, { fit: 'contain' })
    .toBuffer();

  const icoBuffer = await sharp({
    create: {
      width: icoSize,
      height: icoSize,
      channels: 4,
      background: { r: 15, g: 23, b: 42, alpha: 1 }
    }
  })
  .composite([{ input: icoResized, gravity: 'centre' }])
  .png()
  .toBuffer();

  fs.writeFileSync(path.join('src', 'app', 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join('public', 'favicon.ico'), icoBuffer);

  // 3. Create professional OpenGraph Image (1200x630) for WhatsApp, Facebook, LinkedIn, Twitter
  const ogWidth = 1200;
  const ogHeight = 630;
  
  const svgText = `
    <svg width="${ogWidth}" height="${ogHeight}" viewBox="0 0 ${ogWidth} ${ogHeight}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#090d16"/>
          <stop offset="60%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#1e1b4b"/>
        </linearGradient>
      </defs>
      
      <rect width="${ogWidth}" height="${ogHeight}" fill="url(#bg)"/>
      
      <rect x="40" y="40" width="1120" height="550" rx="24" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.12)" stroke-width="2"/>
      
      <text x="380" y="190" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="700" fill="#818cf8" letter-spacing="4">PLATAFORMA DE INTELIGENCIA LABORAL</text>
      
      <text x="380" y="275" font-family="system-ui, -apple-system, sans-serif" font-size="60" font-weight="800" fill="#ffffff" letter-spacing="-1">NEXA Intelligence</text>
      
      <text x="380" y="340" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="500" fill="#cbd5e1">Conozca su gente. Entienda sus datos. Actúe con inteligencia.</text>
      
      <text x="380" y="415" font-family="system-ui, -apple-system, sans-serif" font-size="21" font-weight="400" fill="#94a3b8">
        Modelos de Caracterización con IA · Respaldo de Sergio Flórez Abogados
      </text>
      
      <rect x="380" y="470" width="460" height="46" rx="23" fill="rgba(99,102,241,0.2)" stroke="rgba(99,102,241,0.4)" stroke-width="1.5"/>
      <circle cx="406" cy="493" r="6" fill="#10b981"/>
      <text x="424" y="500" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="600" fill="#e0e7ff">Entorno Activo · Financiera Comultrasan</text>
    </svg>
  `;

  const sfOgBadge = await sharp(sfLogoPath)
    .resize(230, 270, { fit: 'contain' })
    .toBuffer();

  const ogBuffer = await sharp(Buffer.from(svgText))
    .composite([
      {
        input: sfOgBadge,
        top: 175,
        left: 95
      }
    ])
    .png()
    .toBuffer();

  fs.writeFileSync(path.join('public', 'og-image.png'), ogBuffer);
  fs.writeFileSync(path.join('src', 'app', 'opengraph-image.png'), ogBuffer);

  console.log('Successfully generated favicon, app icon and OG preview image!');
}

createFaviconAndOg().catch(err => console.error(err));
