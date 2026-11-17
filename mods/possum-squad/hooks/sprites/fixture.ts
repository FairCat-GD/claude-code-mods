// The spike's hand-made test sprite: a small grey critter, 32 by 32, bobbing in two 200 ms frames.
export const SPRITE_PX = 64

const OPEN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">'
const LEGS = '<rect x="10" y="22" width="2" height="3" fill="#3b3b42"/><rect x="17" y="22" width="2" height="3" fill="#3b3b42"/>'
const BOB = '<animateTransform attributeName="transform" type="translate" values="0 0;0 -1" dur="400ms" calcMode="discrete" repeatCount="indefinite"/>'

const body = (fur: string) =>
  '<rect x="3" y="19" width="5" height="1" fill="#c9a3ab"/>' +
  `<rect x="8" y="15" width="13" height="7" ${fur}/>` +
  '<rect x="10" y="20" width="9" height="2" fill="#c8c8cc"/>' +
  '<rect x="19" y="12" width="8" height="7" fill="#d9d9dd"/>' +
  '<rect x="20" y="10" width="2" height="2" fill="#3b3b42"/>' +
  '<rect x="24" y="10" width="2" height="2" fill="#3b3b42"/>' +
  '<rect x="24" y="14" width="1" height="1" fill="#1b1b1f"/>' +
  '<rect x="27" y="16" width="2" height="1" fill="#e58fa0"/>'

export const BOBBING = `${OPEN}${LEGS}<g>${BOB}${body('fill="#8f8f96"')}</g></svg>`

// The same sprite asking the page: darker fur on a light theme, and a still copy under reduced motion.
const QUERIES =
  '<style>.fur{fill:#8f8f96}.still{display:none}' +
  '@media (prefers-color-scheme: light){.fur{fill:#4e4e57}}' +
  '@media (prefers-reduced-motion: reduce){.moving{display:none}.still{display:inline}}</style>'

export const QUERIED = `${OPEN}${QUERIES}${LEGS}<g class="moving">${BOB}${body('class="fur"')}</g><g class="still">${body('class="fur"')}</g></svg>`
