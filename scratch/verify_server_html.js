async function test() {
  const res = await fetch('http://localhost:5500/admin.html');
  const text = await res.text();
  const cardMatches = text.match(/<div class="admin-card-box stage-settings-card"[^>]*>/g);
  console.log('CARDS IN SERVED HTML:');
  console.log(cardMatches);
  const cssMatch = text.match(/<link rel="stylesheet" href="css\/admin\.css[^"]*">/);
  console.log('CSS LINK:');
  console.log(cssMatch ? cssMatch[0] : 'None');

  const cssRes = await fetch('http://localhost:5500/css/admin.css?v=15.0');
  const cssText = await cssRes.text();
  const hasPureWhite = cssText.includes('.admin-card,') && cssText.includes('background: #ffffff !important;');
  console.log('CSS HAS PURE WHITE CARD RULES:', hasPureWhite);
}

test();
