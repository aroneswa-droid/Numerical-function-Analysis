const cardPool = [
  { src: "card1.jpg", count: 3, scale: 0.1, x: 0, y: 0 },
  { src: "card2.jpg", count: 5, scale: 0.1, x: 5, y: -10 },
  { src: "card3.jpg", count: 2, scale: 0.1, x: -8, y: 0 },
  { src: "card4.jpg", count: 4, scale: 0.1, x: 0, y: 5 }
];

let draggingIndex = -1;
let hoverIndex = -1;
let draggingInsideHand = false;

const handElement = document.getElementById("hand");
const deckElement = document.getElementById("deck");
const deckImg = document.querySelector("#deck img");

const W = 800;
const C = 120;

/* --------------------------
   デッキ生成
-------------------------- */
function createDeck(pool) {
  const deck = [];

  pool.forEach(({ src, count, scale, x, y }) => {
    for (let i = 0; i < count; i++) {
      deck.push({
        src,
        scale,
        x,
        y
      });
    }
  });

  return shuffle(deck);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const r = Math.floor(Math.random() * (i + 1));
    [array[i], array[r]] = [array[r], array[i]];
  }
  return array;
}

const deck = createDeck(cardPool);

/* --------------------------
   deck表示
-------------------------- */
function updateDeckVisual() {
  const { scale, x, y } = { scale: 1, x: 0, y: 0 };

  deckImg.style.position = "absolute";
  deckImg.style.top = "50%";
  deckImg.style.left = "50%";

  deckImg.style.transform = `
    translate(-50%, -50%)
    translate(${x}px, ${y}px)
    scale(${scale})
  `;
}

updateDeckVisual();

/* --------------------------
   カード生成
-------------------------- */
function createCard(cardData) {
  const div = document.createElement("div");
  div.classList.add("card");

  const frame = document.createElement("div");
  frame.classList.add("card-image");

  const img = document.createElement("img");
  img.src = cardData.src;

  frame.appendChild(img);
  div.appendChild(frame);

  div.addEventListener("mousedown", (e) => {
    e.preventDefault();
    const cards = Array.from(handElement.children);
    draggingIndex = cards.indexOf(div);

    div.style.transition = "none";
    div.style.zIndex = 10;

    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", onDrop);
  });

  return div;
}



/* --------------------------
   手札レイアウト
-------------------------- */
function updateHand() {
  const cards = Array.from(handElement.children);
  const visible = cards.filter((_, i) => i !== draggingIndex);

  const slotCount =
    draggingIndex === -1
      ? cards.length
      : draggingInsideHand
        ? cards.length
        : cards.length - 1;

  if (slotCount <= 0) return;

  const gap = (W - slotCount * C) / (slotCount + 1);

  let slot = 0;

  visible.forEach((card) => {
    if (draggingInsideHand && slot === hoverIndex) slot++;

    const x = gap + slot * (C + gap);

    card.style.transform = `translateX(${x}px)`;
    card.style.zIndex = 1;

    slot++;
  });
}

/* --------------------------
   ドラッグ処理
-------------------------- */
function onDrag(e) {
  const cards = Array.from(handElement.children);
  const card = cards[draggingIndex];
  if (!card) return;

  const rect = handElement.getBoundingClientRect();

  const x = e.clientX - rect.left - 60;
  const y = e.clientY - rect.top - 80;

  card.style.transform = `translate(${x}px, ${y}px)`;

  const inside =
    e.clientX >= rect.left &&
    e.clientX <= rect.right &&
    e.clientY >= rect.top &&
    e.clientY <= rect.bottom;

  draggingInsideHand = inside;

  if (!inside) {
    hoverIndex = -1;
    updateHand();
    return;
  }

  const slotCount = cards.length;
  const gap = (W - slotCount * C) / (slotCount + 1);

  const slots = Array.from({ length: slotCount }, (_, i) =>
    gap + i * (C + gap)
  );

  const centerX = x + C / 2;

  hoverIndex = slots.reduce(
    (best, slotX, i) => {
      const dist = Math.abs(centerX - (slotX + C / 2));
      return dist < best.dist ? { index: i, dist } : best;
    },
    { index: 0, dist: Infinity }
  ).index;

  updateHand();
}

/* --------------------------
   ドロップ
-------------------------- */
function onDrop(e) {
  const cards = Array.from(handElement.children);
  const moved = cards[draggingIndex];

  const rect = handElement.getBoundingClientRect();

  const inside =
    e.clientX >= rect.left &&
    e.clientX <= rect.right &&
    e.clientY >= rect.top &&
    e.clientY <= rect.bottom;

  document.querySelectorAll(".card").forEach(c => {
    c.style.transition = "transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)";
  });

  if (inside) {
    const order = cards.filter((_, i) => i !== draggingIndex);

    const index = Math.max(0, Math.min(hoverIndex, order.length));
    order.splice(index, 0, moved);

    handElement.innerHTML = "";
    order.forEach(c => handElement.appendChild(c));
  }

  draggingIndex = -1;
  hoverIndex = -1;
  draggingInsideHand = false;

  requestAnimationFrame(updateHand);

  document.removeEventListener("mousemove", onDrag);
  document.removeEventListener("mouseup", onDrop);
}

/* --------------------------
   ドロー
-------------------------- */
deckElement.addEventListener("click", () => {
  if (deck.length === 0) return;

  const cardData = deck.pop();
  const card = createCard(cardData);

  const d = deckElement.getBoundingClientRect();
  const h = handElement.getBoundingClientRect();

  const startX = d.left - h.left;
  const startY = d.top - h.top;

  card.style.transform = `translate(${startX}px, ${startY}px)`;

  handElement.appendChild(card);

  requestAnimationFrame(updateHand);
});